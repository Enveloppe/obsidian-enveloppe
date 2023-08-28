import i18next from "i18next";
import {
	App,
	Component,
	FrontMatterCache,
	MetadataCache,
	Notice,
	parseFrontMatterTags,
	parseYaml,
	stringifyYaml,
	TFile,
} from "obsidian";
import {getAPI, Link} from "obsidian-dataview";

import GithubPublisher from "../main";
import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	MultiProperties,
} from "../settings/interface";
import {logs} from "../utils";
import {bakeEmbeds} from "./bakeEmbed";
import {getDataviewPath} from "./file_path";
import findAndReplaceText from "./find_and_replace_text";
import {convertLinkCitation, convertWikilinks, escapeRegex} from "./links";

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
		logs(settings, e);
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

async function addTagsToYAML(text: string, toAdd: string[], settings: GitHubPublisherSettings): Promise<string> {
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
			logs(settings, e);
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
			logs(settings, e);
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
 * stringify the dataview link by extracting the value from the link
 * extract the alt text if it exists, otherwise extract the filename
 * return null if the alt text or the filename is excluded
 * @param {Link} fieldValue the dataview link
 * @param {GitHubPublisherSettings} settings the global settings
 * @return {string | null} the display text by dataview
 */
function dataviewExtract(fieldValue: Link, settings: GitHubPublisherSettings): string | null {
	const basename = (name: string) => /([^/\\.]*)(\..*)?$/.exec(name)![1];
	const filename = basename(fieldValue.path).toString();
	const display = fieldValue.display
		? fieldValue.display.toString()
		: filename;
	if (
		!settings.conversion.tags.exclude.includes(display) &&
		!settings.conversion.tags.fields.includes(filename)
	) {
		return display;
	}
	return null;
}

/**
 * Add inlines dataview or frontmatter keys to the tags key in the frontmatter
 * Will be recursive for array
 * stringify with extract alt text for links
 * @param {string} text the text to convert
 * @param {GitHubPublisherSettings} settings the global settings
 * @param {TFile} sourceFile the file to process
 * @param {App} app obsidian app
 * @return {Promise<string>} the converted text
 */

export async function convertInlineDataview(
	text: string,
	settings: GitHubPublisherSettings,
	sourceFile: TFile,
	app: App
): Promise<string> {
	// @ts-ignore
	if (
		settings.conversion.tags.fields.length === 0 ||
		// @ts-ignore
		!app.plugins.enabledPlugins.has("dataview")
	) {
		return text;
	}
	const dvApi = getAPI();
	if (!dvApi) {
		return text;
	}
	const dataviewLinks = dvApi.page(sourceFile.path);
	if (!dataviewLinks) {
		return text;
	}
	const valueToAdd: string[] = [];
	for (const field of settings.conversion.tags.fields) {
		const fieldValue = dataviewLinks[field];
		if (fieldValue) {
			if (fieldValue.constructor.name === "Link") {
				const stringifyField = dataviewExtract(fieldValue, settings);
				if (stringifyField) valueToAdd.push(stringifyField);
			} else if (fieldValue.constructor.name === "Array") {
				for (const item of fieldValue) {
					let stringifyField = item;
					if (item.constructor.name === "Link") {
						stringifyField = dataviewExtract(item, settings);
						valueToAdd.push(stringifyField);
					} else if (
						!settings.conversion.tags.exclude.includes(
							stringifyField.toString()
						)
					) {
						valueToAdd.push(stringifyField.toString());
					}
				}
			} else if (
				!settings.conversion.tags.exclude.includes(fieldValue.toString())
			) {
				valueToAdd.push(fieldValue.toString());
			}
		}
	}
	if (valueToAdd.length > 0) {
		return await addTagsToYAML(text, valueToAdd.filter(Boolean), settings);
	}
	return text;
}

/**
 * Convert dataview queries to markdown
 * Empty the block if settings.convertDataview is false or if the frontmatter key dataview is false
 * The global settings can be overrides by the frontmatter key dataview
 * Also convert links using convertDataviewLinks
 * @param {string} text the text to convert
 * @param {string} path the path of the file to convert
 * @param {App} app obsidian app
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {TFile} sourceFile the file to process
 * @param {MultiProperties} properties the properties of the plugins (settings, repository, frontmatter)
 * @returns {Promise<string>} the converted text
 * @author Ole Eskid Steensen
 * @link https://github.com/oleeskild/obsidian-digital-garden/blob/4cdf2791e24b2a0c2a30e7d39965b7b9b50e2ab0/src/Publisher.ts#L297
 */

export async function convertDataviewQueries(
	text: string,
	path: string,
	app: App,
	frontmatter: FrontMatterCache | undefined | null,
	sourceFile: TFile,
	properties: MultiProperties,
): Promise<string> {
	let replacedText = text;
	const dataViewRegex = /```dataview\s(.+?)```/gsm;
	const dvApi = getAPI();
	if (!dvApi) return replacedText;
	const matches = text.matchAll(dataViewRegex);

	const dataviewJsPrefix = dvApi.settings.dataviewJsKeyword;
	const dataViewJsRegex = new RegExp(`\`\`\`${escapeRegex(dataviewJsPrefix)}\\s(.+?)\`\`\``, "gsm");
	const dataviewJsMatches = text.matchAll(dataViewJsRegex);

	const inlineQueryPrefix = dvApi.settings.inlineQueryPrefix;
	const inlineDataViewRegex = new RegExp(`\`${escapeRegex(inlineQueryPrefix)}(.+?)\``, "gsm");
	const inlineMatches = text.matchAll(inlineDataViewRegex);

	const inlineJsQueryPrefix = dvApi.settings.inlineJsQueryPrefix;
	const inlineJsDataViewRegex = new RegExp(`\`${escapeRegex(inlineJsQueryPrefix)}(.+?)\``, "gsm");
	const inlineJsMatches = text.matchAll(inlineJsDataViewRegex);
	if (!matches && !inlineMatches && !dataviewJsMatches && !inlineJsMatches) {
		logs(properties.settings, "No dataview queries found");
		return replacedText;
	}
	const error = i18next.t("error.dataview");

	//Code block queries
	for (const queryBlock of matches) {
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];
			const markdown = removeDataviewQueries(await dvApi.tryQueryMarkdown(query, path) as string, properties.frontmatter.general);
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			console.error(e);
			new Notice(error);
			return queryBlock[0];
		}
	}

	for (const queryBlock of dataviewJsMatches) {
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];

			const div = createEl("div");
			const component = new Component();
			await dvApi.executeJs(query, div, component, path);
			component.load();
			const markdown = removeDataviewQueries(div.innerHTML, properties.frontmatter.general);
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			console.error(e);
			new Notice(error);
			return queryBlock[0];
		}
	}

	//Inline queries
	for (const inlineQuery of inlineMatches) {
		try {
			const code = inlineQuery[0];
			const query = inlineQuery[1].trim();
			const dataviewResult = dvApi.tryEvaluate(query, { this: dvApi.page(path, sourceFile.path) });
			replacedText = dataviewResult ? replacedText.replace(code, removeDataviewQueries(dataviewResult.toString(), properties.frontmatter.general)) : replacedText.replace(code, removeDataviewQueries(dvApi.settings.renderNullAs, properties.frontmatter.general));
		} catch (e) {
			console.error(e);
			new Notice(error);
			return inlineQuery[0];
		}
	}

	for (const inlineJsQuery of inlineJsMatches) {
		try {
			const code = inlineJsQuery[0];
			const query = inlineJsQuery[1].trim();

			const div = createEl("div");
			const component = new Component();
			await dvApi.executeJs(query, div, component, path);
			component.load();
			const markdown = removeDataviewQueries(div.innerHTML, properties.frontmatter.general);
			replacedText = replacedText.replace(code, markdown);

		} catch (e) {
			console.error(e);
			new Notice(error);
			return inlineJsQuery[0];
		}
	}
	return await convertDataviewLinks(replacedText, frontmatter, sourceFile, app, properties);
}

/**
 * Remove dataview queries from text
 * @param dataviewMarkdown : string the dataview converted in markdown
 * @param {@link FrontmatterConvert} frontmatterSettings the settings
 * @return {string} the text without dataview queries or the dataview queries in markdown
 */
function removeDataviewQueries(dataviewMarkdown: string, frontmatterSettings: FrontmatterConvert): string {
	return frontmatterSettings.dataview ? dataviewMarkdown : "";
}

/**
 * Wrapper to prevent writing 15 lines of code every time
 */
async function convertDataviewLinks(
	md:string,
	frontmatter: FrontMatterCache | undefined | null,
	sourceFile: TFile,
	app: App,
	properties: MultiProperties): Promise<string> {
	const dataviewPath = getDataviewPath(md, properties.settings, app.vault);
	md = await convertLinkCitation(
		md,
		dataviewPath,
		sourceFile,
		app,
		frontmatter,
		properties
	);
	return convertWikilinks(
		md,
		properties.frontmatter.general,
		dataviewPath,
		properties.settings
	);
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
