import { ShareStatusBar } from "./src/status_bar";
import {createLink, noticeMessage, getRepoFrontmatter} from "./src/utils";
import {GitHubPublisherSettings, RepoFrontmatter} from './settings/interface'
import { deleteFromGithub } from './publishing/delete'
import {GithubBranch} from "./publishing/branch";
import { Octokit } from "@octokit/core";
import {MetadataCache, Notice, TFile, Vault} from "obsidian";
import GithubPublisher from "./main";
import {error, informations} from './i18n'
import { StringFunc } from "./i18n";


export async function shareAllMarkedNotes(PublisherManager: GithubBranch, settings: GitHubPublisherSettings, octokit: Octokit, statusBarItems: HTMLElement, branchName: string, repoFrontmatter: RepoFrontmatter, sharedFiles: TFile[], createGithubBranch=true) {
	/**
	 * Share all marked note (share: true) from Obsidian to GitHub
	 * @class publisherManager : the main class with all function and parameters
	 * @class settings
	 * @class octokit
	 * @param statusBarItem Allowing statusbar (only PC)
	 * @param branchName
	 * @param sharedFiles File marked to true
	 * @param createGitHubBranch prevent to multiple creation of branch if already exists
	 */
	const statusBar = new ShareStatusBar(
		statusBarItems,
		sharedFiles.length
	);
	try {
		let errorCount = 0;
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map(
				(file) => file.name);
			if (createGithubBranch) {await PublisherManager.newBranch(branchName, repoFrontmatter);}
			for (
				let files = 0;
				files < sharedFiles.length;
				files++
			) {
				try {
					const file = sharedFiles[files];
					statusBar.increment();
					await PublisherManager.publish(file, false, branchName, repoFrontmatter);
				} catch {
					errorCount++;
					new Notice(
						(error("unablePublishNote") as StringFunc)(sharedFiles[files].name)
					);
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${publishedFiles.length - errorCount} notes`
			await deleteFromGithub(true, settings, octokit, branchName, PublisherManager, repoFrontmatter);
			const update = await PublisherManager.updateRepository(branchName, repoFrontmatter);
			if (update) {
				await noticeMessage(PublisherManager, noticeValue, settings, repoFrontmatter);
			} else {
				new Notice((error("errorPublish") as StringFunc)(settings.githubRepo));
			}
		}
	} catch (error) {
		console.error(error);
		new Notice(
			error("unablePublishMultiNotes") as string
		);
		statusBar.error();
	}
}

export async function deleteUnsharedDeletedNotes(PublisherManager: GithubBranch, settings: GitHubPublisherSettings, octokit: Octokit, branchName: string, repoFrontmatter: RepoFrontmatter) {
	/**
	 * Delete unshared/deleted in the repo
	 * @class publisherManager
	 * @class settings
	 * @class octokit
	 * @param branchName
	 */
	try {
		new Notice((informations("startingClean") as StringFunc)(settings.githubRepo))
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await deleteFromGithub(false, settings,octokit, branchName, PublisherManager, repoFrontmatter);
		await PublisherManager.updateRepository(branchName, repoFrontmatter);
	} catch (e) {
		console.error(e);
	}
}

export async function shareOneNote(branchName: string, PublisherManager: GithubBranch, settings: GitHubPublisherSettings, file: TFile, metadataCache: MetadataCache, vault: Vault) {
	/**
	 * Share only **one** note and their embedded contents (including note)
	 * @param branchName branch name
	 * @class publisherManager GithubBranch class
	 * @class settings plugin's settings
	 * @param file origin file
	 */
	try {
		const frontmatter = metadataCache.getFileCache(file).frontmatter;
		const repoFrontmatter = getRepoFrontmatter(settings, frontmatter);
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		const publishSuccess =
			await PublisherManager.publish(file, true, branchName, repoFrontmatter,[], true);
		if (publishSuccess) {
			const update = await PublisherManager.updateRepository(branchName, repoFrontmatter);
			if (update) {
				await noticeMessage(PublisherManager, file, settings, repoFrontmatter);
				await createLink(file, repoFrontmatter, metadataCache, vault, settings);
			} else {
				new Notice((error("errorPublish") as StringFunc)(settings.githubRepo));
			}
		}
	}
	catch (error) {
		if (!(error instanceof DOMException)) {
			console.error(error);
			new Notice((error("errorPublish") as StringFunc)(settings.githubRepo));
		}
	}
}

export async function shareNewNote(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: GithubPublisher, repoFrontmatter: RepoFrontmatter) {
	/**
	 * Deepscanning of the repository and send only new notes (not exists on the repo yet)
	 * @class PublisherManager
	 * @class octokit
	 * @param branchName
	 * @class Vault
	 * @class plugin
	 */
	const settings = plugin.settings;
	new Notice(informations("scanningRepo") as string);
	const branchMaster = settings.githubBranch;
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings, repoFrontmatter);
	const newlySharedNotes = PublisherManager.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	if (newlySharedNotes.length > 0) {
		new Notice((informations("foundNoteToSend") as StringFunc)(`${newlySharedNotes.length}`));
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await shareAllMarkedNotes(PublisherManager, plugin.settings, octokit, statusBarElement, branchName, repoFrontmatter, newlySharedNotes);
	} else {
		new Notice(informations("noNewNote") as string);
	}

}

export async function shareAllEditedNotes(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: GithubPublisher, repoFrontmatter: RepoFrontmatter) {
	/**
	 * Share edited notes : they exist on the repo, BUT the last edited time in Obsidian is after the last upload. Also share new notes.
	 * @class PublisherManager
	 * @class octokit
	 * @param branchName
	 * @class vault
	 * @class plugin
	 */
	const settings = plugin.settings;
	new Notice(informations("scanningRepo") as string);
	const branchMaster = settings.githubBranch;
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings, repoFrontmatter);
	const newSharedFiles = PublisherManager.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	const newlySharedNotes = await PublisherManager.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		new Notice((informations("foundNoteToSend") as StringFunc)(`${newlySharedNotes.length}`));
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await shareAllMarkedNotes(PublisherManager, settings, octokit, statusBarElement, branchName, repoFrontmatter, newlySharedNotes);
	} else {
		new Notice(informations("noNewNote") as string);
	}
}

export async function shareOnlyEdited(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: GithubPublisher, repoFrontmatter: RepoFrontmatter) {
	/**
	 * share **only** edited notes : they exist on the repo, but the last edited time is after the last upload.
	 * @class PublisherManager
	 * @class octokit
	 * @param branchName
	 * @class vault
	 * @class plugin
	 */
	const settings = plugin.settings;
	new Notice(informations("scanningRepo") as string);
	const branchMaster = settings.githubBranch;
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings, repoFrontmatter);
	const newSharedFiles:TFile[]=[]
	const newlySharedNotes = await PublisherManager.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		new Notice((informations("foundNoteToSend") as StringFunc)(`${newlySharedNotes.length}`));
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName, repoFrontmatter);
		await shareAllMarkedNotes(PublisherManager, settings, octokit, statusBarElement, branchName, repoFrontmatter, newlySharedNotes);
	} else {
		new Notice(informations("noNewNote") as string);
	}
}
