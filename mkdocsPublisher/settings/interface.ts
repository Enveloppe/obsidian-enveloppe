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
}

export const DEFAULT_SETTINGS: MkdocsPublicationSettings = {
	githubRepo: '',
	githubName: '',
	GhToken: '',
	shareKey: 'share',
	ExcludedFolder: '',
	fileMenu: false,
	editorMenu: false,
	downloadedFolder: 'fixedFolder',
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
}
