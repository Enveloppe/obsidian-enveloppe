import { ShareStatusBar } from "./status_bar";
import {createLink, noticeMessage} from "./utils";
import {MkdocsPublicationSettings} from '../settings/interface'
import { deleteFromGithub } from '../githubInteraction/delete'
import {GithubBranch} from "../githubInteraction/branch";
import { Octokit } from "@octokit/core";
import {MetadataCache, Notice, TFile, Vault} from "obsidian";
import MkdocsPublication from "../main";
import t from '../i18n'
import type { StringFunc } from "../i18n";


export async function shareAllMarkedNotes(PublisherManager: GithubBranch, settings: MkdocsPublicationSettings, octokit: Octokit, statusBarItems: HTMLElement, branchName: string, sharedFiles: TFile[], createGithubBranch=true) {
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
	try {
		const statusBar = new ShareStatusBar(
			statusBarItems,
			sharedFiles.length
		);
		let errorCount = 0;
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map(
				(file) => file.name);
			if (createGithubBranch) {await PublisherManager.newBranch(branchName);}
			for (
				let files = 0;
				files < sharedFiles.length;
				files++
			) {
				try {
					const file = sharedFiles[files];
					statusBar.increment();
					await PublisherManager.publish(file, false, branchName);
				} catch {
					errorCount++;
					new Notice(
						(t("unablePublishNote") as StringFunc)(sharedFiles[files].name)
					);
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${publishedFiles.length - errorCount} notes`
			await deleteFromGithub(true, settings, octokit, branchName, PublisherManager);
			const update = await PublisherManager.updateRepository(branchName);
			if (update) {
				await noticeMessage(PublisherManager, noticeValue, settings);
			} else {
				new Notice((t("errorPublish") as StringFunc)(settings.githubRepo));
				
			}
		}
	} catch (error) {
		console.error(error);
		new Notice(
			t("unablePublishMultiNotes") as string
		);
	}
}

export async function deleteUnsharedDeletedNotes(PublisherManager: GithubBranch, settings: MkdocsPublicationSettings, octokit: Octokit, branchName: string) {
	/**
	 * Delete unshared/deleted in the repo
	 * @class publisherManager
	 * @class settings
	 * @class octokit
	 * @param branchName
	 */
	try {
		new Notice((t("startingClean") as StringFunc)(settings.githubRepo))
		await PublisherManager.newBranch(branchName);
		await deleteFromGithub(false, settings,octokit, branchName, PublisherManager);
		await PublisherManager.updateRepository(branchName);
	} catch (e) {
		console.error(e);
	}
}

export async function shareOneNote(branchName: string, PublisherManager: GithubBranch, settings: MkdocsPublicationSettings, file: TFile, metadataCache: MetadataCache) {
	/**
	 * Share only **one** note and their embedded contents (including note)
	 * @param branchName branch name
	 * @class publisherManager GithubBranch class
	 * @class settings plugin's settings
	 * @param file origin file
	 */
	try {
		await PublisherManager.newBranch(branchName);
		const publishSuccess =
			await PublisherManager.publish(file, true, branchName, [], true);
		if (publishSuccess) {
			const update = await PublisherManager.updateRepository(branchName);
			if (update) {
				await noticeMessage(PublisherManager, file, settings)
				await createLink(file, settings, metadataCache);
			} else {
				new Notice((t("errorPublish") as StringFunc)(settings.githubRepo));
			}
		}
	}
	catch (error) {
		console.error(error);
		new Notice((t("errorPublish") as StringFunc)(settings.githubRepo));
	}
}

export async function shareNewNote(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: MkdocsPublication) {
	/**
	 * Deepscanning of the repository and send only new notes (not exists on the repo yet)
	 * @class PublisherManager
	 * @class octokit
	 * @param branchName
	 * @class Vault
	 * @class plugin
	 */
	const settings = plugin.settings;
	new Notice(t("scanningRepo") as string);
	const branchMaster = await PublisherManager.getMasterBranch();
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings);
	const newlySharedNotes = PublisherManager.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	if (newlySharedNotes.length > 0) {
		new Notice((t("foundNoteToSend") as StringFunc)(`${newlySharedNotes.length}`));
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName);
		await shareAllMarkedNotes(PublisherManager, plugin.settings, octokit, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice(t("noNewNote") as string);
	}

}

export async function shareAllEditedNotes(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: MkdocsPublication) {
	/**
	 * Share edited notes : they exist on the repo, BUT the last edited time in Obsidian is after the last upload. Also share new notes.
	 * @class PublisherManager
	 * @class octokit
	 * @param branchName
	 * @class vault
	 * @class plugin
	 */
	const settings = plugin.settings;
	new Notice(t("scanningRepo") as string);
	const branchMaster = await PublisherManager.getMasterBranch();
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings);
	const newSharedFiles = PublisherManager.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	const newlySharedNotes = await PublisherManager.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		new Notice((t("foundNoteToSend") as StringFunc)(`${newlySharedNotes.length}`));
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName);
		await shareAllMarkedNotes(PublisherManager, settings, octokit, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice(t("noNewNote") as string);
	}
}

export async function shareOnlyEdited(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: MkdocsPublication) {
	/**
	 * share **only** edited notes : they exist on the repo, but the last edited time is after the last upload.
	 * @class PublisherManager
	 * @class octokit
	 * @param branchName
	 * @class vault
	 * @class plugin
	 */
	const settings = plugin.settings;
	new Notice(t("scanningRepo") as string);
	const branchMaster = await PublisherManager.getMasterBranch();
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings);
	const newSharedFiles:TFile[]=[]
	const newlySharedNotes = await PublisherManager.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		new Notice((t("foundNoteToSend") as StringFunc)(`${newlySharedNotes.length}`));
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName);
		await shareAllMarkedNotes(PublisherManager, settings, octokit, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice(t("noNewNote") as string);
	}
}
