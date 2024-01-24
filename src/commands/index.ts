import i18next from "i18next";
import { Notice, Platform, TFile } from "obsidian";
import { ERROR_ICONS } from "src/utils/icons";

import { GithubBranch } from "../GitHub/branch";
import { deleteFromGithub } from "../GitHub/delete";
import { MonoRepoProperties, MultiRepoProperties, Repository, UploadedFiles} from "../settings/interface";
import { ListChangedFiles } from "../settings/modals/list_changed";
import {
	createLink,
	createListEdited,
	getSettingsOfMetadataExtractor,
	logs,
	notif,	publisherNotification} from "../utils";
import {checkRepositoryValidityWithRepoFrontmatter} from "../utils/data_validation_test";
import { frontmatterFromFile, getRepoFrontmatter } from "../utils/parse_frontmatter";
import { ShareStatusBar } from "../utils/status_bar";


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
) {
	const statusBar = new ShareStatusBar(statusBarItems, sharedFiles.length);
	const repoFrontmatter = monoRepo.frontmatter;
	try {
		let errorCount = 0;
		const fileError : string[] = [];
		const listStateUploaded: UploadedFiles[] = [];
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map((file) => file.name);
			if (createGithubBranch) {
				const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, repoFrontmatter, sharedFiles.length);
				if (!isValid) return false;
				await PublisherManager.newBranch(repoFrontmatter);
			}
			for (const sharedFile of sharedFiles) {
				try {
					statusBar.increment();
					const uploaded = await PublisherManager.publish(
						sharedFile,
						false,
						monoRepo
					) ;
					if (uploaded) {
						listStateUploaded.push(...uploaded.uploaded);
					}
				} catch(e)  {
					errorCount++;
					fileError.push(sharedFile.name);
					new Notice(
						(i18next.t("error.unablePublishNote", {file: sharedFile.name})));
					logs({settings: PublisherManager.settings, e: true}, e);
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${publishedFiles.length - errorCount} notes`;
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
						repoFrontmatter
					);
				}
			}
			const update = await PublisherManager.updateRepository(
				repoFrontmatter
			);
			if (update) {
				await publisherNotification(
					PublisherManager,
					noticeValue,
					settings,
					repoFrontmatter
				);
				if (settings.plugin.displayModalRepoEditing) {
					const listEdited = createListEdited(listStateUploaded, deleted, fileError);
					new ListChangedFiles(PublisherManager.plugin.app, listEdited).open();
				}
			} else {
				const errorFrag = document.createDocumentFragment();
				errorFrag.createSpan({ cls: ["error", "obsidian-publisher", "icons", "notification"]}).innerHTML = ERROR_ICONS;
				errorFrag.createSpan({ cls: ["error", "obsidian-publisher", "notification"] }).innerHTML = i18next.t("error.errorPublish", { repo: repoFrontmatter });

				new Notice(errorFrag);
			}
		}
	} catch (error) {
		logs({settings: PublisherManager.settings, e: true}, error);
		const errorFrag = document.createDocumentFragment();
		errorFrag.createSpan({ cls: ["error", "obsidian-publisher", "icons", "notification"] }).innerHTML = ERROR_ICONS;
		errorFrag.createSpan({ cls: ["error", "obsidian-publisher", "notification"], text: i18next.t("error.unablePublishMultiNotes") });
		statusBar.error();
	}
}

/**
	* Delete unshared/deleted in the repo
	* @param {GithubBranch} PublisherManager
	* @param {string} branchName - The branch name created by the plugin
	* @param {MonoRepoProperties} monoRepo - The repo where to delete the files
	* @returns {Promise<void>}
	*/
export async function purgeNotesRemote(
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
		const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, monoRepo.frontmatter);
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
	* Share only **one** note and their embedded contents, including note and attachments
	* @param {string} branchName - The branch name created by the plugin
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
	title?: string
): Promise<void|false> {
	const {settings, plugin} = PublisherManager;
	const app = PublisherManager.plugin.app;
	const frontmatter = frontmatterFromFile(file, PublisherManager.plugin);
	try {
		const repoFrontmatter = getRepoFrontmatter(settings, repository, frontmatter);
		const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, repoFrontmatter);
		const multiRepo: MultiRepoProperties = {
			frontmatter: repoFrontmatter,
			repo: repository
		};
		if (!isValid) return false;
		if (!settings.github.dryRun.enable)
			await PublisherManager.newBranch(repoFrontmatter);
		const publishSuccess = await PublisherManager.publish(
			file,
			true,
			multiRepo,
			[],
			true
		);
		if (publishSuccess) {
			if (
				settings.upload.metadataExtractorPath.length > 0 &&
				Platform.isDesktop
			) {
				const metadataExtractor = await getSettingsOfMetadataExtractor(
					app,
					settings
				);
				if (metadataExtractor) {
					await PublisherManager.uploadMetadataExtractorFiles(
						metadataExtractor,
						repoFrontmatter
					);
				}
			}
			const update = await PublisherManager.updateRepository(
				repoFrontmatter, settings.github.dryRun.enable
			);
			if (update) {
				await publisherNotification(
					PublisherManager,
					title,
					settings,
					repoFrontmatter
				);
				await createLink(
					file,
					multiRepo,
					plugin
				);
				if (settings.plugin.displayModalRepoEditing) {
					const listEdited = createListEdited(publishSuccess.uploaded, publishSuccess.deleted, publishSuccess.error);
					new ListChangedFiles(app, listEdited).open();
				}

			} else {
				const notif = document.createDocumentFragment();
				notif.createSpan({ cls: ["error", "obsidian-publisher", "icons", "notification"] }).innerHTML = ERROR_ICONS;
				notif.createSpan({ cls: ["error", "obsidian-publisher", "notification"] }).innerHTML = i18next.t("error.errorPublish", { repo: repoFrontmatter });
				new Notice(notif);
			}
		}
	} catch (error) {
		if (!(error instanceof DOMException)) {
			logs({settings, e: true}, error);
			const notif = document.createDocumentFragment();
			notif.createSpan({ cls: ["error", "obsidian-publisher", "icons", "notification"] }).innerHTML = ERROR_ICONS;
			notif.createSpan({ cls: ["error", "obsidian-publisher", "notification"] }).innerHTML = i18next.t("error.errorPublish", { repo: getRepoFrontmatter(settings, repository, frontmatter) });
			new Notice(notif);
		}
	}
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
	monoRepo: MonoRepoProperties,
): Promise<void|boolean> {
	const plugin = PublisherManager.plugin;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(monoRepo.repo);
	// Get all file in the repo before the creation of the branch
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		monoRepo.frontmatter.branch, // we need to take the master branch because the branch to create doesn't exist yet
		monoRepo.frontmatter
	);
	const newlySharedNotes = PublisherManager.getNewFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			(i18next.t("informations.foundNoteToSend", {nbNotes: newlySharedNotes.length})
			)
		);

		const statusBarElement = plugin.addStatusBarItem();
		const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, monoRepo.frontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(monoRepo.frontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			statusBarElement,
			branchName,
			monoRepo,
			newlySharedNotes,
			false,
		);
		return;
	}
	new Notice(i18next.t("informations.noNewNote") );
}

/**
	* Share edited notes : they exist on the repo, BUT the last edited time in Obsidian is after the last upload. Also share new notes.
	* @param {GithubBranch} PublisherManager
	* @param {string} branchName - The branch name created by the plugin
	* @param {MonoRepoProperties} monoRepo - The repo
	*/
export async function shareAllEditedNotes(
	PublisherManager: GithubBranch,
	branchName: string,
	monoRepo: MonoRepoProperties,
) {
	const plugin = PublisherManager.plugin;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(monoRepo.repo);
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		monoRepo.frontmatter.branch,
		monoRepo.frontmatter
	);
	const newSharedFiles = PublisherManager.getNewFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
	);
	const newlySharedNotes = await PublisherManager.getEditedFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		newSharedFiles
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			(i18next.t("informations.foundNoteToSend", {nbNotes: newlySharedNotes.length})
			)
		);

		const statusBarElement = plugin.addStatusBarItem();
		const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, monoRepo.frontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(monoRepo.frontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			statusBarElement,
			branchName,
			monoRepo,
			newlySharedNotes,
			false,
		);
		return;
	}
	new Notice(i18next.t("informations.noNewNote") );
}

/**
	* share **only** edited notes : they exist on the repo, but the last edited time is after the last upload.
	* @param {GithubBranch} PublisherManager
	* @param {string} branchName - The branch name created by the plugin
	* @param {MonoRepoProperties} monoRepo - The repo
	*/
export async function shareOnlyEdited(
	PublisherManager: GithubBranch,
	branchName: string,
	monoRepo: MonoRepoProperties,
) {
	const shortRepo = monoRepo.repo;
	const repoFrontmatter = monoRepo.frontmatter;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(shortRepo);
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		repoFrontmatter.branch,
		repoFrontmatter
	);
	const newSharedFiles: TFile[] = [];
	const newlySharedNotes = await PublisherManager.getEditedFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		newSharedFiles
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			(i18next.t("informations.foundNoteToSend", {nbNotes: newlySharedNotes.length}))
		);
		const statusBarElement = PublisherManager.plugin.addStatusBarItem();
		const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, repoFrontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(repoFrontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			statusBarElement,
			branchName,
			monoRepo,
			newlySharedNotes,
			false,
		);
		return;
	}
	new Notice(i18next.t("informations.noNewNote") );
}


