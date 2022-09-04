import {Octokit} from "@octokit/core";
import {Notice, parseYaml} from "obsidian";
import {folderSettings, GitHubPublisherSettings, GithubRepo} from "../settings/interface";
import {FilesManagement} from "./filesManagement";
import {Base64} from "js-base64";
import {noticeLog, trimObject} from "../src/utils";
import t, {StringFunc} from "../i18n"

export async function deleteFromGithub(silent = false, settings: GitHubPublisherSettings, octokit: Octokit, branchName='main', filesManagement: FilesManagement) {
	/**
	 * Delete file from github
	 * @param silent no logging
	 * @class settings
	 * @class octokit
	 * @param branchName
	 * @class filesManagement
	 */
	const getAllFile = await filesManagement.getAllFileFromRepo(branchName, octokit, settings);
	const filesInRepo = await filterGithubFile(getAllFile,
		settings
	);
	if (!filesInRepo) {
		let errorMsg = "";
		if (settings.folderDefaultName.length > 0) {
			if (settings.folderDefaultName.length > 0) {
				errorMsg = (t("errorDeleteDefaultFolder") as string)
			} else if (
				settings.downloadedFolder === folderSettings.yaml &&
					settings.rootFolder.length === 0
			) {
				errorMsg = (t("errorDeleteRootFolder") as string)
			}
			if (!silent) {
				new Notice("Error : " + errorMsg);
			}
		}
		return false;
	}
	const allSharedFiles = filesManagement.getAllFileWithPath();
	const allSharedConverted = allSharedFiles.map((file) => { return file.converted; });
	let deletedSuccess = 0;
	let deletedFailed = 0;
	for (const file of filesInRepo) {
		if (!allSharedConverted.includes(file.file.trim())) {
			const checkingIndex = file.file.contains('index') ? await checkIndexFiles(octokit, settings, file.file):false;
			try {
				if (!checkingIndex) {
					noticeLog('trying to delete file : ' + file.file, settings);
					const reponse = await octokit.request(
						"DELETE" + " /repos/{owner}/{repo}/contents/{path}",
						{
							owner: settings.githubName,
							repo: settings.githubRepo,
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
	let successMsg = t('noFileDeleted') as string;
	let failedMsg = '';
	if (deletedSuccess > 0) {
		successMsg = (t("successDeleting") as StringFunc)(deletedSuccess.toString());
	}
	if (deletedFailed > 0) {
		failedMsg = (t('failedDeleting') as StringFunc)(deletedFailed.toString());
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
			file.file.match(/(md|jpe?g|png|gif|bmp|svg|mp3|webm|wav|m4a|ogg|3gp|flac|mp4|ogv|pdf)$/)
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

async function checkIndexFiles(octokit: Octokit, settings: GitHubPublisherSettings, path:string) {
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
			owner: settings.githubName,
			repo: settings.githubRepo,
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
