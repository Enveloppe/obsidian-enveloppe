import {App, Notice, TFile} from 'obsidian'
import {MkdocsPublicationSettings} from '../settings/interface'
import MkdocsPublish from "../githubInteraction/upload";

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

async function noticeMessage(PublisherManager: MkdocsPublish, file: TFile | string, settings: MkdocsPublicationSettings) {
	const noticeValue = (file instanceof TFile) ? '"' + file.basename + '"' : file
	const msg = settings.workflowName.length>0? '.\nNow, waiting for the workflow to be completed...':'.'
	new Notice('Send ' + noticeValue + ' to ' + settings.githubRepo + msg);
	const successWorkflow = await PublisherManager.workflowGestion();
	if (successWorkflow) {
		new Notice(
			"Successfully published " + noticeValue + " to " + settings.githubRepo + "."
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
	trimObject
}
