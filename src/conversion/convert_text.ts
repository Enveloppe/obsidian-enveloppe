import {
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

export function addToYaml(text: string, toAdd: string[], plugin: GithubPublisher, folderNoteParaMeters: { properties: MultiProperties | null, file: TFile}): string {
	const { settings, app } = plugin;
	const frontmatter = app.metadataCache.getFileCache(folderNoteParaMeters.file);
	let yamlObject = stringifyYaml(frontmatter?.frontmatter);
	try {
		if (yamlObject && toAdd.length > 0) {
			yamlObject = tagsToYaml(toAdd, settings, yamlObject);
		}
		if (folderNoteParaMeters?.properties) {
			yamlObject = titleToYaml(yamlObject, folderNoteParaMeters.properties, folderNoteParaMeters.file);
		}
		
		if (Object.keys(yamlObject).length > 0) {
			//check if valid yaml
			const returnToYaml = stringifyYaml(yamlObject);
			parseYaml(returnToYaml);
			if (yamlObject) {
				const fileContentsOnly = text.split("---").slice(2).join("---");
				return `---\n${returnToYaml}---\n${fileContentsOnly}`;
			} else return `---\n${returnToYaml}---\n${text}`;
		}
	} catch (e) {
		return text; //not a valid yaml, skipping
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
	file: TFile,
	frontmatter: FrontMatterCache | undefined | null,
	text: string,
	plugin: GithubPublisher,
	multiProperties: MultiProperties
): Promise<string> {
	const { settings, app } = plugin;
	const metadataCache = app.metadataCache;
	const toAdd = inlineTags(settings, file, metadataCache, frontmatter);
	const folderNoteParaMeters = { properties: multiProperties, file };
	return addToYaml(text, toAdd, plugin, folderNoteParaMeters);
}


/**
 * Main function to convert the text
*/

export async function mainConverting(
	text: string,
	file: TFile,
	frontmatter: FrontMatterCache | undefined | null,
	linkedFiles: LinkedNotes[],
	plugin: GithubPublisher,
	properties: MultiProperties,

): Promise<string> {
	if (properties.frontmatter.general.removeEmbed === "bake")
		text = await bakeEmbeds(file, new Set(), plugin, properties, null, linkedFiles);
	text = findAndReplaceText(text, plugin.settings, false);
	text = await processYaml(file, frontmatter, text, plugin, properties);
	text = await convertToInternalGithub(
		text,
		linkedFiles,
		file,
		plugin,
		frontmatter,
		properties
	);
	text = convertWikilinks(text, properties.frontmatter.general, linkedFiles, plugin.settings, frontmatter);
	text = await convertDataviewQueries(
		text,
		file.path,
		plugin,
		frontmatter,
		file,
		properties
	);
	text = await convertInlineDataview(text, plugin, file);
	text = addHardLineBreak(text, plugin.settings, properties.frontmatter.general);

	return findAndReplaceText(text, plugin.settings, true);
}


