import { ShareStatusBar } from "./status_bar";
import MkdocsPublish from "../githubInteraction/upload";
import { noticeMessage } from "./utils";
import {MkdocsPublicationSettings} from '../settings/interface'
import { deleteFromGithub } from '../githubInteraction/delete'
import { GetFiles } from "../githubInteraction/getFiles";
import {GithubBranch} from "../githubInteraction/branch";
import { Octokit } from "@octokit/core";
import {Notice, TFile} from "obsidian";


export async function shareAllMarkedNotes(publish: MkdocsPublish, settings: MkdocsPublicationSettings, octokit: Octokit, shareFiles: GetFiles, githubBranch: GithubBranch, statusBarItems: HTMLElement, branchName: string, sharedFiles: TFile[], createGithubBranch=true) {
	try {
		const statusBar = new ShareStatusBar(
			statusBarItems,
			sharedFiles.length
		);
		let errorCount = 0;
		if (sharedFiles.length > 0) {
			const publishedFiles = sharedFiles.map(
				(file) => file.name);
			const publishedFilesText = JSON.stringify(publishedFiles).toString();
			if (createGithubBranch) {await githubBranch.newBranch(branchName);}
			const vaultPublisherJSON = settings.folderDefaultName.length > 0 ? `${settings.folderDefaultName}/vault_published.json` : `vault_published.json`;
			await publish.uploadText(
				"vault_published.json",
				publishedFilesText,
				vaultPublisherJSON, "", branchName
			);
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
			await deleteFromGithub(true, settings, octokit, branchName, shareFiles);
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

export async function deleteUnsharedDeletedNotes(githubBranch: GithubBranch, settings: MkdocsPublicationSettings, octokit: Octokit, shareFiles: GetFiles, branchName: string) {
	try {
		new Notice(`Starting cleaning ${settings.githubRepo} `)
		await githubBranch.newBranch(branchName);
		await deleteFromGithub(false, settings,octokit, branchName, shareFiles);
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
		new Notice("Error publishing to " + this.settings.githubRepo + ".");
	}
}


}

export async function shareAllEditedNotes(statusBarElement: HTMLElement, publish: MkdocsPublish, settings: MkdocsPublicationSettings, octokit: Octokit, shareFiles: GetFiles, githubBranch: GithubBranch, branchName: string, vault: Vault) {
	const branchMaster = await githubBranch.getMasterBranch();
	const sharedFilesWithPaths = shareFiles.getAllFileWithPath();
	const githubSharedNotes = await shareFiles.getAllFileFromRepo(branchMaster, octokit, settings);
	const newlySharedNotes = await shareFiles.getAllplusNewEditedFiles(sharedFilesWithPaths, githubSharedNotes, vault);
	if (newlySharedNotes.length > 0) {
		await githubBranch.newBranch(branchName);
		await shareAllMarkedNotes(publish, settings, octokit, shareFiles, githubBranch, statusBarElement, branchName, newlySharedNotes);
	} else {
		new Notice("No new notes to publish.");
	}
}
