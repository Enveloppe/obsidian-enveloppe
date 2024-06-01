/**
 * @credit oleeskild
 * @link https://github.com/oleeskild/obsidian-digital-garden/blob/main/src/compiler/DataviewCompiler.ts
 */

import type {
	EnveloppeSettings,
	LinkedNotes,
	MultiProperties,
	PropertiesConversion,
} from "@interfaces";
import i18next from "i18next";
import { Component, type FrontMatterCache, htmlToMarkdown, TFile } from "obsidian";
import {
	type DataviewApi,
	getAPI,
	isPluginEnabled,
	type Literal,
} from "obsidian-dataview";
import {
	convertToInternalGithub,
	convertWikilinks,
	escapeRegex,
} from "src/conversion/links";
import type Enveloppe from "src/main";

class DataviewCompiler {
	settings: EnveloppeSettings;
	properties: MultiProperties;
	path: string;
	dvApi: DataviewApi;
	sourceText: string;

	constructor(
		settings: EnveloppeSettings,
		properties: MultiProperties,
		path: string,
		dvApi: DataviewApi,
		sourceText: string
	) {
		this.settings = settings;
		this.properties = properties;
		this.path = path;
		this.dvApi = dvApi;
		this.sourceText = sourceText;
	}

	dvJsMatch() {
		const dataviewJsPrefix = this.dvApi.settings.dataviewJsKeyword || "dataviewjs";
		const dataViewJsRegex = new RegExp(
			`\`\`\`${escapeRegex(dataviewJsPrefix)}\\s(.+?)\`\`\``,
			"gsm"
		);
		return this.sourceText.matchAll(dataViewJsRegex);
	}

	dvInlineQueryMatches() {
		const inlineQueryPrefix = this.dvApi.settings.inlineQueryPrefix || "=";
		const inlineDataViewRegex = new RegExp(
			`\`${escapeRegex(inlineQueryPrefix)}(.+?)\``,
			"gsm"
		);
		return this.sourceText.matchAll(inlineDataViewRegex);
	}

	dvInlineJSMatches() {
		const inlineJsQueryPrefix = this.dvApi.settings.inlineJsQueryPrefix || "$=";
		const inlineJsDataViewRegex = new RegExp(
			`\`${escapeRegex(inlineJsQueryPrefix)}(.+?)\``,
			"gsm"
		);
		return this.sourceText.matchAll(inlineJsDataViewRegex);
	}

	matches() {
		return {
			dataviewJsMatches: this.dvJsMatch(),
			inlineMatches: this.dvInlineQueryMatches(),
			inlineJsMatches: this.dvInlineJSMatches(),
		};
	}
	/**
	 * DQL Dataview - The SQL-like Dataview Query Language
	 * Are in **code blocks**
	 * @link https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/#dataview-query-language-dql
	 */
	async dataviewDQL(query: string) {
		const { isInsideCallout, finalQuery } = sanitizeQuery(query);
		const markdown = removeDataviewQueries(
			(await this.dvApi.tryQueryMarkdown(finalQuery, this.path)) as string,
			this.properties.frontmatter.general
		);
		if (isInsideCallout) {
			return surroundWithCalloutBlock(markdown);
		}
		return markdown;
	}
	/**
	 * DataviewJS - JavaScript API for Dataview
	 * Are in **CODE BLOCKS**
	 * @link https://blacksmithgu.github.io/obsidian-dataview/api/intro/
	 */
	async dataviewJS(query: string) {
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		const div = createEl("div");
		const component = new Component();
		await this.dvApi.executeJs(query, div, component, this.path);
		component.load();
		return removeDataviewQueries(div.innerHTML, this.properties.frontmatter.general);
	}

	/**
	 * Inline DQL Dataview - The SQL-like Dataview Query Language in inline
	 * Syntax : `= query`
	 * (the prefix can be changed in the settings)
	 * @source https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/#inline-dql
	 */

