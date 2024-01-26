import { Octokit } from "@octokit/core";
import i18next from "i18next";
import { FrontMatterCache, normalizePath,Notice, TFile, TFolder} from "obsidian";
import GithubPublisher from "src/main";

import {GithubBranch} from "../GitHub/branch";
import {FIND_REGEX, FrontmatterConvert, GitHubPublisherSettings, MultiProperties, RepoFrontmatter, Repository} from "../settings/interface";
import {logs, notif} from ".";
import { frontmatterFromFile, getLinkedFrontmatter, getRepoFrontmatter } from "./parse_frontmatter";

/**
 * - Check if the file is a valid file to publish
 * - Check also the path from the excluded folder list
 * - Always return true if nonShared is true
 * - Return the share state otherwise
 * @param {FrontMatterCache} frontmatter
 * @param {MultiProperties} properties
 * @param {TFile} file (for the excluded file name & filepath)
 * @returns {boolean} true if the file can be published
 */
export function isInternalShared(
	frontmatter: FrontMatterCache | undefined | null,
	properties: MultiProperties,
	file: TFile,
): boolean {
	const frontmatterSettings = properties.frontmatter.general;
	if (frontmatterSettings.unshared) {
		return true;
	}

	if (properties.repository?.shareAll?.enable)
	{
		const excludedFileName = properties.repository.shareAll.excludedFileName;
		return !file.basename.startsWith(excludedFileName) && !isInDryRunFolder(properties.plugin.settings, properties.repository, file);
	}
	if (!frontmatter) return false;
	if (isExcludedPath(properties.plugin.settings, file, properties.repository)) return false;
	const shareKey = properties.repository?.shareKey || properties.plugin.settings.plugin.shareKey;
	logs({settings: properties.plugin.settings}, "shareKey", shareKey, "frontmatter", frontmatter[shareKey]);
	if (frontmatter[shareKey] == null || frontmatter[shareKey] === undefined || ["false", "0", "no"].includes(frontmatter[shareKey].toString().toLowerCase())) return false;
	return ["true", "1", "yes"].includes(frontmatter[shareKey].toString().toLowerCase());

}
/**
 * Retrieves the shared key for a repository based on the provided settings, app, frontmatter, and file.
 * @param plugin - The GitHub Publisher plugin instance.
 * @param frontmatter - The FrontMatterCache object representing the frontmatter of the file.
 * @param file - The TFile object representing the file being processed.
 * @returns The Repository object representing the repository with the shared key, or null if no repository is found.
 */
export function getRepoSharedKey(plugin: GithubPublisher, frontmatter?: FrontMatterCache | null, file?: TFile): Repository | null{
	const {settings} = plugin;
	const allOtherRepo = settings.github.otherRepo;
	if (settings.plugin.shareAll?.enable && !frontmatter) {
		return defaultRepo(settings);
	} else if (!frontmatter) return null;
	const linkedFrontmatter = getLinkedFrontmatter(frontmatter, file, plugin);
	frontmatter = linkedFrontmatter ? {...linkedFrontmatter, ...frontmatter} : frontmatter;
	for (const repo of allOtherRepo) {
		if (frontmatter[repo.shareKey]) {
			return repo;
		}
	}
	logs({settings}, "No other repo found, using default repo");
	return defaultRepo(settings);
}

/**
 * - Disable publishing if the file hasn't a valid frontmatter or if the file is in the folder list to ignore
 * - Check if the file is in the excluded file list
 * - Verify for all Repository if the file is shared
 * @param {FrontMatterCache} meta the frontmatter of the file
 * @param {GitHubPublisherSettings} settings
 * @param {TFile} file
 * @param otherRepo
 * @returns {boolean} the value of meta[settings.shareKey] or false if the file is in the ignore list/not valid
 */

export function isShared(
	meta: FrontMatterCache | undefined | null,
	settings: GitHubPublisherSettings,
	file: TFile,
	otherRepo: Repository|null
): boolean {
	if (!file || file.extension !== "md") {
		return false;
	}
	const otherRepoWithShareAll = settings.github.otherRepo.filter((repo) => repo.shareAll?.enable);
	if (!settings.plugin.shareAll?.enable && otherRepoWithShareAll.length === 0) {
		const shareKey = otherRepo ? otherRepo.shareKey : settings.plugin.shareKey;
		if ( meta == null || !meta[shareKey] || meta[shareKey] == null || isExcludedPath(settings, file, otherRepo) || meta[shareKey] === undefined || ["false", "0", "no"].includes(meta[shareKey].toString().toLowerCase())) {
			return false;
		}
		const shareKeyInFrontmatter:string = meta[shareKey].toString().toLowerCase();
		return ["true", "1", "yes"].includes(shareKeyInFrontmatter);
	} else if (settings.plugin.shareAll?.enable || otherRepoWithShareAll.length > 0) {
		const allExcludedFileName = otherRepoWithShareAll.map((repo) => repo.shareAll!.excludedFileName);
		allExcludedFileName.push(settings.plugin.shareAll!.excludedFileName);
		if (allExcludedFileName.some(prefix => prefix.trim().length > 0 && !file.basename.startsWith(prefix) || prefix.trim().length === 0)) {
			return !isExcludedPath(settings, file, otherRepo);
		}
	}
	return false;
}
/**
 * Check if a file is in an excluded folder
 * @param settings {GitHubPublisherSettings}
 * @param file {TFile}
 * @returns boolean
 */
