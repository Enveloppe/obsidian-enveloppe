import { FrontMatterCache, MetadataCache, TFile, Vault } from "obsidian";
import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	RepoFrontmatter,
} from "../settings/interface";
import { createRelativePath } from "./filePathConvertor";
import { isAttachment } from "../src/utils";

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
	settings: GitHubPublisherSettings,
	linkedFiles: LinkedNotes[]
): string {
	const convertWikilink = conditionConvert.convertWiki;
	const imageSettings = conditionConvert.attachment;
	const embedSettings = conditionConvert.embed;
	const convertLinks = conditionConvert.links;
	if (
		!convertWikilink &&
		convertLinks &&
		imageSettings &&
		embedSettings &&
		!conditionConvert.removeEmbed
	) {
		return fileContent;
	}
	const wikiRegex = /!?\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(\[\[).*?([\]|])/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			const isEmbed = wikiMatch.startsWith("!") ? "!" : "";
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
					.replaceAll("./", "");
				//get last from path
				const linkedFile = linkedFiles.find(
					(item) => item.linkFrom === StrictFileName
				);
				if (linkedFile) {
					let altText: string;
					if (linkedFile.linked.extension !== "md") {
						altText =
							linkedFile.altText.length > 0
								? linkedFile.altText
								: "";
					} else {
						altText =
							linkedFile.altText.length > 0
								? linkedFile.altText
								: linkedFile.linked.basename;
					}
					const removeEmbed =
						conditionConvert.removeEmbed &&
						isEmbedBool &&
						linkedFile.linked.extension === "md";
					if (convertWikilink) {
						let linkDestination = linkedFile.linkFrom;

						/**
						 * In case there's a frontmatter configuration, `filename`, its
						 * value will set the destination path for the file. In the linked
						 * file has that, it means we need to use that path for the links.
						 *
						 * This verification makes sure we're using it. If we don't have the
						 * frontmatter set, then use the regular file path.
						 */
						if (linkedFile.destinationFilePath) {
							linkDestination = linkedFile.destinationFilePath;
						}
						linkCreator = `${isEmbed}[${altText}](${encodeURI(
							linkDestination
						)})`;
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

					const altLink = creatorAltLink(
						altMatch,
						altCreator,
						fileName.split(".").at(-1),
						fileName
					);
					const removeEmbed =
						!isAttachment(fileName.trim()) &&
						conditionConvert.removeEmbed &&
						isEmbedBool;
					if (convertWikilink) {
						const markdownName = !isAttachment(fileName.trim())
							? fileName.trim() + ".md"
							: fileName.trim();
						linkCreator = `${isEmbed}[${altLink}](${encodeURI(
							markdownName
						)})`;
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
 * Add alt text to links
 * @param {string} link the link to add alt text to
 * @param {LinkedNotes} linkedFile the linked file
 * @returns {string} the link with alt text
 */

function addAltText(link: string, linkedFile: LinkedNotes): string {
	if (!link.match(/(\|).*(]])/)) {
		return link.replace("|", "").replace("]]", `|${linkedFile.altText}]]`);
	}
	return link;
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
	frontmatterSettings: FrontmatterConvert
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
			frontmatterSettings
		);
		pathInGithub = pathInGithub.replace(".md", "");

		const regexToReplace = new RegExp(
			`(\\[{2}${linkedFile.linkFrom}(\\\\?\\|.*)?\\]{2})|(\\[.*\\]\\((${linkedFile.linkFrom}|${encodeURI(linkedFile.linkFrom)})\\))`,
			"g"
		);
		const matchedLink = fileContent.match(regexToReplace);
		if (matchedLink) {
			for (const link of matchedLink) {
				const regToReplace = new RegExp(`((${linkedFile.linkFrom})|(${encodeURI(linkedFile.linkFrom.replace(".md", ""))}))`);
				const block_link = linkedFile.linkFrom.match(/#.*/);
				if (block_link) {
					pathInGithub = pathInGithub.replace(/#.*/, "");
					pathInGithub += block_link[0];
				}

				let newLink = link.replace(regToReplace, pathInGithub); //strict replacement of link
				if (link.match(/\[.*\]\(.*\)/)) {
					//only replace in ()
					if (linkedFile.linked.extension === "md") {
						pathInGithub = pathInGithub.replace(/(\.md)?(#\w+)/, ".md$2");
						pathInGithub = !pathInGithub.match(/#\w+/) && !pathInGithub.endsWith(".md") ?
							pathInGithub + ".md"
							: pathInGithub;
					}
					newLink = `[${linkedFile.altText.length > 0 ? linkedFile.altText : linkedFile.linked.basename}](${encodeURI(pathInGithub)})`;
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
	return match.split("/").at(-1); //alt text based on filename for other files
}