	async inlineDQLDataview(query: string) {
		const dataviewResult = this.dvApi.evaluateInline(query, this.path);
		if (dataviewResult.successful) {
			return removeDataviewQueries(
				dataviewResult.value,
				this.properties.frontmatter.general
			);
		} else {
			return removeDataviewQueries(
				this.dvApi.settings.renderNullAs,
				this.properties.frontmatter.general
			);
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
	async inlineDataviewJS(query: string) {
		const evaluateQuery = `
				const query = ${query};
				dv.paragraph(query);
			`;
		// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
		const div = createEl("div");
		const component = new Component();
		await this.dvApi.executeJs(evaluateQuery, div, component, this.path);
		component.load();
		return removeDataviewQueries(
			htmlToMarkdown(div.innerHTML),
			this.properties.frontmatter.general
		);
	}
}

/**
 * Convert dataview queries to markdown
 * Empty the block if settings.convertDataview is false or if the frontmatter key dataview is false
 * The global settings can be overrides by the frontmatter key dataview
 * Also convert links using convertDataviewLinks
 * @author Ole Eskid Steensen
 * @link https://github.com/oleeskild/obsidian-digital-garden/blob/main/src/compiler/DataviewCompiler.ts
 */

export async function convertDataviewQueries(
	text: string,
	path: string,
	frontmatter: FrontMatterCache | undefined | null,
	sourceFile: TFile,
	properties: MultiProperties
): Promise<string> {
	const plugin = properties.plugin;
	const app = plugin.app;
	const settings = plugin.settings;
	let replacedText = text;
	const dataViewRegex = /```dataview\s(.+?)```/gms;
	const isDataviewEnabled = app.plugins.plugins.dataview;
	if (!isDataviewEnabled || !isPluginEnabled(app)) return replacedText;
	const dvApi = getAPI(app);
	if (!dvApi || dvApi === undefined) return replacedText;
	const matches = text.matchAll(dataViewRegex);
	const compiler = new DataviewCompiler(settings, properties, path, dvApi, text);
	const { dataviewJsMatches, inlineMatches, inlineJsMatches } = compiler.matches();

	if (!matches && !inlineMatches && !dataviewJsMatches && !inlineJsMatches) {
		plugin.console.logs({}, "No dataview queries found");
		return replacedText;
	}
	const error = i18next.t("error.dataview");

	/**
	 * DQL Dataview - The SQL-like Dataview Query Language
	 */
	for (const queryBlock of matches) {
		try {
			const block = queryBlock[0];
			const markdown = await compiler.dataviewDQL(queryBlock[1]);
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			plugin.console.logs({ e: true }, e);
			plugin.console.notif({}, error);
			return queryBlock[0];
		}
	}

	for (const queryBlock of dataviewJsMatches) {
		try {
			const block = queryBlock[0];
			const markdown = await compiler.dataviewJS(queryBlock[1]);
			replacedText = replacedText.replace(block, markdown);
		} catch (e) {
			plugin.console.logs({ e: true }, e);
			plugin.console.notif({}, error);
			return queryBlock[0];
		}
	}

	//Inline queries
	for (const inlineQuery of inlineMatches) {
		try {
			const code = inlineQuery[0];
			const query = inlineQuery[1].trim();
			const markdown = await compiler.inlineDQLDataview(query);
			replacedText = replacedText.replace(code, markdown);
		} catch (e) {
			plugin.console.logs({ e: true }, e);
			plugin.console.notif({}, error);
			return inlineQuery[0];
		}
	}

	for (const inlineJsQuery of inlineJsMatches) {
		try {
			const code = inlineJsQuery[0];
			const markdown = await compiler.inlineDataviewJS(inlineJsQuery[1].trim());
			replacedText = replacedText.replace(code, markdown);
		} catch (e) {
			plugin.console.logs({ e: true }, e);
			plugin.console.notif({}, error);
			return inlineJsQuery[0];
		}
	}
	return await convertDataviewLinks(replacedText, frontmatter, sourceFile, properties);
}

/**
 * Remove dataview queries from text
 * @param dataviewMarkdown string the dataview converted in markdown
 * @param {PropertiesConversion} frontmatterSettings the settings
 * @return {string} the text without dataview queries or the dataview queries in markdown
 */
function removeDataviewQueries(
	dataviewMarkdown: Literal,
	frontmatterSettings: PropertiesConversion
): string {
	const toStr = dataviewMarkdown?.toString();
	return frontmatterSettings.dataview && dataviewMarkdown && toStr ? toStr : "";
}

/**
 * Wrapper to prevent writing 15 lines of code every time
 */
async function convertDataviewLinks(
	md: string,
	frontmatter: FrontMatterCache | undefined | null,
	sourceFile: TFile,
	properties: MultiProperties
): Promise<string> {
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
		properties.plugin,
		frontmatter
	);
}

/**
 * Get the dataview path from a markdown file
 */
export function getDataviewPath(markdown: string, plugin: Enveloppe): LinkedNotes[] {
	const { settings } = plugin;
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
					type: "link",
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
function sanitizeQuery(query: string): { isInsideCallout: boolean; finalQuery: string } {
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
	const finalQuery = isInsideCallout ? sanitized.join("\n") : query;
	return { isInsideCallout, finalQuery };
}

/**
 * Surround the text with a callout block
 * @param input {string} The text to surround
 * @returns {string} The text surrounded with a callout block
 */
function surroundWithCalloutBlock(input: string): string {
	const tmp = input.split("\n");

	return ` ${tmp.join("\n> ")}`;
}