export function isExcludedPath(settings: GitHubPublisherSettings, file: TFile | TFolder, repository: Repository | null):boolean {
	const excludedFolder = settings.plugin.excludedFolder;
	if (settings.plugin.shareAll?.enable || repository?.shareAll?.enable) {
		const excludedFromShare = repository?.shareAll?.excludedFileName ?? settings.plugin.shareAll?.excludedFileName;
		if (excludedFromShare && file.name.startsWith(excludedFromShare)) {
			return true;
		}
	}
	for (const folder of excludedFolder) {
		const isRegex = folder.match(FIND_REGEX);
		const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
		if ((regex?.test(file.path)) || file.path.contains(folder.trim())) {
			return true;
		}
	}
	return isInDryRunFolder(settings, repository, file);
}


/**
 * Allow to get all sharedKey from one file to count them
 *
 * @param {FrontMatterCache | undefined} frontmatter - The frontmatter of the file.
 * @param {GitHubPublisherSettings} settings - The GitHub Publisher settings.
 * @param {TFile | null} file - The file to get the shared keys from.
 * @param {App} app - The Obsidian app instance.
 * @returns {string[]} - An array of shared keys found in the file.
 */
export function multipleSharedKey(frontmatter: FrontMatterCache | undefined | null, file: TFile | null, plugin: GithubPublisher): string[] {
	const keysInFile: string[] = [];
	const {settings} = plugin;
	if (settings.plugin.shareAll?.enable)
		keysInFile.push("share"); //add a key to count the shareAll

	const otherRepoWithShareAll = settings.github.otherRepo.filter((repo) => repo.shareAll);
	if (otherRepoWithShareAll.length > 0) {
		for (const repo of otherRepoWithShareAll) {
			keysInFile.push(repo.smartKey);
		}
	}
	if (!frontmatter) return keysInFile;
	const linkedRepo = getLinkedFrontmatter(frontmatter, file, plugin);
	frontmatter = linkedRepo ? {...linkedRepo, ...frontmatter} : frontmatter;
	const allKey = settings.github.otherRepo.map((repo) => repo.shareKey);
	allKey.push(settings.plugin.shareKey);

	for (const key of allKey) {
		if (frontmatter[key]) {
			keysInFile.push(key);
		}
	}
	//remove duplicate
	return [...new Set(keysInFile)];
}

/**
 * Check if the file is an attachment file and return the regexMatchArray
 * Attachment files are :
 * - png
 * - jpg et jpeg
 * - gif
 * - svg
 * - pdf
 * - mp4 and mp3
 * - webm & webp
 * - wav
 * - ogg
 * - m4a
 * - 3gp
 * - flac
 * - mov
 * - mkv
 * - ogv
 * @param {string} filename
 * @return {RegExpMatchArray}
 */

export function isAttachment(filename: string): RegExpMatchArray | null {
	if (filename.includes("excalidraw")) return filename.match(/excalidraw\.md$/i);
	return filename.match(
		/(png|jpe?g|gif|bmp|svg|mp[34]|web[mp]|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf|excalidraw)$/i
	);
}

/**
 * Check if a target Repository === source Repository
 * @param {RepoFrontmatter | RepoFrontmatter[]} source
 * @param {RepoFrontmatter | RepoFrontmatter[]} target
 * @return {boolean} if they are the same
 */
