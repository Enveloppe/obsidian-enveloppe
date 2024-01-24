import {
	App,
	FrontMatterCache,
	MetadataCache,
	parseFrontMatterTags,
	parseYaml,
	stringifyYaml,
	TFile,
} from "obsidian";
import { isFolderNote } from "src/utils/data_validation_test";

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
import { convertToInternalGithub, convertWikilinks } from "./links";

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

//eslint-disable-next-line @typescript-eslint/no-explicit-any
function tagsToYaml(toAdd: string[], settings: GitHubPublisherSettings, yaml: any) {
	if (yaml.tag) {
		try {
			toAdd = [
				...new Set([
					...toAdd,
					...yaml.tag.map((tag: string) =>
						tag.replaceAll("/", "_")
					),
				]),
			];
			delete yaml.tag;
		} catch (e) {
			notif({ settings, e: true }, e);
		}
	}
	if (yaml.tags) {
		try {
			yaml.tags = [
				...new Set([
					...yaml.tags.map((tag: string) =>
						tag.replaceAll("/", "_")
					),
					...toAdd,
				]),
			];
		} catch (e) {
			notif({ settings, e: true }, e);
		}
	} else {
		yaml.tags = toAdd;
	}
	return yaml;
}

/**
 * Add the string list to the YAML frontmatter tags key
 * If the tags key does not exist, it will be created
 * @param {string} text the text to convert
 * @param {string[]} toAdd the list of tags to add
 * @param settings
 * @returns {Promise<string>} the converted text
 */

export function addToYaml(text: string, toAdd: string[], settings: GitHubPublisherSettings, folderNoteParaMeters?: { properties: MultiProperties, file: TFile}): string {
	const yaml = text.split("---")?.[1];
	let yamlObject = yaml ? parseYaml(yaml) : {};
	if (yamlObject && toAdd.length > 0) {
		yamlObject = tagsToYaml(toAdd, settings, yamlObject);
	}
	if (folderNoteParaMeters) {
		yamlObject = titleToYaml(yamlObject, folderNoteParaMeters.properties, folderNoteParaMeters.file);
	}
	if (Object.keys(yamlObject).length > 0) {
		const returnToYaml = stringifyYaml(yamlObject);
		if (yaml){
			const fileContentsOnly = text.split("---").slice(2).join("---");
			return `---\n${returnToYaml}---\n${fileContentsOnly}`;
		} else return `---\n${returnToYaml}---\n${text}`;
	}
	return text;
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
function titleToYaml(yaml: any, properties: MultiProperties, file: TFile) {
	const settings = properties.settings.upload.folderNote.addTitle;
	if (!settings) {
		return yaml;
	}
	if (!yaml[settings.key] && isFolderNote(properties) && settings.enable) {
		yaml[settings.key] = file.basename;
	}
	return yaml;
}

function inlineTags(settings: GitHubPublisherSettings, file: TFile, metadataCache: MetadataCache, frontmatter: FrontMatterCache | undefined | null) {
	if (!settings.conversion.tags.inline) {
		return [];
	}
	const inlineTags = metadataCache.getFileCache(file)?.tags;
	const inlineTagsInText = inlineTags
		? inlineTags.map((t) => t.tag.replace("#", "").replaceAll("/", "_"))
		: [];
	const frontmatterTags = parseFrontMatterTags(frontmatter);

	const yamlTags = frontmatterTags
		? frontmatterTags.map((t) => t.replace("#", "").replaceAll("/", "_"))
		: [];
	return [...new Set([...inlineTagsInText, ...yamlTags])];
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
export async function processYaml(
	settings: GitHubPublisherSettings,
	file: TFile,
	metadataCache: MetadataCache,
	frontmatter: FrontMatterCache | undefined | null,
	text: string,
	multiProperties: MultiProperties
): Promise<string> {
	const toAdd = inlineTags(settings, file, metadataCache, frontmatter);
	const folderNoteParaMeters = { properties: multiProperties, file };
	return addToYaml(text, toAdd, settings, folderNoteParaMeters);
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
		text = await bakeEmbeds(file, new Set(), plugin, properties, null, linkedFiles);
	text = findAndReplaceText(text, properties.settings, false);
	text = await processYaml(properties.settings, file, plugin.app.metadataCache, frontmatter, text, properties);
	text = await convertToInternalGithub(
		text,
		linkedFiles,
		file,
		plugin,
		frontmatter,
		properties
	);
	text = convertWikilinks(text, properties.frontmatter.general, linkedFiles, properties.settings, frontmatter);
	text = await convertDataviewQueries(
		text,
		file.path,
		plugin,
		frontmatter,
		file,
		properties
	);
	text = await convertInlineDataview(text, properties.settings, file, plugin.app);
	text = addHardLineBreak(text, properties.settings, properties.frontmatter.general);

	return findAndReplaceText(text, properties.settings, true);
}


