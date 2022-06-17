import { ShareStatusBar } from "./status_bar";
import MkdocsPublish from "../githubInteraction/upload";
import { noticeMessage } from "./utils";
import {MkdocsPublicationSettings} from '../settings/interface'
import { deleteFromGithub } from '../githubInteraction/delete'
import { FilesManagement } from "../githubInteraction/filesManagement";
import {GithubBranch} from "../githubInteraction/branch";
import { Octokit } from "@octokit/core";
import {Notice, TFile, Vault} from "obsidian";


export async function shareAllMarkedNotes(publish: MkdocsPublish, settings: MkdocsPublicationSettings, octokit: Octokit, filesManagement: FilesManagement, githubBranch: GithubBranch, statusBarItems: HTMLElement, branchName: string, sharedFiles: TFile[], createGithubBranch=true) {
	try {
		const statusBar = new ShareStatusBar(
			statusBarItems,
			sharedFiles.length
		);
		let errorCount = 0;
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map(
				(file) => file.name);
			if (createGithubBranch) {await githubBranch.newBranch(branchName);}
			for (
				let files = 0;
				files < sharedFiles.length;
				files++
			) {
				try {
					const file = sharedFiles[files];
					statusBar.increment();
					await publish.publish(file, false, branchName);
				} catch {
					errorCount++;
					new Notice(
						`Unable to publish note ${sharedFiles[files].name}, skipping it`
					);
				}
			}
			statusBar.finish(8000);
			const noticeValue = `${publishedFiles.length - errorCount} notes`
			await deleteFromGithub(true, settings, octokit, branchName, filesManagement);
			const update = await githubBranch.updateRepository(branchName);
			if (update) {
				await noticeMessage(publish, noticeValue, settings)
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

export async function deleteUnsharedDeletedNotes(githubBranch: GithubBranch, settings: MkdocsPublicationSettings, octokit: Octokit, filesManagement: FilesManagement, branchName: string) {
	try {
		new Notice(`Starting cleaning ${settings.githubRepo} `)
		await githubBranch.newBranch(branchName);
		await deleteFromGithub(false, settings,octokit, branchName, filesManagement);
		await githubBranch.updateRepository(branchName);
	} catch (e) {
		console.error(e);
	}
}

export async function shareOneNote(branchName: string, githubBranch: GithubBranch, publish:MkdocsPublish, settings: MkdocsPublicationSettings, file: TFile) {
	try {
		await githubBranch.newBranch(branchName);
		const publishSuccess =
			await publish.publish(file, true, branchName);
		if (publishSuccess) {
			const update = await githubBranch.updateRepository(branchName);
			if (update) {
				await noticeMessage(publish, file, settings)
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

export async function shareNewNote(githubBranch: GithubBranch, publish:MkdocsPublish , settings: MkdocsPublicationSettings, octokit: Octokit, filesManagement: FilesManagement, branchName: string, vault: Vault) {
	const branchMaster = await githubBranch.getMasterBranch();
	const sharedFilesWithPaths = filesManagement.getAllFileWithPath();
	const githubSharedNotes = await filesManagement.getAllFileFromRepo(branchMaster, octokit, settings);
	const newlySharedNotes = filesManagement.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	if (newlySharedNotes.length > 0) {
		const statusBarElement = this.addStatusBarItem();
		await githubBranch.newBranch(branchName);
		await shareAllMarkedNotes(publish, this.settings, octokit, filesManagement, githubBranch, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to share.");
	}

}

export async function shareAllEditedNotes(publish: MkdocsPublish, settings: MkdocsPublicationSettings, octokit: Octokit, filesManagement: FilesManagement, githubBranch: GithubBranch, branchName: string, vault: Vault) {
	const branchMaster = await githubBranch.getMasterBranch();
	const sharedFilesWithPaths = filesManagement.getAllFileWithPath();
	const githubSharedNotes = await filesManagement.getAllFileFromRepo(branchMaster, octokit, settings);
	const newSharedFiles = filesManagement.getNewFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	const newlySharedNotes = await filesManagement.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		await githubBranch.newBranch(branchName);
		const statusBarElement = this.addStatusBarItem();
		await shareAllMarkedNotes(publish, settings, octokit, filesManagement, githubBranch, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to publish.");
	}
}

export async function shareOnlyEdited(publish: MkdocsPublish, settings: MkdocsPublicationSettings, octokit: Octokit, filesManagement: FilesManagement, githubBranch: GithubBranch, branchName: string, vault: Vault) {
	const branchMaster = await githubBranch.getMasterBranch();
	const sharedFilesWithPaths = filesManagement.getAllFileWithPath();
	const githubSharedNotes = await filesManagement.getAllFileFromRepo(branchMaster, octokit, settings);
	const newSharedFiles:TFile[]=[]
	const newlySharedNotes = await filesManagement.getEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault, newSharedFiles);
	if (newlySharedNotes.length > 0) {
		const statusBarElement = this.addStatusBarItem();
		await githubBranch.newBranch(branchName);
		await shareAllMarkedNotes(publish, settings, octokit, filesManagement, githubBranch, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to publish.");
	}
}
