/**
 * @credit oleeskild
 * @link https://github.com/oleeskild/obsidian-digital-garden/blob/main/src/compiler/DataviewCompiler.ts
 */

import i18next from "i18next";
import { App, Component, FrontMatterCache, htmlToMarkdown,TFile, Vault } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { FrontmatterConvert, GitHubPublisherSettings, LinkedNotes, MultiProperties } from "src/settings/interface";
import { logs, notif } from "src/utils";

import { convertLinkCitation, convertWikilinks, escapeRegex } from "../links";

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
		logs({ settings: properties.settings }, "No dataview queries found");
		return replacedText;
	}
	const error = i18next.t("error.dataview");

	//Code block queries
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
			logs({ settings: properties.settings, e: true }, e);
			notif({ settings: properties.settings }, error);
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
			logs({ settings: properties.settings, e: true }, e);
			notif({ settings: properties.settings }, error);
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
			logs({ settings: properties.settings, e: true }, e);
			notif({ settings: properties.settings }, error);
			return inlineQuery[0];
		}
	}

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
			logs({ settings: properties.settings, e: true }, e);
			notif({ settings: properties.settings }, error);
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
	md: string,
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
 * Get the dataview path from a markdown file
 * @param {string} markdown Markdown file content
 * @param {GitHubPublisherSettings} settings Settings
 * @param {Vault} vault Vault
 * @returns {LinkedNotes[]} Array of linked notes
 */

export function getDataviewPath(
	markdown: string,
	settings: GitHubPublisherSettings,
	vault: Vault
): LinkedNotes[] {
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

function sanitizeQuery(query: string) {
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

function surroundWithCalloutBlock(input: string): string {
	const tmp = input.split("\n");

	return " " + tmp.join("\n> ");
}