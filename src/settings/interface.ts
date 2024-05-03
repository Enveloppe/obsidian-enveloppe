import { TFile } from "obsidian";

import GithubPublisher from "../main";

export enum TypeOfEditRegex {
	path = "path",
	title = "title",
}

export enum EnumbSettingsTabId {
	github = "github-configuration",
	upload = "upload-configuration",
	text = "text-conversion",
	embed = "embed-configuration",
	plugin = "plugin-settings",
	help = "help",
}

export interface RegexReplace {
	regex: string;
	replacement: string;
	type: TypeOfEditRegex;
}

export interface Repository {
	smartKey: string;
	user: string;
	repo: string;
	branch: string;
	automaticallyMergePR: boolean;
	verifiedRepo?: boolean;
	rateLimit?: number;
	token?: string;
	api: {
		tiersForApi: GithubTiersVersion;
		hostname: string;
	}
	workflow: {
		commitMessage: string;
		name: string;
	}
	createShortcuts: boolean;
	shareKey: string;
	shareAll?: {
		enable: boolean;
		excludedFileName: string;
	}
	copyLink: {
		links: string;
		removePart: string[];
		transform: {
			toUri: boolean;
			slugify: "lower" | "strict" | "disable";
			applyRegex: {
				regex: string;
				replacement: string;
			}[]
		}
	}

}

/**
 * @interface GitHubPublisherSettings
 * @description Interface for the settings of the plugin
 */
export interface GitHubPublisherSettings {
	tabsID?: EnumbSettingsTabId;
	github: {
		user: string;
		repo: string;
		branch: string;
		tokenPath: string;
		automaticallyMergePR: boolean;
		dryRun: {
			enable: boolean;
			folderName: string;
		}
		api: {
			tiersForApi: GithubTiersVersion;
			hostname: string;
		}
		workflow: {
			commitMessage: string;
			name: string;
		},
		otherRepo: Repository[];
		verifiedRepo?: boolean;
		rateLimit: number;
	}
	upload: {
		behavior: FolderSettings;
		defaultName: string;
		rootFolder: string;
		yamlFolderKey: string;
		frontmatterTitle: {
			enable: boolean;
			key: string;
		}
		replaceTitle: RegexReplace[],
		replacePath: RegexReplace[],
		autoclean: {
			enable: boolean;
			excluded: string[];
		}
		folderNote: {
			enable: boolean;
			rename: string;
			addTitle: {
				enable: boolean;
				key: string;
			};
		}
		metadataExtractorPath: string;
	}
	conversion: {
		hardbreak: boolean;
		dataview: boolean;
		censorText: TextCleaner[];
		tags: {
			inline: boolean;
			exclude: string[];
			fields: string[];
		}
		links: {
			internal: boolean;
			unshared: boolean;
			wiki: boolean;
			slugify: "disable" | "strict" | "lower" | boolean;
		}
	}
	embed: {
		attachments: boolean;
		overrideAttachments: OverrideAttachments[];
		useObsidianFolder?: boolean;
		keySendFile: string[];
		notes: boolean;
		folder: string;
		convertEmbedToLinks: "links" | "remove" | "keep" | "bake";
		charConvert: string;
		bake?: {
			textBefore: string;
			textAfter: string;
		};
		unHandledObsidianExt: string[];
		sendSimpleLinks: boolean;
	}
	plugin:
	{
		shareKey: string;
		shareAll?: {
			enable: boolean;
			excludedFileName: string;
		}
		fileMenu: boolean;
		editorMenu: boolean;
		excludedFolder: string[];
		copyLink: {
			enable: boolean;
			links: string;
			removePart: string[];
			addCmd: boolean;
			transform: {
				toUri: boolean;
				slugify: "lower" | "strict" | "disable";
				applyRegex: {
					regex: string;
					replacement: string;
				}[]
			}
		}
		noticeError: boolean;
		dev?: boolean;
		displayModalRepoEditing: boolean;
		migrated?: boolean;
		saveTabId?: boolean;
		setFrontmatterKey: string;

	}
}



/**
 * Allow to set a value for the folder settings
 * @enum FolderSettings
 */
