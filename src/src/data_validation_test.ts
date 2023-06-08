import {FrontMatterCache, Notice, TFile, MetadataCache } from "obsidian";
import {FrontmatterConvert, GitHubPublisherSettings, RepoFrontmatter, Repository} from "../settings/interface";
import {GithubBranch} from "../publish/branch";
import {getRepoFrontmatter, noticeLog, verifyRateLimitAPI} from "./utils";
import i18next from "i18next";

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
	meta: FrontMatterCache | null,
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


export function checkEmptyConfiguration(repoFrontmatter: RepoFrontmatter | RepoFrontmatter[], settings: GitHubPublisherSettings) {
	repoFrontmatter = Array.isArray(repoFrontmatter)
		? repoFrontmatter
		: [repoFrontmatter];
	const isEmpty: boolean[]	= [];
	if (settings.github.token.length === 0) {
		isEmpty.push(true);
		const whatIsEmpty = i18next.t("common.ghToken") ;
		new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
	}
	if (settings.github.token.length != 0) {
		for (const repo of repoFrontmatter) {
			if (repo.repo.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("common.repository") ;
				new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
			} else if (repo.owner.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("error.whatEmpty.owner") ;
				new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
			} else if (repo.branch.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("error.whatEmpty.branch") ;
				new Notice(i18next.t("error.isEmpty", {what: whatIsEmpty}));
			} else {
				isEmpty.push(false);
			}
		}
	}
	const allInvalid = isEmpty.every((value) => value === true);
	return !allInvalid;
}

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
 * @param {string} branchName The branch name created by the plugin
 * @param {GithubBranch} PublisherManager The class that manage the branch
 * @param {GitHubPublisherSettings} settings The settings of the plugin
 * @param repository
 * @param { TFile | null} file The file to check if any
 * @param {MetadataCache} metadataCache The metadata cache of Obsidian
 * @return {Promise<void>}
 */
export async function checkRepositoryValidity(
	branchName: string,
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	repository: Repository | null = null,
	file: TFile | null,
	metadataCache: MetadataCache): Promise<void> {
	try {
		const frontmatter = file ? metadataCache.getFileCache(file)?.frontmatter : null;
		const repoFrontmatter = getRepoFrontmatter(settings, repository, frontmatter);
		const isNotEmpty = checkEmptyConfiguration(repoFrontmatter, settings);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(repoFrontmatter, false);
		}
	}
	catch (e) {
		noticeLog(e, settings);
	}
}

export async function checkRepositoryValidityWithRepoFrontmatter(
	PublisherManager: GithubBranch,
	settings: GitHubPublisherSettings,
	repoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	numberOfFile=1
): Promise<boolean> {
	try {
		const isNotEmpty = checkEmptyConfiguration(repoFrontmatter, settings);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(repoFrontmatter, true);
			return await verifyRateLimitAPI(PublisherManager.octokit, settings, false, numberOfFile);
		}
	}
	catch (e) {
		noticeLog(e, settings);
		return false;
	}
}
