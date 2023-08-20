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
	Vault
} from "obsidian";
import {getAPI, Link} from "obsidian-dataview";

import GithubPublisher from "../main";
import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	RepoFrontmatter,
	Repository,
} from "../settings/interface";
import {log, noticeLog} from "../utils";
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
		noticeLog(e, settings);
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
			noticeLog(e, settings);
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
			noticeLog(e, settings);
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
	frontmatter: FrontMatterCache,
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
function dataviewExtract(fieldValue: Link, settings: GitHubPublisherSettings) {
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
) {
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
 * @param {@link GitHubPublisherSettings} settings the global settings
 * @param {App} app obsidian app
 * @param {MetadataCache} metadataCache the metadataCache
 * @param {FrontmatterConvert} frontmatterSettings the frontmatter settings
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {TFile} sourceFile the file to process
 * @param {RepoFrontmatter|RepoFrontmatter[]} sourceFrontmatter the frontmatter of the repo
 * @param shortRepo
 * @return {Promise<string>} the converted text
 * @credits Ole Eskid Steensen
 * @source https://github.com/oleeskild/obsidian-digital-garden/blob/4cdf2791e24b2a0c2a30e7d39965b7b9b50e2ab0/src/Publisher.ts#L297
 */

export async function convertDataviewQueries(
	text: string,
	path: string,
	settings: GitHubPublisherSettings,
	app: App,
	metadataCache: MetadataCache,
	frontmatterSettings: FrontmatterConvert,
	frontmatter: FrontMatterCache,
	sourceFile: TFile,
	sourceFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	shortRepo: Repository | null
) {
	let replacedText = text;
	const dataViewRegex = /```dataview\s(.+?)```/gsm;
	const dvApi = getAPI();
	if (!dvApi) return replacedText;
	const matches = text.matchAll(dataViewRegex);

	const dataviewJsPrefix = dvApi.settings.dataviewJsKeyword;
	const dataViewJsRegex = new RegExp("```" + escapeRegex(dataviewJsPrefix) + "\\s(.+?)```", "gsm");
	const dataviewJsMatches = text.matchAll(dataViewJsRegex);

	const inlineQueryPrefix = dvApi.settings.inlineQueryPrefix;
	const inlineDataViewRegex = new RegExp("`" + escapeRegex(inlineQueryPrefix) + "(.+?)`", "gsm");
	const inlineMatches = text.matchAll(inlineDataViewRegex);

	const inlineJsQueryPrefix = dvApi.settings.inlineJsQueryPrefix;
	const inlineJsDataViewRegex = new RegExp("`" + escapeRegex(inlineJsQueryPrefix) + "(.+?)`", "gsm");
	const inlineJsMatches = text.matchAll(inlineJsDataViewRegex);
	if (!matches && !inlineMatches && !dataviewJsMatches && !inlineJsMatches) {
		log("No dataview queries found");
		return replacedText;
	}
	const error = i18next.t("error.dataview");

	//Code block queries
	for (const queryBlock of matches) {
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];
			const markdown = removeDataviewQueries(await dvApi.tryQueryMarkdown(query, path) as string, frontmatterSettings);
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			console.log(e);
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
			const markdown = removeDataviewQueries(div.innerHTML, frontmatterSettings);
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			console.log(e);
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
			if (dataviewResult) {
				replacedText = replacedText.replace(code, removeDataviewQueries(dataviewResult.toString(), frontmatterSettings));
			} else {
				replacedText = replacedText.replace(code, removeDataviewQueries(dvApi.settings.renderNullAs, frontmatterSettings));
			}
		} catch (e) {
			console.log(e);
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
			const markdown = removeDataviewQueries(div.innerHTML, frontmatterSettings);
			replacedText = replacedText.replace(code, markdown);

		} catch (e) {
			console.log(e);
			new Notice(error);
			return inlineJsQuery[0];
		}
	}
	return await convertDataviewLinks(replacedText, app.vault, settings, metadataCache, frontmatterSettings, frontmatter, sourceFile, sourceFrontmatter, shortRepo);
}

