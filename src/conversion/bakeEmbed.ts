/**
 * The majority of the code was taken from obsidian-easy-bake
 * @credit mgmeyers
 * @source https://github.com/mgmeyers/obsidian-easy-bake
 * @license GPL-3.0
 * Each function is modified to fit the needs of this plugin, but citation are done in the code for each function
 */

import {
	App,
	BlockSubpathResult,
	CachedMetadata,
	HeadingSubpathResult,
	parseLinktext,
	resolveSubpath,
	TFile} from "obsidian";

import {
	GitHubPublisherSettings,
	LinkedNotes,
	MultiProperties} from "../settings/interface";
import {isShared} from "../utils/data_validation_test";
import { createRelativePath, getTitleField, regexOnFileName } from "./file_path";


/**
 * Apply the indent to the text
 * @credit mgmeyers - easy bake plugin
 * @source https://github.com/mgmeyers/obsidian-easy-bake/blob/master/src/BakeModal.ts
 * @param {string} text
 * @param {string} indent
 * @return {string}
 */
function applyIndent(text: string, indent?: string) {
	if (!indent) return text;
	return text.trim().replace(/(\r?\n)/g, `$1${indent}`);
}

/**
 * Strip the first bullet from the string
 * @credit mgmeyers - easy bake plugin
 * @source https://github.com/mgmeyers/obsidian-easy-bake/blob/master/src/BakeModal.ts
 * @param {string} text the text to convert
 * @return {string}
 */
function stripFirstBullet(text: string) {
	return text.replace(/^[ \t]*(?:[-*+]|[0-9]+[.)]) +/, "");
}

/**
 * Dedent the string
 * @credit mgmeyers - easy bake plugin
 * @source https://github.com/mgmeyers/obsidian-easy-bake/blob/master/src/util.ts
 * @param {string} text
 * @return {string}
 */
function dedent(text: string) {
	const firstIndent = text.match(/^([ \t]*)/);
	if (firstIndent) {
		return text.replace(
			// Escape tab chars
			new RegExp(`^${firstIndent[0].replace(/\\/g, "\\$&")}`, "gm"),
			""
		);
	}
	return text;
}

/**
 * Strip the block id from the string
 * @credit mgmeyers - easy bake plugin
 * @source https://github.com/mgmeyers/obsidian-easy-bake/blob/master/src/util.ts
 * @param {string} str
 * @return {string}
 */
function stripBlockId(str: string) {
	return str.replace(/ +\^[^ \n\r]+$/gm, "");
}


function stripFrontmatter(text: string) {
	if (!text) return text;
	return text.replace(/^---[\s\S]+?\r?\n---(?:\r?\n\s*|$)/, "");
}

function sanitizeBakedContent(text: string) {
	return stripBlockId(stripFrontmatter(text));
}

/**
 * Extract the subpath from the content
 * @credit mgmeyers - easy bake plugin
 * @source https://github.com/mgmeyers/obsidian-easy-bake/blob/master/src/util.ts
 * @param {string} content
 * @param { HeadingSubpathResult|BlockSubpathResult } subpathResult
 * @param {CachedMetadata} cache
 * @return {string}
 */
function extractSubpath(
	content: string,
	subpathResult: HeadingSubpathResult | BlockSubpathResult,
	cache: CachedMetadata
) {
	let text = content;

	if (subpathResult.type === "block" && subpathResult.list && cache.listItems) {
		const targetItem = subpathResult.list;
		const ancestors = new Set<number>([targetItem.position.start.line]);
		const start = targetItem.position.start.offset - targetItem.position.start.col;

		let end = targetItem.position.end.offset;
		let found = false;

		for (const item of cache.listItems) {
			if (targetItem === item) {
				found = true;
				continue;
			} else if (!found) {
				// Keep seeking until we find the target
				continue;
			}

			if (!ancestors.has(item.parent)) break;
			ancestors.add(item.position.start.line);
			end = item.position.end.offset;
		}

		text = stripBlockId(dedent(content.substring(start, end)));
	} else {
		const start = subpathResult.start.offset;
		const end = subpathResult.end ? subpathResult.end.offset : content.length;
		text = stripBlockId(content.substring(start, end));
	}

	return text;
}