export enum FolderSettings {
	yaml = "yaml",
	obsidian = "obsidian",
	fixed = "fixed",
}

/**
 * @enum GithubTiersVersion
 * @description Allow to set a value for the github tiers
 */
export enum GithubTiersVersion {
	free = "Github Free/Pro/Team (default)",
	entreprise = "Enterprise",
}

export interface MultiProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: FrontmatterConvert;
		repo: RepoFrontmatter | RepoFrontmatter[];
	},
	repository: Repository | null;
	filepath: string;
}

export interface MonoProperties {
	plugin: GithubPublisher;
	frontmatter: {
		general: FrontmatterConvert;
		repo: RepoFrontmatter
	},
	repository: Repository | null;
	filepath: string;
}

export interface MonoRepoProperties {
	frontmatter: RepoFrontmatter;
	repo: Repository | null;
}

export interface MultiRepoProperties {
	frontmatter: RepoFrontmatter[] | RepoFrontmatter;
	repo: Repository | null;
}


/**
 * Just a constant for the token path
 * @type {string} TOKEN_PATH
 */
export const TOKEN_PATH: string = "%configDir%/plugins/%pluginID%/env";

export const DEFAULT_SETTINGS: Partial<GitHubPublisherSettings> = {
	github: {
		user: "",
		repo: "",
		branch: "main",
		automaticallyMergePR: true,
		dryRun: {
			enable: false,
			folderName: "github-publisher",
		},
		tokenPath: TOKEN_PATH,
		api: {
			tiersForApi: GithubTiersVersion.free,
			hostname: "",
		},
		workflow: {
			commitMessage: "[PUBLISHER] Merge",
			name: "",
		},
		otherRepo: [],
		verifiedRepo: false,
		rateLimit: 0,
	},
	upload: {
		behavior: FolderSettings.fixed,
		defaultName: "",
		rootFolder: "",
		yamlFolderKey: "",
		frontmatterTitle: {
			enable: false,
			key: "title",
		},
		replaceTitle: [],
		replacePath: [],
		autoclean: {
			enable: false,
			excluded: [],
		},
		folderNote: {
			enable: false,
			rename: "index.md",
			addTitle: {
				enable: false,
				key: "title",
			}
		},
		metadataExtractorPath: "",
	},
	conversion: {
		hardbreak: false,
		dataview: true,
		censorText: [],
		tags: {
			inline: false,
			exclude: [],
			fields: [],
		},
		links: {
			internal: false,
			unshared: false,
			wiki: false,
			slugify: "disable",
		},
	},
	embed: {
		attachments: true,
		overrideAttachments: [],
		keySendFile: [],
		notes: false,
		folder: "",
		convertEmbedToLinks: "keep",
		charConvert: "->",
		unHandledObsidianExt: [],
		sendSimpleLinks: true,
	},
	plugin: {
		shareKey: "share",
		fileMenu: false,
		editorMenu: false,
		excludedFolder: [],
		copyLink: {
			enable: false,
			links: "",
			removePart: [],
			addCmd: false,
			transform: {
				toUri: true,
				slugify: "lower",
				applyRegex: [],
			}
		},
		noticeError: false,
		displayModalRepoEditing: false,
		setFrontmatterKey: "Set"
	}
};

/**
 * @interface MetadataExtractor
 * @description Interface for the metadata extractor plugin
 */
export interface MetadataExtractor {
	allExceptMdFile: string | null;
	metadataFile: string | null;
	tagsFile: string | null;
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

export interface ListEditedFiles {
	edited: string[];
	deleted: string[];
	added: string[];
	unpublished: string[];
	notDeleted: string[];
}

export interface UploadedFiles {
	isUpdated: boolean;
	file: string;
}

export interface Deleted {
	success: boolean;
	deleted: string[];
	undeleted: string[];
}

export interface Preset {
	name: string;
	settings: GitHubPublisherSettings;
}

export interface OverrideAttachments {
	path: string;
	destination: string;
	forcePush: boolean;
}

export const FIND_REGEX = /^\/(.*)\/[igmsuy]*$/;