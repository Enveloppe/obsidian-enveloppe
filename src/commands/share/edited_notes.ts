import type { MonoRepoProperties, Repository } from "@interfaces";
import i18next from "i18next";
import { type Command, Notice, type TFile } from "obsidian";
import type { GithubBranch } from "src/GitHub/branch";
import type Enveloppe from "src/main";
import { checkRepositoryValidityWithProperties } from "src/utils/data_validation_test";
import {
	frontmatterSettingsRepository,
	getProperties,
} from "src/utils/parse_frontmatter";

import { shareAllMarkedNotes } from "./all_notes";

/**
 * Share all edited note
 * @call uploadAllEditedNotes
 * @param plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<Command>}
 */
export async function uploadAllEditedNotesCallback(
	plugin: Enveloppe,
	repo: Repository | null,
	branchName: string
): Promise<Command> {
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
 * Upload all the edited notes (including the new ones)
 * @param {Enveloppe} plugin
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @return {Promise<void>}
 */
export async function uploadAllEditedNotes(
	plugin: Enveloppe,
	branchName: string,
	repo: Repository | null = null
): Promise<void> {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const prop = getProperties(plugin, repo, null, true);

	await shareAllEditedNotes(publisher, branchName, {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(plugin, repo),
	});
}

/**
 * Share edited notes : they exist on the repo, BUT the last edited time in Obsidian is after the last upload. Also share new notes.
 * @param {GithubBranch} PublisherManager
 * @param {string} branchName - The branch name created by the plugin
 * @param {MonoRepoProperties} monoRepo - The repo
 */
async function shareAllEditedNotes(
	PublisherManager: GithubBranch,
	branchName: string,
	monoRepo: MonoRepoProperties
) {
	const plugin = PublisherManager.plugin;
	new Notice(i18next.t("informations.scanningRepo"));
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(
		monoRepo.repository,
		monoRepo.convert
	);
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		monoRepo.frontmatter.branch,
		monoRepo.frontmatter
	);
	const newSharedFiles = PublisherManager.getNewFiles(
		sharedFilesWithPaths,
		githubSharedNotes
	);
	const newlySharedNotes = await PublisherManager.getEditedFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		newSharedFiles
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

/**
 * share **only** edited notes : they exist on the repo, but the last edited time is after the last upload.
 * @param {GithubBranch} PublisherManager
 * @param {string} branchName - The branch name created by the plugin
 * @param {MonoRepoProperties} monoRepo - The repo
 */
async function shareOnlyEdited(
	PublisherManager: GithubBranch,
	branchName: string,
	monoRepo: MonoRepoProperties
) {
	const shortRepo = monoRepo.repository;
	const prop = monoRepo.frontmatter;
	new Notice(i18next.t("informations.scanningRepo"));
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(
		shortRepo,
		monoRepo.convert
	);
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(prop.branch, prop);
	const newSharedFiles: TFile[] = [];
	const newlySharedNotes = await PublisherManager.getEditedFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		newSharedFiles
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			i18next.t("informations.foundNoteToSend", { nbNotes: newlySharedNotes.length })
		);
		const statusBarElement = PublisherManager.plugin.addStatusBarItem();
		const isValid = await checkRepositoryValidityWithProperties(
			PublisherManager,
			prop,
			newlySharedNotes.length
		);
		if (!isValid) return false;
		await PublisherManager.newBranch(prop);
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

/**
 * Share only the edited notes
 * @call shareOnlyEdited
 * @param {string} branchName
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {Enveloppe} plugin
 * @return {Promise<void>}
 */
export async function shareEditedOnly(
	branchName: string,
	repo: Repository | null,
	plugin: Enveloppe
): Promise<void> {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const prop = getProperties(plugin, repo, null, true);
	await shareOnlyEdited(publisher, branchName, {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(plugin, repo),
	});
}

/**
 * Share edited note only
 * @call shareEditedOnly
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @param {Enveloppe} plugin
 * @return {Promise<Command>}
 */
export async function shareEditedOnlyCallback(
	repo: Repository | null,
	branchName: string,
	plugin: Enveloppe
): Promise<Command> {
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
