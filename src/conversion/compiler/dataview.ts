/**
 * @credit oleeskild
 * @link https://github.com/oleeskild/obsidian-digital-garden/blob/main/src/compiler/DataviewCompiler.ts
 */

import i18next from "i18next";
import { Component, FrontMatterCache, htmlToMarkdown,TFile } from "obsidian";
import { getAPI, isPluginEnabled,Literal, Success } from "obsidian-dataview";
import GithubPublisher from "src/main";
import { logs, notif } from "src/utils";

import { FrontmatterConvert, LinkedNotes, MultiProperties } from "../../interfaces";
import { convertToInternalGithub, convertWikilinks, escapeRegex } from "../links";

/**
 * Convert dataview queries to markdown
 * Empty the block if settings.convertDataview is false or if the frontmatter key dataview is false
 * The global settings can be overrides by the frontmatter key dataview
 * Also convert links using convertDataviewLinks
 * @param {string} text the text to convert
 * @param {string} path the path of the file to convert
 * @param {GithubPublisher} plugin GithubPublisher plugin
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
	frontmatter: FrontMatterCache | undefined | null,
	sourceFile: TFile,
	properties: MultiProperties,
): Promise<string> {
	const plugin = properties.plugin;
	const app = plugin.app;
	const settings = plugin.settings;
	let replacedText = text;
	const dataViewRegex = /```dataview\s(.+?)```/gsm;
	const isDataviewEnabled = app.plugins.plugins.dataview;
	if (!isDataviewEnabled || !isPluginEnabled(app)) return replacedText;
	const dvApi = getAPI();
	if (!dvApi) return replacedText;
	const matches = text.matchAll(dataViewRegex);

	const dataviewJsPrefix = dvApi.settings.dataviewJsKeyword || "dataviewjs";
	const dataViewJsRegex = new RegExp(`\`\`\`${escapeRegex(dataviewJsPrefix)}\\s(.+?)\`\`\``, "gsm");
	const dataviewJsMatches = text.matchAll(dataViewJsRegex);

	const inlineQueryPrefix = dvApi.settings.inlineQueryPrefix || "=";
	const inlineDataViewRegex = new RegExp(`\`${escapeRegex(inlineQueryPrefix)}(.+?)\``, "gsm");
	const inlineMatches = text.matchAll(inlineDataViewRegex);

	const inlineJsQueryPrefix = dvApi.settings.inlineJsQueryPrefix ||"$=";
	const inlineJsDataViewRegex = new RegExp(`\`${escapeRegex(inlineJsQueryPrefix)}(.+?)\``, "gsm");
	const inlineJsMatches = text.matchAll(inlineJsDataViewRegex);
	if (!matches && !inlineMatches && !dataviewJsMatches && !inlineJsMatches) {
		logs({ settings }, "No dataview queries found");
		return replacedText;
	}
	const error = i18next.t("error.dataview");

	/**
	 * DQL Dataview - The SQL-like Dataview Query Language
	 * Are in **code blocks**
	 * @link https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/#dataview-query-language-dql
	*/
	for (const queryBlock of matches) {
		try {
			const block = queryBlock[0];
			const query = queryBlock[1];
			const {isInsideCallout, finalQuery} = sanitizeQuery(query);
			let markdown = removeDataviewQueries(await dvApi.tryQueryMarkdown(finalQuery, path) as string, properties.frontmatter.general);
			if (isInsideCallout) {
				markdown = surroundWithCalloutBlock(markdown);
			}
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			logs({ settings, e: true }, e);
			notif({ settings }, error);
			return queryBlock[0];
		}
	}

	/**
	 * DataviewJS - JavaScript API for Dataview
	 * Are in **CODE BLOCKS**
	 * @link https://blacksmithgu.github.io/obsidian-dataview/api/intro/
	 */
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
			logs({ settings, e: true }, e);
			notif({ settings }, error);
			return queryBlock[0];
		}
	}

	//Inline queries

	/**
	 * Inline DQL Dataview - The SQL-like Dataview Query Language in inline
	 * Syntax : `= query`
	 * (the prefix can be changed in the settings)
	 * @source https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/#inline-dql
	*/
	for (const inlineQuery of inlineMatches) {
		try {
			const code = inlineQuery[0];
			const query = inlineQuery[1].trim();
			let dataviewResult = dvApi.evaluateInline(query, path);
			if (dataviewResult.successful) {
				dataviewResult = dataviewResult as Success<Literal, string>;
				replacedText = replacedText.replace(code, removeDataviewQueries(dataviewResult.value, properties.frontmatter.general));
			} else {
				replacedText = replacedText.replace(code, removeDataviewQueries(dvApi.settings.renderNullAs, properties.frontmatter.general));
			}
		} catch (e) {
			logs({ settings, e: true }, e);
			notif({ settings }, error);
			return inlineQuery[0];
		}
	}

	/**
	 * Inline DataviewJS - JavaScript API for Dataview in inline
	 * Syntax : `$=js query`
	 * For the moment, it is not possible to properly process the inlineJS.
	 * Temporary solution : encapsulate the query into "pure" JS :
	 * ```ts
	 * const query = queryFound;
	 * dv.paragraph(query);
	 * ```
	 * After the evaluation, the div is converted to markdown with {@link htmlToMarkdown()} and the dataview queries are removed
	 */
	for (const inlineJsQuery of inlineJsMatches) {
		try {
			const code = inlineJsQuery[0];
			const query = inlineJsQuery[1].trim();
			const evaluateQuery = `
				const query = ${query};
				dv.paragraph(query);
			`;
			const div = createEl("div");
			const component = new Component();
			await dvApi.executeJs(evaluateQuery, div, component, path);
			component.load();
			const markdown = removeDataviewQueries(htmlToMarkdown(div.innerHTML), properties.frontmatter.general);
			replacedText = replacedText.replace(code, markdown);
		} catch (e) {
			logs({ settings, e: true }, e);
			notif({ settings }, error);
			return inlineJsQuery[0];
		}
	}
	return await convertDataviewLinks(replacedText, frontmatter, sourceFile, properties);
}

