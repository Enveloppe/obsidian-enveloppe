/**
 * Get all condition from the frontmatter
 * See docs for all the condition
 */

import { FrontMatterCache, normalizePath, TFile } from "obsidian";
import GithubPublisher from "src/main";

import { FolderSettings, FrontmatterConvert, GitHubPublisherSettings, Path, RepoFrontmatter, Repository } from "../settings/interface";

/**
 * Retrieves the frontmatter settings for a given file.
 *
 * @param frontmatter - The frontmatter cache for the file.
 * @param settings - The GitHub Publisher settings.
 * @param repo - The repository settings for the file.
 * @returns The frontmatter settings for the file.
 */
export function getFrontmatterSettings(
	frontmatter: FrontMatterCache | undefined | null,
	settings: GitHubPublisherSettings,
	repo: Repository | null
) {

	let settingsConversion: FrontmatterConvert = {
		convertWiki: settings.conversion.links.wiki,
		attachment: settings.embed.attachments,
		embed: settings.embed.notes,
		links: true,
		removeEmbed: settings.embed.convertEmbedToLinks,
		charEmbedLinks: settings.embed.charConvert,
		dataview: settings.conversion.dataview,
		hardbreak: settings.conversion.hardbreak,
		unshared: settings.conversion.links.unshared,
		convertInternalLinks: settings.conversion.links.internal,
	};

	const shareAll = repo ? repo.shareAll?.enable : settings.plugin.shareAll?.enable;
	if (shareAll) {
		settingsConversion.unshared = true;
	}

	if (!frontmatter) return settingsConversion;
	settingsConversion = settingsLink(frontmatter, settingsConversion);
	settingsConversion = settingsEmbed(frontmatter, settingsConversion);
	settingsConversion = settingAttachment(frontmatter, settingsConversion);

	if (frontmatter.dataview !== undefined) {
		settingsConversion.dataview = frontmatter.dataview;
	}
	if (frontmatter.hardbreak !== undefined) {
		settingsConversion.hardbreak = frontmatter.hardbreak;
	}

	return parseFrontmatterSettingsWithRepository(repo, frontmatter, settingsConversion);
}
/**
 * Translates a boolean value or string representation of a boolean into a string value for the 'removeEmbed' setting.
 *
 * @param removeEmbed - The value to be translated. Can be a boolean value or a string representation of a boolean.
 * @returns The translated string value for the 'removeEmbed' setting. Possible values are 'keep', 'remove', 'links', or 'bake'.
 */
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
 * Retrieves the repository frontmatter based on the provided settings and repository information.
 *
 * @param {GitHubPublisherSettings} settings - The GitHub Publisher settings.
 * @param {Repository | null} repository - The repository information.
 * @param {FrontMatterCache | null} frontmatter - The frontmatter cache.
 * @returns {RepoFrontmatter[] | RepoFrontmatter} - The repository frontmatter.
 */
