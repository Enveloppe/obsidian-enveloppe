import i18next from "i18next";
import { Command, Notice } from "obsidian";

import { GithubBranch } from "../GitHub/branch";
import { deleteFromGithub } from "../GitHub/delete";
import { MonoRepoProperties,Repository } from "../interfaces";
import GithubPublisher from "../main";
import { ListChangedFiles } from "../settings/modals/list_changed";
import { notif } from "../utils";
import { checkRepositoryValidityWithProperties } from "../utils/data_validation_test";
import { frontmatterSettingsRepository,getProperties } from "../utils/parse_frontmatter";

/**
 * Command to delete file on the repo
 * @call purgeNotesRemote
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName - The branch name to delete the file
 * @return {Promise<Command>}
 */
export async function purgeCallback(plugin: GithubPublisher, repo: Repository | null, branchName: string): Promise<Command> {
	const id = repo ? `delete-clean-K${repo.smartKey}` : "delete-clean";
	let name = i18next.t("commands.publisherDeleteClean");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		hotkeys: [],
		callback: async () => {
			const frontmatter = getProperties(plugin, repo, undefined, true);
			const monoRepo: MonoRepoProperties = {
				frontmatter: Array.isArray(frontmatter) ? frontmatter[0] : frontmatter,
				repository: repo,
				convert: frontmatterSettingsRepository(plugin, repo)
			};
			const publisher = await plugin.reloadOctokit(repo?.smartKey);
			await purge(
				publisher,
				branchName,
				monoRepo
			);
		},
	} as Command;
}

/**
	* Delete unshared/deleted in the repo
	* @param {GithubBranch} PublisherManager
	* @param {string} branchName - The branch name created by the plugin
	* @param {MonoRepoProperties} monoRepo - The repo where to delete the files
	* @returns {Promise<void>}
	*/
async function purge(
	PublisherManager: GithubBranch,
	branchName: string,
	monoRepo: MonoRepoProperties,
): Promise<void|boolean> {
	try {
		const noticeFragment = document.createDocumentFragment();
		noticeFragment.createSpan({ cls: ["obsidian-publisher", "notification"] }).innerHTML = i18next.t("informations.startingClean", { repo: monoRepo.frontmatter });
		new Notice(
			noticeFragment
		);
		const isValid = await checkRepositoryValidityWithProperties(PublisherManager, monoRepo.frontmatter);
		if (!isValid) return false;
		if (!PublisherManager.settings.github.dryRun.enable)
			await PublisherManager.newBranch(monoRepo.frontmatter);
		const deleted = await deleteFromGithub(
			false,
			branchName,
			PublisherManager,
			monoRepo
		);
		if (!PublisherManager.settings.github.dryRun.enable)
			await PublisherManager.updateRepository(monoRepo.frontmatter);
		if (PublisherManager.settings.plugin.displayModalRepoEditing) new ListChangedFiles(PublisherManager.plugin.app, deleted).open();
	} catch (e) {
		notif({settings: PublisherManager.settings, e: true}, e);
	}
}

/**
 * Command to delete the files
 * @param {GithubPublisher} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function purgeForRepo(plugin : GithubPublisher, repo: Repository | null, branchName: string): Promise<void> {
	const prop = getProperties(plugin, repo, null, true);
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const mono: MonoRepoProperties = {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(plugin, repo)
	};
	await purge(
		publisher,
		branchName,
		mono
	);
}
