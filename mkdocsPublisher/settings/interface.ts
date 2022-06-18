export interface MkdocsPublicationSettings {
	githubRepo: string;
	githubName: string;
	GhToken: string;
	shareKey: string;
	ExcludedFolder: string;
	fileMenu: boolean;
	editorMenu: boolean;
	downloadedFolder: string;
	folderDefaultName: string;
	yamlFolderKey: string;
	rootFolder: string;
	workflowName: string;
	transferEmbedded: boolean;
	defaultImageFolder: string;
	autoCleanUp: boolean;
	autoCleanUpExcluded: string;
	folderNote: boolean;
	convertWikiLinks: boolean;
	convertForGithub: boolean;
	subFolder: string;
}

export enum folderSettings {
	yaml = "yaml",
	obsidian = "obsidian",
	fixed = "fixed",
}

export const DEFAULT_SETTINGS: MkdocsPublicationSettings = {
	githubRepo: '',
	githubName: '',
	GhToken: '',
	shareKey: 'share',
	ExcludedFolder: '',
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
	transferEmbedded: true,
	defaultImageFolder: '',
	autoCleanUp: false,
	autoCleanUpExcluded: '',
	folderNote: false,
	convertWikiLinks: false,
	convertForGithub: false,
	subFolder: ''
}
