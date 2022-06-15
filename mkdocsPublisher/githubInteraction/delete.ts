import { Octokit } from "@octokit/core";
import { Notice } from "obsidian";
import { MkdocsPublicationSettings } from "../settings/interface";
import { GetFiles } from "./getFiles";
import {Base64} from "js-base64";

export async function deleteFromGithub(silent = false, settings: MkdocsPublicationSettings, octokit: Octokit, branchName='main', GetFiles: GetFiles) {
	const getAllFile = await getAllFileFromRepo(branchName, octokit, settings);
	const filesInRepo = await filterGithubFile(getAllFile,
		settings
	);
	if (!filesInRepo) {
		let errorMsg = "";
		if (settings.folderDefaultName.length > 0) {
			if (settings.folderDefaultName.length > 0) {
				errorMsg =
						"You need to configure a" +
						" default folder name in the" +
						" settings to use this command.";
			} else if (
				settings.downloadedFolder === "yamlFrontmatter" &&
					settings.rootFolder
			) {
				errorMsg =
						"You need to configure a root folder in the settings to use this command.";
			}
			if (!silent) {
				new Notice("Error : " + errorMsg);
			}
		}
		return false;
	}
	const allSharedFiles = GetFiles.getAllFileWithPath();
	console.log(allSharedFiles)
	let deletedSuccess = 0;
	let deletedFailed = 0;
	for (const file of filesInRepo) {
		if (!allSharedFiles.includes(file.file.trim())) {
			try {
				const checkingIndex = file.file.contains('index') ? await checkIndexFiles(octokit, settings, file.file):false;
				if (!checkingIndex) {
					console.log('trying to delete file : ' + file.file);
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
				console.error(e);
			}
		}
	}
	let successMsg = 'No files have been deleted';
	let failedMsg = '';
	if (deletedSuccess > 0) {
		successMsg = `Successfully deleted ${deletedSuccess} files`
	}
	if (deletedFailed > 0) {
		failedMsg = `Failed to delete ${deletedFailed} files.`
	}
	if (!silent) {
		new Notice(successMsg + failedMsg)
	}
	return true;
}

function excludedFileFromDelete(file: string, settings: MkdocsPublicationSettings) {
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

export async function filterGithubFile(fileInRepo: { file: string; sha: string }[], settings: MkdocsPublicationSettings) {
	const sharedFilesInRepo = [];
	for (const file of fileInRepo) {
		if (
			(settings.downloadedFolder === "yamlFrontmatter" &&
					settings.rootFolder.length === 0) ||
				settings.folderDefaultName.length === 0
		) {
			return false;
		}
		if (
			(file.file.includes(settings.folderDefaultName) ||
			(settings.downloadedFolder === "yamlFrontmatter" &&
				file.file.includes(settings.rootFolder)) ||
			(settings.defaultImageFolder.length > 0 &&
				file.file.includes(settings.defaultImageFolder)))
			&&
			!excludedFileFromDelete(file.file, settings) &&
			file.file.match(/(md|jpe?g|png|gif|bmp|svg|mp3|webm|wav|m4a|ogg|3gp|flac|mp4|ogv|pdf)$/)
		) {
			console.log('shared')
			sharedFilesInRepo.push(file);
		}
	}
	return sharedFilesInRepo;
}

async function getAllFileFromRepo(ref="main", octokit: Octokit, settings: MkdocsPublicationSettings) {
	const filesInRepo = [];
	try {
		const repoContents = await octokit.request(
			"GET" + " /repos/{owner}/{repo}/git/trees/{tree_sha}",
			{
				owner: settings.githubName,
				repo: settings.githubRepo,
				tree_sha: ref,
				recursive: "true",
			}
		);

		if (repoContents.status === 200) {
			const files = repoContents.data.tree;
			for (const file of files) {
				const basename = (name: string) =>
					/([^/\\.]*)(\..*)?$/.exec(name)[1]; //don't delete file starting with .
				if (
					file.type === "blob" &&
						basename(file.path).length > 0 &&
						basename(file.path) != 'vault_published'
				) {
					filesInRepo.push({
						file: file.path,
						sha: file.sha,
					});
				}
			}
		}
	} catch (e) {
		console.log(e)
	}
	return filesInRepo;
}

function parseYamlFrontmatter(file: string) {
	const yamlFrontmatter = file.split("---")[1];
	const yamlFrontmatterParsed = yamlFrontmatter.split("\n");
	const yamlFrontmatterParsedCleaned: {[k:string]:string} = {};
	for (const line of yamlFrontmatterParsed) {
		if (line.trim().length > 0) {
			yamlFrontmatterParsedCleaned[line.split(":")[0].trim()] = line.split(":")[1].trim();
		}
	}
	return yamlFrontmatterParsedCleaned;
}

async function checkIndexFiles(octokit: Octokit, settings: MkdocsPublicationSettings, path:string) {
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
			return fileFrontmatter.index === "true" || fileFrontmatter.autoclean === "false" || !fileFrontmatter.share;
		}
	} catch (e) {
		console.log(e);
		return false;
	}
}