/**
 * Remove dataview queries from text
 * @param dataviewMarkdown : string the dataview converted in markdown
 * @param {@link FrontmatterConvert} frontmatterSettings the settings
 * @return {string} the text without dataview queries or the dataview queries in markdown
 */
function removeDataviewQueries(dataviewMarkdown: string, frontmatterSettings: FrontmatterConvert): string {
	const settingsDataview = frontmatterSettings.dataview;
	if (!settingsDataview) return "";
	else return dataviewMarkdown;
}

/**
 * Wrapper to prevent writing 15 lines of code every time
 * @param {string} md the markdown to convert
 * @param {Vault} vault the vault
 * @param {@link GitHubPublisherSettings} settings the settings
 * @param {MetadataCache} metadataCache the metadata cache
 * @param {FrontmatterConvert} frontmatterSettings the frontmatter settings
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {TFile} sourceFile the source file
 * @param {RepoFrontmatter | RepoFrontmatter[]} sourceFrontmatter the source frontmatter
 * @param {Repository | null} shortRepo the short repo
 * @return {Promise<string>} the converted markdown
 */
async function convertDataviewLinks(
	md:string,
	vault: Vault,
	settings: GitHubPublisherSettings,
	metadataCache: MetadataCache,
	frontmatterSettings: FrontmatterConvert,
	frontmatter: FrontMatterCache,
	sourceFile: TFile,
	sourceFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	shortRepo: Repository | null): Promise<string> {
	const dataviewPath = getDataviewPath(md, settings, vault);
	md = await convertLinkCitation(
		md,
		settings,
		dataviewPath,
		metadataCache,
		sourceFile,
		vault,
		frontmatter,
		sourceFrontmatter,
		frontmatterSettings,
		shortRepo
	);
	md = convertWikilinks(
		md,
		frontmatterSettings,
		dataviewPath,
		settings
	);
	return md;
}



/**
 * Main function to convert the text
 * @param {string} text the text to convert
 * @param {GitHubPublisherSettings} settings the global settings
 * @param {FrontmatterConvert} frontmatterSettings the frontmatter settings
 * @param {TFile} file the file to convert
 * @param {App} app obsidian app
 * @param {MetadataCache} metadataCache the metadataCache
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {LinkedNotes[]} linkedFiles the linked files
 * @param {GitHubPublisherSettings} plugin GithubPublisher plugin
 * @param {RepoFrontmatter|RepoFrontmatter[]} sourceRepo the frontmatter of the repo
 * @param {Vault} vault app.vault
 * @param shortRepo
 * @return {Promise<string>} the converted text
 */

export async function mainConverting(
	text: string,
	settings: GitHubPublisherSettings,
	frontmatterSettings: FrontmatterConvert,
	file: TFile,
	app: App,
	metadataCache: MetadataCache,
	frontmatter: FrontMatterCache,
	linkedFiles: LinkedNotes[],
	plugin: GithubPublisher,
	vault: Vault,
	sourceRepo: RepoFrontmatter | RepoFrontmatter[],
	shortRepo: Repository | null
): Promise<string> {
	if (settings.embed.convertEmbedToLinks === "bake")
		text = await bakeEmbeds(file, new Set(), app, shortRepo, settings, null, true);
	text = findAndReplaceText(text, settings, false);
	text = await addInlineTags(settings, file, metadataCache, frontmatter, text);
	text = await convertDataviewQueries(
		text,
		file.path,
		settings,
		plugin.app,
		metadataCache,
		frontmatterSettings,
		frontmatter,
		file,
		sourceRepo,
		shortRepo
	);
	text = await convertInlineDataview(text, settings, file, plugin.app);
	text = addHardLineBreak(text, settings, frontmatterSettings);
	text = await convertLinkCitation(
		text,
		settings,
		linkedFiles,
		metadataCache,
		file,
		vault,
		frontmatter,
		sourceRepo,
		frontmatterSettings,
		shortRepo
	);
	text = convertWikilinks(text, frontmatterSettings, linkedFiles, settings);
	text = findAndReplaceText(text, settings, true);

	return text;
}
