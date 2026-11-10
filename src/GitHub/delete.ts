import {
	type Deleted,
	type EnveloppeSettings,
	FIND_REGEX,
	FolderSettings,
	type GithubRepo,
	type MonoRepoProperties,
	type MultiRepoProperties,
	type Properties,
} from "@interfaces";
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
import type { ContentFile } from "src/GitHub/octokit_types";
import { trimObject } from "src/utils";
import {
	getDryRunFolder,
	isAttachment,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
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
	const allSharedConverted = allSharedFiles.map((file) => {
		return { converted: file.converted, repo: file.prop, otherPath: file.otherPaths };
	});
	let deletedSuccess = 0;
	let deletedFailed = 0;
	const result: Deleted = {
		deleted: [],
		undeleted: [],
		success: false,
	};
	for (const file of filesInRepo) {
		const isInObsidian = allSharedConverted.some(
			(f) => f.converted === file.file || f.otherPath?.includes(file.file)
		);
		const isMarkdownForAnotherRepo = file.file.trim().endsWith(".md")
			? !allSharedConverted.some((f) => {
					let prop = f.repo;
					if (Array.isArray(prop)) {
						prop = prop.find((r) => r.repo === repo.repo);
					}
					return (f.converted === file.file || f.otherPath?.includes(file.file)) && prop;
				})
			: false;
		const isNeedToBeDeleted = isInObsidian ? isMarkdownForAnotherRepo : true;
		if (isNeedToBeDeleted) {
			const checkingIndex = file.file.contains(settings.upload.folderNote.rename)
				? await checkIndexFiles(octokit, file.file, repo, branchName)
				: false;
			if (!checkingIndex) {
				pconsole.trace(
					`trying to delete file : ${file.file} from ${repo.owner}/${repo.repo}`
				);
				try {
					await octokit.request("DELETE /repos/{owner}/{repo}/contents/{+path}", {
						owner: repo.owner,
						repo: repo.repo,
						path: file.file,
						message: `DELETE FILE : ${file.file}`,
						sha: file.sha,
						branch: branchName,
					});
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

/**
 * Prevent deletion of specific file by checking their presence in the excludedFile list
 * @param {string} file file to eventually delete
 * @param {EnveloppeSettings} settings
 * @return {boolean} : true if the file is in the excludedFile list
 */
function excludedFileFromDelete(file: string, settings: EnveloppeSettings): boolean {
	const autoCleanExcluded = settings.upload.autoclean.excluded;
	if (autoCleanExcluded.length > 0) {
		for (const excludedFile of autoCleanExcluded) {
			const isRegex = excludedFile.match(FIND_REGEX);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
			if (regex?.test(file)) {
				return true;
			} else if (file.trim().includes(excludedFile.trim()) && excludedFile.length > 0) {
				return true;
			}
		}
	}
	return false;
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
			!excludedFileFromDelete(file.file, settings) &&
			(enabledAttachments || file.file.endsWith(".md"))
		) {
			sharedFilesInRepo.push(file);
		}
	}
	return sharedFilesInRepo;
}

/**
 * Parse the YAML metadata from github repository files.
 * @param {string} contents file contents to parse
 * @param filePath
 * @return {string} YAML metadata
 */

function parseYamlFrontmatter(contents: string): Record<string, unknown> {
	const { exists, frontmatter } = getFrontMatterInfo(contents);
	if (!exists) return {};
	try {
		return trimObject(parseYaml(frontmatter));
	} catch {
		//probably not a valid frontmatter, skip
		return {};
	}
}

/**
 * If folder note, check if the index must be excluded or included in deletion.
 * Always ignore file with :
 * - index: true
 * - autoClean: false
 * - share: false
 * @param {Octokit} octokit GitHub API
 * @param {string} path path of the file to check
 * @param {Properties} prop repository informations
 * @param {string} branchName branch where the file will be deleted
 * @return {Promise<boolean>} true if the file must be kept
 */

async function checkIndexFiles(
	octokit: Octokit,
	path: string,
	prop: Properties,
	branchName: string
): Promise<boolean> {
	const fileRequest = (await octokit.request(
		"GET /repos/{owner}/{repo}/contents/{+path}",
		{
			owner: prop.owner,
			repo: prop.repo,
			path,
			ref: branchName,
		}
	)) as { status: number; data: ContentFile };
	if (fileRequest.status === 200) {
		const fileContent = Base64.decode(fileRequest.data.content);
		const fileFrontmatter = parseYamlFrontmatter(fileContent);
		// YAML gives booleans, but quoted values stay strings
		const is = (value: unknown, expected: boolean) =>
			value === expected || value === String(expected);
		return (
			is(fileFrontmatter.index, true) ||
			is(fileFrontmatter.delete, false) ||
			!fileFrontmatter.share
		);
	}
	return false;
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
	Vault.recurseChildren(dryRunFolder, (file: TAbstractFile) => {
		const enabledAttachments =
			settings.upload.autoclean.includeAttachments &&
			isAttachment(file.path, settings.embed.unHandledObsidianExt);
		if (
			!excludedFileFromDelete(
				normalizePath(file.path.replace(dryRunFolderPath, "")),
				settings
			) &&
			file instanceof TFile &&
			(enabledAttachments || file.extension === "md")
		)
			dryRunFiles.push(file);
	});
	const allSharedFiles = filesManagement
		.getAllFileWithPath(repoProperties.repository, repoProperties.convert, true)
		.map((file) => {
			return { converted: file.converted, repo: file.prop, otherPath: file.otherPaths };
		});
	let deletedSuccess = 0;
	const result: Deleted = {
		deleted: [],
		undeleted: [],
		success: false,
	};
	const deletedFolder: TAbstractFile[] = [];
	for (const file of dryRunFiles) {
		const convertedPath = normalizePath(file.path.replace(dryRunFolderPath, ""));
		const isInObsidian = allSharedFiles.some(
			(f) => f.converted === convertedPath || f.otherPath?.includes(convertedPath)
		);
		const isMarkdownForAnotherRepo = file.path.trim().endsWith(".md")
			? !allSharedFiles.some((f) => {
					let prop = f.repo;
					if (Array.isArray(prop)) {
						prop = prop.find((r) => r.repo === repo.repo);
					}
					return (
						(f.converted === convertedPath || f.otherPath?.includes(convertedPath)) &&
						prop
					);
				})
			: false;
		const isNeedToBeDeleted = isInObsidian ? isMarkdownForAnotherRepo : true;
		if (isNeedToBeDeleted) {
			const indexFile = convertedPath.contains(settings.upload.folderNote.rename)
				? indexFileDryRun(file, app.metadataCache)
				: false;
			if (!indexFile) {
				pconsole.trace(
					`[DRY-RUN] trying to delete file : ${file.path} from ${dryRunFolderPath}`
				);
				void app.fileManager.trashFile(file);
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

function indexFileDryRun(file: TFile, metadataCache: MetadataCache): boolean {
	const frontmatter = metadataCache.getFileCache(file)?.frontmatter;
	if (frontmatter) {
		const index = frontmatter.index as boolean | undefined;
		const deleteFile = frontmatter.delete as boolean | undefined;
		const share = frontmatter.share as boolean | undefined;
		if (index === true || deleteFile === false || share === false) {
			return true;
		}
	}
	return false;
}
