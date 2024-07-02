/**
 * Get all condition from the frontmatter
 * See docs for all the condition
 */

import {
	FolderSettings,
	type EnveloppeSettings,
	type Path,
	type Properties,
	type PropertiesConversion,
	type Repository,
} from "@interfaces";
import { klona } from "klona";
import { type FrontMatterCache, normalizePath, TFile } from "obsidian";
import type Enveloppe from "src/main";
import merge from "ts-deepmerge";

export function frontmatterSettingsRepository(
	plugin: Enveloppe,
	repo: Repository | null
) {
	const defaultConvert = getFrontmatterSettings(null, plugin.settings, repo);
	if (!repo?.set || !plugin.repositoryFrontmatter[repo.smartKey]) return defaultConvert;
	return getFrontmatterSettings(
		plugin.repositoryFrontmatter[repo.smartKey],
		plugin.settings,
		repo
	);
}

export function getDefaultProperties(repository: Repository | null, plugin: Enveloppe) {
	const defaultSettings = getProperties(plugin, repository);
	if (
		!repository?.set ||
		(repository && !plugin.repositoryFrontmatter[repository.smartKey])
	)
		return defaultSettings;
	return getProperties(
		plugin,
		repository,
		plugin.repositoryFrontmatter[repository.smartKey]
	);
}

/**
 * Retrieves the frontmatter settings for a given file.
 *
 * @param frontmatter - The frontmatter cache for the file.
 * @param settings - The Obsidian Enveloppe settings.
 * @param repo - The repository settings for the file.
 * @returns The frontmatter settings for the file.
 */
export function getFrontmatterSettings(
	frontmatter: FrontMatterCache | undefined | null,
	settings: EnveloppeSettings,
	repo: Repository | null
) {
	let settingsConversion: PropertiesConversion = {
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
		includeLinks: settings.embed.sendSimpleLinks,
	};

	const shareAll = repo ? repo.shareAll?.enable : settings.plugin.shareAll?.enable;
	if (shareAll) {
		settingsConversion.unshared = true;
	}

	if (!frontmatter) return settingsConversion;
	settingsConversion = settingsLink(frontmatter, settingsConversion);
	settingsConversion = settingsEmbed(frontmatter, settingsConversion);
	settingsConversion = settingAttachment(frontmatter, settingsConversion);
	if (frontmatter.dataview != undefined) {
		settingsConversion.dataview = frontmatter.dataview;
	}
	if (frontmatter.hardbreak != undefined) {
		settingsConversion.hardbreak = frontmatter.hardbreak;
	}
	return getFrontmatterSettingRepository(repo, frontmatter, settingsConversion);
}
/**
 * Translates a boolean value or string representation of a boolean into a string value for the 'removeEmbed' setting.
 *
 * @param removeEmbed - The value to be translated. Can be a boolean value or a string representation of a boolean.
 * @returns The translated string value for the 'removeEmbed' setting. Possible values are 'keep', 'remove', 'links', or 'bake'.
 */
