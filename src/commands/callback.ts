/**
 * @file callback.ts
 * @description Return the commands based on the fact it's for a specific repo or the default one
 * The id is different if a repo is set, and the smartkey is used as a name, prepended by a K
 */

import i18next from "i18next";
import {Command, Notice, TFile } from "obsidian";

import {MonoRepoProperties,MultiRepoProperties,Repository} from "../interfaces";
import GithubPublisher from "../main";
import {createLink} from "../utils";
import {checkRepositoryValidity, isShared} from "../utils/data_validation_test";
import { frontmatterFromFile, frontmatterSettingsRepository, getProperties } from "../utils/parse_frontmatter";
import {purgeNotesRemote, shareOneNote} from ".";
import {shareEditedOnly, uploadAllEditedNotes, uploadAllNotes, uploadNewNotes} from "./plugin_commands";

/**
 * Create the command to create a link to the note in the repo
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin
 * @return {Promise<Command>}
 */
export async function createLinkCallback(repo: Repository | null, plugin: GithubPublisher): Promise<Command> {
	const id = repo ? `copy-link-K${repo.smartKey}` : "copy-link";
	const common = i18next.t("common.repository");
	let name = i18next.t("commands.copyLink.title");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = frontmatterFromFile(file, plugin, repo);
			if (
				file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
			) {
				if (!checking) {
					const multiRepo: MultiRepoProperties = {
						frontmatter: getProperties(plugin, repo, frontmatter, true),
						repository: repo,
					};
					createLink(
						file,
						multiRepo,
						plugin
					);
					new Notice(i18next.t("commands.copyLink.onActivation"));
				}
				return true;
			}
			return false;
		},
	} as Command;
}


/**
 * Command to delete file on the repo
 * @call purgeNotesRemote
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName - The branch name to delete the file
 * @return {Promise<Command>}
 */
export async function purgeNotesRemoteCallback(plugin: GithubPublisher, repo: Repository | null, branchName: string): Promise<Command> {
	const id = repo ? `delete-clean-K${repo.smartKey}` : "delete-clean";
	let name = i18next.t("commands.publisherDeleteClean");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	//@ts-ignore
	return {
		id,
		name,
		hotkeys: [],
		//@ts-ignore
		callback: async () => {
			const frontmatter = getProperties(plugin, repo, undefined, true);
			const monoRepo: MonoRepoProperties = {
				frontmatter: Array.isArray(frontmatter) ? frontmatter[0] : frontmatter,
				repository: repo,
				convert: frontmatterSettingsRepository(plugin, repo)
			};
			const publisher = await plugin.reloadOctokit(repo?.smartKey);
			await purgeNotesRemote(
				publisher,
				branchName,
				monoRepo
			);
		},
	} as Command;
}

/**
 * Command to upload the active file ; use checkCallback to check if the file is shared and if they are a active file
 * @call shareOneNote
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin - The plugin instance
 * @return {Promise<Command>}
 */
export async function shareOneNoteCallback(repo: Repository|null, plugin: GithubPublisher): Promise<Command> {
	const id = repo ? `share-one-K${repo.smartKey}` : "share-one";
	let name = i18next.t("commands.shareActiveFile");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	const octokit = await plugin.reloadOctokit(repo?.smartKey);
	//@ts-ignore
	return {
		id,
		name,
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = frontmatterFromFile(file, plugin, repo);
			if (
				file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
			) {
				if (!checking) {
					shareOneNote(
						octokit,
						file,
						repo,
						frontmatter,
						file.basename,
					);
				}
				return true;
			}
			return false;
		},
	} as Command;
}

/**
 * Upload all note
 * @call uploadAllNotes
 * @param plugin {GithubPublisher} - The plugin instance
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName - The branch name to upload the file
 * @return {Promise<Command>}
 */
export async function uploadAllNotesCallback(plugin: GithubPublisher, repo: Repository|null, branchName: string): Promise<Command> {
	const id = repo ? `publish-all-K${repo.smartKey}` : "publish-all";
	let name = i18next.t("commands.uploadAllNotes");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		callback: async () => {
			await uploadAllNotes(plugin,repo, branchName);
		},
	} as Command;
}

