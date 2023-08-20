import { FrontMatterCache, MetadataCache, TFile, Vault } from "obsidian";
import slugify from "slugify";

import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	RepoFrontmatter, Repository,
} from "../settings/interface";
import {isAttachment, noTextConversion} from "../utils/data_validation_test";
import { createRelativePath } from "./file_path";

/**
 * Convert wikilinks to markdown
 * @param {string} fileContent the text to convert
 * @param {FrontmatterConvert} conditionConvert  the frontmatter settings
 * @param {GitHubPublisherSettings} settings  global settings
 * @param {LinkedNotes[]} linkedFiles the list of linked files
 * @return {string} the converted text
 */

export function convertWikilinks(
	fileContent: string,
	conditionConvert: FrontmatterConvert,
	linkedFiles: LinkedNotes[],
	settings: GitHubPublisherSettings,
): string {
	const convertWikilink = conditionConvert.convertWiki;
	const imageSettings = conditionConvert.attachment;
	const convertLinks = conditionConvert.links;
	if (
		noTextConversion(conditionConvert)
	) {
		return fileContent;
	}
	const wikiRegex = /!?\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(\[\[).*?([\]|])/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			let isEmbed = wikiMatch.startsWith("!") ? "!" : "";
			const isEmbedBool = wikiMatch.startsWith("!");
			if (fileMatch) {
				// @ts-ignore
				let linkCreator = wikiMatch;

				/**
				 * In order to compare linked files with files that we have cached in
				 * memory, we have sanitize their link name to matching.
				 *
				 * For example, if we have a [[./wikilink.md|My Incredible Link Title]],
				 * we want to match `wikilink.md` with the cached files we have in
				 * memory. In this case, we'd strip [[, | and ./ to have wikilink.md as
				 * result.
				 */
				const fileName = fileMatch[0]
					.replaceAll("[", "")
					.replaceAll("|", "")
					.replaceAll("]", "")
					.replaceAll("\\", "");
				const StrictFileName = fileMatch[0]
					.replaceAll("[", "")
					.replaceAll("|", "")
					.replaceAll("]", "")
					.replaceAll("\\", "")
					.replaceAll("../", "")
					.replaceAll("./", "")
					.replace(/#.*/, "");
				//get last from path
				const linkedFile = linkedFiles.find(
					(item) => item.linkFrom.replace(/#.*/, "") === StrictFileName
				);
				if (linkedFile) {
					let altText: string;
					if (linkedFile.linked.extension !== "md") {
						altText =
							linkedFile.altText
								? linkedFile.altText
								: "";
					} else {
						altText =
							linkedFile.altText
								? linkedFile.altText
								: linkedFile.linked.basename;
						altText = altText
							.replace("#", " > ")
							.replace(/ > \^\w*/, "");
					}
					const removeEmbed =
						(conditionConvert.removeEmbed === "remove" || conditionConvert.removeEmbed === "bake") &&
						isEmbedBool &&
						linkedFile.linked.extension === "md";
					if (isEmbedBool && linkedFile.linked.extension === "md" && conditionConvert.removeEmbed === "links") {
						isEmbed = conditionConvert.charEmbedLinks + " ";
						linkCreator = linkCreator.replace("!", isEmbed);
					}
					if (convertWikilink) {
						const altMatch = wikiMatch.match(/(\|).*(]])/);
						const altCreator = fileName.split("/");
						let altLink = creatorAltLink(
							altMatch as RegExpMatchArray,
							altCreator,
							fileName.split(".").at(-1) as string,
							fileName
						);

						altLink = altLink
							.replace("#", " > ")
							.replace(/ > \^\w*/, "");
						linkCreator = createMarkdownLinks(fileName, isEmbed, altLink, settings);
					} else {
						const altMatch = wikiMatch.match(/(\|).*(]])/);
						linkCreator = addAltForWikilinks(altMatch as RegExpMatchArray, linkCreator);
					}
					if (
						linkedFile.linked.extension === "md" &&
						!convertLinks &&
						!isEmbedBool
					) {
						linkCreator = altText;
					}
					if (
						(!imageSettings &&
							isAttachment(linkedFile.linked.extension)) ||
						removeEmbed
					) {
						linkCreator = "";
					}
					fileContent = fileContent.replace(wikiMatch, linkCreator);

				} else if (!fileName.startsWith("http")) {
					const altMatch = wikiMatch.match(/(\|).*(]])/);
					const altCreator = fileName.split("/");

					let altLink = creatorAltLink(
						altMatch as RegExpMatchArray,
						altCreator,
						fileName.split(".").at(-1) as string,
						fileName
					);
					altLink = altLink
						.replace("#", " > ")
						.replace(/ > \^\w*/, "");
					const removeEmbed =
						!isAttachment(fileName.trim()) &&
						conditionConvert.removeEmbed === "remove" &&
						isEmbedBool;
					if (isEmbedBool && conditionConvert.removeEmbed === "links" && !isAttachment(fileName.trim())) {
						isEmbed = conditionConvert.charEmbedLinks + " ";
						linkCreator = linkCreator.replace("!", isEmbed);
					}
					if (convertWikilink) {
						linkCreator = createMarkdownLinks(fileName, isEmbed, altLink, settings);
					} else {
						linkCreator = addAltForWikilinks(altMatch as RegExpMatchArray, linkCreator);
					}
					if (
						!isAttachment(fileName.trim()) &&
						!convertLinks &&
						!isEmbedBool
					) {
						linkCreator = altLink;
					}
					if (
						(!imageSettings && isAttachment(fileName.trim())) ||
						removeEmbed
					) {
						linkCreator = "";
					}
					fileContent = fileContent.replace(wikiMatch, linkCreator);
				}
			}
		}
	}
	return fileContent;
}

