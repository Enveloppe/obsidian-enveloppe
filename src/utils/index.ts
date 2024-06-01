import {
	type Deleted,
	FIND_REGEX,
	type EnveloppeSettings,
	type ListEditedFiles,
	type MetadataExtractor,
	type MultiRepoProperties,
	TOKEN_PATH,
	type UploadedFiles,
} from "@interfaces";
import { type App, normalizePath, Platform, type TFile } from "obsidian";
import slugify from "slugify";
import { getReceiptFolder } from "src/conversion/file_path";
import { createRegexFromText } from "src/conversion/find_and_replace_text";
import type Enveloppe from "src/main";
import { frontmatterFromFile } from "src/utils/parse_frontmatter";

/**
 * Create the differents list of the modals opened after the upload
 * @param {UploadedFiles[]} listUploaded
 * @param {Deleted} deleted
 * @param {string[]} fileError
 * @return {ListEditedFiles}
 */
export function createListEdited(
	listUploaded: UploadedFiles[],
	deleted: Deleted,
	fileError: string[]
): ListEditedFiles {
	const listEdited: ListEditedFiles = {
		added: [],
		edited: [],
		deleted: [],
		unpublished: [],
		notDeleted: [],
	};
	listUploaded.forEach((file) => {
		if (file.isUpdated) {
			listEdited.edited.push(file.file);
		} else {
			listEdited.added.push(file.file);
		}
	});
	listEdited.unpublished = fileError;
	if (deleted) {
		listEdited.deleted = deleted.deleted;
		listEdited.notDeleted = deleted.undeleted;
	}
	return listEdited;
}

/**
 * Get the settings of the metadata extractor plugin
 * Disable the plugin if it is not installed, the settings are not set or if plateform is mobile
 * @param {App} app
 * @param {EnveloppeSettings} settings
 * @returns {Promise<MetadataExtractor | null>}
 */

export async function getSettingsOfMetadataExtractor(
	app: App,
	settings: EnveloppeSettings
): Promise<MetadataExtractor | null> {
	if (
		Platform.isMobile ||
		!app.plugins.enabledPlugins.has("metadata-extractor") ||
		settings.upload.metadataExtractorPath.length === 0
	)
		return null;
	const metadataExtractor: MetadataExtractor = {
		allExceptMdFile: null,
		metadataFile: null,
		tagsFile: null,
	};

	const path = `${app.vault.configDir}/plugins/metadata-extractor`;
	const plugin = app.plugins.getPlugin("metadata-extractor");
	//@ts-ignore
	if (plugin?.settings) {
		//@ts-ignore
		if (plugin.settings.allExceptMdFile.length > 0) {
			//get file from plugins folder in .obsidian folder
			//@ts-ignore
			metadataExtractor.allExceptMdFile = `${path}/${plugin.settings.allExceptMdFile}`;
		}
		//@ts-ignore
		if (plugin.settings["metadataFile"].length > 0) {
			//@ts-ignore
			metadataExtractor.metadataFile = `${path}/${plugin.settings.metadataFile}`;
		}
		//@ts-ignore
		if (plugin.settings.tagFile.length > 0) {
			//@ts-ignore
			metadataExtractor.tagsFile = `${path}/${plugin.settings.tagFile}`;
		}
		return metadataExtractor;
	}
	return null;
}

/**
 * Check if the link has a slash at the end and if not add it
 * @returns {string} string with the link with a slash at the end
 * @param link {string} the link to check
 */