export function getRepoFrontmatter(
	settings: GitHubPublisherSettings,
	repository: Repository | null,
	frontmatter?: FrontMatterCache | null,
): RepoFrontmatter[] | RepoFrontmatter {
	let github = repository ?? settings.github;
	if (frontmatter && typeof frontmatter["shortRepo"] === "string" && frontmatter["shortRepo"] !== "default") {
		const smartKey = frontmatter.shortRepo.toLowerCase();
		const allOtherRepo = settings.github.otherRepo;
		const shortRepo = allOtherRepo.find((repo) => {
			return repo.smartKey.toLowerCase() === smartKey;
		});
		github = shortRepo ?? github;
	}
	let repoFrontmatter: RepoFrontmatter = {
		branch: github.branch,
		repo: github.repo,
		owner: github.user,
		autoclean: !settings.github.dryRun.enable && settings.upload.autoclean.enable,
		workflowName: github.workflow.name,
		commitMsg: github.workflow.commitMessage,
		automaticallyMergePR: github.automaticallyMergePR,
		verifiedRepo: github.verifiedRepo ?? false,
		dryRun: {
			...settings.github.dryRun,
			autoclean: settings.upload.autoclean.enable && settings.github.dryRun.enable
		}
	};
	if (settings.upload.behavior === FolderSettings.fixed) {
		repoFrontmatter.autoclean = false;
	}
	if (!frontmatter || (frontmatter.multipleRepo === undefined && frontmatter.repo === undefined && frontmatter.shortRepo === undefined)) {
		return parsePath(settings, repository, repoFrontmatter, frontmatter);
	}
	let isFrontmatterAutoClean = null;
	if (frontmatter.multipleRepo) {
		const multipleRepo = parseMultipleRepo(frontmatter, repoFrontmatter);
		return parsePath(settings, repository, multipleRepo, frontmatter);
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
			isFrontmatterAutoClean = repo.length > 4 ? true : null;
			repoFrontmatter = repositoryStringSlice(repo, repoFrontmatter);
		}
	} else if (frontmatter.shortRepo instanceof Array) {
		return multipleShortKeyRepo(frontmatter, settings.github.otherRepo, repoFrontmatter, settings);
	}
	if (frontmatter.autoclean !== undefined && isFrontmatterAutoClean === null) {
		repoFrontmatter.autoclean = frontmatter.autoclean;
	}
	return parsePath(settings, repository, repoFrontmatter);
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
				const repository: RepoFrontmatter = structuredClone(repoFrontmatter);
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
				const repository: RepoFrontmatter = structuredClone(repoFrontmatter);
				multipleRepo.push(
					repositoryStringSlice(repoString, repository)
				);
			}
		}
	}
	return removeDuplicateRepo(multipleRepo);
}

/**
 * Removes duplicate repositories from the given array of RepoFrontmatter objects.
 * Only the {repo, owner, branch, autoclean} properties are compared.
 * @param multipleRepo - An array of RepoFrontmatter objects representing multiple repositories.
 * @returns An array of RepoFrontmatter objects with duplicate repositories removed.
 */
