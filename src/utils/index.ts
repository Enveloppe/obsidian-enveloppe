import i18next from "i18next";
import {App, normalizePath, Notice, Platform, TFile} from "obsidian";
import slugify from "slugify";
import { createRegexFromText } from "src/conversion/find_and_replace_text";
import GithubPublisher from "src/main";

import {getReceiptFolder} from "../conversion/file_path";
import Publisher from "../GitHub/upload";
import {
	Deleted,
	FIND_REGEX,
	GitHubPublisherSettings,
	ListEditedFiles,
	MetadataExtractor,
	MultiRepoProperties,
	RepoFrontmatter, TOKEN_PATH,
	UploadedFiles} from "../settings/interface";
import { ERROR_ICONS, HOURGLASS_ICON, SUCCESS_ICON } from "./icons";
import { frontmatterFromFile } from "./parse_frontmatter";

type LogsParameters = {
	settings: Partial<GitHubPublisherSettings>,
	e?: boolean,
	logs?: boolean,
}

/**
 * Create a notice message for the log
 * @param args {LogsParameters} the settings and the error type
 * @param {unknown[]} messages the message to display
 */
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function notif(args: LogsParameters, ...messages: unknown[]) {
	const {settings, e} = args;
	if (settings.plugin?.noticeError) {
		new Notice(messages.join(" "));
		return;
	}
	let stack:string = callFunction();
	if (stack.contains("logs")) {
		stack = callFunction(true);
	}
	const date = new Date().toISOString().slice(11, 23);
	const prefix = args.logs ? `DEV LOGS [${date}] ${stack}:\n` : `[GitHub Publisher](${stack}):\n`;
	if (e)
		console.error(prefix, ...messages);
	else
		console.log(prefix, ...messages);
}

export function noticeMobile(cls:"error"|"load"|"success"|"wait", icon: string, message: string) {
	if (!Platform.isMobile) {
		return;
	}
	const noticeFrag = document.createDocumentFragment();
	noticeFrag.createEl("span", { text: message, cls: ["obsidian-publisher", cls, "icons"] }).innerHTML = icon;
	noticeFrag.createEl("span", { cls: ["obsidian-publisher", cls, "notification"] }).innerHTML = message;
	return new Notice(noticeFrag, 0);
}

function callFunction(type?: boolean):string {
	const index = type ? 4 : 3;
	let callFunction = new Error().stack?.split("\n")[index].trim();
	callFunction = callFunction?.substring(callFunction.indexOf("at ") + 3, callFunction.lastIndexOf(" ("));
	callFunction = callFunction?.replace("Object.callback", "");
	callFunction = callFunction ? callFunction : "main";
	callFunction = callFunction === "eval" ? "main" : callFunction;
	return callFunction;
}


/**
 * Add a new option in settings "dev"
 * Will make appear ALL the logs in the console
 * Not just the logs for normal process
 * For advanced users only
 */
export function logs(args: LogsParameters, ...messages: unknown[]) {
	const settings = args.settings as GitHubPublisherSettings;
	args.logs = true;
	if (args.e) {
		notif(args, ...messages);
		return;
	}
	if (settings.plugin?.dev) {
		notif(args, ...messages);
	}
}

export function monkeyPatchConsole(plugin: GithubPublisher) {
	const stack = new Error().stack?.split("\n")?.[3];
	if (!stack?.includes("obsidian-mkdocs-publisher") || !plugin.settings.plugin.dev) {
		return;
	}

	const logFile = `${plugin.manifest.dir}/logs.txt`;
	const logs: string[] = [];
	//detect if console.debug, console.error, console.info, console.log or console.warn is called
	const originalConsole = {
		debug: console.debug,
		error: console.error,
		info: console.info,
		log: console.log,
		warn: console.warn,
	};
	const logMessages = (prefix: string) => (...messages: unknown[]) => {
		logs.push(`\n[${prefix}]`);
		for (const message of messages) {
			logs.push(String(message));
		}
		plugin.app.vault.adapter.write(logFile, logs.join(" "));
		//also display the message in the console
		switch (prefix) {
		case "error":
			originalConsole.error(...messages);
			break;
		case "info":
			originalConsole.info(...messages);
			break;
		case "log":
			originalConsole.log(...messages);
			break;
		case "warn":
			originalConsole.warn(...messages);
			break;
		case "debug":
			originalConsole.debug(...messages);
			break;
		}
	};
	console.debug = logMessages("debug");
	console.error = logMessages("error");
	console.info = logMessages("info");
	console.log = logMessages("log");
	console.warn = logMessages("warn");

}


