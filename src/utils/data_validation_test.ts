import {
	type EnveloppeSettings,
	FIND_REGEX,
	GithubTiersVersion,
	type MultiProperties,
	type Properties,
	type PropertiesConversion,
	type Repository,
} from "@interfaces";
import type { Octokit } from "@octokit/core";
import type { RequestError } from "@octokit/request-error";
import i18next from "i18next";
import {
	type FrontMatterCache,
	Notice,
	normalizePath,
	type TFile,
	type TFolder,
} from "obsidian";
import type { GithubBranch } from "src/GitHub/branch";
import type Enveloppe from "src/main";
import {
	frontmatterFromFile,
	getLinkedFrontmatter,
	getProperties,
	mergeFrontmatter,
} from "src/utils/parse_frontmatter";
import { escapeRegex } from "../conversion/links";
import { EnveloppeErrors } from "./logs";

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
	file: TFile
): boolean {
	const frontmatterSettings = properties.frontmatter.general;
	if (frontmatterSettings.unshared) {
		return true;
	}

	if (properties.repository?.shareAll?.enable) {
		const excludedFileName = properties.repository.shareAll.excludedFileName;
		return (
			!file.basename.startsWith(excludedFileName) &&
			!isInDryRunFolder(properties.plugin.settings, properties.repository, file)
		);
	}
	if (!frontmatter) return false;
	if (isExcludedPath(properties.plugin.settings, file, properties.repository))
		return false;
	const shareKey =
		properties.repository?.shareKey || properties.plugin.settings.plugin.shareKey;
	if (
		frontmatter?.[shareKey] == null ||
		["false", "0", "no"].includes(String(frontmatter[shareKey]).toLowerCase())
	)
		return false;
	return ["true", "1", "yes"].includes(String(frontmatter[shareKey]).toLowerCase());
}
/**
 * Retrieves the shared key for a repository based on the provided settings, app, frontmatter, and file.
 * @param plugin - The Enveloppe plugin instance.
 * @param frontmatter - The FrontMatterCache object representing the frontmatter of the file.
 * @param file - The TFile object representing the file being processed.
 * @returns The Repository object representing the repository with the shared key, or null if no repository is found.
 */
export function getRepoSharedKey(
	plugin: Enveloppe,
	frontmatter?: FrontMatterCache | null,
	file?: TFile
): Repository | null {
	const { settings } = plugin;
	const allOtherRepo = settings.github.otherRepo;
	if (settings.plugin.shareAll?.enable && !frontmatter) {
		return defaultRepo(settings);
	} else if (!frontmatter) return null;
	const linkedFrontmatter = getLinkedFrontmatter(frontmatter, file, plugin);
	frontmatter = mergeFrontmatter(
		frontmatter,
		linkedFrontmatter,
		settings.plugin.shareKey
	);
	return (
		allOtherRepo.find((repo) => frontmatter?.[repo.shareKey]) ?? defaultRepo(settings)
	);
}

/**
 * - Disable publishing if the file hasn't a valid frontmatter or if the file is in the folder list to ignore
 * - Check if the file is in the excluded file list
 * - Verify for all Repository if the file is shared
 * @param {FrontMatterCache} meta the frontmatter of the file
 * @param {EnveloppeSettings} settings
 * @param {TFile} file
 * @param otherRepo
 * @returns {boolean} the value of meta[settings.shareKey] or false if the file is in the ignore list/not valid
 */

