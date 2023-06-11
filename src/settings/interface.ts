import { TFile } from "obsidian";

export enum TypeOfEditRegex {
	path = "path",
	title = "title",
}



export enum enumbSettingsTabId {
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
	tokenPath: string;
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
	copyLink: {	
		links: string;
		removePart: string[];
	}

}

export interface GitHubPublisherSettings {
	github: {
		user: string;
		repo: string;
		branch: string;
		tokenPath: string;
		automaticallyMergePR: boolean;
		api: {
			tiersForApi: GithubTiersVersion;
			hostname: string;
		}
		workflow: {
			commitMessage: string;
			name: string;
		},
		otherRepo: Repository[];
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
			slugify: boolean;
		}
	}
	embed: {
		attachments: boolean;
		keySendFile: string[];
		notes: boolean;
		folder: string;
	}
	plugin:
	{
		shareKey: string;
		fileMenu: boolean;
		editorMenu: boolean;
		excludedFolder: string[];
		copyLink: {
			enable: boolean;
			links: string;
			removePart: string[];
			addCmd: boolean;
		}
		noticeError: boolean;
		displayModalRepoEditing: boolean;
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

export enum GithubTiersVersion {
	free = "Github Free/Pro/Team (default)",
	entreprise = "Enterprise",
}

export const TOKEN_PATH = "%configDir%/plugins/%pluginID%/env";


export const DEFAULT_SETTINGS: GitHubPublisherSettings = {
	github: {
		user: "",
		repo: "",
		branch: "main",
		automaticallyMergePR: true,
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
			slugify: false,
		},
	},
	embed: {
		attachments: true,
		keySendFile: [],
		notes: false,
		folder: "",
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
		},
		noticeError: false,
		displayModalRepoEditing: false,
	}
};

export interface MetadataExtractor {
	allExceptMdFile: string | null;
	metadataFile: string | null;
	tagsFile: string | null;
}

export interface LinkedNotes {
	linked: TFile;
	linkFrom: string;
	altText: string;
	destinationFilePath?: string;
	anchor?: string;
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
}


export interface FrontmatterConvert {
	links: boolean;
	attachment: boolean;
	embed: boolean;
	attachmentLinks: string;
	convertWiki: boolean;
	removeEmbed: boolean;
	dataview: boolean;
	hardbreak: boolean;
	convertInternalNonShared: boolean;
	convertInternalLinks: boolean;
}

export interface RepoFrontmatter {
	branch: string;
	repo: string;
	owner: string;
	autoclean: boolean;
	workflowName: string;
	commitMsg: string;
	automaticallyMergePR: boolean;
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