/**
 * Create the differents list of the modals opened after the upload
 * @param {UploadedFiles[]} listUploaded
 * @param {Deleted} deleted
 * @param {string[]} fileError
 * @return {ListEditedFiles}
 */
export function createListEdited(listUploaded: UploadedFiles[], deleted: Deleted, fileError: string[]): ListEditedFiles {
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
 * @param {GitHubPublisherSettings} settings
 * @returns {Promise<MetadataExtractor | null>}
 */

export async function getSettingsOfMetadataExtractor(
	app: App,
	settings: GitHubPublisherSettings
) {
	// @ts-ignore
	if (
		Platform.isMobile ||
		//@ts-ignore
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
	// @ts-ignore
	const plugin = app.plugins.plugins["metadata-extractor"];
	if (plugin && plugin.settings) {
		if (plugin.settings["allExceptMdFile"].length > 0) {
			//get file from plugins folder in .obsidian folder
			metadataExtractor.allExceptMdFile =
				path + "/" + plugin.settings["allExceptMdFile"];
		}
		if (plugin.settings["metadataFile"].length > 0) {
			metadataExtractor.metadataFile =
				path + "/" + plugin.settings["metadataFile"];
		}
		if (plugin.settings["tagFile"].length > 0) {
			metadataExtractor.tagsFile =
				path + "/" + plugin.settings["tagFile"];
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
		return link.replace(/\/*$/, "") + "/";
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
	plugin: GithubPublisher,
): Promise<void> {
	const otherRepo = multiRepo.repo;
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
		baseLink = repo instanceof Array ? `https://${github.user}.github.io/${settings.github.repo}/` : `https://${repo.owner}.github.io/${repo.repo}/`;
	}
	const frontmatter = frontmatterFromFile(file, plugin);
	let removePart = copyLink.removePart;
	const smartKey = otherRepo?.smartKey ? `${otherRepo.smartKey}.` : "";
	if (frontmatter) {
		if (frontmatter[`${smartKey}baselink`] != undefined) {
			baseLink = frontmatter[`${smartKey}baselink`];
			removePart = [];
		} else if (frontmatter[`${smartKey}copylink`] && typeof frontmatter[`${smartKey}.copylink`] === "object") {
			baseLink = frontmatter[`${smartKey}copylink`].base;
			removePart = frontmatter[`${smartKey}copylink`].remove ?? [];
		}
		if (frontmatter[`${smartKey}copylink.base`]) baseLink = frontmatter[`${smartKey}copylink.base`];
		if (frontmatter[`${smartKey}copylink.remove`]) removePart = frontmatter[`${smartKey}copylink.remove`];
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
	if (transform.toUri === undefined) transform.toUri = settings.plugin.copyLink.transform.toUri;
	if (transform.slugify === undefined) transform.slugify = settings.plugin.copyLink.transform.slugify;
	if (transform.applyRegex === undefined) transform.applyRegex = settings.plugin.copyLink.transform.applyRegex;
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
		const {regex, replacement} = apply;
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
 * Create a notice message for the sharing ; the message can be delayed if a workflow is used.
 * Loop through the list of repo and create a message for each one.
 * @param {Publisher} PublisherManager
 * @param {TFile | string} file
 * @param {GitHubPublisherSettings} settings
 * @param {RepoFrontmatter | RepoFrontmatter[]} repo
 */

export async function publisherNotification(
	PublisherManager: Publisher,
	file: TFile | string | undefined,
	settings: GitHubPublisherSettings,
	repo: RepoFrontmatter | RepoFrontmatter[]
) {
	repo = Array.isArray(repo) ? repo : [repo];
	for (const repository of repo) {
		await publisherNotificationOneRepo(
			PublisherManager,
			file,
			settings,
			repository
		);
	}
}

export function notifError(repoFrontmatter: RepoFrontmatter | RepoFrontmatter[]) {
	const repo = Array.isArray(repoFrontmatter) ? repoFrontmatter : [repoFrontmatter];
	for (const repository of repo) {
		const notif = document.createDocumentFragment();
		notif.createSpan({ cls: ["error", "obsidian-publisher", "icons", "notification"] }).innerHTML = ERROR_ICONS;
		notif.createSpan({ cls: ["error", "obsidian-publisher", "notification"] }).innerHTML = i18next.t("error.errorPublish", { repo: repository });
		new Notice(notif);
	}
}

/**
 * Create a notice message for the sharing ; the message can be delayed if a workflow is used.
 * @param {Publisher} PublisherManager
 * @param {TFile | string} file
 * @param {GitHubPublisherSettings} settings
 * @param {RepoFrontmatter} repo
 * @return {Promise<void>}
 */

async function publisherNotificationOneRepo(
	PublisherManager: Publisher,
	file: TFile | string | undefined,
	settings: GitHubPublisherSettings,
	repo: RepoFrontmatter
): Promise<void> {
	const noticeValue =
		file instanceof TFile ? `"${file.basename}"` : file;
	const docSuccess = document.createDocumentFragment();
	const successMsg = file instanceof String ? 
		i18next.t("informations.successfulPublish", { nbNotes: noticeValue, repo }) 
		: i18next.t("informations.successPublishOneNote", { file: noticeValue, repo });
	docSuccess.createEl("span", { text: successMsg, cls: ["obsidian-publisher", "success", "icons"] }).innerHTML = SUCCESS_ICON;
	docSuccess.createEl("span", { cls: ["obsidian-publisher", "success", "notification"] }).innerHTML = successMsg;
	if (settings.github.workflow.name.length === 0) {
		new Notice(docSuccess, 0);
		return;
	}
	const workflowSuccess = document.createDocumentFragment();
	workflowSuccess.createEl("span", { text: i18next.t("informations.successfulPublish", { nbNotes: noticeValue, repo }), cls: ["obsidian-publisher", "wait", "icons"] }).innerHTML = HOURGLASS_ICON;
	const msg = `${i18next.t("informations.sendMessage", {nbNotes: noticeValue, repo})}.<br>${i18next.t("informations.waitingWorkflow")}`;
	workflowSuccess.createEl("span", { cls: ["obsidian-publisher", "wait", "notification"] }).innerHTML = msg;
	new Notice(workflowSuccess);
	const successWorkflow = await PublisherManager.workflowGestion(repo);
	if (successWorkflow) {
		new Notice(docSuccess, 0);
	}
	
}

/**
 * Trim the object to remove the empty value
 * @param {{[p: string]: string}} obj
 * @return {any}
 */

export function trimObject(obj: { [p: string]: string }) {
	const trimmed = JSON.stringify(obj, (key, value) => {
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
 * @param {GithubPublisher} plugin - The plugin
 * @param {string} tokenPath - The path of the token as entered by the user
 * @return {string} - The final path of the token
 */
export function createTokenPath(plugin: GithubPublisher, tokenPath?: string) {
	const vault = plugin.app.vault;
	if (!tokenPath) {
		tokenPath = TOKEN_PATH;
	}
	tokenPath = tokenPath.replace("%configDir%", vault.configDir);
	tokenPath = tokenPath.replace("%pluginID%", plugin.manifest.id);
	return normalizePath(tokenPath);
}

