import {App, MetadataCache, Notice, TFile, Vault} from 'obsidian'
import {MkdocsPublicationSettings} from '../settings/interface'
import MkdocsPublish from "../publishing/upload";
import t from '../i18n'
import type { StringFunc } from "../i18n";
import {getReceiptFolder} from "./filePathConvertor";

function noticeLog(message: string, settings: MkdocsPublicationSettings) {
	/**
	 * Create a notice message for the log
	 * @param message: string
	 * @param settings: MkdocsPublicationSettings
	 * @returns null
	 */
	if (settings.logNotice) {
		new Notice(message);
	} else {
		console.log(message);
	}
}

function disablePublish (app: App, settings: MkdocsPublicationSettings, file:TFile) {
	/**
	 * Disable publishing if the file hasn't a valid frontmatter or if the file is in the folder list to ignore
	 * @param app: App
	 * @param settings: MkdocsPublicationSettings
	 * @param file: TFile
	 * @returns boolean with the meta[settings.shareKey] if valid or false if not
	 */
	const fileCache = app.metadataCache.getFileCache(file)
	const meta = fileCache?.frontmatter
	const folderList = settings.ExcludedFolder.split(',').filter(x => x!=='')
	if (meta === undefined) {
		return false
	} else if (folderList.length > 0) {
		for (let i = 0; i < folderList.length; i++) {
			if (file.path.contains(folderList[i].trim())) {
				return false
			}
		}
	}
	return meta[settings.shareKey]
}

function checkSlash(
	link: string
) {
	/**
	 * Check if the link has a slash at the end and if not add it
	 * @param link: string
	 * @returns string with the link with a slash at the end
	 */
	const slash = link.match(/\/*$/);
	if (slash[0].length != 1) {
		link = link.replace(/\/*$/, "") + "/";
	}
	return link;
}


async function createLink(file: TFile, settings: MkdocsPublicationSettings, metadataCache: MetadataCache, vault: Vault) {
	/**
	 * Create the link for the file and add it to the clipboard
	 * The path is based with the receipt folder but part can be removed using settings.
	 * By default, use a github.io page for the link.
	 * @param file: TFile
	 * @param settings: MkdocsPublicationSettings
	 * @param metadataCache: MetadataCache
	 * @returns null
	 */
	if (!settings.copyLink){
		return;
	}
	let filepath = getReceiptFolder(file, settings, metadataCache, vault)

	let baseLink = settings.mainLink;
	if (baseLink.length === 0) {
		baseLink = `https://${settings.githubName}.github.io/${settings.githubRepo}/`
	}
	baseLink = checkSlash(baseLink);
	if (settings.linkRemover.length > 0){
		const tobeRemoved = settings.linkRemover.split(',')
		for (const part of tobeRemoved) {
			if (part.length > 0) {
				filepath = filepath.replace(part.trim(), '')
			}
		}
	}
	const url = encodeURI(baseLink + filepath.replace(".md", ''))
	await navigator.clipboard.writeText(url);
	return;

}

async function noticeMessage(PublisherManager: MkdocsPublish, file: TFile | string, settings: MkdocsPublicationSettings) {
	/**
	 * Create a notice message for the sharing ; the message can be delayed if a workflow is used. 
	 * @param PublisherManager: MkdocsPublish
	 * @param file: TFile | string
	 * @param settings: MkdocsPublicationSettings
	 * @returns null
	 */
	const noticeValue = (file instanceof TFile) ? '"' + file.basename + '"' : file
	if (settings.workflowName.length > 0) {
		new Notice((t("sendMessage") as StringFunc)([noticeValue, settings.githubRepo, `.\n${t("waitingWorkflow")}`]));
		const successWorkflow = await PublisherManager.workflowGestion();
		if (successWorkflow) {
			new Notice(
				(t("successfullPublish") as StringFunc)([noticeValue, settings.githubRepo])
			);
		}
	}
	else {
		new Notice(
			(t("successfullPublish") as StringFunc)([noticeValue, settings.githubRepo])
		);
	}
}

function trimObject(obj: {[p: string]: string}){
	/**
	 * Trim the object values
	 * @param obj: {[p: string]: string}
	 * @returns {[p: string]: string}
	*/
	const trimmed = JSON.stringify(obj, (key, value) => {
		if (typeof value === 'string') {
			return value.trim().toLowerCase();
		}
		return value;
	});
	return JSON.parse(trimmed);
}

export {
	disablePublish,
	noticeMessage,
	trimObject,
	createLink,
	noticeLog
}
