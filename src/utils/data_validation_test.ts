import i18next from "i18next";
import {FrontMatterCache, MetadataCache,Notice, TFile } from "obsidian";
import GithubPublisher from "src/main";

import {GithubBranch} from "../publish/branch";
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
	sharekey: string,
	frontmatter: FrontMatterCache,
	frontmatterSettings: FrontmatterConvert
): boolean {
	const shared =
		frontmatter && frontmatter[sharekey] ? frontmatter[sharekey] : false;
	if (shared) return true;
	return !shared && frontmatterSettings.convertInternalNonShared === true;
}

export function getRepoSharedKey(settings: GitHubPublisherSettings, frontmatter?: FrontMatterCache): Repository | null{
	const allOtherRepo = settings.github.otherRepo;
	if (!frontmatter) return null;
	//check all keys in the frontmatter
	for (const repo of allOtherRepo) {
		if (frontmatter[repo.shareKey]) {
			return repo;
		}
	}
	return null;
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
	if (!file || file.extension !== "md" || meta === null) {
		return false;
	}
	const folderList = settings.plugin.excludedFolder;
	const shareKey = otherRepo ? otherRepo.shareKey : settings.plugin.shareKey;
	if (meta === undefined || meta[shareKey] === undefined) {
		return false;
	} else if (folderList.length > 0) {
		for (let i = 0; i < folderList.length; i++) {
			const isRegex = folderList[i].match(/^\/(.*)\/[igmsuy]*$/);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
			if ((regex && regex.test(file.path)) || file.path.contains(folderList[i].trim())) {
				return false;
			}
		}
	}
	return meta[shareKey];
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
	settings: GitHubPublisherSettings,
	repository: Repository | null = null,
	file: TFile | null,
	metadataCache: MetadataCache,
	silent=false): Promise<boolean> {
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
	settings: GitHubPublisherSettings,
	repoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	numberOfFile=1
): Promise<boolean> {
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
