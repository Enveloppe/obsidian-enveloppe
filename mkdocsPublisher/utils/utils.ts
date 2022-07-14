import {App, MetadataCache, Notice, TFile} from 'obsidian'
import {MkdocsPublicationSettings} from '../settings/interface'
import MkdocsPublish from "../githubInteraction/upload";
import t from '../i18n'
import type { StringFunc } from "../i18n";
import {getReceiptFolder} from "./filePathConvertor";

function disablePublish (app: App, settings: MkdocsPublicationSettings, file:TFile) {
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
	const slash = link.match(/\/*$/);
	if (slash[0].length != 1) {
		link = link.replace(/\/*$/, "") + "/";
	}
	return link;
}


async function createLink(file: TFile, settings: MkdocsPublicationSettings, metadataCache: MetadataCache) {
	if (!settings.copyLink){
		return;
	}
	let filepath = getReceiptFolder(file, settings, metadataCache)

	let baseLink = settings.mainLink;
	if (baseLink.length === 0) {
		baseLink = `https://${settings.githubName}.github.io/${settings.githubRepo}/`
	}
	baseLink = checkSlash(baseLink);
	if (settings.linkRemover.length > 0){
		filepath = filepath.replace(settings.linkRemover, '')
	}
	const url = encodeURI(baseLink + filepath)
	new Notice(
		(t("copylinkMsg") as StringFunc)(file.name)
	)
	await navigator.clipboard.writeText(url);
	return;

}

async function noticeMessage(PublisherManager: MkdocsPublish, file: TFile | string, settings: MkdocsPublicationSettings) {
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
	createLink
}