export function checkIfRepoIsInAnother(
	source: RepoFrontmatter | RepoFrontmatter[],
	target: RepoFrontmatter | RepoFrontmatter[]
): boolean {
	source = source instanceof Array ? source : [source];
	target = target instanceof Array ? target : [target];

	/**
	 * A function to compare two repoFrontmatter
	 * @param {RepoFrontmatter} source
	 * @param {RepoFrontmatter} target
	 * @return {boolean}
	 */
	const isSame = (source: RepoFrontmatter, target: RepoFrontmatter) => {
		return (
			source.owner === target.owner &&
			source.repo === target.repo &&
			source.branch === target.branch
		);
	};

	for (const repoTarget of target) {
		for (const repoSource of source) {
			if (isSame(repoTarget, repoSource)) {
				return true;
			}
		}
	}
	for (const sourceRepo of source) {
		for (const targetRepo of target) {
			if (isSame(sourceRepo, targetRepo)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Verify if the Repository configuration is not empty
 * Permit to send a special notice for each empty configuration
 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter the repoFrontmatter to check
 * @param {GithubPublisher} plugin the plugin instance
 * @param silent
 * @return {Promise<boolean>}
 */
export async function checkEmptyConfiguration(repoFrontmatter: RepoFrontmatter | RepoFrontmatter[], plugin: GithubPublisher, silent= false): Promise<boolean> {
	repoFrontmatter = Array.isArray(repoFrontmatter)
		? repoFrontmatter
		: [repoFrontmatter];
	const isEmpty: boolean[] = [];
	const token = await plugin.loadToken();
	if (token.length === 0) {
		isEmpty.push(true);
		const whatIsEmpty = i18next.t("common.ghToken") ;
		if (!silent) new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
	}
	else {
		for (const repo of repoFrontmatter) {
			if (repo.repo.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("common.repository") ;
				if (!silent) new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
			} else if (repo.owner.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("error.whatEmpty.owner") ;
				if (!silent) new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
			} else if (repo.branch.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("error.whatEmpty.branch") ;
				if (!silent) new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
			} else {
				isEmpty.push(false);
			}
		}
	}
	const allInvalid = isEmpty.every((value) => value === true);
	return !allInvalid;
}

/**
 * Verify if the text need to bee converted or not
 * @param {FrontmatterConvert} conditionConvert The frontmatter option to check
 * @return {boolean} if the text need to be converted
 */
export function noTextConversion(conditionConvert: FrontmatterConvert): boolean {
	const convertWikilink = conditionConvert.convertWiki;
	const imageSettings = conditionConvert.attachment;
	const embedSettings = conditionConvert.embed;
	const convertLinks = conditionConvert.links;
	return !convertWikilink
		&& convertLinks
		&& imageSettings
		&& embedSettings
		&& !conditionConvert.removeEmbed;
}

/**
 * Check the validity of the repository settings, from the frontmatter of the file or from the settings of the plugin
 * It doesn't check if the repository allow to creating and merging branch, only if the repository and the main branch exists
 * @param {GithubBranch} PublisherManager The class that manage the branch
 * @param repository {Repository | null} The repository to check if any, if null, it will use the default repository {@link defaultRepo}
 * @param { TFile | null} file The file to check if any
 * @param silent {boolean} if the notice should be displayed
 * @return {Promise<void>}
 */
export async function checkRepositoryValidity(
	PublisherManager: GithubBranch,
	repository: Repository | null = null,
	file: TFile | null,
	silent: boolean=false): Promise<boolean> {
	const settings = PublisherManager.settings;
	try {
		const frontmatter = frontmatterFromFile(file, PublisherManager.plugin);
		const repoFrontmatter = getRepoFrontmatter(settings, repository, frontmatter);
		const isNotEmpty = await checkEmptyConfiguration(repoFrontmatter, PublisherManager.plugin, silent);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(repoFrontmatter, silent);
			return true;
		}
	}
	catch (e) {
		notif({settings, e: true}, e);
		return false;
	}
	return false;
}

/**
 * Check the validity of the repository settings, from the frontmatter of the file or from the settings of the plugin
 * @param {GithubBranch} PublisherManager
 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter
 * @param {number} numberOfFile the number of file to publish
 * @return {Promise<boolean>}
 */
export async function checkRepositoryValidityWithRepoFrontmatter(
	PublisherManager: GithubBranch,
	repoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	numberOfFile: number=1
): Promise<boolean> {
	const settings = PublisherManager.settings;
	if (settings.github.dryRun.enable) return true;
	try {
		/**
		 * verify for each repoFrontmatter if verifiedRepo is true
		 */
		let verified = false;
		if (repoFrontmatter instanceof Array) {
			verified = repoFrontmatter.every((repo) => {
				return repo.verifiedRepo;
			});
		} else if (repoFrontmatter.verifiedRepo) {
			verified = true;
		}
		if (verified && settings.github.rateLimit > 0) return true;
		const isNotEmpty = await checkEmptyConfiguration(repoFrontmatter, PublisherManager.plugin);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(repoFrontmatter, true);
			if (settings.github.rateLimit === 0 || numberOfFile > 20) {
				return await verifyRateLimitAPI(PublisherManager.octokit, settings, false, numberOfFile) > 0;
			}
			return true;
		}
	}
	catch (e) {
		notif({settings, e: true}, e);
		return false;
	}
	return false;
}

/**
 * Returns the default repository based on the provided settings.
 *
 * @param settings - The GitHubPublisherSettings object containing the configuration settings.
 * @returns The Repository object representing the default repository.
 */
export function defaultRepo(settings: GitHubPublisherSettings): Repository {
	return {
		smartKey: "default",
		user: settings.github.user,
		repo: settings.github.repo,
		branch: settings.github.branch,
		automaticallyMergePR: settings.github.automaticallyMergePR,
		verifiedRepo: settings.github.verifiedRepo,
		api: {
			tiersForApi: settings.github.api.tiersForApi,
			hostname: settings.github.api.hostname,
		},
		workflow: {
			commitMessage: settings.github.workflow.commitMessage,
			name: settings.github.workflow.name,
		},
		createShortcuts: false,
		shareKey: settings.plugin.shareKey.length > 0 ? settings.plugin.shareKey : "share",
		copyLink: {
			links: settings.plugin.copyLink.links,
			removePart: settings.plugin.copyLink.removePart,
		},
	};
}

/**
 * This function is used to verify the rate limit of the GitHub API.
 * It checks the remaining number of requests and the reset time of the rate limit.
 * If the remaining requests are less than or equal to the specified number of files,
 * it displays a notice indicating that the rate limit is limited.
 * Otherwise, it displays a notice indicating that the rate limit is not limited.
 * @param octokit - The Octokit instance used to make requests to the GitHub API.
 * @param settings - The settings object containing the rate limit configuration.
 * @param commands - Indicates whether the function is called from a command or not. Default is `false`.
 * @param numberOfFile - The number of files to be processed. Default is `1`.
 * @returns The remaining number of requests in the rate limit.
 */
export async function verifyRateLimitAPI(
	octokit: Octokit,
	settings: GitHubPublisherSettings,
	commands = false,
	numberOfFile = 1
): Promise<number> {
	const rateLimit = await octokit.request("GET /rate_limit");
	const remaining = rateLimit.data.resources.core.remaining;
	const reset = rateLimit.data.resources.core.reset;
	const date = new Date(reset * 1000);
	const time = date.toLocaleTimeString();

	if (remaining <= numberOfFile) {
		new Notice(i18next.t("commands.checkValidity.rateLimit.limited", { resetTime: time }));
		return 0;
	}

	const message = i18next.t("commands.checkValidity.rateLimit.notLimited", {
		remaining,
		resetTime: time
	});

	if (commands) {
		new Notice(message);
	} else {
		notif({ settings }, message);
	}

	return remaining;
}

/**
 * Determines if an attachment file needs to be force pushed based on the provided settings.
 *
 * @param file - The attachment file to check.
 * @param settings - The GitHub Publisher settings.
 * @returns True if the attachment file needs to be force pushed, false otherwise.
 */
export function forcePushAttachment(file: TFile, settings: GitHubPublisherSettings):boolean {
	const needToBeForPush = settings.embed.overrideAttachments.filter((path) => {
		const isRegex = path.path.match(FIND_REGEX);
		const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
		return (
			path.forcePush &&(
				regex?.test(file.path)
				|| file.path === path.path
				|| path.path.contains("{{all}}")
			)
		);
	});
	if (needToBeForPush.length === 0) return false;
	return true;
}

/**
 * Checks if a file is a folder note based on certain conditions.
 * @param properties - An object containing the properties for the file and settings.
 * @returns True if the file is a folder note, false otherwise.
 */
export function isFolderNote(properties: MultiProperties): boolean {
	const {filepath } = properties;
	const { settings } = properties.plugin;
	const { enable, rename } = settings.upload.folderNote;

	if (enable) {
		const filename = filepath.split("/").pop();
		return filename === rename;
	}

	return false;
}

/**
 * Checks if a file or folder is located within the dry run folder specified in the GitHub Publisher settings.
 *
 * @param settings - The GitHub Publisher settings.
 * @param repo - The repository information. If null, the default repository information from the settings will be used.
 * @param file - The file or folder to check.
 * @returns True if the file or folder is located within the dry run folder, false otherwise.
 */
export function isInDryRunFolder(settings: GitHubPublisherSettings, repo: Repository | null, file: TFile | TFolder) {
	if (settings.github.dryRun.folderName.trim().length ===0) return false;
	const variables = {
		owner: repo?.user ?? settings.github.user,
		repo: repo?.repo ?? settings.github.repo,
		branch: repo?.branch ?? settings.github.branch,
	};
	const folder = settings.github.dryRun.folderName
		.replace("{{owner}}", variables.owner)
		.replace("{{repo}}", variables.repo)
		.replace("{{branch}}", variables.branch);
	return file.path.startsWith(normalizePath(folder));
}