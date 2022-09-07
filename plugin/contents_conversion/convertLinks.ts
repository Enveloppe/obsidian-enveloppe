import {FrontMatterCache, MetadataCache, TFile, Vault} from "obsidian";
import {GitHubPublisherSettings, LinkedNotes} from "../settings/interface";
import {createRelativePath, getReceiptFolder} from "./filePathConvertor";

export function convertWikilinks(
	fileContent: string,
	frontmatter: FrontMatterCache,
	settings: GitHubPublisherSettings,
	linkedFiles: LinkedNotes[]):string
{
	/*
	* Convert wikilinks to markdown
	 */
	const convertWikilink: boolean = frontmatter.mdlinks !== undefined ? frontmatter?.mdlinks : settings.convertWikiLinks;
	const imageSettings: boolean = frontmatter.image !== undefined ? frontmatter?.image : settings.embedImage;
	const embedSettings: boolean = frontmatter.embed !== undefined ? frontmatter?.embed : settings.embedNotes;
	if (!convertWikilink && frontmatter?.links && imageSettings) {
		return fileContent;
	}
	const wikiRegex = /!?\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(\[\[).*?([\]|])/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			const isEmbed = wikiMatch.startsWith('!') ? '!' : '';
			if (fileMatch) {
				// @ts-ignore
				let linkCreator = wikiMatch;
				const fileName = fileMatch[0].replaceAll('[', '').replaceAll('|', '').replaceAll(']', '').replaceAll('\\', '');
				const linkedFile=linkedFiles.find(item => item.linkFrom===fileName);
				if (linkedFile) {
					const altText = linkedFile.altText.length > 0 ? linkedFile.altText : linkedFile.linked.extension === 'md' ? linkedFile.linked.basename : "";
					if (convertWikilink) {
						linkCreator = `${isEmbed}[${altText}](${encodeURI(linkedFile.linkFrom)})`;
					}
					else if (frontmatter?.links === false) {
						linkCreator = altText;
					}
					else if (!imageSettings && (linkedFile.linked.extension.match('png|jpg|jpeg|gif|svg'))) {
						linkCreator = '';
					}
					fileContent = fileContent.replace(wikiMatch, linkCreator);
				} else if (!fileName.startsWith('http')) {
					const altMatch = wikiMatch.match(/(\|).*(]])/);
					const altCreator = fileName.split('/');

					const altLink = creatorAltLink(altMatch, altCreator, fileName.split('.').at(-1));
					if (convertWikilink){
						linkCreator = `${isEmbed}[${altLink}](${encodeURI(fileName.trim())})`;
					}
					if (!embedSettings &&  isEmbed === '!') {
						linkCreator = '';
					}
					else if (frontmatter?.links === false && fileName.trim().match('md$')) {
						linkCreator = altLink;
					} else if (
						!imageSettings
						&& fileName.trim().match('(png|jpg|jpeg|gif|svg)$')) {
						linkCreator = '';
					}

					fileContent = fileContent.replace(wikiMatch, linkCreator);
				}
			}
		}
	}
	return fileContent;
}

export function convertLinkCitation(
	fileContent: string,
	settings: GitHubPublisherSettings,
	linkedFiles : LinkedNotes[],
	metadataCache: MetadataCache,
	sourceFile: TFile,
	vault: Vault):string {
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
		let pathInGithub = createRelativePath(sourceFile, linkedFile, metadataCache, settings, vault).replace('.md', '');
		if (pathInGithub.trim().length == 0) {
			pathInGithub = getReceiptFolder(sourceFile, settings, metadataCache, vault)
		}
		const regexToReplace = new RegExp(`(\\[{2}${linkedFile.linkFrom}(\\\\?\\|.*)?\\]{2})|(\\[.*\\]\\(${linkedFile.linkFrom}\\))`, 'g');
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

export function creatorAltLink(
	altMatch: RegExpMatchArray,
	altCreator: string[],
	fileExtension: string):string {
	/*
	* Create the alt text for the link
	* if no alt text is given, the alt text is the filename without the extension
	 */
	if (altMatch) {
		return altMatch[0].replace(']]', '').replace('|', '');
	}
	if (fileExtension === 'md') {
		return altCreator.length > 1 ? altCreator[altCreator.length-1] : altCreator[0] //alt text based on filename for markdown files
	}
	return ''
}
