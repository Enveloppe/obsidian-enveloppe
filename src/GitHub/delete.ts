import {
	type Deleted,
	type EnveloppeSettings,
	FolderSettings,
	type GithubRepo,
	type MonoRepoProperties,
	type MultiRepoProperties,
	type Properties,
} from "@interfaces";
import type { ConvertedLink } from "@interfaces/main";
import type { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Base64 } from "js-base64";
import {
	getFrontMatterInfo,
	type MetadataCache,
	Notice,
	normalizePath,
	parseYaml,
	type TAbstractFile,
	TFile,
	TFolder,
	Vault,
} from "obsidian";
import type { FilesManagement } from "src/GitHub/files";
import type { ActivityLog } from "src/manager/activity";
import { trimObject } from "src/utils";
import {
	getDryRunFolder,
	isAttachment,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import { buildExclusion } from "src/utils/exclusion";
import { frontmatterSettingsRepository } from "src/utils/parse_frontmatter";

/**
 * Delete file from github, based on a list of file in the original vault
 * @param {boolean} silent - default false, if true, no notice will be displayed
 * @param {string} branchName
 * @param {FilesManagement} filesManagement
 * @param {MonoRepoProperties} repoProperties - frontmatter can be an array of Properties or a single Properties
 * @return {Promise<Deleted>} deleted : list of deleted file, undeleted : list of undeleted file, success : true if all file are deleted
 */
export async function deleteFromGithub(
	silent: boolean = false,
	branchName: string,
	filesManagement: FilesManagement,
	repoProperties: MonoRepoProperties | MultiRepoProperties
): Promise<Deleted> {
	// publish() can replace frontmatter with an array
	const prop = Array.isArray(repoProperties.frontmatter)
		? repoProperties.frontmatter
		: [repoProperties.frontmatter];
	const deleted: Deleted[] = [];
	for (const repo of prop) {
		const monoProperties: MonoRepoProperties = {
			frontmatter: repo,
			repository: repoProperties.repository,
			convert: frontmatterSettingsRepository(
				filesManagement.plugin,
				repoProperties.repository
			),
		};
		deleted.push(
			await deleteFromGithubOneRepo(silent, branchName, filesManagement, monoProperties)
		);
	}
	return deleted[0]; //needed only for main repo (not for repo in frontmatter)
}

/**
 * Delete file from github
 * @param {boolean} silent - default false, if true, no notice will be displayed
 * @param {string} branchName
 * @param {FilesManagement} filesManagement
 * @param {MonoRepoProperties} repoProperties - frontmatter must be a single Properties so we use the MonoRepoProperties interface
 */

async function deleteFromGithubOneRepo(
	silent: boolean = false,
	branchName: string,
	filesManagement: FilesManagement,
	repoProperties: MonoRepoProperties
): Promise<Deleted> {
	const repo = repoProperties.frontmatter;
	const pconsole = filesManagement.console;
	if (repo.dryRun.autoclean) return cleanDryRun(silent, filesManagement, repoProperties);
	if (!repo.autoclean) return { success: false, deleted: [], undeleted: [] };
	const getAllFile = await filesManagement.getAllFileFromRepo(branchName, repo);
	const { octokit, plugin, settings, noticeLength } = filesManagement;
	const filesInRepo = await filterGithubFile(getAllFile, settings, repo);
	if (
		(settings.github.rateLimit === 0 || filesInRepo.length > settings.github.rateLimit) &&
		(await verifyRateLimitAPI(octokit, plugin, false, filesInRepo.length)) === 0
	) {
		pconsole.warn("Rate limited exceeded, please try again later");
		return { success: false, deleted: [], undeleted: [] };
	}
	if (filesInRepo.length === 0) {
		pconsole.trace(`No file to delete in ${repo.owner}/${repo.repo}`);
		return { success: false, deleted: [], undeleted: [] };
	}
	const allSharedFiles = filesManagement.getAllFileWithPath(
		repoProperties.repository,
		repoProperties.convert,
		true
	);
	const allSharedConverted = toSharedPaths(allSharedFiles);
	const keepRule = getKeepRule(settings, repoProperties.repository);
	let deletedSuccess = 0;
	let deletedFailed = 0;
	const result: Deleted = {
		deleted: [],
		undeleted: [],
		success: false,
	};
	for (const file of filesInRepo) {
		if (mustBeDeleted(file.file, allSharedConverted, repo)) {
			let kept: boolean;
			try {
				kept = await isKeptInRepo(octokit, file, repo, keepRule);
			} catch (e) {
				// never delete a note that could not be checked
				pconsole.trace(e);
				deletedFailed++;
				result.undeleted.push(file.file);
				continue;
			}
			if (!kept) {
				pconsole.trace(
					`trying to delete file : ${file.file} from ${repo.owner}/${repo.repo}`
				);
				try {
					await trackDelete(filesManagement, file.file, repo, () =>
						octokit.request("DELETE /repos/{owner}/{repo}/contents/{+path}", {
							owner: repo.owner,
							repo: repo.repo,
							path: file.file,
							message: `DELETE FILE : ${file.file}`,
							sha: file.sha,
							branch: branchName,
						})
					);
					deletedSuccess++;
					result.deleted.push(file.file);
				} catch (e) {
					pconsole.trace(e);
					deletedFailed++;
					result.undeleted.push(file.file);
				}
			}
		}
	}
	let successMsg = i18next.t("deletion.noFile");
	let failedMsg = "";
	if (deletedSuccess > 0) {
		successMsg = i18next.t("deletion.success", { nb: deletedSuccess.toString() });
	}
	if (deletedFailed > 0) {
		failedMsg = i18next.t("deletion.failed", { nb: deletedFailed.toString() });
	}
	if (!silent) {
		new Notice(successMsg + failedMsg, noticeLength);
	}
	result.success = deletedFailed === 0;
	return result;
}

/** Show the deletion in the file manager activity */
export function trackDelete<T>(
	filesManagement: FilesManagement,
	path: string,
	repo: Properties,
	run: () => Promise<T>
): Promise<T> {
	const activity = filesManagement.plugin.activity as ActivityLog | undefined;
	if (!activity) return run();
	return activity.track("delete", path, `${repo.owner}/${repo.repo}`, run);
}

export interface SharedPath {
	converted: string;
	repo?: Properties | Properties[];
	otherPath?: string[];
}

export function toSharedPaths(files: ConvertedLink[]): SharedPath[] {
	return files.map((file) => ({
		converted: file.converted,
		repo: file.prop,
		otherPath: file.otherPaths,
	}));
}

/**
 * A published file must be removed when no shared vault file produces it anymore,
 * or when the markdown note producing it is published to another repository.
 * @param {string} path path in the repository (or relative to the dry-run folder)
 * @param {SharedPath[]} shared every shared file of the vault with its converted path
 * @param {Properties} repo the repository being cleaned
 */
export function mustBeDeleted(
	path: string,
	shared: SharedPath[],
	repo: Properties
): boolean {
	const producedBy = (f: SharedPath) =>
		f.converted === path || f.otherPath?.includes(path);
	if (!shared.some(producedBy)) return true;
	if (!path.trim().endsWith(".md")) return false;
	return !shared.some((f) => {
		const prop = Array.isArray(f.repo)
			? f.repo.find((r) => r.repo === repo.repo)
			: f.repo;
		return producedBy(f) && prop;
	});
}

function getExclusion(settings: EnveloppeSettings): (path: string) => boolean {
	return buildExclusion(
		settings.upload.autoclean.excluded,
		(e) =>
			new Notice(
				i18next.t("settings.regexReplacing.invalidRegex", { e: String(e) }),
				settings.plugin.noticeLength
			)
	);
}

/**
 * Scan all file in repo, and excluding some from the list. Also check for some parameters.
 * Only file supported by GitHub are checked.
 * Only include file with the folder Default name or the rootFolder (yaml) or default image folder
 * Ex : Include all files in a rootfolder docs/*
 * Also the function check if the file is excluded from deletion
 * @param {GithubRepo[]} fileInRepo All files from repository
 * @param {EnveloppeSettings} settings Settings of the plugin
 * @param prop
 * @return {Promise<GithubRepo[]>} sharedFilesInRepo containing valid file to check if they must be deleted
 */

export async function filterGithubFile(
	fileInRepo: GithubRepo[],
	settings: EnveloppeSettings,
	prop: Properties
): Promise<GithubRepo[]> {
	const sharedFilesInRepo: GithubRepo[] = [];
	const isExcluded = getExclusion(settings);
	for (const file of fileInRepo) {
		const behavior = prop.path?.type ?? settings.upload.behavior;
		const root = prop.path?.rootFolder ?? settings.upload.rootFolder;
		const defaultName = prop.path?.defaultName ?? settings.upload.defaultName;
		const attachmentFolder = prop.path?.attachment?.folder ?? settings.embed.folder;
		const enabledAttachments =
			settings.upload.autoclean.includeAttachments &&
			isAttachment(file.file, settings.embed.unHandledObsidianExt);
		if (
			(file.file.includes(defaultName) ||
				(behavior === FolderSettings.Yaml && file.file.includes(root)) ||
				(attachmentFolder.length > 0 && file.file.includes(attachmentFolder))) &&
			!isExcluded(file.file) &&
			(enabledAttachments || file.file.endsWith(".md"))
		) {
			sharedFilesInRepo.push(file);
		}
	}
	return sharedFilesInRepo;
}

/**
 * Parse the YAML metadata of a published file.
 * @return the frontmatter, empty if there is none, or null if it can't be read
 */
function parseYamlFrontmatter(contents: string): Record<string, unknown> | null {
	const { exists, frontmatter } = getFrontMatterInfo(contents);
	if (!exists) return {};
	try {
		const parsed: unknown = parseYaml(frontmatter);
		// nothing but blank lines or comments
		if (parsed == null) return {};
		return typeof parsed === "object" ? trimObject(parsed) : null;
	} catch {
		return null;
	}
}

interface KeepRule {
	shareKey: string;
	keepUnshared: boolean;
	/** `settings.upload.folderNote.rename` */
	indexName: string;
}

function getKeepRule(
	settings: EnveloppeSettings,
	repository: MonoRepoProperties["repository"]
): KeepRule {
	return {
		shareKey: repository?.shareKey || settings.plugin.shareKey || "share",
		// imported settings may lack the key: deleting must be an explicit choice
		keepUnshared: settings.upload.autoclean.keepUnshared !== false,
		indexName: settings.upload.folderNote.rename,
	};
}

export function isIndexFile(path: string, indexName: string): boolean {
	const name = path.trim().split("/").pop();
	return !!indexName && (name === indexName || name === `${indexName}.md`);
}

/** `delete: false` protects every note, `index: true` only the index files */
function isMarkedKept(frontmatter: Record<string, unknown>, isIndex: boolean): boolean {
	// YAML gives booleans, but quoted values stay strings
	const is = (value: unknown, expected: boolean) =>
		value === expected || value === String(expected);
	return is(frontmatter.delete, false) || (isIndex && is(frontmatter.index, true));
}

/**
 * Check if a published file must be excluded from deletion:
 * - any note with `delete: false`, or with an unreadable frontmatter
 * - index files with `index: true`
 * - index files with the share key missing or false, if `autoclean.keepUnshared` is enabled
 */
async function isKeptInRepo(
	octokit: Octokit,
	file: GithubRepo,
	prop: Properties,
	keepRule: KeepRule
): Promise<boolean> {
	const isIndex = isIndexFile(file.file, keepRule.indexName);
	if (!isIndex && !file.file.trim().endsWith(".md")) return false;
	// unlike the contents API, it has no 1 MB limit
	const blob = await octokit.request("GET /repos/{owner}/{repo}/git/blobs/{file_sha}", {
		owner: prop.owner,
		repo: prop.repo,
		// biome-ignore lint/style/useNamingConvention: GitHub API :(
		file_sha: file.sha,
	});
	const frontmatter = parseYamlFrontmatter(Base64.decode(blob.data.content));
	if (!frontmatter) return true;
	return (
		isMarkedKept(frontmatter, isIndex) ||
		(isIndex && keepRule.keepUnshared && !frontmatter[keepRule.shareKey])
	);
}

function cleanDryRun(
	silent: boolean = false,
	filesManagement: FilesManagement,
	repoProperties: MonoRepoProperties
): Deleted {
	const { vault, settings, plugin, noticeLength } = filesManagement;
	const app = plugin.app;
	const repo = repoProperties.frontmatter;
	const pconsole = filesManagement.console;
	const dryRunFolderPath = getDryRunFolder(repo.dryRun.folderName, repo);
	if (dryRunFolderPath === "/")
		throw new Error("DryRun folder path is empty, please check your settings");
	const dryRunFolder = vault.getFolderByPath(dryRunFolderPath);
	if (!dryRunFolder) return { success: false, deleted: [], undeleted: [] };
	const dryRunFiles: TFile[] = [];
	const isExcluded = getExclusion(settings);
	Vault.recurseChildren(dryRunFolder, (file: TAbstractFile) => {
		const enabledAttachments =
			settings.upload.autoclean.includeAttachments &&
			isAttachment(file.path, settings.embed.unHandledObsidianExt);
		if (
			!isExcluded(normalizePath(file.path.replace(dryRunFolderPath, ""))) &&
			file instanceof TFile &&
			(enabledAttachments || file.extension === "md")
		)
			dryRunFiles.push(file);
	});
	const allSharedFiles = toSharedPaths(
		filesManagement.getAllFileWithPath(
			repoProperties.repository,
			repoProperties.convert,
			true
		)
	);
	const keepRule = getKeepRule(settings, repoProperties.repository);
	let deletedSuccess = 0;
	const result: Deleted = {
		deleted: [],
		undeleted: [],
		success: false,
	};
	const deletedFolder: TAbstractFile[] = [];
	for (const file of dryRunFiles) {
		const convertedPath = normalizePath(file.path.replace(dryRunFolderPath, ""));
		if (mustBeDeleted(convertedPath, allSharedFiles, repo)) {
			if (!isKeptInDryRun(file, convertedPath, app.metadataCache, keepRule)) {
				pconsole.trace(
					`[DRY-RUN] trying to delete file : ${file.path} from ${dryRunFolderPath}`
				);
				void trackDelete(filesManagement, convertedPath, repo, () =>
					app.fileManager.trashFile(file)
				);
				deletedSuccess++;
				deletedFolder.push(file);
				result.deleted.push(file.path);
			}
		}
	}

	//recursive delete empty folder in dryRunFolder
	//empty folder are folder with children.length === 0
	const dryRunFolders: TFolder[] = [];
	Vault.recurseChildren(dryRunFolder, (file: TAbstractFile) => {
		if (file instanceof TFolder) dryRunFolders.push(file);
	});
	for (const folder of dryRunFolders.reverse()) {
		const children = folder.children.filter((child) => !deletedFolder.includes(child));
		if (children.length === 0) {
			deletedFolder.push(folder);
			void app.fileManager.trashFile(folder);
			deletedSuccess++;
		}
	}

	const successMsg =
		deletedSuccess > 0
			? i18next.t("deletion.success", { nb: deletedSuccess.toString() })
			: i18next.t("deletion.noFile");
	if (!silent) new Notice(successMsg, noticeLength);
	result.success = true;
	return result;
}

function isKeptInDryRun(
	file: TFile,
	path: string,
	metadataCache: MetadataCache,
	keepRule: KeepRule
): boolean {
	const frontmatter = metadataCache.getFileCache(file)?.frontmatter;
	if (!frontmatter) return false;
	const isIndex = isIndexFile(path, keepRule.indexName);
	return (
		isMarkedKept(frontmatter, isIndex) ||
		(isIndex && keepRule.keepUnshared && frontmatter[keepRule.shareKey] === false)
	);
}
