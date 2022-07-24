import {MkdocsPublicationSettings} from "../settings/interface";
import {MetadataCache, TFile, Notice, Vault} from "obsidian";
import {createRelativePath} from "./filePathConvertor";
import { getAPI } from "obsidian-dataview";
import { noticeLog } from "./utils";

function addHardLineBreak(text: string, settings: MkdocsPublicationSettings) {
	try {
		text = text.replace(/^\s\\\s*$/gmi, '<br/>');
		if (settings.hardBreak) {
			text = text.replace(/\n/gm, '  \n');
		}
		return text;
	}
	catch (e) {
		noticeLog(e, settings);
		return text;
	}
}

async function convertDataviewQueries(text: string, path: string, settings: MkdocsPublicationSettings): Promise<string> {
	/* Credit : Ole Eskild Steensen from Obsidian Digital Garden */
	let replacedText = text;
	const dataviewRegex = /```dataview(.+?)```/gsm;
	const dvApi = getAPI();
	const matches = text.matchAll(dataviewRegex);
	if (!matches) return;
	for (const queryBlock of matches){
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];
			const md = await dvApi.tryQueryMarkdown(query, path);
			replacedText = replacedText.replace(block, md);

		} catch (e) {
			noticeLog(e, settings);
			new Notice('Unable to render dataview query. Please update the dataview plugin to the last version.')
			return queryBlock[0];
		}
	}
	return replacedText;
}

function convertWikilinks(fileContent: string, settings: MkdocsPublicationSettings, linkedFiles: {linked: TFile, linkFrom: string, altText: string}[]) {
	if (!settings.convertWikiLinks) {
		return fileContent;
	}
	const wikiRegex = /\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(\[\[).*?([\]|])/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			if (fileMatch) {
				const fileName = fileMatch[0].replace('[[', '').replace('|', '');
				const linkedFile=linkedFiles.find(item => item.linkFrom===fileName);
				if (linkedFile) {
					const altText = linkedFile.altText.length > 0 ? linkedFile.altText : linkedFile.linked.extension === 'md' ? linkedFile.linked.basename : "";
					const linkCreator = `[${altText}](${encodeURI(linkedFile.linkFrom)})`;
					fileContent = fileContent.replace(wikiMatch, linkCreator);
				} else if (!fileName.startsWith('http')) {
					const altMatch = wikiMatch.match(/(\|).*(]])/);
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

function convertLinkCitation(fileContent: string, settings: MkdocsPublicationSettings, linkedFiles : {linked: TFile, linkFrom: string, altText: string}[], metadataCache: MetadataCache, sourceFile: TFile, vault: Vault) {
	/** 
	* Convert internal links with changing the path to the relative path in the github repository
	* @param fileContent: The file content
	* @param settings: Settings of the plugins
	* @param linkedFiles: A list of linked files including the linked file in TFile format and the linked file (string) including the alt text
	* @param metadataCache: Metadata cache 
	* @param sourceFile: The original file
	* @return the file contents with converted internal links

	*/
	if (!settings.convertForGithub) {
		return fileContent;
	}
	for (const linkedFile of linkedFiles) {
		const pathInGithub = createRelativePath(sourceFile, linkedFile, metadataCache, settings, vault).replace('.md', '');
		const regexToReplace = new RegExp(`(\\[{2}${linkedFile.linkFrom}(\\|.*)?\\]{2})|(\\[.*\\]\\(${linkedFile.linkFrom}\\))`, 'g');
		const matchedLink = fileContent.match(regexToReplace);
		if (matchedLink) {
			for (const link of matchedLink) {
				const regToReplace = new RegExp(`${linkedFile.linkFrom}`);
				const newLink = link.replace(regToReplace, pathInGithub); //strict replacement of link
				fileContent = fileContent.replace(link, newLink);
			}
		}
	}
	return fileContent;
}

function creatorAltLink(altMatch: RegExpMatchArray, altCreator: string[], fileExtension: string) {
	if (altMatch) {
		return altMatch[0].replace(']]', '').replace('|', '');
	}
	if (fileExtension === 'md') {
		return altCreator.length > 1 ? altCreator[altCreator.length-1] : altCreator[0] //alt text based on filename for markdown files
	}
	return ''
}


export {convertWikilinks, convertLinkCitation, creatorAltLink, convertDataviewQueries, addHardLineBreak};