/**
 * Allow to includes embed directly in the markdown
 * Note : All embedded contents will be added in the file, without checking the shared state and the repository
 * @credit mgmeyers - easy bake plugin
 * @link https://github.com/mgmeyers/obsidian-easy-bake
 * @source https://github.com/mgmeyers/obsidian-easy-bake/blob/master/src/BakeModal.ts
 * @param {TFile} originalFile
 * @param {Set<TFile>} ancestor the ancestor files
 * @param app {App}
 * @param repo {Repository | null}
 * @param settings {GitHubPublisherSettings} the global settings
 * @param subpath {string|null} the subpath to extract, if any
 * @param sourceRepo
 * @param frontmatterSettings
 * @param linkedNotes
 * @return {string} the converted text
 */
export async function bakeEmbeds(
	originalFile: TFile,
	ancestor: Set<TFile>,
	app: App,
	properties: MultiProperties,
	subpath: string|null,
	linkedNotes: LinkedNotes[]): Promise<string> {
	const { vault, metadataCache } = app;
	let text = await vault.cachedRead(originalFile);

	const cache = metadataCache.getFileCache(originalFile);
	if (!cache) return text;
	const resolvedSubpath = subpath ? resolveSubpath(cache, subpath) : null;
	if (resolvedSubpath) {
		text = extractSubpath(text, resolvedSubpath, cache);
	}
	const embeds = cache.embeds;
	if (!embeds || embeds.length === 0) return text;
	const targets = [...embeds];
	targets.sort((a, b) => a.position.start.offset - b.position.start.offset);
	const newAncestors = new Set(ancestor);
	newAncestors.add(originalFile);
	let posOffset = 0;
	for (const embed of targets) {
		const {path, subpath} = parseLinktext(embed.link);
		const linked = metadataCache.getFirstLinkpathDest(path, originalFile.path);
		if (linked === null || linked?.extension !== "md") continue;
		const start = embed.position.start.offset + posOffset;
		const end = embed.position.end.offset + posOffset;
		const prevLen = end - start;

		const before = text.substring(0, start);
		const after = text.substring(end);

		const replaceTarget = async (replacement: string) => {
			console.log(replacement);
			if (properties.settings.embed.bake?.textAfter) {
				let textAfter = await changeURL(properties.settings.embed.bake?.textAfter, properties, linked, originalFile, app, linkedNotes);
				textAfter = changeTitle(textAfter, linked, app, properties.settings);
				const newLine = replacement.match(/[\s\n]/g) ? "" : "\n";
				replacement = `${replacement}${newLine}${textAfter}`;
			}
			if (properties.settings.embed.bake?.textBefore) {
				let textBefore = await changeURL(properties.settings.embed.bake?.textBefore, properties, linked, originalFile, app, linkedNotes);
				textBefore = changeTitle(textBefore, linked, app, properties.settings);
				replacement = `${textBefore}\n${replacement}`;
			}
			text = before + replacement + after;
			posOffset += replacement.length - prevLen;
		};

		const frontmatter = metadataCache.getFileCache(linked)?.frontmatter;
		const shared = isShared(frontmatter, properties.settings, linked, properties.repository);
		const listMatch = before.match(/(?:^|\n)([ \t]*)(?:[-*+]|[0-9]+[.)]) +$/);
		if (newAncestors.has(linked) || !shared) {
			//do nothing
			continue;
		}
		const baked = sanitizeBakedContent(await bakeEmbeds(linked, newAncestors, app, properties, subpath, linkedNotes));
		await replaceTarget(
			listMatch ? applyIndent(stripFirstBullet(baked), listMatch[1]) : baked);
	}
	return text;
}

async function changeURL(replacement: string, properties: MultiProperties, linked: TFile, sourceFile: TFile, app: App, linkedNotes: LinkedNotes[]) {
	const frontmatter = app.metadataCache.getFileCache(linked)?.frontmatter;
	if (!frontmatter) return replacement;
	const linkedNote = linkedNotes.find((note) => note.linked === linked);
	if (!linkedNote) return replacement;
	if (properties.frontmatter.general.convertInternalLinks) {
		const relativePath = await createRelativePath(sourceFile, linkedNote, frontmatter, app, properties);
		return replacement.replace(/\{{2}url\}{2}/gmi, relativePath);
	} else {
		return replacement.replace(/\{{2}url\}{2}/gmi, linkedNote.linked.path);
	}
}


function changeTitle(replacement: string, linked: TFile, app: App, settings: GitHubPublisherSettings) {
	const title = linked.basename;
	const frontmatter = app.metadataCache.getFileCache(linked)?.frontmatter;
	if (!frontmatter) return replacement.replace(/\{{2}title\}{2}/gmi, title);
	const getTitle = regexOnFileName(getTitleField(frontmatter, linked, settings), settings).replace(".md", "");
	return replacement.replace(/\{{2}title\}{2}/gmi, getTitle);
}