import type {
	EnveloppeSettings,
	LinkedNotes,
	MultiProperties,
	PropertiesConversion,
} from "@interfaces";
import type { FrontMatterCache, TFile } from "obsidian";
import slugify from "slugify";
import {
	createRelativePath,
	linkIsInFormatter,
	textIsInFrontmatter,
} from "src/conversion/file_path";
import { replaceText } from "src/conversion/find_and_replace_text";
import { isAttachment, noTextConversion } from "src/utils/data_validation_test";
import type Enveloppe from "../main";

type IsEmbed = {
	cond: boolean;
	char: string;
};

/**
 * Convert wikilinks to markdown links
 * Pretty cursed
 * @param {string} fileContent the text to convert
 * @param {PropertiesConversion} conditionConvert  the frontmatter settings
 * @param {EnveloppeSettings} settings  global settings
 * @param {LinkedNotes[]} linkedFiles the list of linked files
 * @return {string} the converted text
 */

export function convertWikilinks(
	fileContent: string,
	conditionConvert: PropertiesConversion,
	linkedFiles: LinkedNotes[],
	plugin: Enveloppe,
	sourceFrontmatter: FrontMatterCache | undefined | null
): string {
	if (noTextConversion(conditionConvert)) return fileContent;
	const settings = plugin.settings;
	const wikiRegex = /!?\[\[.*?\]\]/g;
	const wikiMatches = fileContent.match(wikiRegex);
	if (wikiMatches) {
		const fileRegex = /(\[\[).*?([\]|])/;
		for (const wikiMatch of wikiMatches) {
			const fileMatch = wikiMatch.match(fileRegex);
			const isEmbedBool = wikiMatch.startsWith("!");
			const isEmbed: IsEmbed = {
				cond: isEmbedBool,
				char: isEmbedBool ? "!" : "",
			};
			if (fileMatch) {
				const path = filepath(fileMatch[0]);
				const fileName = sanitizeStrictFileName(fileMatch[0]);
				const linkedFile = linkedFiles.find(
					(item) => item.linkFrom.replace(/#.*/, "") === fileName
				);
				const isNotAttachment = !isAttachment(
					fileName.trim(),
					settings.embed.unHandledObsidianExt
				);

				if (linkedFile && !linkIsInFormatter(linkedFile, sourceFrontmatter)) {
					fileContent = isLinkedFile(
						linkedFile,
						conditionConvert,
						isEmbed,
						plugin,
						isNotAttachment,
						fileContent,
						wikiMatch,
						path
					);
				} else if (
					!path.startsWith("http") &&
					!textIsInFrontmatter(path, sourceFrontmatter)
				) {
					fileContent = strictStringConversion(
						isEmbed,
						isNotAttachment,
						wikiMatch,
						path,
						conditionConvert,
						plugin,
						fileContent
					);
				}
			}
		}
	}
	return fileContent;
}

/**
 * We need to sanitize the file to gain the filepath
 * ! Note: Anchor are conservated
 * @param {string} link the link to sanitize
 */
function filepath(link: string) {
	return link
		.replaceAll("[", "")
		.replaceAll("|", "")
		.replaceAll("]", "")
		.replaceAll("\\", "");
}
/**
 * In order to compare linked files with files that we have cached in
 * memory, we have sanitize their link name to matching.
 *
 * For example, if we have a [[./wikilink.md|My Incredible Link Title]],
 * we want to match `wikilink.md` with the cached files we have in
 * memory. In this case, we'd strip [[, | and ./ to have wikilink.md as
 * result.
 * ! Note : It remove the `#anchor` too!
 */
function sanitizeStrictFileName(link: string) {
	return link
		.replaceAll("[", "")
		.replaceAll("|", "")
		.replaceAll("]", "")
		.replaceAll("\\", "")
		.replaceAll("../", "")
		.replaceAll("./", "")
		.replace(/#.*/, "");
}

/**
 * Convert the link to a markdown link using the linked notes from the Obsidian API
 * @param linkedFile the file connected to the link
 * @param conditionConvert the frontmatter settings
 * @param isEmbed the embed and if it is an embed
 * @param settings the global settings of the plugin
 * @param isNotAttachment if the file linked is **not** an attachment
 * @param fileContent the file content to convert
 * @param wikiMatch the match for the wikilink
 * @param fileName the file name to convert to a markdown link
 * @returns {string} the converted text
 */
function isLinkedFile(
	linkedFile: LinkedNotes,
	conditionConvert: PropertiesConversion,
	isEmbed: IsEmbed,
	plugin: Enveloppe,
	isNotAttachment: boolean,
	fileContent: string,
	wikiMatch: string,
	fileName: string
): string {
	let altText: string;
	let linkCreator = wikiMatch;
	const settings = plugin.settings;
	if (linkedFile.linked.extension === "md") {
		altText = linkedFile.altText ? linkedFile.altText : linkedFile.linked.basename;
		altText = altText.replace("#", " > ").replace(/ > \^\w*/, "");
	} else altText = linkedFile.altText ? linkedFile.altText : "";

	const removeEmbed =
		(conditionConvert.removeEmbed === "remove" ||
			conditionConvert.removeEmbed === "bake") &&
		isEmbed.cond &&
		linkedFile.linked.extension === "md";
	if (
		isEmbed.cond &&
		linkedFile.linked.extension === "md" &&
		conditionConvert.removeEmbed === "links"
	) {
		isEmbed.char = `${conditionConvert.charEmbedLinks} `;
		linkCreator = wikiMatch.replace("!", isEmbed.char);
	}
	if (conditionConvert.convertWiki) {
		const altMatch = wikiMatch.match(/(\|).*(]])/);
		const altCreator = fileName.split("/");
		let altLink = creatorAltLink(
			altMatch as RegExpMatchArray,
			altCreator,
			fileName.split(".").at(-1) as string,
			fileName
		);

		altLink = altLink.replace("#", " > ").replace(/ > \^\w*/, "");
		linkCreator = createMarkdownLinks(fileName, isEmbed.char, altLink, settings);
	} else {
		const altMatch = wikiMatch.match(/(\|).*(]])/);
		linkCreator = addAltForWikilinks(altMatch as RegExpMatchArray, linkCreator);
	}
	if (linkedFile.linked.extension === "md" && !conditionConvert.links && !isEmbed.cond)
		linkCreator = altText;
	if ((!conditionConvert.attachment && !isNotAttachment) || removeEmbed) linkCreator = "";

	return replaceText(fileContent, wikiMatch, linkCreator, plugin, true);
}
/**
 * Will strictly convert the the links without a found linked notes (usefull when links are already edited using the markdown conversion or regex)
 * @param {IsEmbed} isEmbed if the link is an embed link
 * @param {boolean} isNotAttachment if the file linked is **not** an attachment
 * @param {string} wikiMatch the match for the wikilink
 * @param {string} fileName  the file name to convert to a markdown link
 * @param {PropertiesConversion} conditionConvert the frontmatter settings
 * @param {EnveloppeSettings} settings the global settings
 * @param {string} fileContent the file content to convert
 * @returns {string} the converted text
 */
