import i18next from "i18next";
import {FrontMatterCache, Notice, TFile} from "obsidian";
import GithubPublisher from "src/main";

import {GithubBranch} from "../GitHub/branch";
import {FrontmatterConvert, GitHubPublisherSettings, RepoFrontmatter, Repository} from "../settings/interface";
import {getRepoFrontmatter, noticeLog, verifyRateLimitAPI} from ".";

/**
 *  Check if the file is a valid file to publish
 * @param {string}  sharekey the key to check if the file is shared
 * @param {FrontMatterCache} frontmatter
 * @param {FrontmatterConvert} frontmatterSettings
 * @returns {boolean} true if the file can be published
 */
export function isInternalShared(
	sharekey: string | undefined,
	frontmatter: FrontMatterCache | undefined | null,
	frontmatterSettings: FrontmatterConvert
): boolean {
	if (!frontmatterSettings.convertInternalNonShared) return false;
	if (sharekey === undefined) return true;
	
	const shared =
		frontmatter?.[sharekey] ? frontmatter[sharekey] : false;
	if (shared) return true;
	return !shared;
}

export function getRepoSharedKey(settings: GitHubPublisherSettings, frontmatter?: FrontMatterCache): Repository | null{
	const allOtherRepo = settings.github.otherRepo;
	if (settings.plugin.shareAll!.enable && !frontmatter) {
		return defaultRepo(settings);
	} else if (!frontmatter) return null;
	//check all keys in the frontmatter
	for (const repo of allOtherRepo) {
		if (frontmatter[repo.shareKey]) {
			return repo;
		}
	}
	return defaultRepo(settings);
}

/**
 * Disable publishing if the file hasn't a valid frontmatter or if the file is in the folder list to ignore
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
	if (!settings.plugin.shareAll || !settings.plugin.shareAll?.enable) {
		const shareKey = otherRepo ? otherRepo.shareKey : settings.plugin.shareKey;
		if ( meta == null || meta[shareKey] === undefined || isExcludedPath(settings, file)) {
			return false;
		} return meta[shareKey];
	} else if (settings.plugin.shareAll!.enable) {
		const excludedFileName = settings.plugin.shareAll!.excludedFileName;
		if (!file.basename.startsWith(excludedFileName) && !isExcludedPath(settings, file)) {
			return true;
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
function isExcludedPath(settings: GitHubPublisherSettings, file: TFile):boolean {
	const excludedFolder = settings.plugin.excludedFolder;
	for (const folder of excludedFolder) {
		const isRegex = folder.match(/^\/(.*)\/[igmsuy]*$/);
		const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
		if ((regex && regex.test(file.path)) || file.path.contains(folder.trim())) {
			return true;
		}
	}
	return false;
}


/**
 * Allow to get all sharedKey from one file to count them
 */
export function multipleSharedKey(frontmatter: FrontMatterCache | undefined, settings: GitHubPublisherSettings) {
	const keysInFile: string[] = [];
	if (settings.plugin.shareAll?.enable)
		keysInFile.push("share"); //add a key to count the shareAll
	
	const otherRepoWithShareAll = settings.github.otherRepo.filter((repo) => repo.shareAll);
	if (otherRepoWithShareAll.length > 0) {
		for (const repo of otherRepoWithShareAll) {
			keysInFile.push(repo.smartKey);
		}
	}
	if (!frontmatter) return keysInFile;
	const allKey = settings.github.otherRepo.map((repo) => repo.shareKey);
	allKey.push(settings.plugin.shareKey);
	
	for (const key of allKey) {
		if (frontmatter[key]) {
			keysInFile.push(key);
		}
	}

	return keysInFile;
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

export function isAttachment(filename: string) {
	return filename.match(
		/(png|jpe?g|gif|bmp|svg|mp[34]|web[mp]|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf)$/i
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
) {
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
export function noTextConversion(conditionConvert: FrontmatterConvert) {
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
 * @param {GitHubPublisherSettings} settings The settings of the plugin
 * @param repository
 * @param { TFile | null} file The file to check if any
 * @param {MetadataCache} metadataCache The metadata cache of Obsidian
 * @param silent
 * @return {Promise<void>}
 */
export async function checkRepositoryValidity(
	PublisherManager: GithubBranch,
	repository: Repository | null = null,
	file: TFile | null,
	silent=false): Promise<boolean> {
	const settings = PublisherManager.settings;
	const metadataCache = PublisherManager.plugin.app.metadataCache;
	try {
		const frontmatter = file ? metadataCache.getFileCache(file)?.frontmatter : undefined;
		const repoFrontmatter = getRepoFrontmatter(settings, repository, frontmatter);
		const isNotEmpty = await checkEmptyConfiguration(repoFrontmatter, PublisherManager.plugin, silent);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(repoFrontmatter, silent);
			return true;
		}
	}
	catch (e) {
		noticeLog(e, settings);
		return false;
	}
	return false;
}

/**
 * Check the validity of the repository settings, from the frontmatter of the file or from the settings of the plugin
 * @param {GithubBranch} PublisherManager
 * @param {GitHubPublisherSettings} settings
 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter
 * @param {number} numberOfFile
 * @return {Promise<boolean>}
 */
export async function checkRepositoryValidityWithRepoFrontmatter(
	PublisherManager: GithubBranch,
	repoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	numberOfFile=1
): Promise<boolean> {
	const settings = PublisherManager.settings;
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
		noticeLog(e, settings);
		return false;
	}
	return false;
}

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