export function isShared(
	meta: FrontMatterCache | undefined | null,
	settings: EnveloppeSettings,
	file: TFile,
	otherRepo: Repository | null
): boolean {
	if (!file || file.extension !== "md" || file.name.endsWith(".excalidraw.md"))
		return false;

	const otherRepoWithShareAll = settings.github.otherRepo.filter(
		(repo) => repo.shareAll?.enable
	);
	if (!settings.plugin.shareAll?.enable && !otherRepoWithShareAll.length) {
		const shareKey = otherRepo ? otherRepo.shareKey : settings.plugin.shareKey;
		if (
			meta == null ||
			meta?.[shareKey] == null ||
			isExcludedPath(settings, file, otherRepo) ||
			["false", "0", "no"].includes(String(meta[shareKey]).toLowerCase())
		) {
			return false;
		}
		const shareKeyInFrontmatter: string = String(meta[shareKey]).toLowerCase();
		return ["true", "1", "yes"].includes(shareKeyInFrontmatter);
	} else if (settings.plugin.shareAll?.enable || otherRepoWithShareAll.length > 0) {
		const allExcludedFileName = otherRepoWithShareAll.map(
			(repo) => repo.shareAll!.excludedFileName
		);
		allExcludedFileName.push(settings.plugin.shareAll!.excludedFileName);
		if (
			allExcludedFileName.some(
				(prefix) =>
					(prefix.trim().length > 0 && !file.basename.startsWith(prefix)) ||
					prefix.trim().length === 0
			)
		) {
			return !isExcludedPath(settings, file, otherRepo);
		}
	}
	return false;
}
/**
 * Check if a file is in an excluded folder
 * @param settings {EnveloppeSettings}
 * @param file {TFile}
 * @param repository
 * @returns boolean
 */
export function isExcludedPath(
	settings: EnveloppeSettings,
	file: TFile | TFolder,
	repository: Repository | null
): boolean {
	const excludedFolder = settings.plugin.excludedFolder;
	if (settings.plugin.shareAll?.enable || repository?.shareAll?.enable) {
		const excludedFromShare =
			repository?.shareAll?.excludedFileName ??
			settings.plugin.shareAll?.excludedFileName;
		if (excludedFromShare && file.name.startsWith(excludedFromShare)) {
			return true;
		}
	}
	for (const folder of excludedFolder) {
		const isRegex = folder.match(FIND_REGEX);
		const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
		if (regex?.test(file.path) || file.path.contains(folder.trim())) {
			return true;
		}
	}
	return isInDryRunFolder(settings, repository, file);
}

/**
 * Allow to get all sharedKey from one file to count them
 *
 * @param {FrontMatterCache | undefined} frontmatter - The frontmatter of the file.
 * @param {TFile | null} file - The file to get the shared keys from.
 * @param plugin
 * @returns {string[]} - An array of shared keys found in the file.
 */
export function multipleSharedKey(
	frontmatter: FrontMatterCache | undefined | null,
	file: TFile | null,
	plugin: Enveloppe
): string[] {
	const keysInFile: string[] = [];
	const { settings } = plugin;
	if (settings.plugin.shareAll?.enable) keysInFile.push("share"); //add a key to count the shareAll

	for (const repo of settings.github.otherRepo) {
		if (repo.shareAll?.enable) keysInFile.push(repo.smartKey);
	}
	if (!frontmatter) return keysInFile;
	const linkedRepo = getLinkedFrontmatter(frontmatter, file, plugin);
	frontmatter = mergeFrontmatter(frontmatter, linkedRepo, settings.plugin.shareKey);
	const allKey = settings.github.otherRepo.map((repo) => repo.shareKey);
	allKey.push(settings.plugin.shareKey);

	for (const key of allKey) {
		if (frontmatter?.[key]) {
			keysInFile.push(key);
		}
	}
	//remove duplicate
	return [...new Set(keysInFile)];
}

/**
 * Check if the file is an attachment file and return the regexMatchArray.
 * It also supports for external attachment (not handled natively by Obsidian) from the settings
 * @info
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
 * @param {string} filename - The name of the file (extension, or full path. Extension is included)
 * @param {string[]} [attachmentExtern] - The list of external attachment from settings
 * @return {RegExpMatchArray}
 */

