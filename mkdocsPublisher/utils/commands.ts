import { ShareStatusBar } from "./status_bar";
import { noticeMessage } from "./utils";
import {MkdocsPublicationSettings} from '../settings/interface'
import { deleteFromGithub } from '../githubInteraction/delete'
import {GithubBranch} from "../githubInteraction/branch";
import { Octokit } from "@octokit/core";
import {Notice, TFile, Vault} from "obsidian";
import MkdocsPublication from "../main";


export async function shareAllMarkedNotes(PublisherManager: GithubBranch, settings: MkdocsPublicationSettings, octokit: Octokit, statusBarItems: HTMLElement, branchName: string, sharedFiles: TFile[], createGithubBranch=true) {
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
						`Unable to publish note ${sharedFiles[files].name}, skipping it`
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
				new Notice("Error publishing to " + settings.githubRepo + ".");
				
			}
		}
	} catch (error) {
		console.error(error);
		new Notice(
			"Unable to publish multiple notes, something went wrong."
		);
	}
}

export async function deleteUnsharedDeletedNotes(PublisherManager: GithubBranch, settings: MkdocsPublicationSettings, octokit: Octokit, branchName: string) {
	try {
		new Notice(`Starting cleaning ${settings.githubRepo} `)
		await PublisherManager.newBranch(branchName);
		await deleteFromGithub(false, settings,octokit, branchName, PublisherManager);
		await PublisherManager.updateRepository(branchName);
	} catch (e) {
		console.error(e);
	}
}

export async function shareOneNote(branchName: string, PublisherManager: GithubBranch, settings: MkdocsPublicationSettings, file: TFile) {
	try {
		await PublisherManager.newBranch(branchName);
		const publishSuccess =
			await PublisherManager.publish(file, true, branchName, [], true);
		if (publishSuccess) {
			const update = await PublisherManager.updateRepository(branchName);
			if (update) {
				await noticeMessage(PublisherManager, file, settings)
			} else {
				new Notice("Error publishing to " + settings.githubRepo + ".");
			}
		}
	}
	catch (error) {
		console.error(error);
		new Notice("Error publishing to " + settings.githubRepo + ".");
	}
}

export async function shareNewNote(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: MkdocsPublication) {
	const settings = plugin.settings;
	new Notice('Scanning the repository, may take a while...');
	const branchMaster = await PublisherManager.getMasterBranch();
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings);
	const newlySharedNotes = PublisherManager.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	if (newlySharedNotes.length > 0) {
		new Notice('Found ' + newlySharedNotes.length + ' new notes to send.');
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName);
		await shareAllMarkedNotes(PublisherManager, plugin.settings, octokit, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to share.");
	}

}

export async function shareAllEditedNotes(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: MkdocsPublication) {
	const settings = plugin.settings;
	new Notice('Scanning the repository, may take a while...');
	const branchMaster = await PublisherManager.getMasterBranch();
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings);
	const newSharedFiles = PublisherManager.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	const newlySharedNotes = await PublisherManager.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		new Notice('Found ' + newlySharedNotes.length + ' notes to send.');
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName);
		await shareAllMarkedNotes(PublisherManager, settings, octokit, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to publish.");
	}
}

export async function shareOnlyEdited(PublisherManager: GithubBranch, octokit: Octokit, branchName: string, vault: Vault, plugin: MkdocsPublication) {
	const settings = plugin.settings;
	new Notice('Scanning the repository, may take a while...');
	const branchMaster = await PublisherManager.getMasterBranch();
	const sharedFilesWithPaths = PublisherManager.getAllFileWithPath();
	const githubSharedNotes = await PublisherManager.getAllFileFromRepo(branchMaster, octokit, settings);
	const newSharedFiles:TFile[]=[]
	const newlySharedNotes = await PublisherManager.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		new Notice('Found ' + newlySharedNotes.length + ' edited notes to send.');
		const statusBarElement = plugin.addStatusBarItem();
		await PublisherManager.newBranch(branchName);
		await shareAllMarkedNotes(PublisherManager, settings, octokit, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to publish.");
	}
}
