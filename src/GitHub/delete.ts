import {
	type Deleted,
	FIND_REGEX,
	FolderSettings,
	type EnveloppeSettings,
	type GithubRepo,
	type MonoRepoProperties,
	type Properties,
} from "@interfaces";
import type { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Base64 } from "js-base64";
import {
	type MetadataCache,
	normalizePath,
	Notice,
	parseYaml,
	type TAbstractFile,
	TFile,
	TFolder,
	Vault,
} from "obsidian";
import type { FilesManagement } from "src/GitHub/files";
import { trimObject } from "src/utils";
import { isAttachment, verifyRateLimitAPI } from "src/utils/data_validation_test";
import { frontmatterSettingsRepository } from "src/utils/parse_frontmatter";
import type Enveloppe from "../main";
import { klona } from "klona";

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
	repoProperties: MonoRepoProperties
): Promise<Deleted> {
	const prop = Array.isArray(repoProperties.frontmatter)
		? repoProperties.frontmatter
		: [repoProperties.frontmatter];
	const deleted: Deleted[] = [];
	for (const repo of prop) {
		const monoProperties: MonoRepoProperties = {
			frontmatter: repo,
			repository: repoProperties.repository,
			convert: frontmatterSettingsRepository(filesManagement.plugin, repo),
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
	const settings = filesManagement.settings;
	const { octokit, plugin } = filesManagement;
	const filesInRepo = await filterGithubFile(getAllFile, settings, repo);
	if (
		(settings.github.rateLimit === 0 || filesInRepo.length > settings.github.rateLimit) &&
		(await verifyRateLimitAPI(octokit, plugin, false, filesInRepo.length)) === 0
	) {
		console.warn("Rate limited exceeded, please try again later");
		return { success: false, deleted: [], undeleted: [] };
	}
	if (filesInRepo.length === 0) {
		pconsole.logs({}, `No file to delete in ${repo.owner}/${repo.repo}`);
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
						prop = prop.find((r) => klona(r.repo) === klona(repo.repo));
					}
					return (f.converted === file.file || f.otherPath?.includes(file.file)) && prop;
				})
			: false;
		const isNeedToBeDeleted = isInObsidian ? isMarkdownForAnotherRepo : true;
		if (isNeedToBeDeleted) {
			const checkingIndex = file.file.contains(settings.upload.folderNote.rename)
				? await checkIndexFiles(octokit, plugin, file.file, repo)
				: false;
			try {
				if (!checkingIndex) {
					pconsole.notif(
						{},
						`trying to delete file : ${file.file} from ${repo.owner}/${repo.repo}`
					);
					const reponse = await octokit.request(
						"DELETE /repos/{owner}/{repo}/contents/{path}",
						{
							owner: repo.owner,
							repo: repo.repo,
							path: file.file,
							message: `DELETE FILE : ${file.file}`,
							sha: file.sha,
							branch: branchName,
						}
					);
					if (reponse.status === 200) {
						deletedSuccess++;
						result.deleted.push(file.file);
					} else {
						deletedFailed++;
						result.undeleted.push(file.file);
					}
				}
			} catch (e) {
				if (!(e instanceof DOMException)) pconsole.logs({ e: true }, e);
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
		new Notice(successMsg + failedMsg);
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
			(enabledAttachments || file.file.match("md$"))
		) {
			sharedFilesInRepo.push(file);
		}
	}
	return sharedFilesInRepo;
}

/**
 * Parse the YAML metadata from github repository files.
 * @param {string} contents file contents to parse
 * @return {string} YAML metadata
 */

function parseYamlFrontmatter(contents: string): unknown {
	const yamlFrontmatter = contents.split("---")[1];
	const yamlFrontmatterParsed = parseYaml(yamlFrontmatter) ?? {};
	return trimObject(yamlFrontmatterParsed);
}

/**
 * If folder note, check if the index must be excluded or included in deletion.
 * Always ignore file with :
 * - index: true
 * - autoClean: false
 * - share: false
 * @param {Octokit} octokit GitHub API
 * @param {EnveloppeSettings} settings Settings of the plugin
 * @param {string} path path of the file to check
 * @param {Properties} prop repository informations
 * @return {Promise<boolean>} true if the file must be deleted
 */

