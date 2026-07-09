/**
 * Get all condition from the frontmatter
 * See docs for all the condition
 */

import {
	type EnveloppeSettings,
	FolderSettings,
	type Path,
	type Properties,
	type PropertiesConversion,
	type Repository,
} from "@interfaces";
import { klona } from "klona";
import { type FrontMatterCache, normalizePath, TFile } from "obsidian";
import type Enveloppe from "src/main";
import { merge } from "ts-deepmerge";

/**
 * FrontMatterCache is typed as `Record<string, any>` by Obsidian since YAML
 * frontmatter is arbitrary user data. These helpers read it as `unknown` and
 * narrow explicitly, instead of letting `any` propagate through every call site.
 */
function fmGet(frontmatter: FrontMatterCache | null | undefined, key: string): unknown {
	return frontmatter ? (frontmatter as Record<string, unknown>)[key] : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

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
		unlink: !settings.conversion.links.unshared && settings.conversion.links.unlink,
	};

	const shareAll = repo ? repo.shareAll?.enable : settings.plugin.shareAll?.enable;
	if (shareAll) {
		settingsConversion.unshared = true;
	}

	if (!frontmatter) return settingsConversion;
	settingsConversion = settingsLink(frontmatter, settingsConversion);
	settingsConversion = settingsEmbed(frontmatter, settingsConversion);
	settingsConversion = settingAttachment(frontmatter, settingsConversion);
	const dataview = fmGet(frontmatter, "dataview");
	if (dataview != undefined) {
		settingsConversion.dataview = dataview as boolean;
	}
	const hardbreak = fmGet(frontmatter, "hardbreak");
	if (hardbreak != undefined) {
		settingsConversion.hardbreak = hardbreak as boolean;
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
		delete setFrontmatter?.[settings.plugin.shareKey];
		//@ts-ignore
		frontmatter = merge.withOptions(
			{ allowUndefinedOverrides: false },
			setFrontmatter ?? {},
			frontmatter ?? {}
		);
	}
	const shortRepoValue = fmGet(frontmatter, "shortRepo");
	if (frontmatter && typeof shortRepoValue === "string" && shortRepoValue !== "default") {
		const smartKey = shortRepoValue.toLowerCase();
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
	const multipleRepoValue = fmGet(frontmatter, "multipleRepo");
	const repoValue = fmGet(frontmatter, "repo");
	if (
		!frontmatter ||
		(multipleRepoValue === undefined &&
			repoValue === undefined &&
			shortRepoValue === undefined)
	) {
		return parsePath(plugin, repository, Properties, frontmatter);
	}
	let isFrontmatterAutoClean = null;
	if (multipleRepoValue) {
		const multipleRepo = parseMultipleRepo(frontmatter, Properties);
		return parsePath(plugin, repository, multipleRepo, frontmatter);
	} else if (repoValue) {
		const repoRecord = asRecord(repoValue);
		if (repoRecord) {
			if (repoRecord.branch != undefined) {
				Properties.branch = repoRecord.branch as string;
			}
			if (repoRecord.repo != undefined) {
				Properties.repo = repoRecord.repo as string;
			}
			if (repoRecord.owner != undefined) {
				Properties.owner = repoRecord.owner as string;
			}
			if (repoRecord.autoclean != undefined) {
				Properties.autoclean = repoRecord.autoclean as boolean;
				isFrontmatterAutoClean = true;
			}
		} else {
			const repo = (repoValue as string).split("/");
			isFrontmatterAutoClean = repo.length > 4 ? true : null;
			Properties = repositoryStringSlice(repo, Properties);
		}
	} else if (shortRepoValue instanceof Array) {
		return multipleShortKeyRepo(
			frontmatter,
			settings.github.otherRepo,
			Properties,
			plugin
		);
	}
	const autocleanValue = fmGet(frontmatter, "autoclean");
	if (autocleanValue != undefined && isFrontmatterAutoClean === null) {
		Properties.autoclean = autocleanValue as boolean;
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

function parseMultipleRepo(
	frontmatter: FrontMatterCache,
	Properties: Properties
): Properties[] {
	const multipleRepo: Properties[] = [];
	const multipleRepoValue = fmGet(frontmatter, "multipleRepo");
	if (multipleRepoValue instanceof Array && multipleRepoValue.length > 0) {
		for (const repo of multipleRepoValue as unknown[]) {
			const repoRecord = asRecord(repo);
			if (repoRecord) {
				const repository: Properties = klona(Properties);
				if (repoRecord.branch != undefined) {
					repository.branch = repoRecord.branch as string;
				}
				if (repoRecord.repo != undefined) {
					repository.repo = repoRecord.repo as string;
				}
				if (repoRecord.owner != undefined) {
					repository.owner = repoRecord.owner as string;
				}
				if (repoRecord.autoclean != undefined) {
					repository.autoclean = repoRecord.autoclean as boolean;
				}
				multipleRepo.push(repository);
			} else {
				//is string
				const repoString = (repo as string).split("/");
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
 * @param plugin
 */
function multipleShortKeyRepo(
	frontmatter: FrontMatterCache,
	allRepo: Repository[],
	properties: Properties,
	plugin: Enveloppe
) {
	const shortRepoValue = fmGet(frontmatter, "shortRepo");
	if (shortRepoValue instanceof Array) {
		const multipleRepo: Properties[] = [];
		for (const repo of shortRepoValue as string[]) {
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
 * @param {string[]} repo the repo string already split by "/"
 * @param {Properties} properties
 * @return {Properties}
 */

function repositoryStringSlice(repo: string[], properties: Properties): Properties {
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
 * @param paths
 * @return {string} - The category or the default name
 */
export function getCategory(
	frontmatter: FrontMatterCache | null | undefined,
	settings: EnveloppeSettings,
	paths: Path | undefined
): string {
	const key = paths?.category?.key ?? settings.upload.yamlFolderKey;
	const rawCategory = fmGet(frontmatter, key);
	const category =
		frontmatter && rawCategory != undefined
			? rawCategory
			: (paths?.defaultName ?? settings.upload.defaultName);
	if (category instanceof Array) {
		return (category as string[]).join("/");
	}
	return category as string;
}

export function parsePath(
	plugin: Enveloppe,
	repository: Repository | null,
	properties: Properties | Properties[],
	frontmatter?: FrontMatterCache | null
): Properties[] | Properties {
	properties = properties instanceof Array ? properties : [properties];
	const settings = plugin.settings;
	const splitArrayPath = (path?: unknown): string | undefined => {
		if (!path) return;
		if (path instanceof Array) {
			return (path as unknown[]).join("/");
		}
		return path as string;
	};

	const matchType = (type?: unknown): FolderSettings => {
		if (typeof type !== "string" || !type) return settings.upload.behavior;
		if (type.match(/^(fixed|obsidian|yaml)$/i))
			return type.toLowerCase() as FolderSettings;
		return settings.upload.behavior;
	};
	for (const repo of properties) {
		const smartKey = repository ? repository.smartKey : "default";
		const category = asRecord(fmGet(frontmatter, "category"));
		const attachment = asRecord(fmGet(frontmatter, "attachment"));

		const path: Path = {
			type: matchType(fmGet(frontmatter, "behavior")),
			defaultName:
				(fmGet(frontmatter, "defaultName") as string | undefined) ??
				(category?.value as string | undefined) ??
				(fmGet(frontmatter, "category.value") as string | undefined) ??
				settings.upload.defaultName,
			rootFolder:
				(fmGet(frontmatter, "rootFolder") as string | undefined) ??
				settings.upload.rootFolder,
			category: {
				key:
					splitArrayPath(category?.key ?? fmGet(frontmatter, "category.key")) ??
					settings.upload.yamlFolderKey,
				value: getCategory(frontmatter, settings, undefined),
			},
			override: splitArrayPath(fmGet(frontmatter, "path")),
			smartkey: smartKey,
			attachment: {
				send:
					(attachment?.send as boolean | undefined) ??
					(fmGet(frontmatter, "attachment.send") as boolean | undefined) ??
					settings.embed.attachments,
				folder:
					splitArrayPath(attachment?.send ?? fmGet(frontmatter, "attachment.folder")) ??
					settings.embed.folder,
			},
		};
		/** List of alias for path generation */
		const smartkeys = {
			/** Overriding path, will skip the rest if exists */
			path: fmGet(frontmatter, `${smartKey}.path`),
			/** Overriding the default category name. Can be a literal string or an object */
			category: fmGet(frontmatter, `${smartKey}.category`),
			/** Overriding the default behavior, can be only yaml | obsidian | fixed */
			behavior: fmGet(frontmatter, `${smartKey}.behavior`),
			/** Overriding attachment */
			attachment: fmGet(frontmatter, `${smartKey}.attachment`),
			/** Alias of attachment.folder */
			attachmentLinks: fmGet(frontmatter, `${smartKey}.attachmentLinks`),
			/** Overriding the root folder */
			rootFolder: fmGet(frontmatter, `${smartKey}.rootFolder`),
			/** DefaultName is only used if yaml, but we parse it in case */
			defaultName: {
				/** Direct with smartkey.defaultName */
				direct: fmGet(frontmatter, `${smartKey}.defaultName`),
				/** Is used in the category.value as literal string */
				asCategoryValue: fmGet(frontmatter, `${smartKey}.category.value`),
			},
			/** Overriding of the category key */
			categoryKey: {
				/** Can be direct with smarkey.<categoryName> like smartkey.folder: category */
				direct: fmGet(frontmatter, `${smartKey}.${path.category.key}`),
				/** Can be a key in a literal string: smartkey.category.key: category will rename the category  */
				asKey: fmGet(frontmatter, `${smartKey}.category.key`),
			},
		};

		if (smartkeys.path) {
			path.override = splitArrayPath(smartkeys.path);
			continue;
		}
		if (smartkeys.categoryKey.direct)
			path.category.key = smartkeys.categoryKey.direct as string;
		if (smartkeys.categoryKey.asKey)
			path.category.key =
				splitArrayPath(smartkeys.categoryKey.asKey) ?? path.category.key;
		if (smartkeys.rootFolder) {
			path.rootFolder = splitArrayPath(smartkeys.rootFolder) as string;
		}
		if (smartkeys.defaultName.direct)
			path.defaultName = splitArrayPath(smartkeys.defaultName.direct) as string;

		if (smartkeys.defaultName.asCategoryValue)
			path.defaultName =
				splitArrayPath(smartkeys.defaultName.asCategoryValue) ?? path.defaultName;

		if (smartkeys.category) {
			const categoryRecord = asRecord(smartkeys.category);
			if (categoryRecord) {
				if (categoryRecord.value)
					path.defaultName = splitArrayPath(categoryRecord.value) ?? path.defaultName;
				if (categoryRecord.key)
					path.category.key = splitArrayPath(categoryRecord.key) ?? path.category.key;
			} else path.category.key = splitArrayPath(smartkeys.category) ?? path.category.key;
		}
		if (smartkeys.behavior) path.type = matchType(smartkeys.behavior);

		if (smartkeys.attachment) {
			const attachmentRecord = asRecord(smartkeys.attachment);
			if (attachmentRecord) {
				path.attachment = {
					send: (attachmentRecord.send as boolean | undefined) ?? path.attachment!.send,
					folder: splitArrayPath(attachmentRecord.folder) ?? path.attachment!.folder,
				};
			} else path.attachment!.send = smartkeys.attachment as boolean;
		}
		if (smartkeys.attachmentLinks)
			path.attachment!.folder = normalizePath(
				(smartkeys.attachmentLinks as string).replace(/\/$/, "")
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
	const dataview = fmGet(frontmatter, `${key}dataview`);
	if (dataview != undefined) {
		frontConvert.dataview = dataview as boolean;
	}
	const hardbreak = fmGet(frontmatter, `${key}hardbreak`);
	if (hardbreak != undefined) {
		frontConvert.hardbreak = hardbreak as boolean;
	}
	const includeLinks = fmGet(frontmatter, `${key}includeLinks`);
	if (includeLinks != undefined) {
		frontConvert.includeLinks = includeLinks as boolean;
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
	const linkedFrontmatter = fmGet(originalFrontmatter, linkedKey);
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
		delete linkedFrontmatter?.[plugin.settings.plugin.shareKey];
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
	const linksValue = fmGet(frontmatter, key);
	if (linksValue != undefined) {
		const linksRecord = asRecord(linksValue);
		if (linksRecord) {
			if (linksRecord.convert != undefined) {
				settingsConversion.links = linksRecord.convert as boolean;
			}
			if (linksRecord.internals != undefined) {
				settingsConversion.convertInternalLinks = linksRecord.internals as boolean;
			}
			if (linksRecord.mdlinks != undefined) {
				settingsConversion.convertWiki = linksRecord.mdlinks as boolean;
			}
			if (linksRecord.nonShared != undefined) {
				settingsConversion.unshared = linksRecord.nonShared as boolean;
			}
			if (linksRecord.unlink != undefined) {
				settingsConversion.unlink = linksRecord.unlink as boolean;
			}
		} else {
			settingsConversion.links = linksValue as boolean;
		}
	}
	const convert = fmGet(frontmatter, `${key}.convert`);
	if (convert != undefined) settingsConversion.links = convert as boolean;
	const internals = fmGet(frontmatter, `${key}.internals`);
	if (internals != undefined)
		settingsConversion.convertInternalLinks = internals as boolean;
	const mdlinks = fmGet(frontmatter, `${key}.mdlinks`);
	if (mdlinks != undefined) settingsConversion.convertWiki = mdlinks as boolean;
	const nonShared = fmGet(frontmatter, `${key}.nonShared`);
	if (nonShared != undefined) settingsConversion.unshared = nonShared as boolean;
	const unlink = fmGet(frontmatter, `${key}.unlink`);
	if (unlink != undefined) settingsConversion.unlink = unlink as boolean;
	const aliasedMdlinks = fmGet(frontmatter, smartKey ? `${smartKey}.mdlinks` : "mdlinks");
	if (aliasedMdlinks != undefined)
		settingsConversion.convertWiki = aliasedMdlinks as boolean;
	const aliasedInternals = fmGet(
		frontmatter,
		smartKey ? `${smartKey}.internals` : "internals"
	);
	if (aliasedInternals != undefined)
		settingsConversion.convertInternalLinks = aliasedInternals as boolean;
	const aliasedNonShared = fmGet(
		frontmatter,
		smartKey ? `${smartKey}.nonShared` : "nonShared"
	);
	if (aliasedNonShared != undefined)
		settingsConversion.unshared = aliasedNonShared as boolean;

	return settingsConversion;
}

function settingsEmbed(
	frontmatter: FrontMatterCache | null | undefined,
	settingsConversion: PropertiesConversion,
	smartkey?: string
) {
	if (!frontmatter) return settingsConversion;
	const key = smartkey ? `${smartkey}.embed` : "embed";
	const embedValue = fmGet(frontmatter, key);
	if (embedValue != undefined) {
		const embedRecord = asRecord(embedValue);
		if (embedRecord) {
			if (embedRecord.send != undefined) {
				settingsConversion.embed = embedRecord.send as boolean;
			}
			if (embedRecord.remove != undefined) {
				settingsConversion.removeEmbed = booleanRemoveEmbed(embedRecord.remove);
			}
			if (embedRecord.char != undefined) {
				settingsConversion.charEmbedLinks = embedRecord.char as string;
			}
		} else {
			settingsConversion.embed = embedValue as boolean;
		}
	}
	const send = fmGet(frontmatter, `${key}.send`);
	if (send != undefined) settingsConversion.embed = send as boolean;
	const remove = fmGet(frontmatter, `${key}.remove`);
	if (remove != undefined) settingsConversion.removeEmbed = booleanRemoveEmbed(remove);
	const char = fmGet(frontmatter, `${key}.char`);
	if (char != undefined) settingsConversion.charEmbedLinks = char as string;
	const removeEmbedKey = smartkey ? `${smartkey}.removeEmbed` : "removeEmbed";
	const removeEmbedValue = fmGet(frontmatter, removeEmbedKey);
	if (removeEmbedValue != undefined)
		settingsConversion.removeEmbed = booleanRemoveEmbed(removeEmbedValue);

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
	const attachmentValue = fmGet(frontmatter, key);
	if (attachmentValue) {
		const attachmentRecord = asRecord(attachmentValue);
		if (attachmentRecord) {
			if (attachmentRecord.send != undefined) {
				settingsConversion.attachment = attachmentRecord.send as boolean;
			}
			if (attachmentRecord.folder != undefined) {
				settingsConversion.attachmentLinks = attachmentRecord.folder as string;
			}
		} else {
			settingsConversion.attachment = attachmentValue as boolean;
		}
	}

	const send = fmGet(frontmatter, `${key}.send`);
	if (send != undefined) settingsConversion.attachment = send as boolean;
	const folder = fmGet(frontmatter, `${key}.folder`);
	if (folder != undefined) settingsConversion.attachmentLinks = folder as string;

	if (settingsConversion.attachmentLinks) {
		settingsConversion.attachmentLinks = normalizePath(
			settingsConversion.attachmentLinks.toString().replace(/\/$/, "")
		);
	}
	return settingsConversion;
}

export function mergeFrontmatter(
	frontmatter: FrontMatterCache | null,
	sourceFrontmatter: FrontMatterCache | null | undefined,
	shareKey: string
) {
	delete sourceFrontmatter?.[shareKey];
	if (sourceFrontmatter && frontmatter)
		//@ts-ignore
		frontmatter = merge.withOptions(
			{ allowUndefinedOverrides: false },
			sourceFrontmatter,
			frontmatter
		);
	return frontmatter;
}