export function isAttachment(
	filename: string,
	attachmentExtern?: string[]
): RegExpMatchArray | null {
	if (filename.match(/excalidraw\.md$/i)) return filename.match(/excalidraw\.md$/i);
	if (attachmentExtern && attachmentExtern.length > 0) {
		for (const att of attachmentExtern) {
			const naturalExt = new RegExp(`\\.${escapeRegex(att)}$`, "i");
			const isRegex = att.match(FIND_REGEX);
			if (isRegex) {
				const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
				if (regex?.test(filename)) return filename.match(regex);
			} else if (filename.match(naturalExt)) return filename.match(naturalExt);
		}
	}
	return filename.match(
		/(png|jpe?g|gif|bmp|svg|mp[34]|web[mp]|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf|excalidraw)$/i
	);
}

/**
 * Check if a target Repository === source Repository
 * @param {Properties | Properties[]} source
 * @param {Properties | Properties[]} target
 * @return {boolean} if they are the same
 */
export function checkIfRepoIsInAnother(
	source: Properties | Properties[],
	target: Properties | Properties[]
): boolean {
	const sources = Array.isArray(source) ? source : [source];
	const targets = Array.isArray(target) ? target : [target];
	return sources.some((s) =>
		targets.some((t) => s.owner === t.owner && s.repo === t.repo && s.branch === t.branch)
	);
}

/**
 * Keep only the repositories of a note that are targeted by the current publication.
 * A note set to another repository in its frontmatter is published there, never in the caller's one.
 * @param {Properties | Properties[]} noteRepos repositories resolved from the note frontmatter
 * @param {Properties | Properties[]} target repositories the caller is publishing to
 * @return {Properties[]} the note's own properties for each targeted repository
 */
export function getPublishTargets(
	noteRepos: Properties | Properties[],
	target: Properties | Properties[]
): Properties[] {
	const repos = Array.isArray(noteRepos) ? noteRepos : [noteRepos];
	return repos.filter((repo) => checkIfRepoIsInAnother(repo, target));
}

/**
 * Verify if the Repository configuration is not empty
 * Permit to send a special notice for each empty configuration
 * @param {Properties | Properties[]} prop the prop to check
 * @param {Enveloppe} plugin the plugin instance
 * @param silent
 * @return {Promise<boolean>}
 */
export async function checkEmptyConfiguration(
	prop: Properties | Properties[],
	plugin: Enveloppe,
	silent = false
): Promise<boolean> {
	prop = Array.isArray(prop) ? prop : [prop];
	const isEmpty: boolean[] = [];
	const token = await plugin.loadToken();
	if (token.length === 0) {
		isEmpty.push(true);
		const whatIsEmpty = i18next.t("common.ghToken");
		if (!silent)
			new Notice(
				i18next.t("error.isEmpty", { what: whatIsEmpty }),
				plugin.settings.plugin.noticeLength
			);
	} else {
		for (const repo of prop) {
			if (repo.repo.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("common.repository");
				if (!silent)
					new Notice(
						i18next.t("error.isEmpty", { what: whatIsEmpty }),
						plugin.settings.plugin.noticeLength
					);
			} else if (repo.owner.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("error.whatEmpty.owner");
				if (!silent)
					new Notice(
						i18next.t("error.isEmpty", { what: whatIsEmpty }),
						plugin.settings.plugin.noticeLength
					);
			} else if (repo.branch.length === 0) {
				isEmpty.push(true);
				const whatIsEmpty = i18next.t("error.whatEmpty.branch");
				if (!silent)
					new Notice(
						i18next.t("error.isEmpty", { what: whatIsEmpty }),
						plugin.settings.plugin.noticeLength
					);
			} else {
				isEmpty.push(false);
			}
		}
	}
	const allInvalid = isEmpty.every((value) => value);
	return !allInvalid;
}

/**
 * Verify if the text need to bee converted or not
 * @param {PropertiesConversion} conditionConvert The frontmatter option to check
 * @return {boolean} if the text need to be converted
 */
