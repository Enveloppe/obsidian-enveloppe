import { ShareStatusBar } from "./src/status_bar";
import {
	createLink,
	noticeMessage,
	getRepoFrontmatter,
	noticeLog,
	getSettingsOfMetadataExtractor
} from "./src/utils";
import {checkRepositoryValidityWithRepoFrontmatter} from "./src/data_validation_test";
import { GitHubPublisherSettings, RepoFrontmatter } from "./settings/interface";
import { deleteFromGithub } from "./publish/delete";
import { GithubBranch } from "./publish/branch";
import { Octokit } from "@octokit/core";
import { MetadataCache, Notice, Platform, TFile, Vault } from "obsidian";
import GithubPublisher from "./main";
import i18next from "i18next";
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
	createGithubBranch = true
) {
	const statusBar = new ShareStatusBar(statusBarItems, sharedFiles.length);
	try {
		let errorCount = 0;
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map((file) => file.name);
			if (createGithubBranch) {
				const isValid = checkRepositoryValidityWithRepoFrontmatter(branchName, PublisherManager, settings, repoFrontmatter);
				if (!isValid) return false;
				await PublisherManager.newBranch(branchName, repoFrontmatter);
			}
			for (let files = 0; files < sharedFiles.length; files++) {
				try {
					const file = sharedFiles[files];
					statusBar.increment();
					await PublisherManager.publish(
						file,
						false,
						branchName,
						repoFrontmatter
					);
				} catch {
					errorCount++;
					new Notice(
						(i18next.t("error.unablePublishNote", {file: sharedFiles[files].name})));
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${publishedFiles.length - errorCount} notes`;
			await deleteFromGithub(
				true,
				settings,
				octokit,
				branchName,
				PublisherManager,
				repoFrontmatter
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
			} else {
				new Notice(
					(i18next.t("error.errorPublish", {repoInfo: settings.github.repo}))
				);
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
 * @return {Promise<void>}
 */
export async function deleteUnsharedDeletedNotes(
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	octokit: Octokit,
	branchName: string,
	repoFrontmatter: RepoFrontmatter
) {
	try {
		new Notice(
			(i18next.t("informations.startingClean", {repoInfo: settings.github.repo}))
		);
		const isValid = checkRepositoryValidityWithRepoFrontmatter(branchName, PublisherManager, settings, repoFrontmatter);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await deleteFromGithub(
			false,
			settings,
			octokit,
			branchName,
			PublisherManager,
			repoFrontmatter
		);
		await PublisherManager.updateRepository(branchName, repoFrontmatter);
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
 * @param {MetadataCache} metadataCache
 * @param {Vault} vault
 * @return {Promise<void>}
 */
export async function shareOneNote(
	branchName: string,
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	file: TFile,
	metadataCache: MetadataCache,
	vault: Vault
) {
	try {
		const frontmatter = metadataCache.getFileCache(file).frontmatter;
		const repoFrontmatter = getRepoFrontmatter(settings, frontmatter);
		const isValid = checkRepositoryValidityWithRepoFrontmatter(branchName, PublisherManager, settings, repoFrontmatter);
		if (!isValid) return false;
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		const publishSuccess = await PublisherManager.publish(
			file,
			true,
			branchName,
			repoFrontmatter,
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
					settings
				);
			} else {
				new Notice(
					(i18next.t("error.errorPublish", {repoInfo: settings.github.repo})));
			}
		}
	} catch (error) {
		if (!(error instanceof DOMException)) {
			noticeLog(error, settings);
			new Notice(
				(i18next.t("error.errorPublish", {repoInfo: settings.github.repo}))
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
 * @return {Promise<void>}
 */
export async function shareNewNote(
	PublisherManager: GithubBranch,
	octokit: Octokit,
	branchName: string,
	vault: Vault,
	plugin: GithubPublisher,
	repoFrontmatter: RepoFrontmatter
) {
	const settings = plugin.settings;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
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
		const isValid = checkRepositoryValidityWithRepoFrontmatter(branchName, PublisherManager, settings, repoFrontmatter);
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
			false
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
 * @return {Promise<void>}
 */
export async function shareAllEditedNotes(
	PublisherManager: GithubBranch,
	octokit: Octokit,
	branchName: string,
	vault: Vault,
	plugin: GithubPublisher,
	repoFrontmatter: RepoFrontmatter
) {
	const settings = plugin.settings;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
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
		const isValid = checkRepositoryValidityWithRepoFrontmatter(branchName, PublisherManager, settings, repoFrontmatter);
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
			false
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
 * @return {Promise<void>}
 */
export async function shareOnlyEdited(
	PublisherManager: GithubBranch,
	octokit: Octokit,
	branchName: string,
	vault: Vault,
	plugin: GithubPublisher,
	repoFrontmatter: RepoFrontmatter
) {
	const settings = plugin.settings;
	new Notice(i18next.t("informations.scanningRepo") );
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
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
		const isValid = checkRepositoryValidityWithRepoFrontmatter(branchName, PublisherManager, settings, repoFrontmatter);
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
			false
		);
	} else {
		new Notice(i18next.t("informations.noNewNote") );
	}
}


