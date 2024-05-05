import { FrontMatterCache, TFile } from "obsidian";

import GithubPublisher from "./main";

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
	api: {
		/**
		 * The tier of the API
		 * @default GithubTiersVersion.free
		 */
		tiersForApi: GithubTiersVersion;
		/**
		 * The hostname of the API
		 */
		hostname: string;
	}
	/**
	 * The workflow settings for merging the PR or active a github action
	 */
	workflow: {
		/**
		 * The commit message when the PR is merged
		 */
		commitMessage: string;
		/**
		 * The path of the github action file
		 * The github action needs to be set on "workflow_dispatch" to be able to be triggered
		 */
		name: string;
	}
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
	shareAll?: {
		enable: boolean;
		/**
		 * The name of the files to exclude
		 */
		excludedFileName: string;
	}
	/**
	 * Setting for copy link commands
	 */
	copyLink: {
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
			}[]
		}
	},
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
	github: {
		/** The user that belongs to the repository, can be also a community (like obsidian-publisher) */
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
		}
		/**
		 * The settings for the github API
		 */
		api: {
			/**
			 * The tier of the API
			 * @default GithubTiersVersion.free
			 */
			tiersForApi: GithubTiersVersion;
			/** hostname for api
			 * @default `api.github.com`
			 * @important if you use a self-hosted github, you need to set the hostname
			 */
			hostname: string;
		}
		/** workflow and action of the plugin in github */
		workflow: {
			/** Commit message when the PR is merged
			 * @default `[PUBLISHER] Merge`
			 */
			commitMessage: string;
			/** The name of the github action file */
			name: string;
		},
		/** Enable the usage of different repository */
		otherRepo: Repository[];
		/** If the default repository is verified */
		verifiedRepo?: boolean;
		/** The rate limit of the Github API */
		rateLimit: number;
	}
	/** Path settings, including converting like, replace path (with regex), folder note support... */
	upload: {
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
		}
		/** Edit the title by using regex */
		replaceTitle: RegexReplace[],
		/** Edit the path by using regex; apply also on attachment path (will be applied on all path)*/
		replacePath: RegexReplace[],
		/** Auto remove file that was unshared (deleted in Obsidian or removed by set `share: false`) */
		autoclean: {
			enable: boolean;
			/** Prevent deleting files */
			excluded: string[];
		}
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
		}
		/** The path to the metadata extractor plugin */
		metadataExtractorPath: string;
	}
	/**
	 * Settings for the content like hardbreak, dataview, censor text, tags, links...
	 */
	conversion: {
		/** Add the two markdown space at the end of each line */
		hardbreak: boolean;
		/** Convert dataview queries to markdown */
		dataview: boolean;
		/** Allow to edit the content of files with regex */
		censorText: TextCleaner[];
		/** Add  */
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
		repo: RepoFrontmatter;
		source: FrontMatterCache | null | undefined;
	},
	repository: Repository | null;
	filepath: string;

}

export interface MonoRepoProperties {
	frontmatter: RepoFrontmatter;
	repo: Repository | null;
	convert: FrontmatterConvert;
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
export type SetRepositoryFrontmatter = {[repository: string] : FrontMatterCache | null | undefined};