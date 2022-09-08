import {App, FrontMatterCache, MetadataCache, Notice, TFile, Vault} from 'obsidian'
import {GitHubPublisherSettings} from '../settings/interface'
import Publisher from "../publishing/upload";
import t from '../i18n'
import type { StringFunc } from "../i18n";
import {getReceiptFolder} from "../contents_conversion/filePathConvertor";
import {frontmatterConvert} from "../settings/interface";

export function noticeLog(message: string, settings: GitHubPublisherSettings) {
	/**
	 * Create a notice message for the log
	 * @param message: string
	 * @param settings: GitHubPublisherSettings
	 * @returns null
	 */
	if (settings.logNotice) {
		new Notice(message);
	} else {
		console.log(message);
	}
}

export function disablePublish (app: App, settings: GitHubPublisherSettings, file:TFile) {
	/**
	 * Disable publishing if the file hasn't a valid frontmatter or if the file is in the folder list to ignore
	 * @param app: App
	 * @param settings: GitHubPublisherSettings
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


export async function createLink(file: TFile, settings: GitHubPublisherSettings, metadataCache: MetadataCache, vault: Vault) {
	/**
	 * Create the link for the file and add it to the clipboard
	 * The path is based with the receipt folder but part can be removed using settings.
	 * By default, use a github.io page for the link.
	 * @param file: TFile
	 * @param settings: GitHubPublisherSettings
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

export async function noticeMessage(PublisherManager: Publisher, file: TFile | string, settings: GitHubPublisherSettings) {
	/**
	 * Create a notice message for the sharing ; the message can be delayed if a workflow is used. 
	 * @param PublisherManager: Publisher
	 * @param file: TFile | string
	 * @param settings: GitHubPublisherSettings
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

export function trimObject(obj: {[p: string]: string}){
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

export function isAttachment(filename: string) {
	return filename.match(/(png|jpe?g|gif|bmp|svg|mp[34]|webm|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf)$/i)
}



export function getFrontmatterCondition(frontmatter: FrontMatterCache, settings: GitHubPublisherSettings) {
	let imageDefaultFolder = null;
	if (settings.defaultImageFolder.length > 0) {
		imageDefaultFolder = settings.defaultImageFolder;
	} else if (settings.folderDefaultName.length > 0) {
		imageDefaultFolder = settings.folderDefaultName;
	}
	const settingsConversion: frontmatterConvert = {
		convertWiki: settings.convertWikiLinks,
		attachment: settings.embedImage,
		embed: settings.embedNotes,
		attachmentLinks: imageDefaultFolder,
		links: true,
		removeEmbed: false,
		dataview: settings.convertDataview,
	}
	if (frontmatter.links !== undefined) {
		if (typeof frontmatter.links === 'object') {
			if (frontmatter.links.convert !== undefined) {
				settingsConversion.links = frontmatter.links.convert
			}
			if (frontmatter.links.mdlinks !== undefined) {
				settingsConversion.convertWiki = frontmatter.links.mdlinks
			}
		} else {
			settingsConversion.links = frontmatter.links
		}
	}
	if (frontmatter.embed !== undefined) {
		if (typeof frontmatter.embed === 'object') {
			if (frontmatter.embed.send !== undefined) {
				settingsConversion.embed = frontmatter.embed.send
			}
			if (frontmatter.embed.remove !== undefined) {
				settingsConversion.removeEmbed = frontmatter.embed.remove
			}
		} else {
			settingsConversion.embed = frontmatter.embed
		}
	}
	if (frontmatter.attachment !== undefined) {
		if (typeof frontmatter.attachment === 'object') {
			if (frontmatter.attachment.send !== undefined) {
				settingsConversion.attachment = frontmatter.attachment.send
			}
			if (frontmatter.attachment.folder !== undefined) {
				settingsConversion.attachmentLinks = frontmatter.attachment.folder
			}
		} else {
			settingsConversion.attachment = frontmatter.attachment
		}
	}
	if (frontmatter.attachmentLinks !== undefined) {
		settingsConversion.attachmentLinks = frontmatter.attachmentLinks.toString().replace(/\/$/, '')
	}
	if (frontmatter.mdlinks !== undefined) {
		settingsConversion.convertWiki = frontmatter.mdlinks
	}
	if (frontmatter.removeEmbed !== undefined) {
		settingsConversion.removeEmbed = frontmatter.removeEmbed
	}
	if (frontmatter.dataview !== undefined) {
		settingsConversion.dataview = frontmatter.dataview
	}
	return settingsConversion
}
