import {TFile} from "obsidian";
import {settings, subSettings} from "../i18n";

export interface GitHubPublisherSettings {
	githubRepo: string;
	githubName: string;
	GhToken: string;
	githubBranch: string;
	shareKey: string;
	excludedFolder: string[];
	fileMenu: boolean;
	editorMenu: boolean;
	downloadedFolder: string;
	folderDefaultName: string;
	yamlFolderKey: string;
	rootFolder: string;
	workflowName: string;
	embedImage: boolean;
	defaultImageFolder: string;
	autoCleanUp: boolean;
	autoCleanUpExcluded: string[];
	folderNote: boolean;
	convertWikiLinks: boolean;
	convertForGithub: boolean;
	subFolder: string;
	embedNotes: boolean;
	copyLink: boolean;
	mainLink: string;
	linkRemover: string;
	hardBreak: boolean;
	logNotice: boolean;
	convertDataview: boolean;
	useFrontmatterTitle: boolean;
	censorText: TextCleaner[];
	inlineTags: boolean;
	dataviewFields: string[];
	frontmatterTitleKey: string;
	excludeDataviewValue: string[];
	metadataFileFields: string[];
	shareExternalModified: boolean;
	automaticallyMergePR: boolean;
}

export enum folderSettings {
	yaml = "yaml",
	obsidian = "obsidian",
	fixed = "fixed",
}

export const DEFAULT_SETTINGS: GitHubPublisherSettings = {
	githubRepo: '',
	githubName: '',
	GhToken: '',
	githubBranch: 'main',
	shareKey: 'share',
	excludedFolder: [],
	fileMenu: false,
	editorMenu: false,
	downloadedFolder: folderSettings.fixed,
	//fixedFolder
	//yamlFrontmatter
	//obsidianPath
	folderDefaultName: '',
	yamlFolderKey: '',
	rootFolder: '',
	workflowName: '',
	embedImage: true,
	defaultImageFolder: '',
	autoCleanUp: false,
	autoCleanUpExcluded: [],
	folderNote: false,
	convertWikiLinks: false,
	convertForGithub: false,
	subFolder: '',
	embedNotes: false,
	copyLink: false,
	mainLink:'',
	linkRemover: '',
	hardBreak: false,
	logNotice: false,
	convertDataview: true,
	useFrontmatterTitle: false,
	censorText: [],
	inlineTags: false,
	dataviewFields: [],
	excludeDataviewValue: [],
	metadataFileFields:[],
	frontmatterTitleKey: 'title',
	shareExternalModified: false,
	automaticallyMergePR: true
}

export interface LinkedNotes {
	linked: TFile,
	linkFrom: string,
	altText: string,
	destinationFilePath?: string,
}

export interface ConvertedLink {
	converted: string,
	real: string,
	repoFrontmatter?: RepoFrontmatter | RepoFrontmatter[]
}

export interface GithubRepo {
	file: string,
	sha: string,
}

export interface TextCleaner {
	entry: string
	replace: string,
	after: boolean,
	flags: string,
}

export const PUBLISHER_TABS = {
	'github-configuration':
			{
				name: settings("github", "githubConfiguration") as string,
				icon: "cloud",
			},
	'upload-configuration':
			{
				name: 'Upload Configuration',
				icon: "upload",
			},
	'text-conversion':{
		name: settings("textConversion", "textConversion") as string,
		icon: "file-text",
	},
	'embed-configuration': {
		name: settings("embed", "embed") as string,
		icon: 'link',
	},
	'plugin-settings':{
		name: settings("plugin", "pluginSettings") as string,
		icon: "gear",
	},
	'help':{
		name: subSettings('help.help') as string,
		icon: "info",
	}
}

export interface frontmatterConvert {
	links: boolean,
	attachment: boolean,
	embed: boolean,
	attachmentLinks: string,
	convertWiki: boolean,
	removeEmbed: boolean,
	dataview: boolean,
	hardbreak: boolean
}

export interface RepoFrontmatter {
	branch: string,
	repo: string,
	owner: string,
	autoclean: boolean,
}


