import type { FolderSettings, GithubTiersVersion } from "src/interfaces/enum";
import type {
	OverrideAttachments,
	RegexReplace,
	Repository,
	TextCleaner,
} from "src/interfaces/main";

export type Api = {
	/**
	 * The tier of the API
	 * @default GithubTiersVersion.free
	 */
	tiersForApi: GithubTiersVersion;
	/**
	 * The hostname of the API
	 */
	hostname: string;
};

export type Workflow = {
	/**
	 * The commit message when the PR is merged
	 */
	commitMessage: string;
	/**
	 * The path of the github action file
	 * The github action needs to be set on "workflow_dispatch" to be able to be triggered
	 */
	name: string;
};

export type ShareAll = {
	enable: boolean;
	/**
	 * The name of the files to exclude
	 */
	excludedFileName: string;
};

export type CopyLink = {
	/**
	 * Link to made the copy link command
	 */
	links: string;
	/**
	 * Remove part of the link
	 */
	removePart: string[];
	/**
	 * Adjust the created link
	 */
	transform: {
		/**
		 * Transform the link to an uri
		 */
		toUri: boolean;
		/**
		 * Slugify the link
		 * - `lower` : slugify the link in lower case
		 * - `strict` : slugify the link in lower case and remove all special characters (including chinese or russian one)
		 * - `disable` : do not slugify the link
		 */
		slugify: "lower" | "strict" | "disable";
		/**
		 * Apply a regex to the link
		 */
		applyRegex: {
			regex: string;
			replacement: string;
		}[];
	};
};

/**
 * The GitHub settings of the plugin
 */
export interface GitHub {
	/** The user that belongs to the repository, can be also a community (like enveloppe) */
	user: string;
	/** The name of the repository */
	repo: string;
	/**
	 * The branch of the repository (default: main)
	 */
	branch: string;
	/**
	 * The path where the token is stored (as the token is not saved in the settings directly, to prevent mistake and security issue)
	 * @default `%configDir%/plugins/%pluginID%/env`
	 */
	tokenPath: string;
	/**
	 * If the PR should be automatically merged
	 */
	automaticallyMergePR: boolean;
	/**
	 * Don't push the changes to the repository, or make any action on the repository
	 * It will use a local folder instead to mimic the behavior of the plugin
	 */
	dryRun: {
		enable: boolean;
		/** The folder name that mimic the folder, allow special keys to mimic multiple repository
		 * @key `%owner%` the owner of the repository (equivalent to `user`)
		 * @key `%repo%` the name of the repository
		 * @key `%branch%` the branch of the repository
		 */
		folderName: string;
	};
	/**
	 * The settings for the github API
	 */
	api: Api;
	/** workflow and action of the plugin in github */
	workflow: Workflow;
	/** Enable the usage of different repository */
	otherRepo: Repository[];
	/** If the default repository is verified */
	verifiedRepo?: boolean;
	/** The rate limit of the Github API */
	rateLimit: number;
}

/**
 * The settings for the upload settings tabs
 */
export interface Upload {
	/** The behavior of the folder settings
	 * - `yaml` : use a yaml frontmatter to set the path
	 * - `obsidian` : use the obsidian path
	 * - `fixed` : use a fixed folder and send all in it
	 */
	behavior: FolderSettings;
	/** The default name of the folder
	 * Used only with `yaml` behavior, when the `category: XXX` is not set in the frontmatter.
	 */
	defaultName: string;
	/** The root folder of the repository
	 * Used with all behavior
	 */
	rootFolder: string;
	/** The "category" key name if used with YAML behavior */
	yamlFolderKey: string;
	/** Generate the filename using a frontmatter key, to change it in the repository.
	 */
	frontmatterTitle: {
		enable: boolean;
		/** @default `title` */
		key: string;
	};
	/** Edit the title by using regex */
	replaceTitle: RegexReplace[];
	/** Edit the path by using regex; apply also on attachment path (will be applied on all path)*/
	replacePath: RegexReplace[];
	/** Auto remove file that was unshared (deleted in Obsidian or removed by set `share: false`) */
	autoclean: {
		enable: boolean;
		/** Prevent deleting files */
		excluded: string[];
		includeAttachments: boolean;
	};
	/** Allow to set a folder note in `index.md` (example) when some settings are met
	 * For example, auto-rename to `index.md` when the file name and the folder name are the same.
	 */
	folderNote: {
		enable: boolean;
		/** The name of the index, by default `index.md`*/
		rename: string;
		/** save the old title in the frontmatter */
		addTitle: {
			enable: boolean;
			key: string;
		};
	};
	/** The path to the metadata extractor plugin */
	metadataExtractorPath: string;
}

