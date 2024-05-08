/**
 * @file src/commands/plugin_commands.ts
 * @description Contains all the commands that are used by the plugin ; used in suggest_other_repo_command.ts
 */

import i18next from "i18next";
import { Notice } from "obsidian";

import {MonoRepoProperties, MultiRepoProperties, Repository} from "../interfaces";
import GithubPublisher from "../main";
import {createLink} from "../utils";
import {checkRepositoryValidity, isShared} from "../utils/data_validation_test";
import { frontmatterFromFile, frontmatterSettingsRepository, getProperties } from "../utils/parse_frontmatter";
import {
	purgeNotesRemote,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote, shareOnlyEdited
} from ".";

/**
 * Create the command to create a link to the note in the repo if a file is active ; else do nothing
 * @call createLink
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin - The plugin instance
 * @return {Promise<void>}
 */
export async function createLinkOnActiveFile(repo: Repository | null, plugin: GithubPublisher): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = frontmatterFromFile(file, plugin, repo);

	if (
		file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
	) {
		const multiRepo: MultiRepoProperties = {
			frontmatter: getProperties(plugin, repo, frontmatter),
			repository: repo
		};
		await createLink(
			file,
			multiRepo,
			plugin
		);
		new Notice(i18next.t("commands.copyLink.onActivation"));
		return;
	}
	new Notice(i18next.t("commands.runOtherRepo.noFile"));
}

/**
 * Command to shareTheActiveFile ; Return an error if no file is active
 * @call shareOneNote
 * @param {GithubPublisher} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function shareActiveFile(plugin: GithubPublisher, repo: Repository | null): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = frontmatterFromFile(file, plugin, repo);
	if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
		await shareOneNote(
			await plugin.reloadOctokit(repo?.smartKey),
			file,
			repo,
			frontmatter,
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
export async function deleteCommands(plugin : GithubPublisher, repo: Repository | null, branchName: string): Promise<void> {
	const prop = getProperties(plugin, repo, null, true);
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const mono: MonoRepoProperties = {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(plugin, repo)
	};
	await purgeNotesRemote(
		publisher,
		branchName,
		mono
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

export async function uploadAllNotes(plugin: GithubPublisher, repo: Repository | null, branchName: string): Promise<void> {
	const statusBarItems = plugin.addStatusBarItem();
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const sharedFiles = publisher.getSharedFiles(repo);
	const prop = getProperties(plugin, repo, undefined, true);
	const mono: MonoRepoProperties = {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(
			plugin,
			repo
		)
	};
	await shareAllMarkedNotes(
		publisher,
		statusBarItems,
		branchName,
		mono,
		sharedFiles,
		true,
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

export async function uploadNewNotes(plugin: GithubPublisher, branchName: string, repo: Repository|null): Promise<void> {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const prop = getProperties(plugin, repo, null, true);
	await shareNewNote(
		publisher,
		branchName,
		{
			frontmatter: Array.isArray(prop) ? prop[0] : prop,
			repository: repo,
			convert: frontmatterSettingsRepository(plugin, repo)
		},
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
export async function repositoryValidityActiveFile(plugin:GithubPublisher, repo: Repository | null): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (file) {
		await checkRepositoryValidity(
			await plugin.reloadOctokit(repo?.smartKey),
			repo,
			file,
		);
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
export async function uploadAllEditedNotes(plugin: GithubPublisher ,branchName: string, repo: Repository|null=null): Promise<void> {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const prop = getProperties(plugin, repo, null, true);

	await shareAllEditedNotes(
		publisher,
		branchName,
		{
			frontmatter: Array.isArray(prop) ? prop[0] : prop,
			repository: repo,
			convert: frontmatterSettingsRepository(plugin, repo)
		},
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
export async function shareEditedOnly(branchName: string, repo: Repository|null, plugin: GithubPublisher): Promise<void> {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const prop = getProperties(plugin, repo, null, true);
	await shareOnlyEdited(
		publisher,
		branchName,
		{
			frontmatter: Array.isArray(prop) ? prop[0] : prop,
			repository: repo,
			convert: frontmatterSettingsRepository(plugin, repo)
		},
	);
}