function strictStringConversion(
	isEmbed: IsEmbed,
	isNotAttachment: boolean,
	wikiMatch: string,
	fileName: string,
	conditionConvert: PropertiesConversion,
	plugin: Enveloppe,
	fileContent: string
): string {
	const altMatch = wikiMatch.match(/(\|).*(]])/);
	const altCreator = fileName.split("/");

	let altLink = creatorAltLink(
		altMatch as RegExpMatchArray,
		altCreator,
		fileName.split(".").at(-1) as string,
		fileName
	);
	altLink = altLink.replace("#", " > ").replace(/ > \^\w*/, "");
	const removeEmbed =
		isNotAttachment && conditionConvert.removeEmbed === "remove" && isEmbed.cond;
	let linkCreator = wikiMatch;
	if (isEmbed.cond && conditionConvert.removeEmbed === "links" && isNotAttachment) {
		isEmbed.char = `${conditionConvert.charEmbedLinks} `;
		linkCreator = linkCreator.replace("!", isEmbed.char);
	}
	const settings = plugin.settings;
	linkCreator = conditionConvert.convertWiki
		? createMarkdownLinks(fileName, isEmbed.char, altLink, settings)
		: addAltForWikilinks(altMatch as RegExpMatchArray, linkCreator);
	if (isNotAttachment && !conditionConvert.links && !isEmbed.cond) {
		linkCreator = altLink;
	}
	if ((!conditionConvert.attachment && !isNotAttachment) || removeEmbed) {
		linkCreator = "";
	}
	return replaceText(fileContent, wikiMatch, linkCreator, plugin, true);
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
		const altText = link ? link[1].replace("#", " > ").replace(/ > \^\w*/, "") : "";
		return linkCreator.replace(/\[{2}(.*)\]{2}/, `[[$1|${altText}]]`);
	}
	return linkCreator;
}