export interface Conversion {
	/** Add the two markdown space at the end of each line */
	hardbreak: boolean;
	/** Convert dataview queries to markdown */
	dataview: boolean;
	/** Allow to edit the content of files with regex */
	censorText: TextCleaner[];
	/** Add tags into frontmatter */
	tags: {
		/** Allow to add inline tags into the frontmatter, like #tags into tags: [] */
		inline: boolean;
		/** Exclude some tags from that */
		exclude: string[];
		/** add the fields value into tags too */
		fields: string[];
	};
	/** Settings for the links */
	links: {
		/** Convert internal links to their proper path into Obsidian */
		internal: boolean;
		/** Also convert the internal path for unshared files */
		unshared: boolean;
		/** Convert wikilinks to markdown links */
		wiki: boolean;
		/** Slugify links if needed
		 * - `disable` : do not slugify the link
		 * - `strict` : slugify the link in lower case and remove all special characters (including chinese or russian one)
		 * - `lower` : slugify the link in lower case
		 * @default `disable`
		 */
		slugify: "disable" | "strict" | "lower" | boolean;
	};
}

/**
 * The settings for the embed settings tabs
 * Allow to set the behavior of the embeds, like attachments, notes, links...
 */
export interface Embed {
	/** Allow to send attachments */
	attachments: boolean;
	/** Force push attachments and change their path.
	 * Will be before the replacePath settings
	 */
	overrideAttachments: OverrideAttachments[];
	/** Use the obsidian folder for the attachments */
	useObsidianFolder?: boolean;
	/** Send files linkeds to a frontmatter keys */
	keySendFile: string[];
	/** Also send embeddednotes */
	notes: boolean;
	/** The folder where the attachments are stored */
	folder: string;
	/** Modify the embeds:
	 * - `links` : convert the embed to links
	 * - `remove` : remove the embed
	 * - `keep` : keep the embed
	 * - `bake` : bake the embed into the text
	 */
	convertEmbedToLinks: "links" | "remove" | "keep" | "bake";
	/** Allow to insert character(s) before the link
	 * @example `->` allow to convert `[[file]]` to `-> [[file]]`
	 */
	charConvert: string;
	/** Baking settings when including the text of the embed directly into the notes */
	bake?: {
		/** Allow  */
		textBefore: string;
		textAfter: string;
	};
	/** Allow send file not natively supported by obsidian
	 * Support regex (with `/regex/flags` format)
	 */
	unHandledObsidianExt: string[];
	/** Also send files /attachments linkeds by links (ie [[file]])
	 * Will apply all previous settings
	 */
	sendSimpleLinks: boolean;
}

/**
 * The settings for the plugin behavior
 * Allow to set the behavior of the plugin, like commands added, share all, logs...
 */
export interface PluginBehavior {
	/** The native key for sharing
	 * @default `share`
	 */
	shareKey: string;
	/** Allow to share all file without using a frontmatter key */
	shareAll?: ShareAll;
	/** Allow to create shortcuts in the file menu (right click in explorer)*/
	fileMenu: boolean;
	/** Allow to create shortcuts in the editor menu (right click in editor)*/
	editorMenu: boolean;
	/** The folder to exclude from the plugin */
	excludedFolder: string[];
	/** Allow to create a commands to copy the link */
	copyLink: {
		/** Enable globally the creator when a file is created => send it in the clipboard */
		enable: boolean;
		/** Create a commands in the palette */
		addCmd: boolean;
	} & CopyLink;
	/** Send an obsidian notification on error */
	noticeError: boolean;
	/** Send all logs in the console */
	dev?: boolean;
	/** Display a strange modal when a file is send, resuming the action of the plugin */
	displayModalRepoEditing: boolean;
	/** If the settings was migrated from previous version. */
	migrated?: boolean;
	/** Allow to save the tabsId.
	 * If disabled, the user will always return to the default tab when the settings are closed.
	 */
	saveTabId?: boolean;
	/** Key used for "link" a frontmatter (overriding default settings) into another frontmatter
	 * @default `Set`
	 * @example `Set: [[frontmatter]]`
	 */
	setFrontmatterKey: string;
	/**
	 * Save the folder of the plugin
	 * @default `.obsidian/plugins/%pluginID%`
	 */
	manifestDir?: string;
}

/**
 * @interface MetadataExtractor
 * @description Interface for the metadata extractor plugin
 */
export interface MetadataExtractor {
	allExceptMdFile: string | null;
	metadataFile: string | null;
	tagsFile: string | null;
}
