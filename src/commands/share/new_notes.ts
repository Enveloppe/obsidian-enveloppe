import type { MonoRepoProperties, Repository } from "@interfaces";
import i18next from "i18next";
import { type Command, Notice } from "obsidian";
import { shareAllMarkedNotes } from "src/commands";
import type { GithubBranch } from "src/GitHub/branch";
import type Enveloppe from "src/main";
import { checkRepositoryValidityWithProperties } from "src/utils/data_validation_test";
import {
	frontmatterSettingsRepository,
	getProperties,
} from "src/utils/parse_frontmatter";

/**
 * Upload all new notes only
 * @param plugin {Enveloppe} - The plugin instance
 * @param repo {Repository | null} - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param branchName {string} - The branch name to upload the file
 * @returns {Promise<Command>}
 */
export async function uploadNewNotesCallback(
	plugin: Enveloppe,
	repo: Repository | null,
	branchName: string
): Promise<Command> {
	const id = repo ? `upload-new-K${repo.smartKey}` : "upload-new";
	let name = i18next.t("commands.uploadNewNotes");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		callback: async () => {
			await uploadNewNotes(plugin, branchName, repo);
		},
	} as Command;
}

/**
 * Command to share the new notes
 * @call shareNewNote
 * @param {Enveloppe} plugin
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @return {Promise<void>}
 */

export async function uploadNewNotes(
	plugin: Enveloppe,
	branchName: string,
	repo: Repository | null
): Promise<void> {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const prop = getProperties(plugin, repo, null, true);
	await shareNewNote(publisher, branchName, {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(plugin, repo),
	});
}

/**
 * Deep scan the repository and send only the note that not exist in the repository
 * @param {GithubBranch} PublisherManager
 * @param {string} branchName - The branch name created by the plugin
 * @param {MonoRepoProperties} monoRepo - The repo
 * @returns {Promise<void>}
 */
export async function shareNewNote(
	PublisherManager: GithubBranch,
	branchName: string,
	monoRepo: MonoRepoProperties
): Promise<void | boolean> {
	const plugin = PublisherManager.plugin;
	new Notice(i18next.t("informations.scanningRepo"));
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(
		monoRepo.repository,
		monoRepo.convert
	);
	// Get all file in the repo before the creation of the branch
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		monoRepo.frontmatter.branch, // we need to take the master branch because the branch to create doesn't exist yet
		monoRepo.frontmatter
	);
	const newlySharedNotes = PublisherManager.getNewFiles(
		sharedFilesWithPaths,
		githubSharedNotes
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			i18next.t("informations.foundNoteToSend", { nbNotes: newlySharedNotes.length })
		);

		const statusBarElement = plugin.addStatusBarItem();
		const isValid = await checkRepositoryValidityWithProperties(
			PublisherManager,
			monoRepo.frontmatter,
			newlySharedNotes.length
		);
		if (!isValid) return false;
		await PublisherManager.newBranch(monoRepo.frontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			statusBarElement,
			branchName,
			monoRepo,
			newlySharedNotes,
			false
		);
		return;
	}
	new Notice(i18next.t("informations.noNewNote"));
}