export function noTextConversion(conditionConvert: PropertiesConversion): boolean {
	const convertWikilink = conditionConvert.convertWiki;
	const imageSettings = conditionConvert.attachment;
	const embedSettings = conditionConvert.embed;
	const convertLinks = conditionConvert.links;
	return (
		!convertWikilink &&
		convertLinks &&
		imageSettings &&
		embedSettings &&
		!conditionConvert.removeEmbed
	);
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
	silent: boolean = false
): Promise<boolean> {
	try {
		const frontmatter = frontmatterFromFile(file, PublisherManager.plugin, repository);
		const prop = getProperties(PublisherManager.plugin, repository, frontmatter);
		const isNotEmpty = await checkEmptyConfiguration(
			prop,
			PublisherManager.plugin,
			silent
		);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(prop, silent);
			return true;
		}
	} catch (e) {
		PublisherManager.console.error(e as Error);
		return false;
	}
	return false;
}

/**
 * Check the validity of the repository settings, from the frontmatter of the file or from the settings of the plugin
 * @param {GithubBranch} PublisherManager
 * @param {Properties} prop
 * @param {number} numberOfFile the number of file to publish
 * @return {Promise<boolean>}
 */
export async function checkRepositoryValidityWithProperties(
	PublisherManager: GithubBranch,
	prop: Properties,
	numberOfFile: number = 1
): Promise<boolean> {
	const settings = PublisherManager.settings;
	if (settings.github.dryRun.enable) return true;
	try {
		const verified = prop.verifiedRepo;
		const rateLimit = prop.rateLimit;
		if (verified && rateLimit) return true;
		const isNotEmpty = await checkEmptyConfiguration(prop, PublisherManager.plugin);
		if (isNotEmpty) {
			await PublisherManager.checkRepository(prop, true);
			if (prop?.rateLimit === 0 || numberOfFile > 20) {
				return (
					(await verifyRateLimitAPI(
						PublisherManager.octokit,
						PublisherManager.plugin,
						false,
						numberOfFile
					)) > 0
				);
			}
			return true;
		}
	} catch (e) {
		PublisherManager.console.error(e as Error);
		return false;
	}
	return false;
}

/**
 * Returns the default repository based on the provided settings.
 *
 * @param settings - The EnveloppeSettings object containing the configuration settings.
 * @returns The Repository object representing the default repository.
 */
export function defaultRepo(settings: EnveloppeSettings): Repository {
	return {
		smartKey: "default",
		user: settings.github.user,
		repo: settings.github.repo,
		branch: settings.github.branch,
		automaticallyMergePR: settings.github.automaticallyMergePR,
		verifiedRepo: settings.github.verifiedRepo,
		rateLimit: settings.github.rateLimit,
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
			transform: {
				toUri: settings.plugin.copyLink.transform.toUri,
				slugify: settings.plugin.copyLink.transform.slugify,
				applyRegex: settings.plugin.copyLink.transform.applyRegex,
			},
		},
		set: null,
	};
}

export async function verifyToken(octokit: Octokit, owner: string) {
	try {
		await octokit.request("GET /user");
	} catch {
		throw new EnveloppeErrors(i18next.t("commands.checkValidity.errorToken", { owner }), {
			cause: "invalid token",
		});
	}
}

/**
 * This function is used to verify the rate limit of the GitHub API.
 * It checks the remaining number of requests and the reset time of the rate limit.
 * If the remaining requests are less than or equal to the specified number of files,
 * it displays a notice indicating that the rate limit is limited.
 * Otherwise, it displays a notice indicating that the rate limit is not limited.
 * @param octokit - The Octokit instance used to make requests to the GitHub API.
 * @param plugin
 * @param commands - Indicates whether the function is called from a command or not. Default is `false`.
 * @param numberOfFile - The number of files to be processed. Default is `1`.
 * @returns The remaining number of requests in the rate limit.
 */
