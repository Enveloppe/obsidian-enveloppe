import {Octokit} from "@octokit/core";
import i18next from "i18next";
import {App, FrontMatterCache, MetadataCache, Notice, Platform, TFile, Vault} from "obsidian";
import GithubPublisher from "src/main";

import {getReceiptFolder} from "../conversion/file_path";
import Publisher from "../publish/upload";
import {
	Deleted,
	FolderSettings,
	FrontmatterConvert,
	GitHubPublisherSettings,
	ListEditedFiles, 	MetadataExtractor,
	RepoFrontmatter,
	Repository, TOKEN_PATH,
	UploadedFiles} from "../settings/interface";

/**
 * Create a notice message for the log
 * @param {any} message the message to display
 * @param {GithubPublisher} settings to know if it should use the notice or the log
 */
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function noticeLog(message: any, settings: GitHubPublisherSettings) {
	if (settings.plugin.noticeError) {
		new Notice(message);
	} else {
		console.log("[GITHUB PUBLISHER]" , message);
	}
}

/**
 * Create a debug message for the log
 * Only display if debug is enabled
 * @param {unknown[]} args
 */
export function log(...args: unknown[]) {
	if (process.env.BUILD_ENV && process.env.BUILD_ENV==="development" && Platform.isDesktop) {
		let callFunction = new Error().stack?.split("\n")[2].trim();
		callFunction = callFunction?.substring(callFunction.indexOf("at ") + 3, callFunction.lastIndexOf(" ("));
		callFunction = callFunction?.replace("Object.callback", "");
		callFunction = callFunction ? callFunction : "main";
		const date = new Date().toISOString().slice(11, 23);
		console.log(`[${date}](${callFunction}):\n`, ...args);
	}
}

/**
 * Create the differents list of the modals opened after the upload
 * @param {UploadedFiles[]} listUploaded
 * @param {Deleted} deleted
 * @param {string[]} fileError
 * @return {ListEditedFiles}
 */
