import type { FrontMatterCache, TFile } from "obsidian";

import type { EnumbSettingsTabId, FolderSettings, TypeOfEditRegex } from "./enum";
import type {
	Api,
	Conversion,
	CopyLink,
	Embed,
	GitHub,
	PluginBehavior,
	ShareAll,
	Upload,
	Workflow,
} from "./settings";

/**
 * @interface RegexReplace
 * @description Interface for the regex replace settings, to replace the path or the title of a file with a regex
 */
export interface RegexReplace {
	regex: string;
	replacement: string;
	type: TypeOfEditRegex;
}

/**
 * @interface Repository
 * @description Interface when registering another repository than the default one
 */
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
	copyLink: CopyLink;
	/**
	 * Allow to set a file for settings that override for example path, dataview, hardbreak...
	 * Useful for autoclean settings, but also for other settings without needing to change the frontmatter and use the set function
	 */
	set: string | null;
}

/**
 * @interface EnveloppeSettings
 * @description Interface for the settings of the plugin
 */
export interface EnveloppeSettings {
	/**
	 * Save the tabs id when the settings was closed, pretty useful when quick tests are done
	 */
	tabsId?: EnumbSettingsTabId;
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
	/** The TFile linked */
	linked: TFile;
	/** The source (where the file was found) from */
	linkFrom: string;
	/** The alt text/alias of the link */
	altText?: string;
	/** The destination file path if any (frontmatter settings, like title etc)*/
	destinationFilePath?: string;
	/** If the file was linked by an anchor
	 * Include the `#` in the anchor
	 * @example `[[file#anchor]]`
	 */
	anchor?: string;
	/** If the file was linked by an embed or a link */
	type: "embed" | "link";
	/** Position of the embed /link if any (used for bake) */
	position?: {
		start: number;
		end: number;
	};
}

/**
 * @interface ConvertedLink
 * A type for the shared files in the vault that includes the prop, but also the real path in Obsidian and the converted path in GitHub
 */
export interface ConvertedLink {
	/** Path in GitHub */
	converted: string;
	/** Path in Obsidian */
	real: TFile;
	/** The prop */
	prop?: Properties | Properties[];
	/** @important Only if Attachment ; list all possible path using the backlinks */
	otherPaths?: string[];
}

/**
 * @interface GithubRepo
 * @description File in the github Repository with the sha
 */
export interface GithubRepo {
	file: string;
	sha: string;
}

/**
 * @interface TextCleaner
 * @description Interface for the text cleaner settings, to replace some text in the files
 */
export interface TextCleaner {
	/** Text to replace */
	entry: string;
	/** Replacement (support regex)*/
	replace: string;
	/** After or before all other conversion */
	after: boolean;
	/** If the text is a regex with flags*/
	flags?: string;
	/** Change the text in codeBlocks too. */
	inCodeBlocks?: boolean;
}

/**
 * @interface Path
 * Override the path of a file using the frontmatter settings
 * It can override majority of {@link Upload} settings
 * The frontmatter can be written in the syntax `key.subkey: value`
 * Also, it supports smartkey so: `smartkey.key.subkey: value` override the path only for the linked {@link Repository} with the smartkey
 */
export interface Path {
	/** Folder settings
	 * - `yaml` : Use YAML frontmatter for settings the path
	 * - `obsidian` : Use the obsidian tree
	 * - `fixed` : Use a fixed folder and send all in it
	 */
	type: FolderSettings;
	/** The default receipt folder, used by `yaml` type only */
	defaultName: string;
	/** The root folde */
	rootFolder: string;
	/** If the category key is overridden */
	category: {
		/** The key to override */
		key?: string;
		/** The value to override */
		value?: string;
	};
	/** Override the entire path, from root and must include the extension */
	override?: string;
	/** If a smartkey is found, for repository settings */
	smartkey?: string;
	/** Override attachement settings */
	attachment?: {
		/** Send or not attachment */
		send: boolean;
		/** Default folder for attachment */
		folder: string;
	};
}

/** A sort of extension of Properties, but include settings like bake embed, dataview or unshared links conversion */
export interface PropertiesConversion {
	/** Convert links */
	links: boolean;
	/** Send attachment */
	attachment: boolean;
	/** Send embed */
	embed: boolean;
	/** Folder receipt of file */
	attachmentLinks?: string;
	/** Convert wikilinks to markdown */
	convertWiki: boolean;
	/** Remove embed or bake it */
	removeEmbed: "keep" | "remove" | "links" | "bake";
	/** Add text before embed, like `-> [[embed]]` instead of `![[embed]]` */
	charEmbedLinks: string;
	/** Convert dataview queries */
	dataview: boolean;
	/** Add hardbreak */
	hardbreak: boolean;
	/** convert link of unshared files */
	unshared: boolean;
	/** Convert internal links to their part in the github repo */
	convertInternalLinks: boolean;
	/** Include also linked files in the send/conversion */
	includeLinks: boolean;
}

/** A very important interface that handle a repository from the frontmatter and a lot of usefull settings that override the default plugin behavior, including {@link Path}.
 * Properties also handle {@link Repository} settings.
 */
export interface Properties {
	/** Branch name */
	branch: string;
	/** The repository name */
	repo: string;
	/** The owner of the repository */
	owner: string;
	/** Allow autoclean the repo */
	autoclean: boolean;
	/** workflow name if needed to activate it */
	workflowName: string;
	/** commitMsg if the default is not okay for this repo */
	commitMsg: string;
	/** Automatically merge the PR */
	automaticallyMergePR: boolean;
	/** If the repository was checked */
	verifiedRepo?: boolean;
	/** Override path settings */
	path?: Path;
	/** Save the rate Limit from {@link Repository} */
	rateLimit?: number;
	/** If the dryRun is enabled and which settings are used */
	dryRun: {
		/** Enable the dryRun */
		enable: boolean;
		/** The folder receipt */
		folderName: string;
		/** If autoclean must perform in it */
		autoclean: boolean;
	};
}
/**
 * Preset from the official repository
 */
export interface Preset {
	name: string;
	settings: EnveloppeSettings;
}

export type SetRepositoryFrontmatter = {
	[repository: string]: FrontMatterCache | null | undefined;
};

/**
 * Override attachments settings, allowing force push and changing the destination
 */
export interface OverrideAttachments {
	/** Path to override.
	 * Support `{{all}}` special keys for handled all attachment */
	path: string;
	/** Destination of the files, use `{{default}}` to send into their default repository */
	destination: string;
	/** Force push the attachments */
	forcePush: boolean;
}
