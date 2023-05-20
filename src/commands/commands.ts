import { ShareStatusBar } from "../src/status_bar";
import {
	createLink,
	noticeMessage,
	getRepoFrontmatter,
	noticeLog,
	getSettingsOfMetadataExtractor,
	createListEdited
} from "../src/utils";
import {checkRepositoryValidityWithRepoFrontmatter} from "../src/data_validation_test";
import {GitHubPublisherSettings, RepoFrontmatter, Repository, UploadedFiles} from "../settings/interface";
import { deleteFromGithub } from "../publish/delete";
import { GithubBranch } from "../publish/branch";
import { Octokit } from "@octokit/core";
import { MetadataCache, Notice, Platform, TFile, Vault } from "obsidian";
import GithubPublisher from "../main";
import i18next from "i18next";
import { ListChangedFiles } from "../settings/modals/list_changed";
/**
 * Share all marked note (share: true) from Obsidian to GitHub
 * @param {GithubBranch} PublisherManager
 * @param {GitHubPublisherSettings} settings
 * @param {Octokit} octokit
 * @param {HTMLElement} statusBarItems - The status bar items
 * @param {string} branchName - The branch name created by the plugin
 * @param {RepoFrontmatter} repoFrontmatter
 * @param {TFile[]} sharedFiles - The files marked as shared
 * @param {boolean} createGithubBranch - If the branch has to be created
 * @param plugin
 * @param shortRepo
 * @return {Promise<void>}
 */