async function checkIndexFiles(
	octokit: Octokit,
	plugin: Enveloppe,
	path: string,
	prop: Properties
): Promise<boolean> {
	try {
		const fileRequest = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner: prop.owner,
				repo: prop.repo,
				path,
			}
		);
		if (fileRequest.status === 200) {
			// @ts-ignore
			const fileContent = Base64.decode(fileRequest.data.content);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fileFrontmatter = parseYamlFrontmatter(fileContent) as any;
			// if not share => don't delete
			// Key preventing deletion :
			//	- index: true
			//	- delete: false
			// return true for NO DELETION
			return (
				fileFrontmatter.index === "true" ||
				fileFrontmatter.delete === "false" ||
				!fileFrontmatter.share
			);
		}
	} catch (e) {
		if (!(e instanceof DOMException)) {
			plugin.console.notif({ e: true }, e);
			return false;
		}
	}
	return false;
}

function cleanDryRun(
	silent: boolean = false,
	filesManagement: FilesManagement,
	repoProperties: MonoRepoProperties
): Deleted {
	const { vault, settings, console, plugin } = filesManagement;
	const app = plugin.app;
	const repo = repoProperties.frontmatter;
	const dryRunFolderPath = normalizePath(
		repo.dryRun.folderName
			.replace("{{owner}}", repo.owner)
			.replace("{{repo}}", repo.repo)
			.replace("{{branch}}", repo.branch)
	);
	const dryRunFolder = vault.getAbstractFileByPath(dryRunFolderPath);
	if (!dryRunFolder || dryRunFolder instanceof TFile)
		return { success: false, deleted: [], undeleted: [] };
	const dryRunFiles: TFile[] = [];
	Vault.recurseChildren(dryRunFolder as TFolder, (file: TAbstractFile) => {
		const enabledAttachments =
			settings.upload.autoclean.includeAttachments &&
			isAttachment(file.path, settings.embed.unHandledObsidianExt);
		if (
			!excludedFileFromDelete(
				normalizePath(file.path.replace(dryRunFolderPath, "")),
				settings
			) &&
			(enabledAttachments || file.path.match("md$")) &&
			file instanceof TFile
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
						prop = prop.find((r) => klona(r.repo) === klona(repo.repo));
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
				? indexFileDryRun(file as TFile, app.metadataCache)
				: false;
			if (!indexFile) {
				console.notif(
					{},
					`[DRYRUN] trying to delete file : ${file.path} from ${dryRunFolderPath}`
				);
				vault.trash(file, false);
				deletedSuccess++;
				deletedFolder.push(file);
			}
		}
	}

	//recursive delete empty folder in dryRunFolder
	//empty folder are folder with children.length === 0
	const dryRunFolders: TFolder[] = [];
	Vault.recurseChildren(
		vault.getAbstractFileByPath(dryRunFolderPath) as TFolder,
		(file: TAbstractFile) => {
			if (file instanceof TFolder) {
				dryRunFolders.push(file);
			}
		}
	);
	for (const folder of dryRunFolders.reverse()) {
		const children = folder.children.filter((child) => !deletedFolder.includes(child));
		if (children.length === 0) {
			deletedFolder.push(folder);
			vault.trash(folder, false);
			deletedSuccess++;
		}
	}

	const successMsg =
		deletedSuccess > 0
			? i18next.t("deletion.success", { nb: deletedSuccess.toString() })
			: i18next.t("deletion.noFile");
	if (!silent) new Notice(successMsg);
	result.success = deletedSuccess === 0;
	return result;
}

function indexFileDryRun(file: TFile, metadataCache: MetadataCache): boolean {
	const frontmatter = metadataCache.getFileCache(file)?.frontmatter;
	if (frontmatter) {
		const index = frontmatter.index;
		const deleteFile = frontmatter.delete;
		const share = frontmatter.share;
		if (index === true || deleteFile === false || share === false) {
			return true;
		}
	}
	return false;
}