export function createListEdited(listUploaded: UploadedFiles[], deleted: Deleted, fileError: string[]) {
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
 * @param {string} link: string
 * @returns {string} string with the link with a slash at the end
 */

function checkSlash(link: string): string {
	const slash = link.match(/\/*$/);
	if (slash && slash[0].length != 1) {
		link = link.replace(/\/*$/, "") + "/";
	}
	return link;
}

/**
 * Create the link for the file and add it to the clipboard
 * The path is based with the receipt folder but part can be removed using settings.
 * By default, use a github.io page for the link.
 * @param {TFile} file
 * @param {RepoFrontmatter | RepoFrontmatter[]} repo
 * @param {MetadataCache} metadataCache
 * @param {Vault} vault
 * @param {GitHubPublisherSettings} settings
 * @param otherRepo
 * @return {Promise<void>}
 */

export async function createLink(
	file: TFile,
	repo: RepoFrontmatter | RepoFrontmatter[],
	metadataCache: MetadataCache,
	vault: Vault,
	settings: GitHubPublisherSettings,
	otherRepo: Repository | null
): Promise<void> {

	const copyLink = otherRepo ? otherRepo.copyLink : settings.plugin.copyLink;
	const github = otherRepo ? otherRepo : settings.github;
	if (!settings.plugin.copyLink.enable) {
		return;
	}
	let filepath = getReceiptFolder(file, settings, metadataCache, vault, otherRepo);

	let baseLink = copyLink.links;
	if (baseLink.length === 0) {
		if (repo instanceof Array) {
			baseLink = `https://${github.user}.github.io/${settings.github.repo}/`;
		} else {
			baseLink = `https://${repo.owner}.github.io/${repo.repo}/`;
		}
	}
	const frontmatter = metadataCache.getFileCache(file)!.frontmatter as FrontMatterCache;
	const keyRepo = frontmatter["baselink"];
	let removePart = copyLink.removePart;
	if (frontmatter["baselink"] !== undefined) {
		baseLink = keyRepo;
		removePart = [];
	} else if (frontmatter["copylink"] && typeof frontmatter["copylink"]==="object") {
		baseLink = frontmatter["copylink"].base;
		removePart = frontmatter["copylink"].remove ?? [];
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
	const url = checkSlash(encodeURI(baseLink + filepath));
	await navigator.clipboard.writeText(url);
	return;
}

/**
 * Create a notice message for the sharing ; the message can be delayed if a workflow is used.
 * Loop through the list of repo and create a message for each one.
 * @param {Publisher} PublisherManager
 * @param {TFile | string} file
 * @param {GitHubPublisherSettings} settings
 * @param {RepoFrontmatter | RepoFrontmatter[]} repo
 * @return {Promise<void>}
 */

export async function noticeMessage(
	PublisherManager: Publisher,
	file: TFile | string | undefined,
	settings: GitHubPublisherSettings,
	repo: RepoFrontmatter | RepoFrontmatter[]
) {
	repo = Array.isArray(repo) ? repo : [repo];
	for (const repository of repo) {
		await noticeMessageOneRepo(
			PublisherManager,
			file,
			settings,
			repository
		);
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

async function noticeMessageOneRepo(
	PublisherManager: Publisher,
	file: TFile | string | undefined,
	settings: GitHubPublisherSettings,
	repo: RepoFrontmatter
): Promise<void> {
	const noticeValue =
		file instanceof TFile ? "\"" + file.basename + "\"" : file;
	let successMsg = "";
	if (file instanceof String) {
		successMsg = i18next.t("informations.successfulPublish", { nbNotes: noticeValue, repo: repo });
	} else {
		log("file published :", noticeValue);
		successMsg = i18next.t("informations.successPublishOneNote", { file: noticeValue, repo: repo });
	}
	if (settings.github.workflow.name.length > 0) {
		const msg = i18next.t("informations.sendMessage", {nbNotes: noticeValue, repo: repo}) + ".\n" + i18next.t("informations.waitingWorkflow");
		new Notice(msg);
		const successWorkflow = await PublisherManager.workflowGestion(repo);
		if (successWorkflow) {
			new Notice(successMsg);
		}
	} else {
		new Notice(successMsg);
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
 * Get all condition from the frontmatter
 * Condition can be set :
 * - imageDefaultFolder
 * - convertWikiLinks
 * - attachment
 * - convert internal links
 * - remove Embed
 * - convert dataview
 * - hard break
 * @param {FrontMatterCache} frontmatter
 * @param {GitHubPublisherSettings} settings
 * @return {FrontmatterConvert}
 */

export function getFrontmatterCondition(
	frontmatter: FrontMatterCache,
	settings: GitHubPublisherSettings
) {
	let imageDefaultFolder: string = "";
	if (settings.embed.folder.length > 0) {
		imageDefaultFolder = settings.embed.folder;
	} else if (settings.upload.defaultName.length > 0) {
		imageDefaultFolder = settings.upload.defaultName;
	}
	const settingsConversion: FrontmatterConvert = {
		convertWiki: settings.conversion.links.wiki,
		attachment: settings.embed.attachments,
		embed: settings.embed.notes,
		attachmentLinks: imageDefaultFolder,
		links: true,
		removeEmbed: settings.embed.convertEmbedToLinks,
		charEmbedLinks: settings.embed.charConvert,
		dataview: settings.conversion.dataview,
		hardbreak: settings.conversion.hardbreak,
		convertInternalNonShared: settings.conversion.links.unshared,
		convertInternalLinks: settings.conversion.links.internal,
	};
	if (frontmatter.links !== undefined) {
		if (typeof frontmatter.links === "object") {
			if (frontmatter.links.convert !== undefined) {
				settingsConversion.links = frontmatter.links.convert;
			}
			if (frontmatter.links.internals !== undefined) {
				settingsConversion.convertInternalLinks =
					frontmatter.links.internals;
			}
			if (frontmatter.links.mdlinks !== undefined) {
				settingsConversion.convertWiki = frontmatter.links.mdlinks;
			}
			if (frontmatter.links.nonShared !== undefined) {
				settingsConversion.convertInternalNonShared =
					frontmatter.links.nonShared;
			}
		} else {
			settingsConversion.links = frontmatter.links;
		}
	}
	if (frontmatter.embed !== undefined) {
		if (typeof frontmatter.embed === "object") {
			if (frontmatter.embed.send !== undefined) {
				settingsConversion.embed = frontmatter.embed.send;
			}
			if (frontmatter.embed.remove !== undefined) {
				settingsConversion.removeEmbed = translateBooleanForRemoveEmbed(frontmatter.embed.remove);
			}
			if (frontmatter.embed.char !== undefined) {
				settingsConversion.charEmbedLinks = frontmatter.embed.char;
			}
		} else {
			settingsConversion.embed = frontmatter.embed;
		}
	}
	if (frontmatter.attachment !== undefined) {
		if (typeof frontmatter.attachment === "object") {
			if (frontmatter.attachment.send !== undefined) {
				settingsConversion.attachment = frontmatter.attachment.send;
			}
			if (frontmatter.attachment.folder !== undefined) {
				settingsConversion.attachmentLinks =
					frontmatter.attachment.folder;
			}
		} else {
			settingsConversion.attachment = frontmatter.attachment;
		}
	}
	if (frontmatter.attachmentLinks !== undefined) {
		settingsConversion.attachmentLinks = frontmatter.attachmentLinks
			.toString()
			.replace(/\/$/, "");
	}
	if (frontmatter.mdlinks !== undefined) {
		settingsConversion.convertWiki = frontmatter.mdlinks;
	}
	if (frontmatter.removeEmbed !== undefined) {
		settingsConversion.removeEmbed = translateBooleanForRemoveEmbed(frontmatter.removeEmbed);
	}
	if (frontmatter.dataview !== undefined) {
		settingsConversion.dataview = frontmatter.dataview;
	}
	if (frontmatter.hardbreak !== undefined) {
		settingsConversion.hardbreak = frontmatter.hardbreak;
	}
	if (frontmatter.internals !== undefined) {
		settingsConversion.convertInternalLinks = frontmatter.internals;
	}
	if (frontmatter.nonShared !== undefined) {
		settingsConversion.convertInternalNonShared = frontmatter.nonShared;
	}
	return settingsConversion;
}

function translateBooleanForRemoveEmbed(removeEmbed: unknown) {
	if (removeEmbed === "true") {
		return "keep";
	} else if (removeEmbed === "false") {
		return "remove";
	} else if (removeEmbed === "links") {
		return "links";
	} else if (removeEmbed === "bake" || removeEmbed === "include") {
		return "bake";
	} else return "keep";
}

/**
 * Get the frontmatter from the frontmatter
 * @param {GitHubPublisherSettings} settings
 * @param repository
 * @param {FrontMatterCache} frontmatter
 * @return {RepoFrontmatter[] | RepoFrontmatter}
 */

export function getRepoFrontmatter(
	settings: GitHubPublisherSettings,
	repository: Repository | null,
	frontmatter?: FrontMatterCache
) {
	let github = repository ?? settings.github;
	if (frontmatter && typeof frontmatter["shortRepo"] === "string" && frontmatter["shortRepo"]!=="default") {
		const smartKey = frontmatter.shortRepo.toLowerCase();
		const allOtherRepo = settings.github.otherRepo;
		const shortRepo = allOtherRepo.filter((repo) => {
			return repo.smartKey.toLowerCase() === smartKey;
		})[0];
		github = shortRepo ?? github;
	}
	let repoFrontmatter: RepoFrontmatter = {
		branch: github.branch,
		repo: github.repo,
		owner: github.user,
		autoclean: settings.upload.autoclean.enable,
		workflowName: github.workflow.name,
		commitMsg: github.workflow.commitMessage,
		automaticallyMergePR: github.automaticallyMergePR,
		verifiedRepo: github.verifiedRepo ?? false,
	};
	if (settings.upload.behavior === FolderSettings.fixed) {
		repoFrontmatter.autoclean = false;
	}
	if (!frontmatter || (frontmatter.multipleRepo === undefined && frontmatter.repo === undefined && frontmatter.shortRepo === undefined)) {
		return repoFrontmatter;
	}
	let isFrontmatterAutoClean= null;
	if (frontmatter.multipleRepo) {
		const multipleRepo = parseMultipleRepo(frontmatter, repoFrontmatter);
		if (multipleRepo.length === 1) {
			return multipleRepo[0] as RepoFrontmatter;
		}
		return multipleRepo;
	} else if (frontmatter.repo) {
		if (typeof frontmatter.repo === "object") {
			if (frontmatter.repo.branch !== undefined) {
				repoFrontmatter.branch = frontmatter.repo.branch;
			}
			if (frontmatter.repo.repo !== undefined) {
				repoFrontmatter.repo = frontmatter.repo.repo;
			}
			if (frontmatter.repo.owner !== undefined) {
				repoFrontmatter.owner = frontmatter.repo.owner;
			}
			if (frontmatter.repo.autoclean !== undefined) {
				repoFrontmatter.autoclean = frontmatter.repo.autoclean;
				isFrontmatterAutoClean = true;
			}
		} else {
			const repo = frontmatter.repo.split("/");
			isFrontmatterAutoClean= repo.length > 4 ? true : null;
			repoFrontmatter = repositoryStringSlice(repo, repoFrontmatter);
		}
	} else if (frontmatter.shortRepo instanceof Array) {
		return multipleShortKeyRepo(frontmatter, settings.github.otherRepo, repoFrontmatter);
	}
	if (frontmatter.autoclean !== undefined && isFrontmatterAutoClean === null) {
		repoFrontmatter.autoclean = frontmatter.autoclean;
	}
	return repoFrontmatter;
}

/**
 * Get the repoFrontmatter array from the frontmatter
 * @example
 * multipleRepo:
 *   - repo: repo1
 *     owner: owner1
 *     branch: branch1
 *     autoclean: true
 *   - repo: repo2
 *     owner: owner2
 *     branch: branch2
 *     autoclean: false
 * @param {FrontMatterCache} frontmatter
 * @param {RepoFrontmatter} repoFrontmatter
 * @return {RepoFrontmatter[]}
 */

function parseMultipleRepo(
	frontmatter: FrontMatterCache,
	repoFrontmatter: RepoFrontmatter
) {
	const multipleRepo: RepoFrontmatter[] = [];
	if (
		frontmatter.multipleRepo instanceof Array &&
		frontmatter.multipleRepo.length > 0
	) {
		for (const repo of frontmatter.multipleRepo) {
			if (typeof repo === "object") {
				const repository: RepoFrontmatter = {
					branch: repoFrontmatter.branch,
					repo: repoFrontmatter.repo,
					owner: repoFrontmatter.owner,
					autoclean: false,
					automaticallyMergePR: repoFrontmatter.automaticallyMergePR,
					workflowName: repoFrontmatter.workflowName,
					commitMsg: repoFrontmatter.commitMsg
				};
				if (repo.branch !== undefined) {
					repository.branch = repo.branch;
				}
				if (repo.repo !== undefined) {
					repository.repo = repo.repo;
				}
				if (repo.owner !== undefined) {
					repository.owner = repo.owner;
				}
				if (repo.autoclean !== undefined) {
					repository.autoclean = repo.autoclean;
				}
				multipleRepo.push(repository);
			} else {
				//is string
				const repoString = repo.split("/");
				const repository: RepoFrontmatter = {
					branch: repoFrontmatter.branch,
					repo: repoFrontmatter.repo,
					owner: repoFrontmatter.owner,
					autoclean: false,
					automaticallyMergePR: repoFrontmatter.automaticallyMergePR,
					workflowName: repoFrontmatter.workflowName,
					commitMsg: repoFrontmatter.commitMsg
				};
				multipleRepo.push(
					repositoryStringSlice(repoString, repository)
				);
			}
		}
	}
	//remove duplicates
	return multipleRepo.filter(
		(v, i, a) =>
			a.findIndex(
				(t) =>
					t.repo === v.repo &&
					t.owner === v.owner &&
					t.branch === v.branch &&
					t.autoclean === v.autoclean
			) === i
	);
}

/**
 * Get the repoFrontmatter from the `shortRepo` string ;
 * Using the `default` key will put the default repoFrontmatter in the list
 * @param {FrontMatterCache} frontmatter - The frontmatter of the file
 * @param {Repository[]} allRepo - The list of all repo from the settings
 * @param {RepoFrontmatter} repoFrontmatter - The default repoFrontmatter (from the default settings)
 * @return {RepoFrontmatter[] | RepoFrontmatter} - The repoFrontmatter from shortRepo
 */
function multipleShortKeyRepo(frontmatter: FrontMatterCache, allRepo: Repository[], repoFrontmatter: RepoFrontmatter) {
	if (frontmatter.shortRepo instanceof Array) {
		const multipleRepo: RepoFrontmatter[] = [];
		for (const repo of frontmatter.shortRepo) {
			const smartKey = repo.toLowerCase();
			if (smartKey === "default") {
				multipleRepo.push(repoFrontmatter);
			} else {
				const shortRepo = allRepo.filter((repo) => {
					return repo.smartKey.toLowerCase() === smartKey;
				})[0];
				if (shortRepo) {
					multipleRepo.push({
						branch: shortRepo.branch,
						repo: shortRepo.repo,
						owner: shortRepo.user,
						autoclean: repoFrontmatter.autoclean,
						automaticallyMergePR: shortRepo.automaticallyMergePR,
						workflowName: shortRepo.workflow.name,
						commitMsg: shortRepo.workflow.commitMessage
					} as RepoFrontmatter);
				}
			}
		}
		return multipleRepo;
	}
	return repoFrontmatter;
}

/**
 * slice the string repo if yaml object is not used
 * @example
 * repo: owner/repo/branch/autoclean
 * @example
 * repo: owner/repo/branch
 * @example
 * repo: owner/repo
 * @example
 * repo: repo1
 * @param {string} repo
 * @param {RepoFrontmatter} repoFrontmatter
 * @return {RepoFrontmatter}
 */

function repositoryStringSlice(repo: string, repoFrontmatter: RepoFrontmatter) {
	const newRepo: RepoFrontmatter = {
		branch: repoFrontmatter.branch,
		repo: repoFrontmatter.repo,
		owner: repoFrontmatter.owner,
		autoclean: false,
		automaticallyMergePR: repoFrontmatter.automaticallyMergePR,
		workflowName: repoFrontmatter.workflowName,
		commitMsg: repoFrontmatter.commitMsg
	};
	if (repo.length >= 4) {
		newRepo.branch = repo[2];
		newRepo.repo = repo[1];
		newRepo.owner = repo[0];
		newRepo.autoclean = repo[3] === "true";
	}
	if (repo.length === 3) {
		newRepo.branch = repo[2];
		newRepo.repo = repo[1];
		newRepo.owner = repo[0];
	} else if (repo.length === 2) {
		newRepo.repo = repo[1];
		newRepo.owner = repo[0];
	} else if (repo.length === 1) {
		newRepo.repo = repo[0];
	}
	return newRepo;
}

/**
 * Get the category from the frontmatter
 * @param {FrontMatterCache} frontmatter
 * @param {GitHubPublisherSettings} settings
 * @return {string} - The category or the default name
 */
export function getCategory(frontmatter: FrontMatterCache, settings: GitHubPublisherSettings):string {
	const key = settings.upload.yamlFolderKey;
	let category = frontmatter[key] ?? settings.upload.defaultName;
	if (category instanceof Array) {
		category = category.join("/");
	}
	return category;
}

/**
	 * The REST API of Github have a rate limit of 5000 requests per hour.
	 * This function check if the user is over the limit, or will be over the limit after the next request.
	 * If the user is over the limit, the function will display a message to the user.
	 * It also calculate the time remaining before the limit is reset.
	 */
export async function verifyRateLimitAPI(octokit: Octokit, settings: GitHubPublisherSettings, commands=false, numberOfFile=1): Promise<number> {
	const rateLimit = await octokit.request("GET /rate_limit");
	const remaining = rateLimit.data.resources.core.remaining;
	const reset = rateLimit.data.resources.core.reset;
	const date = new Date(reset * 1000);
	const time = date.toLocaleTimeString();
	if (remaining <= numberOfFile) {
		new Notice(i18next.t("commands.checkValidity.rateLimit.limited", {resetTime: time}));
		return 0;
	}
	if (!commands) {
		noticeLog(i18next.t("commands.checkValidity.rateLimit.notLimited", {
			remaining: remaining,
			resetTime: time
		}), settings);
	} else {
		new Notice(i18next.t("commands.checkValidity.rateLimit.notLimited", {
			remaining: remaining,
			resetTime: time
		}));
	}
	return remaining;
}


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
	return tokenPath;
}

