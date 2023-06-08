import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	RepoFrontmatter, Repository,
} from "../settings/interface";
import {
	App,
	FrontMatterCache,
	MetadataCache,
	Notice,
	parseFrontMatterTags,
	parseYaml,
	stringifyYaml,
	TFile,
	Vault,
} from "obsidian";
import { getDataviewPath } from "./file_path";
import { getAPI, Link } from "obsidian-dataview";
import { noticeLog } from "../src/utils";
import { convertLinkCitation, convertWikilinks } from "./links";
import findAndReplaceText from "./find_and_replace_text";
import GithubPublisher from "../main";
import i18next from "i18next";

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
 * @returns {Promise<string>} the converted text
 */

async function addTagsToYAML(text: string, toAdd: string[]): Promise<string> {
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
			console.log(e);
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
			console.log(e);
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
 * @param {App} app obsidian app
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {string} text the text to convert
 * @return {Promise<string>} the converted text
 */
export async function addInlineTags(
	settings: GitHubPublisherSettings,
	file: TFile,
	metadataCache: MetadataCache,
	app: App,
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
		return await addTagsToYAML(text, toAdd);
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
	const basename = (name: string) => /([^/\\.]*)(\..*)?$/.exec(name)[1];
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
	const dataviewLinks = await dvApi.page(sourceFile.path);
	const valueToAdd: string[] = [];
	for (const field of settings.conversion.tags.fields) {
		const fieldValue = dataviewLinks[field];
		if (fieldValue) {
			if (fieldValue.constructor.name === "Link") {
				const stringifyField = dataviewExtract(fieldValue, settings);
				valueToAdd.push(stringifyField);
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
		return await addTagsToYAML(text, valueToAdd.filter(Boolean));
	}
	return text;
}

/**
 * Convert dataview queries to markdown
 * Empty the block if settings.convertDataview is false or if the frontmatter key dataview is false
 * The global settings can be overrides by the frontmatter key dataview
 * @param {string} text the text to convert
 * @param {string} path the path of the file to convert
 * @param {GitHubPublisherSettings} settings the global settings
 * @param {App} app obsidian app
 * @param {MetadataCache} metadataCache the metadataCache
 * @param {FrontmatterConvert} frontmatterSettings the frontmatter settings
 * @param {FrontMatterCache} frontmatter the frontmatter cache
 * @param {TFile} sourceFile the file to process
 * @param {RepoFrontmatter|RepoFrontmatter[]} sourceFrontmatter the frontmatter of the repo
 * @param shortRepo
 * @return {Promise<string>} the converted text
 * @credits Ole Eskid Steensen
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
): Promise<string> {
	// @ts-ignore
	if (!app.plugins.enabledPlugins.has("dataview")) {
		return text;
	}
	const vault = app.vault;
	let replacedText = text;
	const dataviewRegex = /```dataview(.+?)```/gms;
	const dvApi = getAPI();
	const matches = text.matchAll(dataviewRegex);
	if (!matches) return;
	const settingsDataview = frontmatterSettings.dataview;
	for (const queryBlock of matches) {
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];
			let md = settingsDataview
				? await dvApi.tryQueryMarkdown(query, path)
				: "";
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
			replacedText = replacedText.replace(block, md);
		} catch (e) {
			noticeLog(e, settings);
			if (!queryBlock[1].match("js")) new Notice(i18next.t("error.dataview"));
			return text;
		}
	}
	return replacedText;
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
	text = findAndReplaceText(text, settings, false);
	text = await addInlineTags(
		settings,
		file,
		metadataCache,
		plugin.app,
		frontmatter,
		text
	);
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
