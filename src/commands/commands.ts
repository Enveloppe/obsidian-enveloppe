import i18next from "i18next";
import { Notice, Platform, TFile } from "obsidian";

import { GithubBranch } from "../GitHub/branch";
import { deleteFromGithub } from "../GitHub/delete";
import { MonoRepoProperties, MultiRepoProperties, Repository, UploadedFiles} from "../settings/interface";
import { ListChangedFiles } from "../settings/modals/list_changed";
import {
	createLink,
	createListEdited,
	getRepoFrontmatter,
	getSettingsOfMetadataExtractor,
	logs,
	noticeLog,
	noticeMessage} from "../utils";
import {checkRepositoryValidityWithRepoFrontmatter} from "../utils/data_validation_test";
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
				const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, repoFrontmatter, sharedFiles.length);
				if (!isValid) return false;
				await PublisherManager.newBranch(branchName, repoFrontmatter);
			}
			for (const sharedFile of sharedFiles) {
				try {
					statusBar.increment();
					const uploaded = await PublisherManager.publish(
						sharedFile,
						false,
						branchName,
						monoRepo
					) ;
					if (uploaded) {
						listStateUploaded.push(...uploaded.uploaded);
					}
				} catch  {
					errorCount++;
					fileError.push(sharedFile.name);
					new Notice(
						(i18next.t("error.unablePublishNote", {file: sharedFile.name})));
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
						branchName,
						repoFrontmatter
					);
				}
			}
			const update = await PublisherManager.updateRepository(
				branchName,
				repoFrontmatter
			);
			if (update) {
				await noticeMessage(
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
				new Notice(
					(i18next.t("error.errorPublish", {repo: repoFrontmatter})));
			}
		}
	} catch (error) {
		console.error(error);
		new Notice(i18next.t("error.unablePublishMultiNotes") );
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
		new Notice(
			i18next.t("informations.startingClean", {repo: monoRepo.frontmatter})
		);
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, monoRepo.frontmatter);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, monoRepo.frontmatter);
		const deleted = await deleteFromGithub(
			false,
			branchName,
			PublisherManager,
			monoRepo
		);
		await PublisherManager.updateRepository(branchName, monoRepo.frontmatter);
		if (PublisherManager.settings.plugin.displayModalRepoEditing) new ListChangedFiles(PublisherManager.plugin.app, deleted).open();
	} catch (e) {
		console.error(e);
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
	branchName: string,
	PublisherManager: GithubBranch,
	file: TFile,
	repository: Repository | null = null,
	title?: string,
): Promise<void|false> {
	const settings = PublisherManager.settings;
	const app = PublisherManager.plugin.app;
	const metadataCache = app.metadataCache;
	try {
		const frontmatter = metadataCache.getFileCache(file)?.frontmatter;
		const repoFrontmatter = getRepoFrontmatter(settings, repository, frontmatter);
		const isValid = await checkRepositoryValidityWithRepoFrontmatter(PublisherManager, repoFrontmatter);
		const multiRepo: MultiRepoProperties = {
			frontmatter: repoFrontmatter,
			repo: repository
		};
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		const publishSuccess = await PublisherManager.publish(
			file,
			true,
			branchName,
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
						branchName,
						repoFrontmatter
					);
				}
			}
			const update = await PublisherManager.updateRepository(
				branchName,
				repoFrontmatter
			);
			if (update) {
				await noticeMessage(
					PublisherManager,
					title,
					settings,
					repoFrontmatter
				);
				await createLink(
					file,
					multiRepo,
					settings,
					app
				);
				if (settings.plugin.displayModalRepoEditing) {
					const listEdited = createListEdited(publishSuccess.uploaded, publishSuccess.deleted, publishSuccess.error);
					new ListChangedFiles(app, listEdited).open();
				}
				
			} else {
				new Notice(
					(i18next.t("error.errorPublish", { repo: repoFrontmatter})));
			}
		}
	} catch (error) {
		if (!(error instanceof DOMException)) {
			logs(settings, error);
			new Notice(
				(i18next.t("error.errorPublish", {repo: getRepoFrontmatter(settings, repository, metadataCache.getFileCache(file)?.frontmatter)}))
			);
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
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, monoRepo.frontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, monoRepo.frontmatter);
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
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, monoRepo.frontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, monoRepo.frontmatter);
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
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, repoFrontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
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


