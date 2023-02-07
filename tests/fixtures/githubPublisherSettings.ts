import {FolderSettings, GitHubPublisherSettings} from '../../plugin/settings/interface';

const settings: GitHubPublisherSettings = {
	githubRepo: "",
	githubName: "",
	GhToken: "",
	githubBranch: "main",
	shareKey: "share",
	excludedFolder: [],
	fileMenu: false,
	editorMenu: false,
	downloadedFolder: FolderSettings.fixed,
	//fixedFolder
	//yamlFrontmatter
	//obsidianPath
	folderDefaultName: "",
	yamlFolderKey: "",
	rootFolder: "",
	workflowName: "",
	embedImage: true,
	defaultImageFolder: "",
	autoCleanUp: false,
	autoCleanUpExcluded: [],
	folderNote: false,
	folderNoteRename: "index.md",
	convertWikiLinks: false,
	convertForGithub: false,
	subFolder: "",
	embedNotes: false,
	copyLink: false,
	mainLink: "",
	linkRemover: "",
	hardBreak: false,
	logNotice: false,
	convertDataview: true,
	useFrontmatterTitle: false,
	censorText: [],
	inlineTags: false,
	dataviewFields: [],
	excludeDataviewValue: [],
	metadataFileFields: [],
	frontmatterTitleKey: "title",
	shareExternalModified: false,
	automaticallyMergePR: true,
	metadataExtractorPath: "",
	convertInternalNonShared: false,
	frontmatterTitleRegex: "",
	frontmatterTitleReplacement: "",

}

export default settings;
