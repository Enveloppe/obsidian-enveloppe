import { DEFAULT_SETTINGS, GithubTiersVersion } from "@interfaces";
import type {
	EnveloppeSettings,
	Properties,
	PropertiesConversion,
	Repository,
} from "@interfaces/main";
import { klona } from "klona";
import type { FrontMatterCache } from "obsidian";
import { merge } from "ts-deepmerge";

/**
 * obsidian-typings augments FrontMatterCache with a required (if deprecated)
 * `index__` method "for typing purposes", so a plain object literal is no
 * longer structurally assignable to it. Real code never constructs one -
 * it only ever reads `metadataCache.getFileCache(file)?.frontmatter` - so
 * this cast only matters for building test fixtures.
 */
export function fm(obj: Record<string, unknown>): FrontMatterCache {
	return obj as unknown as FrontMatterCache;
}

/** A full, valid EnveloppeSettings fixture, optionally deep-merged with overrides. */
export function createSettings(
	overrides: Partial<EnveloppeSettings> = {}
): EnveloppeSettings {
	return merge(klona(DEFAULT_SETTINGS), overrides) as unknown as EnveloppeSettings;
}

export function createProperties(overrides: Partial<Properties> = {}): Properties {
	return {
		branch: "main",
		repo: "repo",
		owner: "owner",
		autoclean: false,
		workflowName: "",
		commitMsg: "",
		automaticallyMergePR: false,
		dryRun: {
			enable: false,
			folderName: "",
			autoclean: false,
		},
		...overrides,
	};
}

export function createPropertiesConversion(
	overrides: Partial<PropertiesConversion> = {}
): PropertiesConversion {
	return {
		links: true,
		attachment: true,
		embed: true,
		convertWiki: false,
		removeEmbed: "keep",
		charEmbedLinks: "->",
		dataview: false,
		hardbreak: false,
		unshared: false,
		convertInternalLinks: false,
		includeLinks: false,
		unlink: false,
		...overrides,
	};
}

export function createRepository(overrides: Partial<Repository> = {}): Repository {
	return {
		smartKey: "default",
		user: "owner",
		repo: "repo",
		branch: "main",
		automaticallyMergePR: false,
		api: { tiersForApi: GithubTiersVersion.Free, hostname: "" },
		workflow: { commitMessage: "", name: "" },
		createShortcuts: false,
		shareKey: "share",
		copyLink: {
			links: "",
			removePart: [],
			transform: { toUri: true, slugify: "lower", applyRegex: [] },
		},
		set: null,
		...overrides,
	};
}

/** A minimal object that satisfies TFile's shape without needing the real Obsidian class. */
export function createFile(overrides: {
	path?: string;
	name?: string;
	basename?: string;
	extension?: string;
}) {
	const path = overrides.path ?? "note.md";
	const name = overrides.name ?? path.split("/").pop() ?? path;
	const extension = overrides.extension ?? name.split(".").pop() ?? "";
	const basename = overrides.basename ?? name.replace(new RegExp(`\\.${extension}$`), "");
	return { path, name, basename, extension, stat: { mtime: 0, ctime: 0, size: 0 } };
}
