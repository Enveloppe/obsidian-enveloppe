import {FolderSettings, GitHubPublisherSettings, GithubTiersVersion} from "../../plugin/settings/interface";

const settings: GitHubPublisherSettings = {
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
			customCommitMsg: "",
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
			addCmd: false
		},
		noticeError: false,
		displayModalRepoEditing: false,
	}
};

export default settings;
