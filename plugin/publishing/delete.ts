import {Octokit} from "@octokit/core";
import {Notice, parseYaml} from "obsidian";
import {folderSettings, GitHubPublisherSettings, GithubRepo, RepoFrontmatter} from "../settings/interface";
import {FilesManagement} from "./filesManagement";
import {Base64} from "js-base64";
import {isAttachment, noticeLog, trimObject} from "../src/utils";
import {StringFunc, deletion} from "../i18n"

export async function deleteFromGithub(silent=false, settings: GitHubPublisherSettings, octokit: Octokit, branchName = "main", filesManagement: FilesManagement, repoFrontmatter: RepoFrontmatter[]|RepoFrontmatter) {
	if (repoFrontmatter instanceof Array) {
		for (const repo of repoFrontmatter) {
			await deleteFromGithubOneRepo(silent, settings, octokit, branchName, filesManagement, repo)
		}
	} else {
		await deleteFromGithubOneRepo(silent, settings, octokit, branchName, filesManagement, repoFrontmatter)
	}
}


async function deleteFromGithubOneRepo(silent = false, settings: GitHubPublisherSettings, octokit: Octokit, branchName='main', filesManagement: FilesManagement, repo: RepoFrontmatter) {
	/**
	 * Delete file from github
	 * @param silent no logging
	 * @class settings
	 * @class octokit
	 * @param branchName
	 * @class filesManagement
	 */
	const getAllFile = await filesManagement.getAllFileFromRepo(branchName, octokit, settings, repo);
	const filesInRepo = await filterGithubFile(getAllFile,
		settings
	);
	if (!filesInRepo) {
		let errorMsg = "";
		if (settings.folderDefaultName.length > 0) {
			if (settings.folderDefaultName.length > 0) {
				errorMsg = (deletion("errorDeleteDefaultFolder") as string)
			} else if (
				settings.downloadedFolder === folderSettings.yaml &&
					settings.rootFolder.length === 0
			) {
				errorMsg = (deletion("errorDeleteRootFolder") as string)
			}
			if (!silent) {
				new Notice("Error : " + errorMsg);
			}
		}
		return false;
	}
	const allSharedFiles = filesManagement.getAllFileWithPath();
	const allSharedConverted = allSharedFiles.map((file) => { return {converted: file.converted, repo: file.repoFrontmatter}})
	let deletedSuccess = 0;
	let deletedFailed = 0;
	for (const file of filesInRepo) {
		const isInObsidian = allSharedConverted.some((f) => f.converted === file.file);
		const isMarkdownForAnotherRepo = file.file.trim().endsWith(".md") ? !allSharedConverted.some((f) => f.converted === file.file && JSON.stringify(f.repo) == JSON.stringify(repo)) : false;
		const isNeedToBeDeleted = isInObsidian ? isMarkdownForAnotherRepo : true;
		if (isNeedToBeDeleted) {
			const checkingIndex = file.file.contains('index') ? await checkIndexFiles(octokit, settings, file.file, repo):false;
			try {
				if (!checkingIndex) {
					noticeLog(`trying to delete file : ${file.file} from ${repo.owner}/${repo.repo}`, settings);
					const reponse = await octokit.request(
						"DELETE" + " /repos/{owner}/{repo}/contents/{path}",
						{
							owner: repo.owner,
							repo: repo.repo,
							path: file.file,
							message: "Delete file",
							sha: file.sha,
							branch: branchName
						}
					);
					if (reponse.status === 200) {
						deletedSuccess++;
					} else {
						deletedFailed++;
					}
				}
			} catch (e) {
				if (!(e instanceof DOMException)) noticeLog(e, settings);
			}
		}
	}
	let successMsg = deletion('noFileDeleted') as string;
	let failedMsg = '';
	if (deletedSuccess > 0) {
		successMsg = (deletion("successDeleting") as StringFunc)(deletedSuccess.toString());
	}
	if (deletedFailed > 0) {
		failedMsg = (deletion('failedDeleting') as StringFunc)(deletedFailed.toString());
	}
	if (!silent) {
		new Notice(successMsg + failedMsg)
	}
	return true;
}

function excludedFileFromDelete(file: string, settings: GitHubPublisherSettings) {
	/**
	 * Prevent deletion of specific file by checking their presence in the excludedFile list
	 * @param file file to eventually delete
	 * @class settings
	 */
	const autoCleanExcluded = settings.autoCleanUpExcluded.split(',')
	if (autoCleanExcluded.length > 0) {
		for (const excludedFile of autoCleanExcluded) {
			if (file.trim().includes(excludedFile.trim()) && excludedFile.length > 0) {
				return true;
			}
		}
	}
	return false;
}

export async function filterGithubFile(fileInRepo: GithubRepo[], settings: GitHubPublisherSettings): Promise<GithubRepo[]> {
	/**
	 * Scan all file in repo, and excluding some from the list. Also check for some parameters.
	 * Only file supported by GitHub are checked.
	 * Only include file with the folder Default name or the rootFolder (yaml) or default image folder
	 * Ex : Include all files in a rootfolder docs/*
	 * Also the function check if the file is excluded from deletion
	 * @param fileInRepo All files from repository
	 * @class settings
	 * @return sharedFilesInRepo TFile[] containing valid file to check if they must be deleted
	 */
	const sharedFilesInRepo:GithubRepo[] = [];
	for (const file of fileInRepo) {
		if (
			(settings.downloadedFolder === folderSettings.yaml &&
					settings.rootFolder.length === 0) ||
				settings.folderDefaultName.length === 0
		) {
			return null;
		}
		if (
			(file.file.includes(settings.folderDefaultName) ||
			(settings.downloadedFolder === folderSettings.yaml &&
				file.file.includes(settings.rootFolder)) ||
			(settings.defaultImageFolder.length > 0 &&
				file.file.includes(settings.defaultImageFolder)))
			&&
			!excludedFileFromDelete(file.file, settings) &&
			(isAttachment(file.file) || file.file.match('md$'))
		) {
			sharedFilesInRepo.push(file);
		}
	}
	return sharedFilesInRepo;
}



function parseYamlFrontmatter(contents: string) {
	/**
	 * Parse the YAML metadata from github repository files.
	 * @param contents file contents to parse
	 */
	const yamlFrontmatter = contents.split("---")[1];
	const yamlFrontmatterParsed = parseYaml(yamlFrontmatter);

	return trimObject(yamlFrontmatterParsed);
}


async function checkIndexFiles(octokit: Octokit, settings: GitHubPublisherSettings, path:string, repoFrontmatter: RepoFrontmatter) {
	/**
	 * If folder note, check if the index must be excluded or included in deletion.
	 * Always ignore file with :
	 * - index: true
	 * - autoClean: false
	 * - share: false
	 * @class octokit
	 * @class settings
	 * @param path
	 */
	try {
		const fileRequest = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
			owner: repoFrontmatter.owner,
			repo: repoFrontmatter.repo,
			path: path,
		});
		if (fileRequest.status === 200) {
			// @ts-ignore
			const fileContent = Base64.decode(fileRequest.data.content);
			const fileFrontmatter = parseYamlFrontmatter(fileContent);
			// if not share => don't delete
			// Key preventing deletion :
			//	- index: true
			//	- autoclean: false
			// return true for NO DELETION
			return fileFrontmatter.index === "true" || fileFrontmatter.autoclean === "false" || !fileFrontmatter.share ;
		}
	} catch (e) {
		if (!(e instanceof DOMException)) {
			noticeLog(e, settings);
			return false;
		}
	}
}
