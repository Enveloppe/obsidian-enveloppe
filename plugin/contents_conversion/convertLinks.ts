import {FrontMatterCache, MetadataCache, TFile, Vault} from "obsidian";
import {frontmatterConvert, GitHubPublisherSettings, LinkedNotes} from "../settings/interface";
import {createRelativePath} from "./filePathConvertor";
import {isAttachment} from "../src/utils";

export function convertWikilinks(
	fileContent: string,
	conditionConvert: frontmatterConvert,
	settings: GitHubPublisherSettings,
	linkedFiles: LinkedNotes[]):string
{
	/*
	* Convert wikilinks to markdown
	 */
	const convertWikilink = conditionConvert.convertWiki
	const imageSettings = conditionConvert.attachment
	const embedSettings = conditionConvert.embed
	const convertLinks = conditionConvert.links
	if (!convertWikilink && convertLinks && imageSettings && embedSettings && !conditionConvert.removeEmbed) {
		return fileContent;
	}
	const wikiRegex = /!?\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(\[\[).*?([\]|])/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			const isEmbed = wikiMatch.startsWith('!') ? '!' : '';
			const isEmbedBool = wikiMatch.startsWith('!');

			if (fileMatch) {
				// @ts-ignore
				let linkCreator = wikiMatch;
				const fileName = fileMatch[0].replaceAll('[', '').replaceAll('|', '').replaceAll(']', '').replaceAll('\\', '');
				const linkedFile=linkedFiles.find(item => item.linkFrom===fileName);
				if (linkedFile) {
					const altText = linkedFile.altText.length > 0 ? linkedFile.altText : linkedFile.linked.extension === 'md' ? linkedFile.linked.basename : "";
					const removeEmbed =  conditionConvert.removeEmbed && isEmbedBool && linkedFile.linked.extension === 'md';
					if (convertWikilink) {
						linkCreator = `${isEmbed}[${altText}](${encodeURI(linkedFile.linkFrom)})`;
					}

					if (linkedFile.linked.extension === 'md' && !convertLinks && !isEmbedBool) {
						linkCreator = altText;
					}
					if ((!imageSettings && isAttachment(linkedFile.linked.extension)) || removeEmbed)
					{
						linkCreator = '';
					}
					fileContent = fileContent.replace(wikiMatch, linkCreator);
				} else if (!fileName.startsWith('http')) {
					const altMatch = wikiMatch.match(/(\|).*(]])/);
					const altCreator = fileName.split('/');

					const altLink = creatorAltLink(altMatch, altCreator, fileName.split('.').at(-1), fileName);
					const removeEmbed = !isAttachment(fileName.trim()) &&  conditionConvert.removeEmbed && isEmbedBool;
					if (convertWikilink){
						linkCreator = `${isEmbed}[${altLink}](${encodeURI(fileName.trim())})`;
					}
					if (!isAttachment(fileName.trim()) && !convertLinks && !isEmbedBool)  {
						linkCreator = altLink;
					} if ((!imageSettings && isAttachment(fileName.trim()))
						|| removeEmbed)
					{
						linkCreator = '';
					}

					fileContent = fileContent.replace(wikiMatch, linkCreator);
				}
			}
		}
	}
	return fileContent;
}

function addAltText(link: string, linkedFile: LinkedNotes) {
	if (!link.match(/(\|).*(]])/)) {
		return link.replace('|', '').replace(']]', `|${linkedFile.altText}]]`);
	} return link;
}

export function convertLinkCitation(
	fileContent: string,
	settings: GitHubPublisherSettings,
	linkedFiles : LinkedNotes[],
	metadataCache: MetadataCache,
	sourceFile: TFile,
	vault: Vault,
	frontmatter: FrontMatterCache):string {
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
		let pathInGithub = createRelativePath(sourceFile, linkedFile, metadataCache, settings, vault, frontmatter).replace('.md', '');
		const regexToReplace = new RegExp(`(\\[{2}${linkedFile.linkFrom}(\\\\?\\|.*)?\\]{2})|(\\[.*\\]\\(${linkedFile.linkFrom}\\))`, 'g');
		const matchedLink = fileContent.match(regexToReplace);
		if (matchedLink) {
			for (const link of matchedLink) {
				const regToReplace = new RegExp(`${linkedFile.linkFrom}`);
				const block_link = linkedFile.linkFrom.match(/#.*/)
				if (block_link) {
					pathInGithub += block_link[0];
				}
				let newLink = link.replace(regToReplace, pathInGithub); //strict replacement of link
				newLink = addAltText(newLink, linkedFile);
				fileContent = fileContent.replace(link, newLink);
			}
		}
	}
	return fileContent;
}

export function creatorAltLink(
	altMatch: RegExpMatchArray,
	altCreator: string[],
	fileExtension: string,
	match: string):string {
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
	return match.split('/').at(-1); //alt text based on filename for other files
}
