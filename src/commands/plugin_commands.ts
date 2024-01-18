/**
 * @file src/commands/plugin_commands.ts
 * @description Contains all the commands that are used by the plugin ; used in suggest_other_repo_command.ts
 */

import i18next from "i18next";
import { Notice } from "obsidian";

import GithubPublisher from "../main";
import {MonoRepoProperties, MultiRepoProperties, RepoFrontmatter, Repository} from "../settings/interface";
import {createLink} from "../utils";
import {checkRepositoryValidity, isShared} from "../utils/data_validation_test";
import { getRepoFrontmatter } from "../utils/parse_frontmatter";
import {
	purgeNotesRemote,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote, shareOnlyEdited
} from "./commands";

/**
 * Create the command to create a link to the note in the repo if a file is active ; else do nothing
 * @call createLink
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {GithubPublisher} plugin - The plugin instance
 * @return {Promise<void>}
 */
export async function createLinkOnActiveFile(repo: Repository | null, plugin: GithubPublisher): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = file ? plugin.app.metadataCache.getFileCache(file)?.frontmatter : null;
	if (
		file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
	) {
		const multiRepo: MultiRepoProperties = {
			frontmatter: getRepoFrontmatter(plugin.settings, repo, frontmatter),
			repo
		};
		await createLink(
			file,
			multiRepo,
			plugin.settings,
			plugin.app
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
export async function shareActiveFile(plugin: GithubPublisher, repo: Repository | null, branchName: string): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = file ? plugin.app.metadataCache.getFileCache(file)?.frontmatter : null;
	if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
		await shareOneNote(
			branchName,
			await plugin.reloadOctokit(),
			file,
			repo,
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
	const repoFrontmatter = getRepoFrontmatter(plugin.settings, repo);
	const publisher = await plugin.reloadOctokit();
	const mono: MonoRepoProperties = {
		frontmatter: repoFrontmatter as RepoFrontmatter,
		repo
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

export async function uploadAllNotes(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const statusBarItems = plugin.addStatusBarItem();
	const publisher = await plugin.reloadOctokit();
	const sharedFiles = publisher.getSharedFiles(repo);
	const mono: MonoRepoProperties = {
		frontmatter: getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
		repo
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
	const publisher = await plugin.reloadOctokit();
	await shareNewNote(
		publisher,
		branchName,
		{
			frontmatter: getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
			repo
		} as MonoRepoProperties,
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
export async function repositoryValidityActiveFile(plugin:GithubPublisher, branchName: string, repo: Repository | null): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (file) {
		await checkRepositoryValidity(
			await plugin.reloadOctokit(),
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
	const publisher = await plugin.reloadOctokit();
	const repoFrontmatter = getRepoFrontmatter(plugin.settings, repo);

	await shareAllEditedNotes(
		publisher,
		branchName,
		{
			frontmatter: Array.isArray(repoFrontmatter) ? repoFrontmatter[0] : repoFrontmatter,
			repo
		} as MonoRepoProperties,
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
		branchName,
		{
			frontmatter: getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
			repo
		} as MonoRepoProperties,
	);
}