/**
 * Remove dataview queries from text
 * @param dataviewMarkdown : string the dataview converted in markdown
 * @param {@link FrontmatterConvert} frontmatterSettings the settings
 * @return {string} the text without dataview queries or the dataview queries in markdown
 */
function removeDataviewQueries(dataviewMarkdown: Literal, frontmatterSettings: FrontmatterConvert): string {
	const toString = dataviewMarkdown?.toString();
	return frontmatterSettings.dataview && dataviewMarkdown && toString ? toString : "";
}

/**
 * Wrapper to prevent writing 15 lines of code every time
 * @param {string} md the text to convert
 * @param {FrontMatterCache | undefined | null} frontmatter the frontmatter cache
 * @param {TFile} sourceFile the file to process
 * @param {GithubPublisher} plugin obsidian app
 * @param {MultiProperties} properties the properties of the plugins (settings, repository, frontmatter)
 * @returns {Promise<string>} the converted text
 */
async function convertDataviewLinks(
	md: string,
	frontmatter: FrontMatterCache | undefined | null,
	sourceFile: TFile,
	properties: MultiProperties): Promise<string> {

	const dataviewPath = getDataviewPath(md, properties.plugin);
	md = await convertToInternalGithub(
		md,
		dataviewPath,
		sourceFile,
		frontmatter,
		properties
	);	
	return convertWikilinks(
		md,
		properties.frontmatter.general,
		dataviewPath,
		properties.plugin.settings,
		frontmatter
	);
}

/**
 * Get the dataview path from a markdown file
 * @param {string} markdown Markdown file content
 * @param {GitHubPublisherSettings} settings Settings
 * @param {Vault} vault Vault
 * @returns {LinkedNotes[]} Array of linked notes
 */

export function getDataviewPath(
	markdown: string,
	plugin: GithubPublisher
): LinkedNotes[] {
	const { settings} = plugin;
	const vault = plugin.app.vault;
	if (!settings.conversion.dataview) {
		return [];
	}
	const wikiRegex = /\[\[(.*?)\]\]/gim;
	const wikiMatches = markdown.matchAll(wikiRegex);
	const linkedFiles: LinkedNotes[] = [];
	if (!wikiMatches) return [];
	if (wikiMatches) {
		for (const wikiMatch of wikiMatches) {
			const altText = wikiMatch[1].replace(/(.*)\\?\|/i, "");
			const linkFrom = wikiMatch[1].replace(/\\?\|(.*)/, "");
			const linked =
				vault.getAbstractFileByPath(linkFrom) instanceof TFile
					? (vault.getAbstractFileByPath(linkFrom) as TFile)
					: null;
			if (linked) {
				linkedFiles.push({
					linked,
					linkFrom,
					altText,
					type: "link"
				});
			}
		}
	}
	return linkedFiles;
}

/**
 * Allow to sanitize the query if it is inside a callout block
 * @param query {string} The query to sanitize
 * @returns {isInsideCallout: boolean, finalQuery: string}
 */
function sanitizeQuery(query: string): {isInsideCallout: boolean, finalQuery: string} {
	let isInsideCallout = false;
	const parts = query.split("\n");
	const sanitized = [];

	for (const part of parts) {
		if (part.startsWith(">")) {
			isInsideCallout = true;
			sanitized.push(part.substring(1).trim());
		} else {
			sanitized.push(part);
		}
	}
	let finalQuery = query;
	if (isInsideCallout) {
		finalQuery = sanitized.join("\n");
	}
	return {isInsideCallout, finalQuery};
}

/**
 * Surround the text with a callout block
 * @param input {string} The text to surround
 * @returns {string} The text surrounded with a callout block
 */
function surroundWithCalloutBlock(input: string): string {
	const tmp = input.split("\n");

	return " " + tmp.join("\n> ");
}