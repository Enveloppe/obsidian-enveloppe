import {
	App,
	FrontMatterCache,
	MetadataCache,
	parseFrontMatterTags,
	parseYaml,
	stringifyYaml,
	TFile,
} from "obsidian";

import GithubPublisher from "../main";
import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	MultiProperties,
} from "../settings/interface";
import { notif } from "../utils";
import { convertDataviewQueries } from "./compiler/dataview";
import { bakeEmbeds, convertInlineDataview } from "./compiler/embeds";
import findAndReplaceText from "./find_and_replace_text";
import { convertLinkCitation, convertWikilinks } from "./links";

/**
 * Convert soft line breaks to hard line breaks, adding two space at the end of the line.
 * This settings can be set for global or perfile using a frontmatter key 'hardbreak'
 * If both are set, the perfile setting will override the global setting.
 * If neither are set, the default is false.
 * @param {string} text the text to convert
 * @param {GitHubPublisherSettings} settings the global settings
 * @param {frontmatter} frontmatter the perfile frontmatter settings
 * @returns {string} the converted text
 */

export function addHardLineBreak(
	text: string,
	settings: GitHubPublisherSettings,
	frontmatter: FrontmatterConvert
): string {
	try {
		text = text.replace(/^\s*\\\s*$/gim, "<br/>");
		if (frontmatter.hardbreak) {
			text = text.replace(/\n/gm, "  \n");
		}
		return text;
	} catch (e) {
		notif({ settings, e: true }, e);
		return text;
	}
}

/**
 * Add the string list to the YAML frontmatter tags key
 * If the tags key does not exist, it will be created
 * @param {string} text the text to convert
 * @param {string[]} toAdd the list of tags to add
 * @param settings
 * @returns {Promise<string>} the converted text
 */

export async function addTagsToYAML(text: string, toAdd: string[], settings: GitHubPublisherSettings): Promise<string> {
	const yaml = text.split("---")[1];
	const yamlObject = parseYaml(yaml);
	if (yamlObject.tag) {
		try {
			toAdd = [
				...new Set([
					...toAdd,
					...yamlObject.tag.map((tag: string) =>
						tag.replaceAll("/", "_")
					),
				]),
			];
			delete yamlObject.tag;
		} catch (e) {
			notif({ settings, e: true }, e);
		}
	}
	if (yamlObject.tags) {
		try {
			yamlObject.tags = [
				...new Set([
					...yamlObject.tags.map((tag: string) =>
						tag.replaceAll("/", "_")
					),
					...toAdd,
				]),
			];
		} catch (e) {
			notif({ settings, e: true }, e);
		}
	} else {
		yamlObject.tags = toAdd;
	}
	const returnToYaml = stringifyYaml(yamlObject);
	const fileContentsOnly = text.split("---").slice(2).join("---");
	return `---\n${returnToYaml}---\n${fileContentsOnly}`;
}

/**
 * Add inlines tags to frontmatter tags keys.
 * Duplicate tags will be removed.
 * @param {GitHubPublisherSettings} settings the global settings
 * @param {TFile} file the file to process
 * @param {MetadataCache} metadataCache the metadataCache
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {string} text the text to convert
 * @return {Promise<string>} the converted text
 */
export async function addInlineTags(
	settings: GitHubPublisherSettings,
	file: TFile,
	metadataCache: MetadataCache,
	frontmatter: FrontMatterCache | undefined | null,
	text: string
): Promise<string> {
	if (!settings.conversion.tags.inline) {
		return text;
	}
	const inlineTags = metadataCache.getFileCache(file)?.tags;
	const inlineTagsInText = inlineTags
		? inlineTags.map((t) => t.tag.replace("#", "").replaceAll("/", "_"))
		: [];
	const frontmatterTags = parseFrontMatterTags(frontmatter);

	const yamlTags = frontmatterTags
		? frontmatterTags.map((t) => t.replace("#", "").replaceAll("/", "_"))
		: [];
	const toAdd = [...new Set([...inlineTagsInText, ...yamlTags])];
	if (toAdd.length > 0) {
		return await addTagsToYAML(text, toAdd, settings);
	}
	return text;
}


/**
 * Main function to convert the text
*/

export async function mainConverting(
	text: string,
	file: TFile,
	app: App,
	frontmatter: FrontMatterCache | undefined | null,
	linkedFiles: LinkedNotes[],
	plugin: GithubPublisher,
	properties: MultiProperties,

): Promise<string> {
	if (properties.frontmatter.general.removeEmbed === "bake")
		text = await bakeEmbeds(file, new Set(), app, properties, null, linkedFiles);
	text = findAndReplaceText(text, properties.settings, false);
	text = await addInlineTags(properties.settings, file, plugin.app.metadataCache, frontmatter, text);
	text = await convertLinkCitation(
		text,
		linkedFiles,
		file,
		app,
		frontmatter,
		properties
	);
	text = convertWikilinks(text, properties.frontmatter.general, linkedFiles, properties.settings);
	text = await convertDataviewQueries(
		text,
		file.path,
		plugin.app,
		frontmatter,
		file,
		properties
	);
	text = await convertInlineDataview(text, properties.settings, file, plugin.app);
	text = addHardLineBreak(text, properties.settings, properties.frontmatter.general);

	return findAndReplaceText(text, properties.settings, true);
}
