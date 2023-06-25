/**
 * @file src/commands/plugin_commands.ts
 * @description Contains all the commands that are used by the plugin ; used in suggest_other_repo_command.ts
 */

import i18next from "i18next";
import {RepoFrontmatter, Repository} from "../settings/interface";
import {checkRepositoryValidity, isShared} from "../utils/data_validation_test";
import {createLink, getAllFilesOfFolder, getRepoFrontmatter} from "../utils";
import GithubPublisher from "../main";
import {
	purgeNotesRemote,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote, shareOnlyEdited
} from "./commands";
import { Notice } from "obsidian";

/**
 * Create the command to create a link to the note in the repo if a file is active ; else do nothing
 * @call createLink
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin
 * @return {Promise<void>}
 */
export async function createLinkOnActiveFile(branchName: string, repo: Repository | null, plugin: GithubPublisher): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = file ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
	if (
		file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
	) {
		await createLink(
			file,
			getRepoFrontmatter(plugin.settings, repo, frontmatter),
			plugin.app.metadataCache,
			plugin.app.vault,
			plugin.settings,
			repo
		);
		new Notice(i18next.t("commands.copyLink.onActivation"));
	} else {
		new Notice(i18next.t("commands.runOtherRepo.noFile"));
	}
}

/**
 * Command to shareTheActiveFile ; Return an error if no file is active
 * @call shareOneNote
 * @param {GithubPublisher} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function shareActiveFile(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = file ? plugin.app.metadataCache.getFileCache(file)?.frontmatter : null;
	if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
		await shareOneNote(
			branchName,
			await plugin.reloadOctokit(),
			plugin.settings,
			file,
			repo,
			plugin.app.metadataCache,
			plugin.app.vault,
		);
	} else {
		new Notice(i18next.t("commands.runOtherRepo.noFile"));
	}
}


/**
 * Command to delete the files
 * @param {GithubPublisher} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function deleteCommands(plugin : GithubPublisher, repo: Repository | null, branchName: string) {
	const repoFrontmatter = getRepoFrontmatter(plugin.settings, repo);
	const publisher = await plugin.reloadOctokit();
	await purgeNotesRemote(
		publisher,
		plugin.settings,
		publisher.octokit,
		branchName,
		repoFrontmatter as RepoFrontmatter,
		repo
	);
}

/**
 * Command to share all the notes
 * @call shareAllMarkedNotes
 * @param {GithubPublisher} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<void>}
 */

export async function uploadAllNotes(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const statusBarItems = plugin.addStatusBarItem();
	const publisher = await plugin.reloadOctokit();
	const sharedFiles = publisher.getSharedFiles(repo);
	await shareAllMarkedNotes(
		publisher,
		plugin.settings,
		publisher.octokit,
		statusBarItems,
		branchName,
		getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
		sharedFiles,
		true,
		plugin,
		repo
	);
}

/**
 * Command to share the new notes
 * @call shareNewNote
 * @param {GithubPublisher} plugin
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @return {Promise<void>}
 */

export async function uploadNewNotes(plugin: GithubPublisher, branchName: string, repo: Repository|null) {
	const publisher = await plugin.reloadOctokit();
	await shareNewNote(
		publisher,
		publisher.octokit,
		branchName,
		plugin.app.vault,
		plugin,
			getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
			repo
	);
}

/**
 * Command to check the validity of the repository
 * @call checkRepositoryValidity
 * @param {GithubPublisher} plugin
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @return {Promise<void>}
 */
export async function repositoryValidityActiveFile(plugin:GithubPublisher, branchName: string, repo: Repository | null) {
	const file = plugin.app.workspace.getActiveFile();
	if (file) {
		await checkRepositoryValidity(
			await plugin.reloadOctokit(),
			plugin.settings,
			repo,
			file,
			plugin.app.metadataCache);
	} else {
		new Notice("No file is active");
	}
}

/**
 * Upload all the edited notes (including the new ones)
 * @param {GithubPublisher} plugin
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @return {Promise<void>}
 */
export async function uploadAllEditedNotes(plugin: GithubPublisher ,branchName: string, repo: Repository|null=null) {
	const publisher = await plugin.reloadOctokit();
	await shareAllEditedNotes(
		publisher,
		publisher.octokit,
		branchName,
		plugin.app.vault,
		plugin,
		getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
		repo
	);
}

/**
 * Share only the edited notes
 * @call shareOnlyEdited
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin
 * @return {Promise<void>}
 */
export async function shareEditedOnly(branchName: string, repo: Repository|null, plugin: GithubPublisher) {
	const publisher = await plugin.reloadOctokit();
	await shareOnlyEdited(
		publisher,
		publisher.octokit,
		branchName,
		plugin.app.vault,
		plugin,
		getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
		repo
	);
}
