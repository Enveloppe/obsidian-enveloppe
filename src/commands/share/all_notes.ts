import { MonoRepoProperties, Repository, UploadedFiles } from "@interfaces";
import { ERROR_ICONS } from "@interfaces/icons";
import i18next from "i18next";
import { Command, FrontMatterCache, Notice, Platform, TFile } from "obsidian";
import { GithubBranch } from "src/GitHub/branch";
import { deleteFromGithub } from "src/GitHub/delete";
import GithubPublisher from "src/main";
import { ListChangedFiles } from "src/settings/modals/list_changed";
import { createListEdited, getSettingsOfMetadataExtractor, logs, notifError,publisherNotification } from "src/utils";
import { checkRepositoryValidityWithProperties } from "src/utils/data_validation_test";
import { frontmatterSettingsRepository,getProperties } from "src/utils/parse_frontmatter";
import { ShareStatusBar } from "src/utils/status_bar";

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
	* Share all marked note (share: true) from Obsidian to GitHub
	* @param {GithubBranch} PublisherManager
	* @param {HTMLElement} statusBarItems - The status bar element
	* @param {string} branchName - The branch name created by the plugin
	* @param {MonoRepoProperties} monoRepo - The repo where to share the files
	* @param {TFile[]} sharedFiles - The files to share
	* @param {boolean} createGithubBranch - If true, create the branch before sharing the files
	*/
export async function shareAllMarkedNotes(
	PublisherManager: GithubBranch,
	statusBarItems: HTMLElement,
	branchName: string,
	monoRepo: MonoRepoProperties,
	sharedFiles: TFile[],
	createGithubBranch: boolean = true,
	sourceFrontmatter: FrontMatterCache | undefined | null = null,
) {
	const statusBar = new ShareStatusBar(statusBarItems, sharedFiles.length);
	const prop = monoRepo.frontmatter;
	try {
		const fileError : string[] = [];
		const listStateUploaded: UploadedFiles[] = [];
		if (sharedFiles.length > 0) {
			if (createGithubBranch) {
				const isValid = await checkRepositoryValidityWithProperties(PublisherManager, prop, sharedFiles.length);
				if (!isValid) return false;
				await PublisherManager.newBranch(prop);
			}
			for (const sharedFile of sharedFiles) {
				try {
					statusBar.increment();
					const uploaded = await PublisherManager.publish(
						sharedFile,
						false,
						monoRepo,
						undefined,
						undefined,
						sourceFrontmatter,
					) ;
					if (uploaded) {
						listStateUploaded.push(...uploaded.uploaded);
					}
				} catch(e)  {
					fileError.push(sharedFile.name);
					new Notice(
						(i18next.t("error.unablePublishNote", {file: sharedFile.name})));
					logs({settings: PublisherManager.settings, e: true}, e);
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${listStateUploaded.length} notes`;
			const deleted = await deleteFromGithub(
				true,
				branchName,
				PublisherManager,
				monoRepo
			);
			const settings = PublisherManager.settings;
			if (
				settings.upload.metadataExtractorPath.length > 0 &&
					Platform.isDesktop
			) {
				const metadataExtractor = await getSettingsOfMetadataExtractor(
					PublisherManager.plugin.app,
					settings
				);
				if (metadataExtractor) {
					await PublisherManager.uploadMetadataExtractorFiles(
						metadataExtractor,
						prop
					);
				}
			}
			const update = await PublisherManager.updateRepository(
				prop
			);
			if (update) {
				await publisherNotification(
					PublisherManager,
					noticeValue,
					settings,
					prop
				);
				if (settings.plugin.displayModalRepoEditing) {
					const listEdited = createListEdited(listStateUploaded, deleted, fileError);
					new ListChangedFiles(PublisherManager.plugin.app, listEdited).open();
				}
			} else {
				notifError(prop);
			}
		}
	} catch (error) {
		logs({settings: PublisherManager.settings, e: true}, error);
		const errorFrag = document.createDocumentFragment();
		errorFrag.createSpan({ cls: ["error", "obsidian-publisher", "icons", "notification"] }).innerHTML = ERROR_ICONS;
		errorFrag.createSpan({ cls: ["error", "obsidian-publisher", "notification"], text: i18next.t("error.unablePublishMultiNotes") });
		statusBar.error(prop);
	}
}

