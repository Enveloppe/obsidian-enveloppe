import i18next from "i18next";
import {
	FrontMatterCache,
	MetadataCache,
	Notice,
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
import { convertToInternalGithub, convertWikilinks, escapeRegex } from "./links";

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
	const properties = folderNoteParaMeters?.properties;
	if (!properties || (!properties.plugin.settings.conversion.tags.inline && !properties.plugin.settings.upload.folderNote.addTitle)) 
		return text;
	const { settings, app } = plugin;
	const frontmatter = app.metadataCache.getFileCache(folderNoteParaMeters.file);
	let yamlObject = parseYaml(stringifyYaml(frontmatter?.frontmatter ?? {}));
	const yamlRegex = new RegExp(`---\n${escapeRegex(stringifyYaml(frontmatter?.frontmatter))}---\n`, "g");
	try {
		if (yamlObject && toAdd.length > 0) {
			yamlObject = tagsToYaml(toAdd, settings, yamlObject);
		}
		if (folderNoteParaMeters?.properties) {
			yamlObject = titleToYaml(yamlObject, folderNoteParaMeters.properties, folderNoteParaMeters.file);
		}
		if (yamlObject && Object.keys(yamlObject).length > 0) {
			//check if valid yaml
			const returnToYaml = stringifyYaml(yamlObject);
			return text.replace(yamlRegex, `---\n${returnToYaml}---\n`);
		}
	} catch (e) {
		new Notice(i18next.t("error.parseYaml"));
		return text; //not a valid yaml, skipping
	}
	new Notice(i18next.t("error.parseYaml"));
	return text;
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	properties: MultiProperties,

): Promise<string> {
	const { plugin } = properties;
	if (properties.frontmatter.general.removeEmbed === "bake")
		text = await bakeEmbeds(file, new Set(), properties, null, linkedFiles);
	text = await processYaml(file, frontmatter, text, properties);
	text = findAndReplaceText(text, plugin.settings, false);
	text = await convertToInternalGithub(
		text,
		linkedFiles,
		file,
		frontmatter,
		properties
	);
	text = convertWikilinks(text, properties.frontmatter.general, linkedFiles, plugin.settings, frontmatter);
	text = await convertDataviewQueries(
		text,
		file.path,
		frontmatter,
		file,
		properties
	);
	text = await convertInlineDataview(text, plugin, file);
	text = addHardLineBreak(text, plugin.settings, properties.frontmatter.general);

	return findAndReplaceText(text, plugin.settings, true);
}