export async function verifyRateLimitAPI(
	octokit: Octokit,
	plugin: Enveloppe,
	commands = false,
	numberOfFile = 1
): Promise<number> {
	const settings = plugin.settings;
	try {
		const rateLimit = await octokit.request("GET /rate_limit");
		const remaining = rateLimit.data.resources.core.remaining;
		const reset = rateLimit.data.resources.core.reset;
		const date = new Date(reset * 1000);
		const time = date.toLocaleTimeString();

		if (remaining <= numberOfFile) {
			new Notice(
				i18next.t("commands.checkValidity.rateLimit.limited", { resetTime: time }),
				settings.plugin.noticeLength
			);
			return 0;
		}

		const message = i18next.t("commands.checkValidity.rateLimit.notLimited", {
			remaining,
			resetTime: time,
		});

		if (commands) new Notice(message, settings.plugin.noticeLength);
		else plugin.console.info(message);

		return remaining;
	} catch (error) {
		//if the error is 404 and user use enterprise, it's normal
		const requestError = error as RequestError;
		if (
			requestError.status === 404 &&
			settings.github.api.tiersForApi === GithubTiersVersion.Entreprise &&
			(requestError.response?.data as { message?: string })?.message ===
				"Rate limiting is not enabled." &&
			requestError.name === "HttpError"
		)
			return 5000;
		else if (requestError.status !== 401) plugin.console.error(error as Error);
		return 0;
	}
}

/**
 * Determines if an attachment file needs to be force pushed based on the provided settings.
 *
 * @param file - The attachment file to check.
 * @param settings - The Enveloppe settings.
 * @returns True if the attachment file needs to be force pushed, false otherwise.
 */
export function forcePushAttachment(file: TFile, settings: EnveloppeSettings): boolean {
	const needToBeForPush = settings.embed.overrideAttachments.filter((path) => {
		const isRegex = path.path.match(FIND_REGEX);
		const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
		return (
			path.forcePush &&
			(regex?.test(file.path) || file.path === path.path || path.path.contains("{{all}}"))
		);
	});
	return needToBeForPush.length !== 0;
}

/**
 * Checks if a file is a folder note based on certain conditions.
 * @param properties - An object containing the properties for the file and settings.
 * @returns True if the file is a folder note, false otherwise.
 */
export function isFolderNote(properties: MultiProperties): boolean {
	const { filepath } = properties;
	const { settings } = properties.plugin;
	const { enable, rename } = settings.upload.folderNote;

	if (enable) {
		const filename = filepath.split("/").pop();
		return filename === rename;
	}

	return false;
}

/**
 * Resolve the dry-run folder, replacing the `{{owner}}`, `{{repo}}` and `{{branch}}` variables.
 * Falls back to "enveloppe" so a dry run never writes at the root of the vault.
 */
export function getDryRunFolder(
	folderName: string,
	target: { owner: string; repo: string; branch: string }
): string {
	const folder = folderName.trim().length > 0 ? folderName : "enveloppe";
	return normalizePath(
		folder
			.replaceAll("{{owner}}", target.owner)
			.replaceAll("{{repo}}", target.repo)
			.replaceAll("{{branch}}", target.branch)
	);
}

/**
 * Checks if a file or folder is located within the dry run folder specified in the Enveloppe settings.
 *
 * @param settings - The Enveloppe settings.
 * @param repo - The repository information. If null, the default repository information from the settings will be used.
 * @param file - The file or folder to check.
 * @returns True if the file or folder is located within the dry run folder, false otherwise.
 */
export function isInDryRunFolder(
	settings: EnveloppeSettings,
	repo: Repository | null,
	file: TFile | TFolder
) {
	if (settings.github.dryRun.folderName.trim().length === 0) return false;
	const folder = getDryRunFolder(settings.github.dryRun.folderName, {
		owner: repo?.user ?? settings.github.user,
		repo: repo?.repo ?? settings.github.repo,
		branch: repo?.branch ?? settings.github.branch,
	});
	return file.path === folder || file.path.startsWith(`${folder}/`);
}
