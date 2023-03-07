import {App, FrontMatterCache, MetadataCache, Notice, Platform, TFile, Vault,} from "obsidian";
import {
	FolderSettings,
	FrontmatterConvert,
	GitHubPublisherSettings,
	MetadataExtractor,
	RepoFrontmatter,
} from "../settings/interface";
import Publisher from "../publish/upload";
import {getReceiptFolder} from "../conversion/filePathConvertor";
import i18next from "i18next";

/**
 * Create a notice message for the log
 * @param {string} message the message to display
 * @param {GithubPublisher} settings to know if it should use the notice or the log
 */

export function noticeLog(message: string, settings: GitHubPublisherSettings) {
	if (settings.plugin.noticeError) {
		new Notice(message);
	} else {
		console.log(message);
	}
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
	if (slash[0].length != 1) {
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
 * @return {Promise<void>}
 */

export async function createLink(
	file: TFile,
	repo: RepoFrontmatter | RepoFrontmatter[],
	metadataCache: MetadataCache,
	vault: Vault,
	settings: GitHubPublisherSettings
): Promise<void> {
	const copyLink = settings.plugin.copyLink;
	const github = settings.github;
	if (!copyLink.enable) {
		return;
	}
	let filepath = getReceiptFolder(file, settings, metadataCache, vault);

	let baseLink = copyLink.links;
	if (baseLink.length === 0) {
		if (repo instanceof Array) {
			baseLink = `https://${github.user}.github.io/${settings.github.repo}/`;
		} else {
			baseLink = `https://${repo.owner}.github.io/${repo.repo}/`;
		}
	}
	const keyRepo = metadataCache.getFileCache(file)?.frontmatter["baselink"];
	if (keyRepo !== undefined) {
		baseLink = keyRepo;
	}

	baseLink = checkSlash(baseLink);
	if (copyLink.removePart.length > 0) {
		for (const part of copyLink.removePart) {
			if (part.length > 0) {
				filepath = filepath.replace(part.trim(), "");
			}
		}
	}
	const url = encodeURI(baseLink + filepath);
	console.log(url, filepath);
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
	file: TFile | string,
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
	file: TFile | string,
	settings: GitHubPublisherSettings,
	repo: RepoFrontmatter
): Promise<void> {
	const noticeValue =
		file instanceof TFile ? "\"" + file.basename + "\"" : file;
	let successMsg = "";
	const repoInfo = `${repo.owner}:${repo.repo}`;
	if (file instanceof String) {
		successMsg = i18next.t("informations.successfullPublish", { nbNotes: noticeValue, repoInfo: repoInfo });
	} else {
		successMsg = i18next.t("informations.successPublishOneNote", { file: noticeValue, repoInfo: repoInfo });
	}
	if (settings.github.worflow.workflowName.length > 0) {
		const msg = i18next.t("informations.sendMessage", {nbNotes: noticeValue, repoOwner: repo.owner, repoInfo: repo.repo}) + ".\n" + i18next.t("informations.waitingWorkflow");
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
	let imageDefaultFolder = null;
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
		removeEmbed: false,
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
				settingsConversion.removeEmbed = frontmatter.embed.remove;
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
		settingsConversion.removeEmbed = frontmatter.removeEmbed;
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

/**
 * Get the frontmatter from the frontmatter
 * @param {GitHubPublisherSettings} settings
 * @param {FrontMatterCache} frontmatter
 * @return {RepoFrontmatter[] | RepoFrontmatter}
 */

export function getRepoFrontmatter(
	settings: GitHubPublisherSettings,
	frontmatter?: FrontMatterCache
) {
	const github = settings.github;
	let repoFrontmatter: RepoFrontmatter = {
		branch: github.branch,
		repo: github.repo,
		owner: github.user,
		autoclean: settings.upload.autoclean.enable,
	};
	if (settings.upload.behavior === FolderSettings.fixed) {
		repoFrontmatter.autoclean = false;
	}
	if (!frontmatter || (frontmatter.multipleRepo === undefined && frontmatter.repo === undefined)) {
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

export function getCategory(frontmatter: FrontMatterCache, settings: GitHubPublisherSettings) {
	const key = settings.upload.yamlFolderKey;
	let category = frontmatter[key] !== undefined ? frontmatter[key] : settings.upload.defaultName;
	if (category instanceof Array) {
		category = category.join("/");
	}
	return category;
}