/**
 * If there are no altText (aka (.*)|), we create one based on the content in [[.*]], but we replace the # with >.
 * @param {RegExpMatchArray} altMatch - The match for the altText if any
 * @param {string} linkCreator - The links to edit
 */
function addAltForWikilinks(altMatch: RegExpMatchArray, linkCreator: string) {
	if (!altMatch) {
		const link = linkCreator.match(/\[{2}(.*)\]{2}/);
		/** need group 1 because group 0 is the whole match */
		const altText = link ? link[1]
			.replace("#", " > ")
			.replace(/ > \^\w*/, "")
			: "";
		return linkCreator.replace(/\[{2}(.*)\]{2}/, `[[$1|${altText}]]`);
	}
	return linkCreator;
}


function createMarkdownLinks(fileName: string, isEmbed: string, altLink: string, settings: GitHubPublisherSettings) {
	const markdownName = !isAttachment(fileName.trim())
		? fileName.replace(/#.*/, "").trim() + ".md"
		: fileName.trim();
	let anchor = fileName.match(/(#.*)/) ? fileName.match(/(#.*)/)![0]!.replaceAll(" ", "%20") : "";
	const encodedURI = encodeURI(markdownName);
	if (settings.conversion.links.slugify) {
		anchor = fileName.match(/(#.*)/) ? slugify(fileName.match(/(#.*)/)![0], { lower: true, strict: true }) : "";
		anchor = `#${anchor}`;
	}
	return `${isEmbed}[${altLink}](${encodedURI}${anchor})`;
}


/**
 * Add alt text to links
 * @param {string} link the link to add alt text to
 * @param {LinkedNotes} linkedFile the linked file
 * @returns {string} the link with alt text
 */

function addAltText(link: string, linkedFile: LinkedNotes): string {
	if (link.match(/\[{2}.*\]{2}/) && !link.match(/(\|).*(]])/)) {
		return link.replace("|", "").replace("]]", `|${linkedFile.altText}]]`);
	}
	return link;
}

/**
 * Escape special characters in a string
 * @param {string} filepath The string to escape
 * @return {string} The escaped string
 */

export function escapeRegex(filepath: string): string {
	return filepath.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Convert internal links with changing the path to the relative path in the github repository
 * @param {string} fileContent The file content
 * @param {GitHubPublisherSettings} settings Settings of the plugins
 * @param {LinkedNotes[]} linkedFiles A list of linked files including the linked file in TFile format and the linked file (string) including the alt text
 * @param {MetadataCache} metadataCache The metadata cache of the vault
 * @param {TFile} sourceFile The source file
 * @param {Vault} vault The vault
 * @param {FrontMatterCache} frontmatter The frontmatter cache
 * @param {RepoFrontmatter} sourceRepoFrontmatter The frontmatter of the source file
 * @param {FrontmatterConvert} frontmatterSettings The frontmatter settings
 * @param shortRepo
 * @return {string} the file contents with converted internal links
 */

export async function convertLinkCitation(
	fileContent: string,
	settings: GitHubPublisherSettings,
	linkedFiles: LinkedNotes[],
	metadataCache: MetadataCache,
	sourceFile: TFile,
	vault: Vault,
	frontmatter: FrontMatterCache,
	sourceRepoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	frontmatterSettings: FrontmatterConvert,
	shortRepo: Repository | null
): Promise<string> {
	if (!frontmatterSettings.convertInternalLinks) {
		return fileContent;
	}
	for (const linkedFile of linkedFiles) {
		let pathInGithub = await createRelativePath(
			sourceFile,
			linkedFile,
			metadataCache,
			settings,
			vault,
			frontmatter,
			sourceRepoFrontmatter,
			frontmatterSettings,
			shortRepo
		);
		pathInGithub = pathInGithub.replace(".md", "");
		let anchor = linkedFile.anchor ? linkedFile.anchor : "";
		let linkInMarkdown = escapeRegex(linkedFile.linkFrom.replace(anchor, "")).replaceAll(" ", "%20") + anchor.replace("^", "\\^");
		linkInMarkdown = linkInMarkdown.replaceAll(" ", "%20");
		const escapedLinkedFile = escapeRegex(linkedFile.linkFrom);


		const regexToReplace = new RegExp(
			`(\\[{2}${escapedLinkedFile}(\\\\?\\|.*)?\\]{2})|(\\[.*\\]\\((${escapedLinkedFile}|${linkInMarkdown})\\))`,
			"g"
		);
		const matchedLink = fileContent.match(regexToReplace);
		if (matchedLink) {
			for (const link of matchedLink) {
				const regToReplace = new RegExp(`((${escapedLinkedFile})|(${linkInMarkdown}))`);
				let pathInGithubWithAnchor = pathInGithub;
				if (linkedFile.anchor) {
					pathInGithub = pathInGithub.replace(/#.*/, "");
					pathInGithubWithAnchor += linkedFile.anchor;
				}
				let newLink = link.replace(regToReplace, pathInGithubWithAnchor); //strict replacement of link
				if (link.match(/\[.*\]\(.*\)/)) {
					if (linkedFile.linked.extension === "md") {
						anchor =  settings.conversion.links.slugify ? slugify(anchor, { lower: true, strict: true }) : anchor;
						pathInGithub = pathInGithub.replaceAll(" ", "%20") + ".md#" + anchor;
						//probably useless
						// pathInGithub = pathInGithub.replace(/(\.md)?(#.*)/, ".md$2");
						pathInGithub = !pathInGithub.match(/(#.*)/) && !pathInGithub.endsWith(".md") ?
							pathInGithub + ".md"
							: pathInGithub;
					}
					const altText = link.match(/\[(.*)\]/)![1];
					newLink = `[${altText}](${pathInGithub})`;
				}
				newLink = addAltText(newLink, linkedFile);
				fileContent = fileContent.replace(link, newLink);
			}
		}
	}
	return fileContent;
}

/**
 * Create the alt text for the link
 * if no alt text is given, the alt text is the filename without the extension
 * @param {RegExpMatchArray} altMatch the alt matched by the regex
 * @param {string[]} altCreator The filename split by /
 * @param {string} fileExtension the file extension
 * @param {string} match the filename matched
 * @return {string} the alt text
 */

export function creatorAltLink(
	altMatch: RegExpMatchArray,
	altCreator: string[],
	fileExtension: string,
	match: string
): string {
	if (altMatch) {
		return altMatch[0].replace("]]", "").replace("|", "");
	}
	if (fileExtension === "md") {
		return altCreator.length > 1
			? altCreator[altCreator.length - 1]
			: altCreator[0]; //alt text based on filename for markdown files
	}
	return match.split("/").at(-1) as string; //alt text based on filename for other files
}
