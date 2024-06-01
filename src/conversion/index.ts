import type {
	EnveloppeSettings,
	LinkedNotes,
	MultiProperties,
	PropertiesConversion,
} from "@interfaces";
import i18next from "i18next";
import {
	type FrontMatterCache,
	getFrontMatterInfo,
	type MetadataCache,
	Notice,
	parseFrontMatterTags,
	parseYaml,
	stringifyYaml,
	type TFile,
} from "obsidian";
import { convertDataviewQueries } from "src/conversion/compiler/dataview";
import { bakeEmbeds, convertInlineDataview } from "src/conversion/compiler/embeds";
import { convertToInternalGithub, convertWikilinks } from "src/conversion/links";
import type Enveloppe from "src/main";
import { isFolderNote } from "src/utils/data_validation_test";

import findAndReplaceText from "./find_and_replace_text";

/**
 * Convert soft line breaks to hard line breaks, adding two space at the end of the line.
 * This settings can be set for global or perfile using a frontmatter key 'hardbreak'
 * If both are set, the perfile setting will override the global setting.
 * If neither are set, the default is false.
 * @param {string} text the text to convert
 * @param {EnveloppeSettings} settings the global settings
 * @param {frontmatter} frontmatter the perfile frontmatter settings
 * @returns {string} the converted text
 */

export function addHardLineBreak(
	text: string,
	plugin: Enveloppe,
	frontmatter: PropertiesConversion
): string {
	try {
		text = text.replace(/^\s*\\\s*$/gim, "<br/>");
		if (frontmatter.hardbreak) {
			text = text.replace(/\n/gm, "  \n");
		}
		return text;
	} catch (e) {
		plugin.console.notif({ e: true }, e);
		return text;
	}
}

function tagsToYaml(toAdd: string[], plugin: Enveloppe, yaml: any) {
	if (yaml.tag) {
		try {
			toAdd = [
				...new Set([
					...toAdd,
					...yaml.tag.map((tag: string) => tag.replaceAll("/", "_")),
				]),
			];
			delete yaml.tag;
		} catch (e) {
			plugin.console.notif({ e: true }, e);
		}
	}
	if (yaml.tags) {
		try {
			yaml.tags = [
				...new Set([
					...yaml.tags.map((tag: string) => tag.replaceAll("/", "_")),
					...toAdd,
				]),
			];
		} catch (e) {
			plugin.console.notif({ e: true }, e);
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

export function addToYaml(
	text: string,
	toAdd: string[],
	folderNoteParaMeters: { properties: MultiProperties | null; file: TFile }
): string {
	const properties = folderNoteParaMeters?.properties;
	const { contentStart, exists, frontmatter } = getFrontMatterInfo(text);
	if (
		!properties ||
		(!properties.plugin.settings.conversion.tags.inline &&
			!properties.plugin.settings.upload.folderNote.addTitle)
	)
		return text;
	let yamlObject = parseYaml(exists ? frontmatter : "{}");
	try {
		if (yamlObject && toAdd.length > 0) {
			yamlObject = tagsToYaml(toAdd, properties.plugin, yamlObject);
		}
		if (folderNoteParaMeters?.properties) {
			yamlObject = titleToYaml(
				yamlObject,
				folderNoteParaMeters.properties,
				folderNoteParaMeters.file
			);
		}
		if (yamlObject && Object.keys(yamlObject).length > 0) {
			return `---\n${stringifyYaml(yamlObject)}---\n${
				exists ? text.slice(contentStart) : text
			}`;
		}
	} catch (_e) {
		new Notice(i18next.t("error.parseYaml"));
		return text; //not a valid yaml, skipping
	}
	new Notice(i18next.t("error.parseYaml"));
	return text;
}

function titleToYaml(yaml: any, properties: MultiProperties, file: TFile) {
	const settings = properties.plugin.settings.upload.folderNote.addTitle;
	if (!settings) {
		return yaml;
	}
	if (!yaml[settings.key] && isFolderNote(properties) && settings.enable) {
		yaml[settings.key] = file.basename;
	}
	return yaml;
}

function inlineTags(
	settings: EnveloppeSettings,
	file: TFile,
	metadataCache: MetadataCache,
	frontmatter: FrontMatterCache | undefined | null
) {
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
 * @param {TFile} file the file to process
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {string} text the text to convert
 * @return {Promise<string>} the converted text
 */
export async function processYaml(
	file: TFile,
	frontmatter: FrontMatterCache | undefined | null,
	text: string,
	multiProperties: MultiProperties
): Promise<string> {
	const { plugin } = multiProperties;
	const { settings, app } = plugin;
	const metadataCache = app.metadataCache;
	const toAdd = inlineTags(settings, file, metadataCache, frontmatter);
	const folderNoteParaMeters = { properties: multiProperties, file };
	return addToYaml(text, toAdd, folderNoteParaMeters);
}

/**
 * Main function to convert the text
 */

export async function mainConverting(
	text: string,
	file: TFile,
	frontmatter: FrontMatterCache | undefined | null,
	linkedFiles: LinkedNotes[],
	properties: MultiProperties
): Promise<string> {
	const { plugin } = properties;
	if (properties.frontmatter.general.removeEmbed === "bake")
		text = await bakeEmbeds(file, new Set(), properties, null, linkedFiles);
	text = findAndReplaceText(text, plugin, false);
	text = await processYaml(file, frontmatter, text, properties);
	text = await convertToInternalGithub(text, linkedFiles, file, frontmatter, properties);
	text = convertWikilinks(
		text,
		properties.frontmatter.general,
		linkedFiles,
		plugin,
		frontmatter
	);
	text = await convertDataviewQueries(text, file.path, frontmatter, file, properties);
	text = await convertInlineDataview(text, plugin, file);
	text = addHardLineBreak(text, plugin, properties.frontmatter.general);

	return findAndReplaceText(text, plugin, true);
}
