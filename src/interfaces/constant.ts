import { FolderSettings, GithubTiersVersion } from "./enum";
import { GitHubPublisherSettings } from "./main";

/** Find a regex encapsuled in // */
export const FIND_REGEX = /^\/(.*)\/[igmsuy]*$/;


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