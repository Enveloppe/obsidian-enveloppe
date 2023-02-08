import {FrontMatterCache, Notice } from "obsidian";
import {FrontmatterConvert, GitHubPublisherSettings, RepoFrontmatter} from "../settings/interface";
import {error, StringFunc, t} from "../i18n";

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

export function isShared(frontmatter: FrontMatterCache, sharekey: string): boolean {
	return frontmatter && frontmatter[sharekey] !== undefined && frontmatter[sharekey];
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
		const whatIsEmpty = t("error.whatEmpty.ghToken") as string;
		new Notice((error("isEmpty") as StringFunc)(whatIsEmpty));
	}
	if (settings.github.token.length != 0) {
		for (const repo of repoFrontmatter) {
			if (repo.repo.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = t("error.whatEmpty.repo") as string;
				new Notice((error("isEmpty") as StringFunc)(whatIsEmpty));
			} else if (repo.owner.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = t("error.whatEmpty.owner") as string;
				new Notice((error("isEmpty") as StringFunc)(whatIsEmpty));
			} else if (repo.branch.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = t("error.whatEmpty.branch") as string;
				new Notice((error("isEmpty") as StringFunc)(whatIsEmpty));
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
