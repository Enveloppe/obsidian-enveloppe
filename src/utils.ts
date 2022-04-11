import { Base64 } from "js-base64";
import {
	App,
	TFile
} from 'obsidian';
import {mkdocsPublicationSettings} from "./settings";

function arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return Base64.btoa(binary);
}

function disablePublish(app: App, settings: mkdocsPublicationSettings, file:TFile) {
	const fileCache = app.metadataCache.getFileCache(file);
	const meta = fileCache?.frontmatter;
	const folder_list = settings.ExcludedFolder.split(',');
	if (meta === undefined) {
		return false;
	} else if (folder_list.length > 0) {
		for (let i = 0; i < folder_list.length; i++) {
			if (file.path.contains(folder_list[i].trim())) {
				return false;
			}
		}
	}
	return meta[settings.shareKey];
}

export { arrayBufferToBase64, disablePublish};