/**
 * Upload all new notes only
 * @param plugin {GithubPublisher} - The plugin instance
 * @param repo {Repository | null} - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param branchName {string} - The branch name to upload the file
 * @returns {Promise<Command>}
 */
export async function uploadNewNotesCallback(plugin: GithubPublisher, repo: Repository | null, branchName: string): Promise<Command> {
	const id = repo ? `upload-new-K${repo.smartKey}` : "upload-new";
	let name = i18next.t("commands.uploadNewNotes");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		callback: async () => {
			await uploadNewNotes(plugin,branchName, repo);
		},
	} as Command;
}

/**
 * Share all edited note
 * @call uploadAllEditedNotes
 * @param plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<Command>}
 */
export async function uploadAllEditedNotesCallback(plugin: GithubPublisher, repo: Repository|null, branchName: string): Promise<Command> {
	const id = repo ? `upload-all-edited-new-K${repo.smartKey}` : "upload-all-edited-new";
	let name = i18next.t("commands.uploadAllNewEditedNote");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		callback: async () => {
			await uploadAllEditedNotes(plugin, branchName, repo);
		},
	} as Command;
}

/**
 * Share edited note only
 * @call shareEditedOnly
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @param {GithubPublisher} plugin
 * @return {Promise<Command>}
 */
export async function shareEditedOnlyCallback(repo: Repository|null, branchName: string, plugin: GithubPublisher): Promise<Command> {
	const id = repo ? `upload-edited-K${repo.smartKey}` : "upload-edited";
	let name = i18next.t("commands.uploadAllEditedNote");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		callback: async () => {
			await shareEditedOnly(branchName, repo, plugin);
		},
	} as Command;
}

/**
 * Check if the repository is valid
 * @param {GithubPublisher} plugin
 * @param {Repository} repo
 * @return {Promise<Command>}
 */

export async function checkRepositoryValidityCallback(plugin: GithubPublisher, repo: Repository | null): Promise<Command> {
	const id = repo ? `check-plugin-repo-validy-K${repo.smartKey}` : "check-plugin-repo-validy";
	let name = i18next.t("commands.checkValidity.title");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	const octokit = await plugin.reloadOctokit(repo?.smartKey);
	//@ts-ignore
	return {
		id,
		name,
		checkCallback: (checking) => {
			if (plugin.app.workspace.getActiveFile())
			{
				if (!checking) {
					checkRepositoryValidity(
						octokit,
						repo,
						plugin.app.workspace.getActiveFile()
					);
				}
				return true;
			}
			return false;
		},
	} as Command;
}

export function refreshOpenedSet(plugin: GithubPublisher) {
	const findRepo= (file: TFile | null) => {
		if (!file) return [];
		return plugin.settings.github.otherRepo.filter((repo) => repo.set === file.path);
	};
	
	return {
		id: "reload-opened-set",
		name: i18next.t("commands.refreshOpenedSet"),
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const repos = findRepo(file);
			if (file && repos.length > 0) {
				if (!checking) {
					repos.forEach((repo) => {
						plugin.repositoryFrontmatter[repo.smartKey] = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
					});
				}
				return true;
			}
			return false;
		},
	} as Command;
}

export function refreshAllSets(plugin: GithubPublisher) {
	return {
		id: "reload-all-sets",
		name: i18next.t("commands.refreshAllSets"),
		checkCallback: (checking) => {
			const allSets = plugin.settings.github.otherRepo.filter((repo) => repo.set !== "" || repo.set !== null);
			if (allSets.length > 0) {
				if (!checking) {
					allSets.forEach((repo) => {
						if (!repo.set) return;
						const file = plugin.app.vault.getAbstractFileByPath(repo.set);
						if (!file || !(file instanceof TFile)) return;
						plugin.repositoryFrontmatter[repo.smartKey] = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
					});
				}
				return true;
			}
			return false;
		}
	} as Command;
}
