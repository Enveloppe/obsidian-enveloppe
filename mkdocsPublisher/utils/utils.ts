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

async function noticeMessage(publish: MkdocsPublish, file: TFile | string, settings: MkdocsPublicationSettings) {
	const noticeValue = (file instanceof TFile) ? '"' + file.basename + '"' : file
	const msg = settings.workflowName.length>0? '.\nNow, waiting for the workflow to be completed...':'.'
	new Notice('Send ' + noticeValue + ' to ' + settings.githubRepo + msg);
	const successWorkflow = await publish.workflowGestion();
	if (successWorkflow) {
		new Notice(
			"Successfully published " + noticeValue + " to " + settings.githubRepo + "."
		);
	}
}

function convertWikilinks(fileContent: string, settings: MkdocsPublicationSettings, linkedFiles: {linked: TFile, linkFrom: string, altText: string}[]) {
	if (!settings.convertWikiLinks) {
		return fileContent;
	}
	const wikiRegex = /\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(?<=\[\[).*?(?=([\]|]))/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			if (fileMatch) {
				const fileName = fileMatch[0]
				const linked=linkedFiles.find(item => item.linkFrom===fileName)
				if (linked) {
					const altText = linked.altText.length > 0 ? linked.altText : linked.linked.basename
					const linkCreator = `[${altText}](${encodeURI(linked.linkFrom)})`
					fileContent = fileContent.replace(wikiMatch, linkCreator)
				} else if (!fileMatch[0].startsWith('http')) {
					const altRegex = /(?<=\|).*(?=]])/;
					const altMatch = wikiMatch.match(altRegex);
					const altCreator = fileName.split('/');
					const altLink = altMatch ? altMatch[0] : altCreator.length > 1 ? altCreator[altCreator.length-2] : altCreator[0];
					const linkCreator = `[${altLink}](${encodeURI(fileName.trim())})`
					fileContent = fileContent.replace(wikiMatch, linkCreator)
				}
			}
		}
	}
	return fileContent;
}

function getReceiptFolder(file: TFile, settings:MkdocsPublicationSettings) {
	const folderDefault = settings.folderDefaultName;
	let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;

	if (settings.downloadedFolder === "yamlFrontmatter") {
		const frontmatter = this.metadataCache.getCache(file.path).frontmatter
		let folderRoot = settings.rootFolder;
		if (folderRoot.length > 0) {
			folderRoot = folderRoot + "/";
		}
		if (frontmatter[settings.yamlFolderKey]) {
			const category = frontmatter[settings.yamlFolderKey]
			let parentCatFolder = category.split('/').at(-1)
			parentCatFolder = parentCatFolder.length === 0 ? category.split('/').at(-2) : parentCatFolder
			const fileName = settings.folderNote && parentCatFolder === file.name ? 'index.md' : file.name
			path = folderRoot + frontmatter[settings.yamlFolderKey] + "/" + fileName;
		}
	} else if (settings.downloadedFolder === "obsidianPath") {
		const fileName = file.name.replace('.md', '') === file.parent.name && settings.folderNote ? 'index.md' : file.name
		path = folderDefault + '/' + file.path.replace(file.name, fileName);
	}
	return path
}

function convertLinkCitation(fileContent: string, settings: MkdocsPublicationSettings, linkedFiles : {linked: TFile, linkFrom: string, altText: string}[]) {
	if (!settings.convertForGithub) {
		return fileContent;
	}
	for (const linkedFile of linkedFiles) {
		const pathInGithub = getReceiptFolder(linkedFile.linked, settings)
		fileContent = fileContent.replace(linkedFile.linkFrom, pathInGithub)
	}
	return fileContent;
}

export {disablePublish, noticeMessage, convertWikilinks, convertLinkCitation, getReceiptFolder }