/**
 * Convert the link to a markdown link
 * Will sluggify the anchor by removing and readding it to the link
 * @param fileName the file name to convert to a markdown link
 * @param isEmbed the embed character
 * @param altLink the alias
 * @param settings the global settings
 * @returns {string} the converted markdown link
 */
function createMarkdownLinks(
	fileName: string,
	isEmbed: string,
	altLink: string,
	settings: EnveloppeSettings
): string {
	const markdownName = isAttachment(fileName.trim(), settings.embed.unHandledObsidianExt)
		? fileName.trim()
		: `${fileName.replace(/#.*/, "").trim()}.md`;
	const anchorMatch = fileName.match(/(#.*)/);
	let anchor = anchorMatch ? anchorMatch[0] : null;
	const encodedUri = encodeURI(markdownName);
	anchor = slugifyAnchor(anchor, settings);
	return `${isEmbed}[${altLink}](${encodedUri}${anchor})`;
}

/**
 * Slugify the anchor based on the settings
 * @param anchor {string | null} the anchor to slugify
 * @param settings {EnveloppeSettings}
 * @returns {string} the slugified anchor
 */
function slugifyAnchor(anchor: string | null, settings: EnveloppeSettings): string {
	const slugifySetting =
		typeof settings.conversion.links.slugify === "string"
			? settings.conversion.links.slugify
			: "disable";
	if (anchor && slugifySetting !== "disable") {
		switch (settings.conversion.links.slugify) {
			case "lower":
				return anchor.toLowerCase().replaceAll(" ", "-");
			case "strict":
				return `#${slugify(anchor, { lower: true, strict: true })}`;

			default:
				return anchor;
		}
	}
	return anchor?.replaceAll(" ", "%20") ?? "";
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
 * @param {string} fileContent the text to convert
 * @param {LinkedNotes[]} linkedFiles the list of linked files in the file, include any internal links
 * @param {TFile} sourceFile the file to convert
 * @param {FrontMatterCache | undefined | null} frontmatter the frontmatter of the source file
 * @param {MultiProperties} properties the properties of the source file
 * @return {string} the converted text
 */
export async function convertToInternalGithub(
	fileContent: string,
	linkedFiles: LinkedNotes[],
	sourceFile: TFile,
	frontmatter: FrontMatterCache | undefined | null,
	properties: MultiProperties
): Promise<string> {
	const frontmatterSettings = properties.frontmatter.general;
	const settings = properties.plugin.settings;
	if (!frontmatterSettings.convertInternalLinks) return fileContent;

	for (const linkedFile of linkedFiles) {
		let pathInGithub = await createRelativePath(
			sourceFile,
			linkedFile,
			frontmatter,
			properties
		);
		pathInGithub = pathInGithub.replace(".md", "");
		let anchor = linkedFile.anchor ? linkedFile.anchor : "";
		let linkInMarkdown =
			escapeRegex(linkedFile.linkFrom.replace(anchor, "")).replaceAll(" ", "%20") +
			anchor.replace("^", "\\^");
		linkInMarkdown = linkInMarkdown.replaceAll(" ", "%20");
		const escapedLinkedFile = escapeRegex(linkedFile.linkFrom);
		const regexToReplace = new RegExp(
			`(\\[{2}${escapedLinkedFile}(\\\\?\\|.*?)?\\]{2})|(\\[.*?\\]\\((${escapedLinkedFile}|${linkInMarkdown})\\))`,
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

				let newLink = link.replace(regToReplace, pathInGithubWithAnchor);
				if (link.match(/\[.*\]\(.*\)/)) {
					if (
						linkedFile.linked.extension === "md" &&
						!linkedFile.linked.name.includes("excalidraw")
					) {
						anchor = slugifyAnchor(anchor, settings);
						pathInGithub = `${pathInGithub.replaceAll(" ", "%20")}.md#${anchor}`;
						pathInGithub =
							!pathInGithub.match(/(#.*)/) && !pathInGithub.endsWith(".md")
								? `${pathInGithub}.md`
								: pathInGithub;
					}
					const altText = link.match(/\[(.*)\]/)![1];
					newLink = `[${altText}](${encodeURI(pathInGithub)})`; //encode to URI for compatibility with github
				}
				newLink = addAltText(newLink, linkedFile);
				fileContent = replaceText(fileContent, link, newLink, properties.plugin, true);
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
		return altCreator.length > 1 ? altCreator[altCreator.length - 1] : altCreator[0]; //alt text based on filename for markdown files
	}
	return match.split("/").at(-1) as string; //alt text based on filename for other files
}
