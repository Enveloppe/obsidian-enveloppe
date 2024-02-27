import { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Base64 } from "js-base64";
import { MetadataCache, normalizePath, Notice, parseYaml, TAbstractFile, TFile, TFolder, Vault } from "obsidian";

import {
	Deleted,
	FIND_REGEX,
	FolderSettings,
	GitHubPublisherSettings,
	GithubRepo,
	MonoRepoProperties,
	RepoFrontmatter,
} from "../settings/interface";
import { logs, notif, trimObject} from "../utils";
import {isAttachment, verifyRateLimitAPI} from "../utils/data_validation_test";
import { FilesManagement } from "./files";

/**
 * Delete file from github, based on a list of file in the original vault
 * @param {boolean} silent - default false, if true, no notice will be displayed
 * @param {string} branchName
 * @param {FilesManagement} filesManagement
 * @param {MonoRepoProperties} repoProperties - frontmatter can be an array of RepoFrontmatter or a single RepoFrontmatter
 * @return {Promise<Deleted>} deleted : list of deleted file, undeleted : list of undeleted file, success : true if all file are deleted
 */
export async function deleteFromGithub(
	silent: boolean = false,
	branchName: string,
	filesManagement: FilesManagement,
	repoProperties: MonoRepoProperties,
): Promise<Deleted> {

	const repoFrontmatter = Array.isArray(repoProperties.frontmatter)
		? repoProperties.frontmatter
		: [repoProperties.frontmatter];
	const deleted: Deleted[] = [];
	console.warn("REPO FRONTMATTER", repoFrontmatter);
	for (const repo of repoFrontmatter) {
		const monoProperties: MonoRepoProperties = {
			frontmatter: repo,
			repo: repoProperties.repo,
		};
		deleted.push(await deleteFromGithubOneRepo(
			silent,
			branchName,
			filesManagement,
			monoProperties
		));
	}
	return deleted[0]; //needed only for main repo (not for repo in frontmatter)
}

/**
 * Delete file from github
 * @param {boolean} silent - default false, if true, no notice will be displayed
 * @param {string} branchName
 * @param {FilesManagement} filesManagement
 * @param {MonoRepoProperties} repoProperties - frontmatter must be a single RepoFrontmatter so we use the MonoRepoProperties interface
 */

