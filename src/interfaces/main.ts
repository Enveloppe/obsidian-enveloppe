import { FrontMatterCache, TFile } from "obsidian";

import { EnumbSettingsTabId, FolderSettings,TypeOfEditRegex  } from "./enum";
import { Api, Conversion, CopyLink, Embed, GitHub, PluginBehavior, ShareAll, Upload, Workflow } from "./settings";

export interface RegexReplace {
	regex: string;
	replacement: string;
	type: TypeOfEditRegex;
}

export interface Repository {
	/**
	 * The smart key of the repository (used to identify the repository)
	 */
	smartKey: string;
	/**
	 * The user of the repository (can be a real user or a community)
	 */
	user: string;
	/**
	 * The repository name
	 */
	repo: string;
	/**
	 * The branch of the repository (default: main)
	 */
	branch: string;
	/**
	 * If the PR should be automatically merged
	 */
	automaticallyMergePR: boolean;
	/**
	 * if the validity of the repository was checked and valide
	 */
	verifiedRepo?: boolean;
	/**
	 * The rate limit of the GitHub API
	 */
	rateLimit?: number;
	/**
	 * The github token if needed ; use the default one if not set
	 */
	token?: string;
	/**
	 * The github API hostname
	 */
	api: Api;
	/**
	 * The workflow settings for merging the PR or active a github action
	 */
	workflow: Workflow;
	/**
	 * Create a shortcut in obsidian menus (right-click / file menu / editor menu) for action on this repository
	 */
	createShortcuts: boolean;
	/**
	 * The name of the share key
	 */
	shareKey: string;
	/**
	 * Share all file without a sharing key
	 */
	shareAll?: ShareAll;
	/**
	 * Setting for copy link commands
	 */
	copyLink: CopyLink,
	/**
	 * Allow to set a file for settings that override for example path, dataview, hardbreak... 
	 * Useful for autoclean settings, but also for other settings without needing to change the frontmatter and use the set function
	 */
	set: TFile | null;
}

/**
 * @interface GitHubPublisherSettings
 * @description Interface for the settings of the plugin
 */
export interface GitHubPublisherSettings {
	/**
	 * Save the tabs id when the settings was closed, pretty useful when quick tests are done
	 */
	tabsID?: EnumbSettingsTabId;
	/**
	 * GitHub settings for the default repository
	 */
	github: GitHub;
	/** Path settings, including converting like, replace path (with regex), folder note support... */
	upload: Upload;
	/**
	 * Settings for the content like hardbreak, dataview, censor text, tags, links...
	 */
	conversion: Conversion;
	/** Files attached to other files by embedded or links. Include attachments settings (image...) */
	embed: Embed;
	plugin: PluginBehavior;
}


/**
 * @interface LinkedNotes
 * @description Interface for the linked notes, with the file, the link from, the alt text and the destination file path
 */
export interface LinkedNotes {
	linked: TFile;
	linkFrom: string;
	altText?: string;
	destinationFilePath?: string;
	anchor?: string;
	type: "embed" | "link";
	position?: {
		start: number;
		end: number;
	}
}

export interface ConvertedLink {
	converted: string;
	real: string;
	repoFrontmatter?: RepoFrontmatter | RepoFrontmatter[];
}

export interface GithubRepo {
	file: string;
	sha: string;
}

export interface TextCleaner {
	entry: string;
	replace: string;
	after: boolean;
	flags?: string;
	inCodeBlocks?: boolean;
}

export interface Path {
	type: FolderSettings;
	defaultName: string;
	rootFolder: string;
	category?: {
		key: string;
		value: string;
	};
	override?: string;
	smartkey?: string;
	attachment?: {
		send: boolean;
		folder: string;
	};
}

export interface FrontmatterConvert {
	links: boolean;
	attachment: boolean;
	embed: boolean;
	attachmentLinks?: string;
	convertWiki: boolean;
	removeEmbed: "keep" | "remove" | "links" | "bake";
	charEmbedLinks: string;
	dataview: boolean;
	hardbreak: boolean;
	unshared: boolean;
	convertInternalLinks: boolean;
	includeLinks: boolean;
}

export interface RepoFrontmatter {
	branch: string;
	repo: string;
	owner: string;
	autoclean: boolean;
	workflowName: string;
	commitMsg: string;
	automaticallyMergePR: boolean;
	verifiedRepo?: boolean;
	path?: Path;
	rateLimit?: number;
	dryRun: {
		enable: boolean;
		folderName: string;
		autoclean: boolean;
	}
}

export interface Preset {
	name: string;
	settings: GitHubPublisherSettings;
}

export type SetRepositoryFrontmatter = {[repository: string] : FrontMatterCache | null | undefined};

export interface OverrideAttachments {
	path: string;
	destination: string;
	forcePush: boolean;
}