function removeDuplicateRepo(multipleRepo: RepoFrontmatter[]) {
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
 */
function multipleShortKeyRepo(frontmatter: FrontMatterCache, allRepo: Repository[], repoFrontmatter: RepoFrontmatter, setting: GitHubPublisherSettings) {
	if (frontmatter.shortRepo instanceof Array) {
		const multipleRepo: RepoFrontmatter[] = [];
		for (const repo of frontmatter.shortRepo) {
			const smartKey = repo.toLowerCase();
			if (smartKey === "default") {
				multipleRepo.push(repoFrontmatter);
			} else {
				const shortRepo = allRepo.find((repo) => {
					return repo.smartKey.toLowerCase() === smartKey;
				});
				if (shortRepo) {
					let repo = {
						branch: shortRepo.branch,
						repo: shortRepo.repo,
						owner: shortRepo.user,
						autoclean: repoFrontmatter.autoclean,
						automaticallyMergePR: shortRepo.automaticallyMergePR,
						workflowName: shortRepo.workflow.name,
						commitMsg: shortRepo.workflow.commitMessage,
						dryRun: repoFrontmatter.dryRun
					} as RepoFrontmatter;
					const parsedPath = parsePath(setting, shortRepo, repo);
					repo = Array.isArray(parsedPath) ? parsedPath[0] : parsedPath;
					multipleRepo.push(repo);
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

function repositoryStringSlice(repo: string, repoFrontmatter: RepoFrontmatter): RepoFrontmatter {
	const newRepo: RepoFrontmatter = structuredClone(repoFrontmatter);
	if (repo.length === 4) {
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
export function getCategory(
	frontmatter: FrontMatterCache | null | undefined,
	settings: GitHubPublisherSettings,
	paths: Path | undefined): string {
	const key = paths?.category?.key ?? settings.upload.yamlFolderKey;
	const category = frontmatter && frontmatter[key] !== undefined ? frontmatter[key] : paths?.defaultName ?? settings.upload.defaultName;
	if (category instanceof Array) {
		return category.join("/");
	}
	return category;
}

export function parsePath(
	settings: GitHubPublisherSettings,
	repository: Repository | null,
	repoFrontmatter: RepoFrontmatter | RepoFrontmatter[],
	frontmatter?: FrontMatterCache | null | undefined
): RepoFrontmatter[] | RepoFrontmatter {
	repoFrontmatter = repoFrontmatter instanceof Array ? repoFrontmatter : [repoFrontmatter];
	for (const repo of repoFrontmatter) {
		const smartKey = repository ? repository.smartKey : "default";
		const path: Path = {
			type: settings.upload.behavior,
			defaultName: settings.upload.defaultName,
			rootFolder: settings.upload.rootFolder,
			category: {
				key: settings.upload.yamlFolderKey,
				value: settings.upload.defaultName,
			},
			override: frontmatter?.path,
			smartkey: smartKey,
			attachment: {
				send: settings.embed.attachments,
				folder: settings.embed.folder,
			}
		};

		if (frontmatter?.[`${smartKey}.path`]) {
			path.override = frontmatter[`${smartKey}.path`] instanceof Array ? frontmatter[`${smartKey}.path`].join("/") : frontmatter[`${smartKey}.path`];
			continue;
		}
		if (frontmatter?.[`${smartKey}.${path.category!.key}`]) {
			const category = frontmatter[`${smartKey}.${path.category!.key}`];
			path.category!.value = category instanceof Array ? category.join("/") : category;
		}
		if (frontmatter?.[`${smartKey}.rootFolder`]) {
			const rootFolder = frontmatter[`${smartKey}.rootFolder`] instanceof Array ? frontmatter[`${smartKey}.rootFolder`].join("/") : frontmatter[`${smartKey}.rootFolder`];
			path.rootFolder = rootFolder;
		}
		if (frontmatter?.[`${smartKey}.defaultName`]) {
			path.defaultName = frontmatter[`${smartKey}.defaultName`] instanceof Array ? frontmatter[`${smartKey}.defaultName`].join("/") : frontmatter[`${smartKey}.defaultName`];
		}
		if (frontmatter?.[`${smartKey}.type`]) {
			const type = frontmatter[`${smartKey}.type`].toLowerCase();
			if (type.match(/^(fixed|obsidian|yaml)$/i)) path.type = frontmatter[`${smartKey}.type`] as FolderSettings;
		}
		if (frontmatter?.[`${smartKey}.attachment`]) {
			if (typeof frontmatter?.[`${smartKey}.attachment`] === "object") {
				path.attachment = {
					send: frontmatter[`${smartKey}.attachment`]?.send ?? path.attachment?.send,
					folder: frontmatter[`${smartKey}.attachment`]?.folder ?? path.attachment?.folder,
				};
			} else {
				path.attachment!.send = frontmatter[`${smartKey}.attachment`];
			}
		}
		if (frontmatter?.[`${smartKey}.attachmentLinks`]) {
			path.attachment!.folder = normalizePath(frontmatter[`${smartKey}.attachmentLinks`]
				.toString()
				.replace(/\/$/, ""));
		}
		path.category!.value = getCategory(frontmatter, settings, path);
		repo.path = path;
	}
	return repoFrontmatter;
}

function parseFrontmatterSettingsWithRepository(
	repository: Repository | null,
	frontmatter: FrontMatterCache | null | undefined,
	frontConvert: FrontmatterConvert) {
	if (!repository) return frontConvert;
	const smartKey = repository.smartKey;
	if (frontmatter?.[`${smartKey}.links`]) {
		if (typeof frontmatter?.[`${smartKey}.links`] === "object") {
			frontConvert.links = frontmatter[`${smartKey}.links`]?.convert ?? frontConvert.links;
			frontConvert.convertInternalLinks = frontmatter[`${smartKey}.links`]?.internals ?? frontConvert.convertInternalLinks;
			frontConvert.convertWiki = frontmatter[`${smartKey}.links`]?.mdlinks ?? frontConvert.convertWiki;
			frontConvert.unshared = frontmatter[`${smartKey}.links`]?.nonShared ?? frontConvert.unshared;
		} else {
			frontConvert.links = frontmatter[`${smartKey}.links`];
		}
	}
	if (frontmatter?.[`${smartKey}.embed`]) {
		if (typeof frontmatter?.[`${smartKey}.embed`] === "object") {
			frontConvert.embed = frontmatter[`${smartKey}.embed`]?.send ?? frontConvert.embed;
			frontConvert.removeEmbed = translateBooleanForRemoveEmbed(frontmatter[`${smartKey}.embed`]?.remove ?? frontConvert.removeEmbed);
			frontConvert.charEmbedLinks = frontmatter[`${smartKey}.embed`]?.char ?? frontConvert.charEmbedLinks;
		} else {
			frontConvert.embed = frontmatter[`${smartKey}.embed`];
		}
	}
	if (frontmatter?.[`${smartKey}.attachment`]) {
		if (typeof frontmatter?.[`${smartKey}.attachment`] === "object") {
			frontConvert.attachment = frontmatter[`${smartKey}.attachment`]?.send ?? frontConvert.attachment;
			frontConvert.attachmentLinks = frontmatter[`${smartKey}.attachment`]?.folder ?? frontConvert.attachmentLinks;
		} else {
			frontConvert.attachment = frontmatter[`${smartKey}.attachment`];
		}
	}
	if (frontmatter?.[`${smartKey}.attachmentLinks`]) {
		frontConvert.attachmentLinks = normalizePath(frontmatter[`${smartKey}.attachmentLinks`]
			.toString()
			.replace(/\/$/, ""));
	}
	frontConvert.convertWiki = frontmatter?.[`${smartKey}.mdlinks`] ?? frontConvert.convertWiki;

	if (frontmatter?.[`${smartKey}.removeEmbed`]) {
		frontConvert.removeEmbed = translateBooleanForRemoveEmbed(frontmatter[`${smartKey}.removeEmbed`]);
	}
	frontConvert.dataview = frontmatter?.[`${smartKey}.dataview`] ?? frontConvert.dataview;
	frontConvert.hardbreak = frontmatter?.[`${smartKey}.hardbreak`] ?? frontConvert.hardbreak;
	frontConvert.convertInternalLinks = frontmatter?.[`${smartKey}.internals`] ?? frontConvert.convertInternalLinks;
	frontConvert.unshared = frontmatter?.[`${smartKey}.nonShared`] ?? frontConvert.unshared;
	return frontConvert;
}

export function getLinkedFrontmatter(
	originalFrontmatter: FrontMatterCache | null | undefined,
	sourceFile: TFile | null | undefined,
	plugin: GithubPublisher,
) {
	const { settings } = plugin;
	const { metadataCache, vault } = plugin.app;
	const linkedKey = settings.plugin.setFrontmatterKey;
	if (!linkedKey || !originalFrontmatter || !sourceFile) return originalFrontmatter;
	const linkedFrontmatter = originalFrontmatter?.[linkedKey];
	if (!linkedFrontmatter) return originalFrontmatter;
	let linkedFile: undefined | string;
	metadataCache.getFileCache(sourceFile)?.frontmatterLinks?.forEach((link) => {
		const fieldRegex = new RegExp(`${linkedKey}(\\.\\d+)?`, "g");
		if (link.key.match(fieldRegex)) {
			linkedFile = link.link;
		}
	});
	if (!linkedFile) return originalFrontmatter;
	const linkedFrontmatterFile = metadataCache.getFirstLinkpathDest(linkedFile, sourceFile.path) ?? vault.getAbstractFileByPath(linkedFile);
	if (!linkedFrontmatterFile || !(linkedFrontmatterFile instanceof TFile)) return originalFrontmatter;
	const linked = metadataCache.getFileCache(linkedFrontmatterFile)?.frontmatter;
	if (!linked) return originalFrontmatter;
	return linked;
}

export function frontmatterFromFile(file: TFile | null, plugin: GithubPublisher) {
	let frontmatter = null;
	if (file) {
		frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
		const linkedFrontmatter = getLinkedFrontmatter(frontmatter, file, plugin);
		frontmatter = linkedFrontmatter ? { ...linkedFrontmatter, ...frontmatter } : frontmatter;
	}
	return frontmatter;
}

function settingsLink(frontmatter: FrontMatterCache, settingsConversion: FrontmatterConvert) {
	if (frontmatter.links !== undefined) {
		if (typeof frontmatter.links === "object") {
			if (frontmatter.links.convert !== undefined) {
				settingsConversion.links = frontmatter.links.convert;
			}
			if (frontmatter.links.internals !== undefined) {
				settingsConversion.convertInternalLinks = frontmatter.links.internals;
			}
			if (frontmatter.links.mdlinks !== undefined) {
				settingsConversion.convertWiki = frontmatter.links.mdlinks;
			}
			if (frontmatter.links.nonShared !== undefined) {
				settingsConversion.unshared = frontmatter.links.nonShared;
			}
		} else {
			settingsConversion.links = frontmatter.links;
		}
	}
	if (frontmatter["links.convert"] !== undefined) settingsConversion.links = frontmatter["links.convert"];
	if (frontmatter["links.internals"] !== undefined) settingsConversion.convertInternalLinks = frontmatter["links.internals"];
	if (frontmatter["links.mdlinks"] !== undefined) settingsConversion.convertWiki = frontmatter["links.mdlinks"];
	if (frontmatter["links.nonShared"] !== undefined) settingsConversion.unshared = frontmatter["links.nonShared"];
	if (frontmatter.mdlinks !== undefined) settingsConversion.convertWiki = frontmatter.mdlinks;
	if (frontmatter.internals !== undefined) settingsConversion.convertInternalLinks = frontmatter.internals;
	if (frontmatter.nonShared !== undefined) settingsConversion.unshared = frontmatter.nonShared;
	return settingsConversion;
}

function settingsEmbed(frontmatter: FrontMatterCache, settingsConversion: FrontmatterConvert) {
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
	if (frontmatter["embed.send"] !== undefined) settingsConversion.embed = frontmatter["embed.send"];
	if (frontmatter["embed.remove"] !== undefined) settingsConversion.removeEmbed = translateBooleanForRemoveEmbed(frontmatter["embed.remove"]);
	if (frontmatter["embed.char"] !== undefined) settingsConversion.charEmbedLinks = frontmatter["embed.char"];
	if (frontmatter.removeEmbed !== undefined) settingsConversion.removeEmbed = translateBooleanForRemoveEmbed(frontmatter.removeEmbed);

	return settingsConversion;
}

function settingAttachment(frontmatter: FrontMatterCache, settingsConversion: FrontmatterConvert) {
	if (frontmatter.attachment !== undefined) {
		if (typeof frontmatter.attachment === "object") {
			if (frontmatter.attachment.send !== undefined) {
				settingsConversion.attachment = frontmatter.attachment.send;
			}
			if (frontmatter.attachment.folder !== undefined) {
				settingsConversion.attachmentLinks = frontmatter.attachment.folder;
			}
		} else {
			settingsConversion.attachment = frontmatter.attachment;
		}
	}

	if (frontmatter["attachment.send"] !== undefined) settingsConversion.attachment = frontmatter["attachment.send"];
	if (frontmatter["attachment.folder"] !== undefined) settingsConversion.attachmentLinks = frontmatter["attachment.folder"];

	if (settingsConversion.attachmentLinks) {
		settingsConversion.attachmentLinks = normalizePath(settingsConversion.attachmentLinks
			.toString()
			.replace(/\/$/, ""));
	}
	return settingsConversion;
}