async function deleteFromGithubOneRepo(
	silent:boolean = false,
	branchName: string,
	filesManagement: FilesManagement,
	repoProperties: MonoRepoProperties,
): Promise<Deleted> {
	const repo = repoProperties.frontmatter;
	if (repo.dryRun.autoclean) return cleanDryRun(silent, filesManagement, repoProperties);
	console.warn("REPO AUTOCLEAN ?", repo.autoclean);
	if (!repo.autoclean) return {success: false, deleted: [], undeleted: []};
	const getAllFile = await filesManagement.getAllFileFromRepo(
		branchName,
		repo
	);
	const settings = filesManagement.settings;
	const octokit = filesManagement.octokit;
	const filesInRepo = await filterGithubFile(getAllFile, settings, repo);
	if (
		(settings.github.rateLimit === 0 || filesInRepo.length > settings.github.rateLimit)
		&& await verifyRateLimitAPI(octokit, settings, false, filesInRepo.length) === 0
	) {
		console.warn("Rate limited exceeded, please try again later");
		return {success: false, deleted: [], undeleted: []};
	}
	const defaultName = repo.path?.defaultName ?? settings.upload.defaultName;
	const behavior = repo.path?.type ?? settings.upload.behavior;
	const root = repo.path?.rootFolder ?? settings.upload.rootFolder;
	if (filesInRepo.length === 0) {
		let errorMsg = "";
		if (defaultName.length === 0) {
			errorMsg = i18next.t("deletion.defaultFolder");
		} else if (
			behavior === FolderSettings.yaml &&
			root.length === 0
		) {
			errorMsg = i18next.t("deletion.rootFolder");
		}
		new Notice(`Error : ${errorMsg}`);
		console.warn("ERROR : ", errorMsg);
		return {success: false, deleted: [], undeleted: []};
	}
	const allSharedFiles = filesManagement.getAllFileWithPath(repoProperties.repo);
	const allSharedConverted = allSharedFiles.map((file) => {
		return { converted: file.converted, repo: file.repoFrontmatter };
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
			(f) => f.converted === file.file
		);
		const isMarkdownForAnotherRepo = file.file.trim().endsWith(".md")
			? !allSharedConverted.some(
				(f) => {
					let repoFrontmatter = f.repo;
					if (Array.isArray(repoFrontmatter)) {
						repoFrontmatter = repoFrontmatter.find((r) => JSON.stringify(r.repo) === JSON.stringify(repo.repo));
					} return f.converted === file.file && repoFrontmatter;
				})
			: false;
		const isNeedToBeDeleted = isInObsidian
			? isMarkdownForAnotherRepo
			: true;
		console.warn("IS NEED TO BE DELETED ?", isNeedToBeDeleted);	
		if (isNeedToBeDeleted) {
			const checkingIndex = file.file.contains(settings.upload.folderNote.rename)
				? await checkIndexFiles(octokit, settings, file.file, repo)
				: false;
			try {
				if (!checkingIndex) {
					notif(
						{settings},
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
				if (!(e instanceof DOMException)) logs({settings, e: true}, e);
			}
		}
	}
	let successMsg = i18next.t("deletion.noFile") ;
	let failedMsg = "";
	if (deletedSuccess > 0) {
		successMsg = (i18next.t("deletion.success", {nb: deletedSuccess.toString()}));
	}
	if (deletedFailed > 0) {
		failedMsg = (i18next.t("deletion.failed", {nb: deletedFailed.toString()}));
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
 * @param {GitHubPublisherSettings} settings
 * @return {boolean} : true if the file is in the excludedFile list
 */
function excludedFileFromDelete(
	file: string,
	settings: GitHubPublisherSettings
): boolean {
	const autoCleanExcluded = settings.upload.autoclean.excluded;
	if (autoCleanExcluded.length > 0) {
		for (const excludedFile of autoCleanExcluded) {
			const isRegex = excludedFile.match(FIND_REGEX);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
			if (regex?.test(file)) {
				return true;
			} else if (
				file.trim().includes(excludedFile.trim()) &&
				excludedFile.length > 0
			) {
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
 * @param {GitHubPublisherSettings} settings Settings of the plugin
 * @return {Promise<GithubRepo[]>} sharedFilesInRepo containing valid file to check if they must be deleted
 */

export async function filterGithubFile(
	fileInRepo: GithubRepo[],
	settings: GitHubPublisherSettings,
	repoFrontmatter: RepoFrontmatter
): Promise<GithubRepo[]> {
	const sharedFilesInRepo: GithubRepo[] = [];
	for (const file of fileInRepo) {
		const behavior = repoFrontmatter.path?.type ?? settings.upload.behavior;
		const root = repoFrontmatter.path?.rootFolder ?? settings.upload.rootFolder;
		const defaultName = repoFrontmatter.path?.defaultName ?? settings.upload.defaultName;
		const attachmentFolder = repoFrontmatter.path?.attachment?.folder ?? settings.embed.folder;
		if (
			(file.file.includes(defaultName) ||
				(behavior === FolderSettings.yaml &&
					file.file.includes(root)) ||
				(attachmentFolder.length > 0 &&
					file.file.includes(attachmentFolder))) &&
			!excludedFileFromDelete(file.file, settings) &&
			(isAttachment(file.file) || file.file.match("md$"))
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
 * @param {GitHubPublisherSettings} settings Settings of the plugin
 * @param {string} path path of the file to check
 * @param {RepoFrontmatter} repoFrontmatter repository informations
 * @return {Promise<boolean>} true if the file must be deleted
 */

async function checkIndexFiles(
	octokit: Octokit,
	settings: GitHubPublisherSettings,
	path: string,
	repoFrontmatter: RepoFrontmatter
): Promise<boolean> {
	try {
		const fileRequest = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner: repoFrontmatter.owner,
				repo: repoFrontmatter.repo,
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
			notif({settings, e: true}, e);
			return false;
		}
	}
	return false;
}

function cleanDryRun(
	silent: boolean = false,
	filesManagement: FilesManagement, repoProperties: MonoRepoProperties): Deleted {
	const {vault, settings} = filesManagement;
	const app = filesManagement.plugin.app;
	const repo = repoProperties.frontmatter;
	const dryRunFolderPath = normalizePath(repo.dryRun.folderName
		.replace("{{owner}}", repo.owner)
		.replace("{{repo}}", repo.repo)
		.replace("{{branch}}", repo.branch));
	const dryRunFolder = vault.getAbstractFileByPath(dryRunFolderPath);
	if (!dryRunFolder || dryRunFolder instanceof TFile) return {success: false, deleted: [], undeleted: []};
	const dryRunFiles:TFile[] = [];
	Vault.recurseChildren(dryRunFolder as TFolder, (file: TAbstractFile) => {
		if (!excludedFileFromDelete(normalizePath(file.path.replace(dryRunFolderPath, "")), settings) && (isAttachment(file.path) || file.path.match("md$")) && file instanceof TFile) dryRunFiles.push(file);
	});
	const allSharedFiles = filesManagement.getAllFileWithPath(repoProperties.repo).map((file) => {
		return { converted: file.converted, repo: file.repoFrontmatter };
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
			(f) => f.converted === convertedPath
		);
		const isMarkdownForAnotherRepo = file.path.trim().endsWith(".md") ?
			!allSharedFiles.some(
				(f) => {
					let repoFrontmatter = f.repo;
					if (Array.isArray(repoFrontmatter)) {
						repoFrontmatter = repoFrontmatter.find((r) => JSON.stringify(r.repo) === JSON.stringify(repo.repo));
					} return f.converted === convertedPath && repoFrontmatter;
				})
			: false;
		const isNeedToBeDeleted = isInObsidian ? isMarkdownForAnotherRepo : true;
		if (isNeedToBeDeleted) {
			const indexFile = (convertedPath.contains(settings.upload.folderNote.rename)) ? indexFileDryRun(file as TFile, app.metadataCache) : false;
			if (!indexFile) {
				notif({settings}, `[DRYRUN] trying to delete file : ${file.path} from ${dryRunFolderPath}`);
				vault.trash(file, false);
				deletedSuccess++;
				deletedFolder.push(file);
			}
		}
	}

	//recursive delete empty folder in dryRunFolder
	//empty folder are folder with children.length === 0
	const dryRunFolders:TFolder[] = [];
	Vault.recurseChildren(vault.getAbstractFileByPath(dryRunFolderPath) as TFolder, (file: TAbstractFile) => {
		if (file instanceof TFolder) {
			dryRunFolders.push(file);
		}
	});
	for (const folder of dryRunFolders.reverse()) {
		const children = folder.children.filter((child) => !deletedFolder.includes(child));
		if (children.length === 0) {
			deletedFolder.push(folder);
			vault.trash(folder, false);
			deletedSuccess++;
		}
	}

	const successMsg = deletedSuccess > 0 ? (i18next.t("deletion.success", {nb: deletedSuccess.toString()})) : i18next.t("deletion.noFile");
	if (!silent)
		new Notice(successMsg);
	result.success = deletedSuccess === 0;
	return result;
}

function indexFileDryRun(file: TFile, metadataCache: MetadataCache):boolean {
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