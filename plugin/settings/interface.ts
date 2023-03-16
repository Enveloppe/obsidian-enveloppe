import { TFile } from "obsidian";

export enum TypeOfEditRegex {
	path = "path",
	title = "title",
}

export enum enumbSettingsTabId {
	github = "github-configuration",
	upload = "upload-configuration",
	text = "text-configuration",
	embed = "embed-configuration",
	plugin = "plugin-settings",
	help = "help",
}

export interface RegexReplace {
	regex: string;
	replacement: string;
	type: TypeOfEditRegex;
}

export interface GitHubPublisherSettings {
	github: {
		user: string;
		repo: string;
		branch: string;
		token: string;
		automaticallyMergePR: boolean;
		api: {
			tiersForApi: GithubTiersVersion;
			hostname: string;
		}
		worflow: {
			customCommitMsg: string;
			workflowName: string;
		}
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

export const DEFAULT_SETTINGS: GitHubPublisherSettings = {
	github: {
		user: "",
		repo: "",
		branch: "main",
		token: "",
		automaticallyMergePR: true,
		api: {
			tiersForApi: GithubTiersVersion.free,
			hostname: "",
		},
		worflow: {
			customCommitMsg: "[PUBLISHER] Merge",
			workflowName: "",
		},
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
}

export interface ListeEditedFiles {
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

