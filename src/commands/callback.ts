/**
 * @file callback.ts
 * @description Return the commands based on the fact it's for a specific repo or the default one
 * The id is different if a repo is set, and the smartkey is used as a name, prepended by a K
 */

import {FolderSettings, RepoFrontmatter, Repository} from "../settings/interface";
import GithubPublisher from "../main";
import {checkRepositoryValidity, isShared} from "../utils/data_validation_test";
import {createLink, getRepoFrontmatter} from "../utils";
import i18next from "i18next";
import {Command, Notice } from "obsidian";
import {purgeNotesRemote, shareOneNote} from "./commands";
import {shareEditedOnly, uploadAllEditedNotes, uploadAllNotes, uploadNewNotes} from "./plugin_commands";

/**
 * Create the command to create a link to the note in the repo
 * @call createLink
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @param {GithubPublisher} plugin
 * @return {Promise<Command>}
 */
export async function createLinkCallback(repo: Repository | null, branchName: string, plugin: GithubPublisher) {
	const id = repo ? `publisher-copy-link-K${repo.smartKey}` : "publisher-copy-link";
	const common = i18next.t("common.repository");
	let name = i18next.t("commands.copyLink.title");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id: id,
		name: name,
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = file ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
			if (
				file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
			) {
				if (!checking) {
					createLink(
						file,
						getRepoFrontmatter(plugin.settings, repo, frontmatter),
						plugin.app.metadataCache,
						plugin.app.vault,
						plugin.settings,
						repo
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
 * @param {GithubPublisher} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<Command>}
 */
export async function purgeNotesRemoteCallback(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const id = repo ? `publisher-delete-clean-K${repo.smartKey}` : "publisher-delete-clean";
	let name = i18next.t("commands.publisherDeleteClean");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	//@ts-ignore
	return {
		id: id,
		name: name,
		hotkeys: [],
		//@ts-ignore
		checkCallback: async (checking) => {
			if (plugin.settings.upload.autoclean.enable && plugin.settings.upload.behavior !== FolderSettings.fixed) {
				if (!checking) {
					//@ts-ignore
					const publisher = await plugin.reloadOctokit();
					purgeNotesRemote(
						publisher,
						plugin.settings,
						publisher.octokit,
						branchName,
						getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
						repo
					);
				}
				return true;
			}
			return false;
		},
	} as Command;
}

/**
 * Command to upload the active file ; use checkCallback to check if the file is shared and if they are a active file
 * @call shareOneNote
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin
 * @param {string} branchName
 * @return {Promise<Command>}
 */
export async function shareOneNoteCallback(repo: Repository|null, plugin: GithubPublisher, branchName: string) {
	const id = repo ? `publisher-one-K${repo.smartKey}` : "publisher-one";
	let name = i18next.t("commands.shareActiveFile");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	//@ts-ignore
	return {
		id: id,
		name: name,
		hotkeys: [],
		//@ts-ignore
		checkCallback: async (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = file ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
			if (
				file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
			) {
				if (!checking) {
					shareOneNote(
						branchName,
						//@ts-ignore
						await plugin.reloadOctokit(),
						plugin.settings,
						file,
						repo,
						plugin.app.metadataCache,
						plugin.app.vault
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
 * @param plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<Command>}
 */
export async function uploadAllNotesCallback(plugin: GithubPublisher, repo: Repository|null, branchName: string) {
	const id = repo ? `publisher-publish-all-K${repo.smartKey}` : "publisher-publish-all";
	let name = i18next.t("commands.uploadAllNotes");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id: id,
		name: name,
		callback: async () => {
			await uploadAllNotes(plugin,repo, branchName);
		},
	} as Command;
}

export async function uploadNewNotesCallback(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const id = repo ? `publisher-upload-new-K${repo.smartKey}` : "publisher-upload-new";
	let name = i18next.t("commands.uploadNewNotes");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id: id,
		name:name,
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
export async function uploadAllEditedNotesCallback(plugin: GithubPublisher, repo: Repository|null, branchName: string) {
	const id = repo ? `publisher-upload-all-edited-new-K${repo.smartKey}` : "publisher-upload-all-edited-new";
	let name = i18next.t("commands.uploadAllNewEditedNote");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id: id,
		name: name,
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
export async function shareEditedOnlyCallback(repo: Repository|null, branchName: string, plugin: GithubPublisher) {
	const id = repo ? `publisher-upload-edited-K${repo.smartKey}` : "publisher-upload-edited";
	let name = i18next.t("commands.uploadAllEditedNote");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id: id,
		name: name,
		callback: async () => {
			await shareEditedOnly(branchName, repo, plugin);
		},
	} as Command;
}

/**
 * Check if the repository is valid
 * @param {GithubPublisher} plugin
 * @param {Repository} repo
 * @param {string} branchName
 * @return {Promise<Command>}
 */

export async function checkRepositoryValidityCallback(plugin: GithubPublisher, repo: Repository, branchName: string) {
	const id = repo ? `check-plugin-repo-validy-K${repo.smartKey}` : "check-plugin-repo-validy";
	let name = i18next.t("commands.checkValidity.title");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	//@ts-ignore
	return {
		id: id,
		name: name,
		//@ts-ignore
		checkCallback: async (checking) => {
			if (plugin.app.workspace.getActiveFile())
			{
				if (!checking) {
					checkRepositoryValidity(
						branchName,
						await plugin.reloadOctokit(),
						plugin.settings,
						repo,
						plugin.app.workspace.getActiveFile(),
						plugin.app.metadataCache);
				}
				return true;
			}
			return false;
		},
	} as Command;
}


