import { Octokit } from "@octokit/core";
import { Notice, parseYaml } from "obsidian";
import {
	Deleted,
	FolderSettings,
	GitHubPublisherSettings,
	GithubRepo,
	RepoFrontmatter,
} from "../settings/interface";
import { FilesManagement } from "./files";
import { Base64 } from "js-base64";
import {noticeLog, trimObject } from "../src/utils";
import {isAttachment} from "../src/data_validation_test";
import i18next from "i18next";

/**
 * Delete file from github, based on a list of file in the original vault
 * @param {boolean} silent No logging
 * @param {GitHubPublisherSettings} settings
 * @param {Octokit} octokit
 * @param {string} branchName The name of the branch created by the plugin
 * @param {FilesManagement} filesManagement
 * @param {RepoFrontmatter[] | RepoFrontmatter} repoFrontmatter
 * @return {Promise<void>}
 */
export async function deleteFromGithub(
	silent = false,
	settings: GitHubPublisherSettings,
	octokit: Octokit,
	branchName: string,
	filesManagement: FilesManagement,
	repoFrontmatter: RepoFrontmatter[] | RepoFrontmatter,
): Promise<Deleted> {
	repoFrontmatter = Array.isArray(repoFrontmatter)
		? repoFrontmatter
		: [repoFrontmatter];
	const deleted: Deleted[] = [];
	for (const repo of repoFrontmatter) {
		deleted.push(await deleteFromGithubOneRepo(
			silent,
			settings,
			octokit,
			branchName,
			filesManagement,
			repo,
		));
	}
	return deleted[0]; //needed only for main repo (not for repo in frontmatter)
}

/**
 * Delete file from github
 * @param {boolean} silent No logging
 * @param {GitHubPublisherSettings} settings
 * @param {Octokit} octokit
 * @param {string} branchName The branch where the file will be deleted
 * @param {FilesManagement} filesManagement
 * @param {RepoFrontmatter} repo
 * @return {Promise<boolean>} : true if success
 */

async function deleteFromGithubOneRepo(
	silent = false,
	settings: GitHubPublisherSettings,
	octokit: Octokit,
	branchName: string,
	filesManagement: FilesManagement,
	repo: RepoFrontmatter
): Promise<Deleted> {
	if (!repo.autoclean) return;
	const getAllFile = await filesManagement.getAllFileFromRepo(
		branchName,
		octokit,
		settings,
		repo
	);
	const filesInRepo = await filterGithubFile(getAllFile, settings);
	if (!filesInRepo) {
		let errorMsg = "";
		if (settings.upload.defaultName.length > 0) {
			if (settings.upload.defaultName.length > 0) {
				errorMsg = i18next.t("deletion.defaultFolder");
			} else if (
				settings.upload.behavior === FolderSettings.yaml &&
				settings.upload.rootFolder.length === 0
			) {
				errorMsg = i18next.t("deletion.rootFolder");
			}
		}
		if (!silent) {
			new Notice("Error : " + errorMsg);
		}
		return {success: false, deleted: [], undeleted: []};
	}
	const allSharedFiles = filesManagement.getAllFileWithPath();
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
				(f) =>
					f.converted === file.file &&
						JSON.stringify(f.repo) == JSON.stringify(repo)
			)
			: false;
		const isNeedToBeDeleted = isInObsidian
			? isMarkdownForAnotherRepo
			: true;
		if (isNeedToBeDeleted) {
			const checkingIndex = file.file.contains(settings.upload.folderNote.rename)
				? await checkIndexFiles(octokit, settings, file.file, repo)
				: false;
			try {
				if (!checkingIndex) {
					noticeLog(
						`trying to delete file : ${file.file} from ${repo.owner}/${repo.repo}`,
						settings
					);
					const reponse = await octokit.request(
						"DELETE" + " /repos/{owner}/{repo}/contents/{path}",
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
				if (!(e instanceof DOMException)) noticeLog(e, settings);
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
			const isRegex = excludedFile.match(/^\/(.*)\/[igmsuy]*$/);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
			if (regex && regex.test(file)) {
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
	settings: GitHubPublisherSettings
): Promise<GithubRepo[]> {
	const sharedFilesInRepo: GithubRepo[] = [];
	for (const file of fileInRepo) {
		const behavior = settings.upload.behavior;
		const root = settings.upload.rootFolder;
		const defaultName = settings.upload.defaultName;
		const attachmentFolder = settings.embed.folder;
		if (
			(behavior === FolderSettings.yaml &&
				root.length === 0) ||
			defaultName.length === 0 || behavior === FolderSettings.fixed
		) {
			return null;
		}
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

function parseYamlFrontmatter(contents: string) {
	const yamlFrontmatter = contents.split("---")[1];
	const yamlFrontmatterParsed = parseYaml(yamlFrontmatter);

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
				path: path,
			}
		);
		if (fileRequest.status === 200) {
			// @ts-ignore
			const fileContent = Base64.decode(fileRequest.data.content);
			const fileFrontmatter = parseYamlFrontmatter(fileContent);
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
			noticeLog(e, settings);
			return false;
		}
	}
}