function checkSlash(link: string): string {
	const slash = link.match(/\/*$/);
	if (slash && slash[0].length != 1) {
		return `${link.replace(/\/*$/, "")}/`;
	}
	return link;
}

/**
 * Create the link for the file and add it to the clipboard
 * The path is based with the receipt folder but part can be removed using settings.
 * By default, use a github.io page for the link.
 */

export async function createLink(
	file: TFile,
	multiRepo: MultiRepoProperties,
	plugin: Enveloppe
): Promise<void> {
	const otherRepo = multiRepo.repository;
	const settings = plugin.settings;
	const repo = multiRepo.frontmatter;
	const copyLink = otherRepo ? otherRepo.copyLink : settings.plugin.copyLink;
	const github = otherRepo ? otherRepo : settings.github;
	if (!settings.plugin.copyLink.enable) {
		return;
	}
	let filepath = getReceiptFolder(file, otherRepo, plugin, multiRepo.frontmatter);

	let baseLink = copyLink.links;
	if (baseLink.length === 0) {
		baseLink =
			repo instanceof Array
				? `https://${github.user}.github.io/${settings.github.repo}/`
				: `https://${repo.owner}.github.io/${repo.repo}/`;
	}
	const frontmatter = frontmatterFromFile(file, plugin, otherRepo);
	let removePart = copyLink.removePart;
	const smartKey = otherRepo?.smartKey ? `${otherRepo.smartKey}.` : "";
	if (frontmatter) {
		if (frontmatter[`${smartKey}baselink`] != undefined) {
			baseLink = frontmatter[`${smartKey}baselink`] as unknown as string;
			removePart = [];
		} else if (
			frontmatter[`${smartKey}copylink`] &&
			typeof frontmatter[`${smartKey}.copylink`] === "object"
		) {
			baseLink = frontmatter[`${smartKey}copylink`].base as unknown as string;
			removePart =
				(frontmatter[`${smartKey}copylink`].remove as unknown as string[]) ?? [];
		}
		if (frontmatter[`${smartKey}copylink.base`])
			baseLink = frontmatter[`${smartKey}copylink.base`] as unknown as string;
		if (frontmatter[`${smartKey}copylink.remove`])
			removePart =
				(frontmatter[`${smartKey}copylink.remove`] as unknown as string[]) ?? [];
	}

	baseLink = checkSlash(baseLink);
	if (removePart.length > 0) {
		for (const part of removePart) {
			if (part.length > 0) {
				filepath = filepath.replace(part.trim(), "");
			}
		}
	}
	filepath = checkSlash(filepath);
	let url = baseLink + filepath;
	let transform = copyLink.transform;
	if (!transform) transform = settings.plugin.copyLink.transform;
	if (transform.toUri === undefined)
		transform.toUri = settings.plugin.copyLink.transform.toUri;
	if (transform.slugify === undefined)
		transform.slugify = settings.plugin.copyLink.transform.slugify;
	if (transform.applyRegex === undefined)
		transform.applyRegex = settings.plugin.copyLink.transform.applyRegex;
	if (transform.toUri) {
		url = encodeURI(url);
	}
	if (transform.slugify === "lower") {
		url = url.toLowerCase();
	} else if (transform.slugify === "strict") {
		url = slugify(url, { lower: true, strict: true });
	}
	for (const apply of transform.applyRegex) {
		//detect if text is encapsed by //
		const { regex, replacement } = apply;
		if (regex.match(FIND_REGEX)) {
			const reg = createRegexFromText(regex);
			url = url.replace(reg, replacement);
		} else {
			url = url.replace(new RegExp(regex, "g"), replacement);
		}
	}
	//fix links like double slash
	await navigator.clipboard.writeText(url.replace(/([^:]\/)\/+/g, "$1"));
	return;
}

/**
 * Trim the object to remove the empty value
 */
export function trimObject(obj: { [p: string]: string }) {
	const trimmed = JSON.stringify(obj, (_key, value) => {
		if (typeof value === "string") {
			return value.trim().toLowerCase();
		}
		return value;
	});
	return JSON.parse(trimmed);
}

/**
 * The REST API of Github have a rate limit of 5000 requests per hour.
 * This function check if the user is over the limit, or will be over the limit after the next request.
 * If the user is over the limit, the function will display a message to the user.
 * It also calculate the time remaining before the limit is reset.
 */

/**
 * Convert the variable to their final value:
 * - %configDir% -> The config directory of the vault
 * - %pluginID% -> The ID of the plugin
 * @param {Enveloppe} plugin - The plugin
 * @param {string} tokenPath - The path of the token as entered by the user
 * @return {string} - The final path of the token
 */
export function createTokenPath(plugin: Enveloppe, tokenPath?: string): string {
	const vault = plugin.app.vault;
	if (!tokenPath) {
		tokenPath = TOKEN_PATH;
	}
	tokenPath = tokenPath.replace("%configDir%", vault.configDir);
	tokenPath = tokenPath.replace("%pluginID%", plugin.manifest.id);
	return normalizePath(tokenPath);
}