export async function shareAllMarkedNotes(
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	octokit: Octokit,
	statusBarItems: HTMLElement,
	branchName: string,
	repoFrontmatter: RepoFrontmatter,
	sharedFiles: TFile[],
	createGithubBranch = true,
	plugin: GithubPublisher,
	shortRepo: Repository | null
) {
	const statusBar = new ShareStatusBar(statusBarItems, sharedFiles.length);
	try {
		let errorCount = 0;
		const fileError : string[] = [];
		const listStateUploaded: UploadedFiles[] = [];
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map((file) => file.name);
			if (createGithubBranch) {
				const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, settings, repoFrontmatter, sharedFiles.length);
				if (!isValid) return false;
				await PublisherManager.newBranch(branchName, repoFrontmatter);
			}
			for (let files = 0; files < sharedFiles.length; files++) {
				try {
					const file = sharedFiles[files];
					statusBar.increment();
					const uploaded = await PublisherManager.publish(
						file,
						false,
						branchName,
						repoFrontmatter,
						shortRepo
					) ;
					if (uploaded) {
						listStateUploaded.push(...uploaded.uploaded);
					}
				} catch {
					errorCount++;
					fileError.push(sharedFiles[files].name);
					new Notice(
						(i18next.t("error.unablePublishNote", {file: sharedFiles[files].name})));
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${publishedFiles.length - errorCount} notes`;
			const deleted = await deleteFromGithub(
				true,
				settings,
				octokit,
				branchName,
				PublisherManager,
				repoFrontmatter,
				shortRepo
			);
			
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
					noticeValue,
					settings,
					repoFrontmatter
				);
				if (settings.plugin.displayModalRepoEditing) {
					const listEdited = createListEdited(listStateUploaded, deleted, fileError);
					new ListChangedFiles(plugin.app, listEdited).open();
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
 * @param {GitHubPublisherSettings} settings
 * @param {Octokit} octokit
 * @param {string} branchName - The branch name created by the plugin
 * @param {RepoFrontmatter} repoFrontmatter
 * @param otherRepo
 * @return {Promise<void>}
 */
export async function purgeNotesRemote(
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	octokit: Octokit,
	branchName: string,
	repoFrontmatter: RepoFrontmatter,
	otherRepo: Repository | null
) {
	try {
		new Notice(
			(i18next.t("informations.startingClean", {repo: repoFrontmatter}))
		);
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, settings, repoFrontmatter);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		const deleted = await deleteFromGithub(
			false,
			settings,
			octokit,
			branchName,
			PublisherManager,
			repoFrontmatter,
			otherRepo
		);
		await PublisherManager.updateRepository(branchName, repoFrontmatter);
		if (settings.plugin.displayModalRepoEditing) new ListChangedFiles(app, deleted).open();
	} catch (e) {
		console.error(e);
	}
}

/**
 * Share only **one** note and their embedded contents, including note and attachments
 * @param {string} branchName - The branch name created by the plugin
 * @param {GithubBranch} PublisherManager
 * @param {GitHubPublisherSettings} settings
 * @param {TFile} file - The file to share
 * @param repository
 * @param {MetadataCache} metadataCache
 * @param {Vault} vault
 * @return {Promise<void>}
 */
export async function shareOneNote(
	branchName: string,
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	file: TFile,
	repository: Repository | null = null,
	metadataCache: MetadataCache,
	vault: Vault
) {
	try {
		const frontmatter = metadataCache.getFileCache(file).frontmatter;
		const repoFrontmatter = getRepoFrontmatter(settings, repository, frontmatter);
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, settings, repoFrontmatter);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		const publishSuccess = await PublisherManager.publish(
			file,
			true,
			branchName,
			repoFrontmatter,
			repository,
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
					file,
					settings,
					repoFrontmatter
				);
				await createLink(
					file,
					repoFrontmatter,
					metadataCache,
					vault,
					settings,
					repository
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
			noticeLog(error, settings);
			new Notice(
				(i18next.t("error.errorPublish", {repo: getRepoFrontmatter(settings, repository, metadataCache.getFileCache(file).frontmatter)}))
			);
		}
	}
}

/**
 * Deep scan the repository and send only the note that not exist in the repository
 * @param {GithubBranch} PublisherManager
 * @param {Octokit} octokit
 * @param {string} branchName - The branch name created by the plugin
 * @param {Vault} vault
 * @param {GithubPublisher} plugin
 * @param {RepoFrontmatter} repoFrontmatter
 * @param shortRepo
 * @return {Promise<void>}
 */
export async function shareNewNote(
	PublisherManager: GithubBranch,
	octokit: Octokit,
	branchName: string,
	vault: Vault,
	plugin: GithubPublisher,
	repoFrontmatter: RepoFrontmatter,
	shortRepo: Repository
) {
	const settings = plugin.settings;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(shortRepo);
	// Get all file in the repo before the creation of the branch
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		repoFrontmatter.branch, // we need to take the master branch because the branch to create doesn't exist yet
		octokit,
		settings,
		repoFrontmatter
	);
	const newlySharedNotes = PublisherManager.getNewFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		vault
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			(i18next.t("informations.foundNoteToSend", {nbNotes: newlySharedNotes.length})
			)
		);

		const statusBarElement = plugin.addStatusBarItem();
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, settings, repoFrontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			plugin.settings,
			octokit,
			statusBarElement,
			branchName,
			repoFrontmatter,
			newlySharedNotes,
			false,
			plugin,
			shortRepo
		);
	} else {
		new Notice(i18next.t("informations.noNewNote") );
	}
}

/**
 * Share edited notes : they exist on the repo, BUT the last edited time in Obsidian is after the last upload. Also share new notes.
 * @param {GithubBranch} PublisherManager
 * @param {Octokit} octokit
 * @param {string} branchName - The branch name created by the plugin
 * @param {Vault} vault
 * @param {GithubPublisher} plugin
 * @param {RepoFrontmatter} repoFrontmatter
 * @param {Repository | null} shortRepo - The repository object if needed (if the repo is from OtherRepo and not the default one)
 * @return {Promise<void>}
 */
export async function shareAllEditedNotes(
	PublisherManager: GithubBranch,
	octokit: Octokit,
	branchName: string,
	vault: Vault,
	plugin: GithubPublisher,
	repoFrontmatter: RepoFrontmatter,
	shortRepo: Repository | null
) {
	const settings = plugin.settings;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(shortRepo);
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		repoFrontmatter.branch,
		octokit,
		settings,
		repoFrontmatter
	);
	const newSharedFiles = PublisherManager.getNewFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		vault
	);
	const newlySharedNotes = await PublisherManager.getEditedFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		vault,
		newSharedFiles
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			(i18next.t("informations.foundNoteToSend", {nbNotes: newlySharedNotes.length})
			)
		);

		const statusBarElement = plugin.addStatusBarItem();
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, settings, repoFrontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			settings,
			octokit,
			statusBarElement,
			branchName,
			repoFrontmatter,
			newlySharedNotes,
			false,
			plugin,
			shortRepo
		);
	} else {
		new Notice(i18next.t("informations.noNewNote") );
	}
}

/**
 * share **only** edited notes : they exist on the repo, but the last edited time is after the last upload.
 * @param {GithubBranch} PublisherManager
 * @param {Octokit} octokit
 * @param {string} branchName - The branch name created by the plugin
 * @param {Vault} vault
 * @param {GithubPublisher} plugin
 * @param {RepoFrontmatter} repoFrontmatter
 * @param shortRepo
 * @return {Promise<void>}
 */
export async function shareOnlyEdited(
	PublisherManager: GithubBranch,
	octokit: Octokit,
	branchName: string,
	vault: Vault,
	plugin: GithubPublisher,
	repoFrontmatter: RepoFrontmatter,
	shortRepo: Repository | null
) {
	const settings = plugin.settings;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath(shortRepo);
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(
		repoFrontmatter.branch,
		octokit,
		settings,
		repoFrontmatter
	);
	const newSharedFiles: TFile[] = [];
	const newlySharedNotes = await PublisherManager.getEditedFiles(
		sharedFilesWithPaths,
		githubSharedNotes,
		vault,
		newSharedFiles
	);
	if (newlySharedNotes.length > 0) {
		new Notice(
			(i18next.t("informations.foundNoteToSend", {nbNotes: newlySharedNotes.length}))
		);
		const statusBarElement = plugin.addStatusBarItem();
		const isValid = checkRepositoryValidityWithRepoFrontmatter(PublisherManager, settings, repoFrontmatter, newlySharedNotes.length);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await shareAllMarkedNotes(
			PublisherManager,
			settings,
			octokit,
			statusBarElement,
			branchName,
			repoFrontmatter,
			newlySharedNotes,
			false,
			plugin,
			shortRepo
		);
	} else {
		new Notice(i18next.t("informations.noNewNote") );
	}
}


