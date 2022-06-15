import {App, Notice, TFile, MetadataCache} from 'obsidian'
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
				const fileName = fileMatch[0];
				const linkedFile=linkedFiles.find(item => item.linkFrom===fileName);
				if (linkedFile) {
					const altText = linkedFile.altText.length > 0 ? linkedFile.altText : linkedFile.linked.extension === 'md' ? linkedFile.linked.basename : "";
					const linkCreator = `[${altText}](${encodeURI(linkedFile.linkFrom)})`;
					fileContent = fileContent.replace(wikiMatch, linkCreator);
				} else if (!fileName.startsWith('http')) {
					const altMatch = wikiMatch.match(/(?<=\|).*(?=]])/);
					const altCreator = fileName.split('/');
					const altLink = creatorAltLink(altMatch, altCreator, fileName.split('.').at(-1));
					const linkCreator = `[${altLink}](${encodeURI(fileName.trim())})`;
					fileContent = fileContent.replace(wikiMatch, linkCreator);
				}
			}
		}
	}
	return fileContent;
}

function creatorAltLink(altMatch: RegExpMatchArray, altCreator: string[], fileExtension: string) {
	if (altMatch) {
		return altMatch[0]
	}
	if (fileExtension === 'md') {
		return altCreator.length > 1 ? altCreator[altCreator.length-1] : altCreator[0] //alt text based on filename for markdown files
	}
	return ''
	
}

function createRelativePath(sourcePath: string, targetPath: string) {
	const sourceList = sourcePath.split('/');
	const targetList = targetPath.split('/');
	const diffSourcePath = sourceList.filter(x => !targetList.includes(x));
	const diffTargetPath = targetList.filter(x => !sourceList.includes(x));
	const diffTarget = function (folderPath: string[]) {
		const relativePath = [];
		for (const folder of folderPath) {
			if (folder != folderPath.at(-1)) {
				relativePath.push('..');
			}
		}
		return relativePath;
	};
	return diffTarget(diffSourcePath).concat(diffTargetPath).join('/')
}

function getReceiptFolder(file: TFile, settings:MkdocsPublicationSettings, metadataCache: MetadataCache) {
	if (file.extension === 'md') {
		const folderDefault = settings.folderDefaultName;
		let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;
		
		if (settings.downloadedFolder === "yamlFrontmatter") {
			const frontmatter = metadataCache.getCache(file.path).frontmatter
			let folderRoot = settings.rootFolder;
			if (folderRoot.length > 0) {
				folderRoot = folderRoot + "/";
			}
			if (frontmatter && frontmatter[settings.yamlFolderKey]) {
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
}

function convertLinkCitation(fileContent: string, settings: MkdocsPublicationSettings, linkedFiles : {linked: TFile, linkFrom: string, altText: string}[], metadataCache: MetadataCache, sourceFile: TFile) {
	if (!settings.convertForGithub) {
		return fileContent;
	}
	for (const linkedFile of linkedFiles) {
		let pathInGithub=linkedFile.linked.extension === 'md' ? getReceiptFolder(linkedFile.linked, settings, metadataCache) : getImageLinkOptions(linkedFile.linked, settings);
		const sourcePath = getReceiptFolder(sourceFile, settings, metadataCache);
		pathInGithub = createRelativePath(sourcePath, pathInGithub);
		const regexToReplace = new RegExp(`(\\[{2}.*${linkedFile.linkFrom}.*\\]{2})|(\\[.*\\]\\(.*${linkedFile.linkFrom}.*\\))`, 'g');
		const matchedLink = fileContent.match(regexToReplace);
		for (const link of matchedLink) {
			const newLink = link.replace(linkedFile.linkFrom, pathInGithub);
			fileContent = fileContent.replace(link, newLink);
		}
	}
	return fileContent;
}

function getImageLinkOptions(file: TFile, settings: MkdocsPublicationSettings) {
	let fileDefaultPath = file.path;
	const fileName = file.name;
	if (settings.defaultImageFolder.length > 0) {
		fileDefaultPath = settings.defaultImageFolder + "/" + fileName;
	} else if (settings.folderDefaultName.length > 0) {
		fileDefaultPath = settings.folderDefaultName + "/" + fileName;
	}
	return fileDefaultPath;
}

export {
	disablePublish,
	noticeMessage,
	convertWikilinks,
	convertLinkCitation,
	getReceiptFolder,
	getImageLinkOptions,
	createRelativePath
}
