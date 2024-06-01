import type { MultiRepoProperties, Repository } from "@interfaces";
import i18next from "i18next";
import {
	type Command,
	type FrontMatterCache,
	Notice,
	Platform,
	type TFile,
} from "obsidian";
import type { GithubBranch } from "src/GitHub/branch";
import type Enveloppe from "src/main";
import { ListChangedFiles } from "src/settings/modals/list_changed";
import { createLink, createListEdited, getSettingsOfMetadataExtractor } from "src/utils";
import {
	checkRepositoryValidityWithProperties,
	isShared,
} from "src/utils/data_validation_test";
import { frontmatterFromFile, getProperties } from "src/utils/parse_frontmatter";
import merge from "ts-deepmerge";

/**
 * Command to upload the active file ; use checkCallback to check if the file is shared and if they are a active file
 * @call shareOneNote
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {Enveloppe} plugin - The plugin instance
 * @return {Promise<Command>}
 */
export async function shareOneNoteCallback(
	repo: Repository | null,
	plugin: Enveloppe
): Promise<Command> {
	const id = repo ? `share-one-K${repo.smartKey}` : "share-one";
	let name = i18next.t("commands.shareActiveFile");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	const octokit = await plugin.reloadOctokit(repo?.smartKey);
	return {
		id,
		name,
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = frontmatterFromFile(file, plugin, repo);
			if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
				if (!checking) {
					shareOneNote(octokit, file, repo, frontmatter, file.basename);
				}
				return true;
			}
			return false;
		},
	} as Command;
}

/**
 * Share only **one** note and their embedded contents, including note and attachments
 * @param {GithubBranch} PublisherManager
 * @param {TFile} file - The file to share
 * @param {Repository|null} repository
 * @param {string} title The title from frontmatter + regex (if any)
 * @returns {Promise<void>}
 */
export async function shareOneNote(
	PublisherManager: GithubBranch,
	file: TFile,
	repository: Repository | null = null,
	sourceFrontmatter: FrontMatterCache | undefined | null,
	title?: string
): Promise<void | false> {
	const { settings, plugin } = PublisherManager;
	const app = PublisherManager.plugin.app;
	let frontmatter = frontmatterFromFile(file, PublisherManager.plugin, null);
	if (sourceFrontmatter && frontmatter)
		frontmatter = merge.withOptions(
			{ allowUndefinedOverrides: false },
			sourceFrontmatter,
			frontmatter
		);
	try {
		const prop = getProperties(plugin, repository, frontmatter);
		let isValid: boolean;
		if (prop instanceof Array) {
			const isValidArray = [];
			for (const repo of prop) {
				isValidArray.push(
					await checkRepositoryValidityWithProperties(PublisherManager, repo)
				);
			}
			isValid = isValidArray.every((v) => v === true);
		} else isValid = await checkRepositoryValidityWithProperties(PublisherManager, prop);

		const multiRepo: MultiRepoProperties = {
			frontmatter: prop,
			repository,
		};
		if (!isValid) return false;
		if (!settings.github.dryRun.enable) await PublisherManager.newBranch(prop);
		const publishSuccess = await PublisherManager.publish(
			file,
			true,
			multiRepo,
			[],
			true,
			sourceFrontmatter
		);
		if (publishSuccess) {
			if (settings.upload.metadataExtractorPath.length > 0 && Platform.isDesktop) {
				const metadataExtractor = await getSettingsOfMetadataExtractor(app, settings);
				if (metadataExtractor) {
					await PublisherManager.uploadMetadataExtractorFiles(metadataExtractor, prop);
				}
			}
			const update = await PublisherManager.updateRepository(
				prop,
				settings.github.dryRun.enable
			);
			if (update) {
				await plugin.console.publisherNotification(
					PublisherManager,
					title,
					settings,
					prop
				);
				await createLink(file, multiRepo, plugin);
				if (settings.plugin.displayModalRepoEditing) {
					const listEdited = createListEdited(
						publishSuccess.uploaded,
						publishSuccess.deleted,
						publishSuccess.error
					);
					new ListChangedFiles(app, listEdited).open();
				}
			} else {
				plugin.console.notifError(prop);
			}
		}
	} catch (error) {
		if (!(error instanceof DOMException)) {
			plugin.console.logs({ e: true }, error);
			plugin.console.notifError(getProperties(plugin, repository, frontmatter, true));
		}
	}
}

/**
 * Command to shareTheActiveFile ; Return an error if no file is active
 * @call shareOneNote
 * @param {Enveloppe} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {string} branchName
 * @return {Promise<void>}
 */
export async function shareActiveFile(
	plugin: Enveloppe,
	repo: Repository | null
): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = frontmatterFromFile(file, plugin, repo);
	if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
		await shareOneNote(
			await plugin.reloadOctokit(repo?.smartKey),
			file,
			repo,
			frontmatter
		);
	} else {
		new Notice(i18next.t("commands.runOtherRepo.noFile"));
	}
}