function booleanRemoveEmbed(removeEmbed: unknown) {
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
 * @param {Enveloppe} plugin - The plugin instance
 * @param {Repository | null} repository - The repository information.
 * @param {FrontMatterCache | null} frontmatter - The frontmatter cache.
 * @param {boolean} [checkSet] - Whether to check the set file for frontmatter (preventing multiple reading of the same file)
 * @returns {Properties[] | Properties} - The repository frontmatter.
 */
export function getProperties(
	plugin: Enveloppe,
	repository: Repository | null,
	frontmatter?: FrontMatterCache | null,
	checkSet?: boolean
): Properties[] | Properties {
	const settings = plugin.settings;
	let github = repository ?? settings.github;
	if (checkSet && repository && plugin.repositoryFrontmatter[repository.smartKey]) {
		const setFrontmatter = plugin.repositoryFrontmatter[repository.smartKey];
		frontmatter = merge.withOptions(
			{ allowUndefinedOverrides: false },
			setFrontmatter ?? {},
			frontmatter ?? {}
		);
	}
	if (
		frontmatter &&
		typeof frontmatter.shortRepo === "string" &&
		frontmatter.shortRepo !== "default"
	) {
		const smartKey = frontmatter.shortRepo.toLowerCase();
		const allOtherRepo = settings.github.otherRepo;
		const shortRepo = allOtherRepo.find((repo) => {
			return repo.smartKey.toLowerCase() === smartKey;
		});
		github = shortRepo ?? github;
	}
	let Properties: Properties = {
		branch: github.branch,
		repo: github.repo,
		owner: github.user,
		autoclean: !settings.github.dryRun.enable && settings.upload.autoclean.enable,
		workflowName: github.workflow.name,
		commitMsg: github.workflow.commitMessage,
		automaticallyMergePR: github.automaticallyMergePR,
		verifiedRepo: github.verifiedRepo ?? false,
		rateLimit: github.rateLimit,
		dryRun: {
			...settings.github.dryRun,
			autoclean: settings.upload.autoclean.enable && settings.github.dryRun.enable,
		},
	};
	if (settings.upload.behavior === FolderSettings.Fixed) {
		Properties.autoclean = false;
	}
	if (
		!frontmatter ||
		(frontmatter.multipleRepo === undefined &&
			frontmatter.repo === undefined &&
			frontmatter.shortRepo === undefined)
	) {
		return parsePath(plugin, repository, Properties, frontmatter);
	}
	let isFrontmatterAutoClean = null;
	if (frontmatter.multipleRepo) {
		const multipleRepo = parseMultipleRepo(frontmatter, Properties);
		return parsePath(plugin, repository, multipleRepo, frontmatter);
	} else if (frontmatter.repo) {
		if (typeof frontmatter.repo === "object") {
			if (frontmatter.repo.branch != undefined) {
				Properties.branch = frontmatter.repo.branch;
			}
			if (frontmatter.repo.repo != undefined) {
				Properties.repo = frontmatter.repo.repo;
			}
			if (frontmatter.repo.owner != undefined) {
				Properties.owner = frontmatter.repo.owner;
			}
			if (frontmatter.repo.autoclean != undefined) {
				Properties.autoclean = frontmatter.repo.autoclean;
				isFrontmatterAutoClean = true;
			}
		} else {
			const repo = frontmatter.repo.split("/");
			isFrontmatterAutoClean = repo.length > 4 ? true : null;
			Properties = repositoryStringSlice(repo, Properties);
		}
	} else if (frontmatter.shortRepo instanceof Array) {
		return multipleShortKeyRepo(
			frontmatter,
			settings.github.otherRepo,
			Properties,
			plugin
		);
	}
	if (frontmatter.autoclean != undefined && isFrontmatterAutoClean === null) {
		Properties.autoclean = frontmatter.autoclean;
	}
	return parsePath(plugin, repository, Properties);
}

/**
 * Get the Properties array from the frontmatter
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
 * @param {Properties} Properties
 * @return {Properties[]}
 */

function parseMultipleRepo(frontmatter: FrontMatterCache, Properties: Properties) {
	const multipleRepo: Properties[] = [];
	if (frontmatter.multipleRepo instanceof Array && frontmatter.multipleRepo.length > 0) {
		for (const repo of frontmatter.multipleRepo) {
			if (typeof repo === "object") {
				const repository: Properties = klona(Properties);
				if (repo.branch != undefined) {
					repository.branch = repo.branch;
				}
				if (repo.repo != undefined) {
					repository.repo = repo.repo;
				}
				if (repo.owner != undefined) {
					repository.owner = repo.owner;
				}
				if (repo.autoclean != undefined) {
					repository.autoclean = repo.autoclean;
				}
				multipleRepo.push(repository);
			} else {
				//is string
				const repoString = repo.split("/");
				const repository: Properties = klona(Properties);
				multipleRepo.push(repositoryStringSlice(repoString, repository));
			}
		}
	}
	return removeDuplicateRepo(multipleRepo);
}

/**
 * Removes duplicate repositories from the given array of Properties objects.
 * Only the {repo, owner, branch, autoclean} properties are compared.
 * @param multipleRepo - An array of Properties objects representing multiple repositories.
 * @returns An array of Properties objects with duplicate repositories removed.
 */
function removeDuplicateRepo(multipleRepo: Properties[]) {
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
 * Get the Properties from the `shortRepo` string ;
 * Using the `default` key will put the default Properties in the list
 * @param {FrontMatterCache} frontmatter - The frontmatter of the file
 * @param {Repository[]} allRepo - The list of all repo from the settings
 * @param {Properties} properties - The default Properties (from the default settings)
 */
function multipleShortKeyRepo(
	frontmatter: FrontMatterCache,
	allRepo: Repository[],
	properties: Properties,
	plugin: Enveloppe
) {
	if (frontmatter.shortRepo instanceof Array) {
		const multipleRepo: Properties[] = [];
		for (const repo of frontmatter.shortRepo) {
			const smartKey = repo.toLowerCase();
			if (smartKey === "default") {
				multipleRepo.push(properties);
			} else {
				const shortRepo = allRepo.find((repo) => {
					return repo.smartKey.toLowerCase() === smartKey;
				});
				if (shortRepo) {
					let repo = {
						branch: shortRepo.branch,
						repo: shortRepo.repo,
						owner: shortRepo.user,
						autoclean: properties.autoclean,
						automaticallyMergePR: shortRepo.automaticallyMergePR,
						workflowName: shortRepo.workflow.name,
						commitMsg: shortRepo.workflow.commitMessage,
						dryRun: properties.dryRun,
					} as Properties;
					const parsedPath = parsePath(plugin, shortRepo, repo);
					repo = Array.isArray(parsedPath) ? parsedPath[0] : parsedPath;
					multipleRepo.push(repo);
				}
			}
		}
		return multipleRepo;
	}
	return properties;
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
 * @param {Properties} properties
 * @return {Properties}
 */

function repositoryStringSlice(repo: string, properties: Properties): Properties {
	const newRepo: Properties = klona(properties);
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
 * @param {EnveloppeSettings} settings
 * @return {string} - The category or the default name
 */
export function getCategory(
	frontmatter: FrontMatterCache | null | undefined,
	settings: EnveloppeSettings,
	paths: Path | undefined
): string {
	const key = paths?.category?.key ?? settings.upload.yamlFolderKey;
	const category =
		frontmatter && frontmatter[key] != undefined
			? frontmatter[key]
			: paths?.defaultName ?? settings.upload.defaultName;
	if (category instanceof Array) {
		return category.join("/");
	}
	return category;
}

export function parsePath(
	plugin: Enveloppe,
	repository: Repository | null,
	properties: Properties | Properties[],
	frontmatter?: FrontMatterCache | null | undefined
): Properties[] | Properties {
	properties = properties instanceof Array ? properties : [properties];
	const settings = plugin.settings;
	const splitArrayPath = (path?: string[] | string): string | undefined => {
		if (!path) return;
		if (path instanceof Array) {
			return path.join("/");
		}
		return path;
	};

	const matchType = (type?: string) => {
		if (!type) return settings.upload.behavior;
		if (type.match(/^(fixed|obsidian|yaml)$/i)) return type as FolderSettings;
		return settings.upload.behavior;
	};
	for (const repo of properties) {
		const smartKey = repository ? repository.smartKey : "default";

		const path: Path = {
			type: matchType(frontmatter?.behavior),
			defaultName:
				frontmatter?.defaultName ??
				frontmatter?.category?.value ??
				frontmatter?.["category.value"] ??
				settings.upload.defaultName,
			rootFolder: frontmatter?.rootFolder ?? settings.upload.rootFolder,
			category: {
				key:
					splitArrayPath(frontmatter?.category?.key ?? frontmatter?.["category.key"]) ??
					settings.upload.yamlFolderKey,
				value: getCategory(frontmatter, settings, undefined),
			},
			override: splitArrayPath(frontmatter?.path),
			smartkey: smartKey,
			attachment: {
				send:
					frontmatter?.attachment?.send ??
					frontmatter?.["attachment.send"] ??
					settings.embed.attachments,
				folder:
					splitArrayPath(
						frontmatter?.attachment?.send ?? frontmatter?.["attachment.folder"]
					) ?? settings.embed.folder,
			},
		};
		/** List of alias for path generation */
		const smartkeys = {
			/** Overriding path, will skip the rest if exists */
			path: frontmatter?.[`${smartKey}.path`],
			/** Overriding the default category name. Can be a literal string or an object */
			category: frontmatter?.[`${smartKey}.category`],
			/** Overriding the default behavior, can be only yaml | obsidian | fixed */
			behavior: frontmatter?.[`${smartKey}.behavior`],
			/** Overriding attachment */
			attachment: frontmatter?.[`${smartKey}.attachment`],
			/** Alias of attachment.folder */
			attachmentLinks: frontmatter?.[`${smartKey}.attachmentLinks`],
			/** Overriding the root folder */
			rootFolder: frontmatter?.[`${smartKey}.rootFolder`],
			/** DefaultName is only used if yaml, but we parse it in case */
			defaultName: {
				/** Direct with smartkey.defaultName */
				direct: frontmatter?.[`${smartKey}.defaultName`],
				/** Is used in the category.value as literal string */
				asCategoryValue: frontmatter?.[`${smartKey}.category.value`],
			},
			/** Overriding of the category key */
			categoryKey: {
				/** Can be direct with smarkey.<categoryName> like smartkey.folder: category */
				direct: frontmatter?.[`${smartKey}.${path.category}`],
				/** Can be a key in a literal string: smartkey.category.key: category will rename the category  */
				asKey: frontmatter?.[`${smartKey}.category.key`],
			},
		};

		if (smartkeys.path) {
			path.override = splitArrayPath(smartkeys.path);
			continue;
		}
		if (smartkeys.categoryKey.direct) path.category.key = smartkeys.categoryKey.direct;
		if (smartkeys.categoryKey.asKey)
			path.category.key =
				splitArrayPath(smartkeys.categoryKey.asKey) ?? path.category.key;
		if (smartkeys.rootFolder) {
			const rootFolder = splitArrayPath(smartkeys.rootFolder) as string;
			path.rootFolder = rootFolder;
		}
		if (smartkeys.defaultName.direct)
			path.defaultName = splitArrayPath(smartkeys.defaultName.direct) as string;

		if (smartkeys.defaultName.asCategoryValue)
			path.defaultName =
				splitArrayPath(smartkeys.defaultName.asCategoryValue) ?? path.defaultName;

		if (smartkeys.category) {
			if (typeof smartkeys.category === "object") {
				if (smartkeys.category.value)
					path.defaultName = splitArrayPath(smartkeys.category.value) ?? path.defaultName;
				if (smartkeys.category.key)
					path.category.key = splitArrayPath(smartkeys.category.key) ?? path.category.key;
			} else path.category.key = splitArrayPath(smartkeys.category) ?? path.category.key;
		}
		if (smartkeys.behavior) path.type = matchType(smartkeys.behavior.toLowerCase());

		if (smartkeys.attachment) {
			if (typeof smartkeys.attachment === "object") {
				path.attachment = {
					send: smartkeys.attachment?.send ?? path.attachment?.send,
					folder: splitArrayPath(smartkeys.attachment?.folder) ?? path.attachment!.folder,
				};
			} else path.attachment!.send = smartkeys.attachment;
		}
		if (smartkeys.attachmentLinks)
			path.attachment!.folder = normalizePath(
				smartkeys.attachmentLinks.toString().replace(/\/$/, "")
			);
		path.category.value = getCategory(frontmatter, settings, path);
		repo.path = path;
	}

	return properties;
}

function getFrontmatterSettingRepository(
	repository: Repository | null,
	frontmatter: FrontMatterCache | null | undefined,
	frontConvert: PropertiesConversion
) {
	if (!repository || !repository?.smartKey) return frontConvert;
	const smartKey = repository.smartKey;
	frontConvert = settingsLink(frontmatter, frontConvert, smartKey);
	frontConvert = settingAttachment(frontmatter, frontConvert, smartKey);
	frontConvert = settingsEmbed(frontmatter, frontConvert, smartKey);
	const key = `${smartKey}.`;
	if (frontmatter?.[`${key}dataview`] != undefined) {
		frontConvert.dataview = frontmatter[`${smartKey}dataview`];
	}
	if (frontmatter?.[`${key}hardbreak`] != undefined) {
		frontConvert.hardbreak = frontmatter[`${smartKey}hardbreak`];
	}
	if (frontmatter?.[`${key}includeLinks`] != undefined) {
		frontConvert.includeLinks = frontmatter[`${smartKey}includeLinks`];
	}
	return frontConvert;
}

export function getLinkedFrontmatter(
	originalFrontmatter: FrontMatterCache | null | undefined,
	sourceFile: TFile | null | undefined,
	plugin: Enveloppe
) {
	const { settings } = plugin;
	const { metadataCache, vault } = plugin.app;
	const linkedKey = settings.plugin.setFrontmatterKey;
	if (!linkedKey || !originalFrontmatter || !sourceFile) return undefined;
	const linkedFrontmatter = originalFrontmatter?.[linkedKey];
	if (!linkedFrontmatter) return undefined;
	let linkedFile: undefined | string;
	metadataCache.getFileCache(sourceFile)?.frontmatterLinks?.forEach((link) => {
		const fieldRegex = new RegExp(`${linkedKey}(\\.\\d+)?`, "g");
		if (link.key.match(fieldRegex)) {
			linkedFile = link.link;
		}
	});
	if (!linkedFile) return undefined;
	const linkedFrontmatterFile =
		metadataCache.getFirstLinkpathDest(linkedFile, sourceFile.path) ??
		vault.getAbstractFileByPath(linkedFile);
	if (!linkedFrontmatterFile || !(linkedFrontmatterFile instanceof TFile))
		return undefined;
	return metadataCache.getFileCache(linkedFrontmatterFile)?.frontmatter;
}

export function frontmatterFromFile(
	file: TFile | null,
	plugin: Enveloppe,
	repo: Repository | null
) {
	let frontmatter = null;
	const setFrontmatter =
		repo?.set && plugin.repositoryFrontmatter[repo.smartKey]
			? plugin.repositoryFrontmatter[repo.smartKey]
			: null;
	if (file) {
		frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
		const linkedFrontmatter = getLinkedFrontmatter(frontmatter, file, plugin);
		frontmatter = merge.withOptions(
			{ allowUndefinedOverrides: false },
			setFrontmatter ?? {},
			linkedFrontmatter ?? {},
			frontmatter ?? {}
		) as FrontMatterCache;
	}

	return frontmatter;
}

function settingsLink(
	frontmatter: FrontMatterCache | null | undefined,
	settingsConversion: PropertiesConversion,
	smartKey?: string
) {
	let key = "links";
	if (smartKey) key = `${smartKey}.${key}`;
	if (!frontmatter) return settingsConversion;
	if (frontmatter[key] != undefined) {
		if (typeof frontmatter[key] === "object") {
			if (frontmatter[key].convert != undefined) {
				settingsConversion.links = frontmatter[key].convert;
			}
			if (frontmatter[key].internals != undefined) {
				settingsConversion.convertInternalLinks = frontmatter[key].internals;
			}
			if (frontmatter[key].mdlinks != undefined) {
				settingsConversion.convertWiki = frontmatter[key].mdlinks;
			}
			if (frontmatter[key].nonShared != undefined) {
				settingsConversion.unshared = frontmatter[key].nonShared;
			}
		} else {
			settingsConversion.links = frontmatter[key];
		}
	}
	if (frontmatter[`${key}.convert`] != undefined)
		settingsConversion.links = frontmatter[`${key}.convert`];
	if (frontmatter[`${key}.internals`] != undefined)
		settingsConversion.convertInternalLinks = frontmatter[`${key}.internals`];
	if (frontmatter[`${key}.mdlinks`] != undefined)
		settingsConversion.convertWiki = frontmatter[`${key}.mdlinks`];
	if (frontmatter[`${key}.nonShared`] != undefined)
		settingsConversion.unshared = frontmatter[`${key}.nonShared`];

	if (frontmatter[smartKey ? `${smartKey}.mdlinks` : "mdlinks"] != undefined)
		settingsConversion.convertWiki =
			frontmatter[smartKey ? `${smartKey}.mdlinks` : "mdlinks"];
	if (frontmatter[smartKey ? `${smartKey}.internals` : "internals"] != undefined)
		settingsConversion.convertInternalLinks =
			frontmatter[smartKey ? `${smartKey}.internals` : "internals"];
	if (frontmatter[smartKey ? `${smartKey}.nonShared` : "nonShared"] != undefined)
		settingsConversion.unshared =
			frontmatter[smartKey ? `${smartKey}.nonShared` : "nonShared"];

	return settingsConversion;
}

function settingsEmbed(
	frontmatter: FrontMatterCache | null | undefined,
	settingsConversion: PropertiesConversion,
	smartkey?: string
) {
	if (!frontmatter) return settingsConversion;
	const key = smartkey ? `${smartkey}.embed` : "embed";
	if (frontmatter[key] != undefined) {
		if (typeof frontmatter[key] === "object") {
			if (frontmatter[key].send != undefined) {
				settingsConversion.embed = frontmatter[key].send;
			}
			if (frontmatter[key].remove != undefined) {
				settingsConversion.removeEmbed = booleanRemoveEmbed(frontmatter[key].remove);
			}
			if (frontmatter[key].char != undefined) {
				settingsConversion.charEmbedLinks = frontmatter[key].char;
			}
		} else {
			settingsConversion.embed = frontmatter[key];
		}
	}
	if (frontmatter[`${key}.send`] != undefined)
		settingsConversion.embed = frontmatter[`${key}.send`];
	if (frontmatter[`${key}.remove`] != undefined)
		settingsConversion.removeEmbed = booleanRemoveEmbed(frontmatter[`${key}.remove`]);
	if (frontmatter[`${key}.char`] != undefined)
		settingsConversion.charEmbedLinks = frontmatter[`${key}.char`];
	const removeEmbedKey = smartkey ? `${smartkey}.removeEmbed` : "removeEmbed";
	if (frontmatter[removeEmbedKey] != undefined)
		settingsConversion.removeEmbed = booleanRemoveEmbed(frontmatter[removeEmbedKey]);

	return settingsConversion;
}

function settingAttachment(
	frontmatter: FrontMatterCache | undefined | null,
	settingsConversion: PropertiesConversion,
	smartKey?: string
) {
	if (!frontmatter) return settingsConversion;
	let key = "attachment";
	if (smartKey) key = `${smartKey}.${key}`;
	if (frontmatter[key]) {
		if (typeof frontmatter[key] === "object") {
			if (frontmatter[key].send != undefined) {
				settingsConversion.attachment = frontmatter[key].send;
			}
			if (frontmatter[key].folder != undefined) {
				settingsConversion.attachmentLinks = frontmatter[key].folder;
			}
		} else {
			settingsConversion.attachment = frontmatter[key];
		}
	}

	if (frontmatter[`${key}.send`] != undefined)
		settingsConversion.attachment = frontmatter[`${key}.send`];
	if (frontmatter[`${key}.folder`] != undefined)
		settingsConversion.attachmentLinks = frontmatter[`${key}.folder`];

	if (settingsConversion.attachmentLinks) {
		settingsConversion.attachmentLinks = normalizePath(
			settingsConversion.attachmentLinks.toString().replace(/\/$/, "")
		);
	}
	return settingsConversion;
}
