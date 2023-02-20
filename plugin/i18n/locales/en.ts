export default {
	commands: {
		shareActiveFile: "Upload single current active note",
		publisherDeleteClean: "Purge depublished and deleted files",
		uploadAllNotes: "Upload all notes",
		uploadNewNotes: "Upload unpublished notes",
		uploadAllNewEditedNote:
			"Refresh published and upload new notes",
		uploadAllEditedNote: "Refresh all published notes",
		shareViewFiles: (viewFile: string): string =>
			`Upload "${viewFile}" with Github Publisher`,
		checkValidity: {
			name: "Test the connection to the configured repository",
			inRepo: {
				error301: (repoInfo: string): string => `Error 301: ${repoInfo}  was moved permanently.`,
				error404: (repoInfo: string): string => `Error 404: ${repoInfo}: is not found.`,
				error403: (repoInfo: string): string => `Error 403: this action is forbidden for ${repoInfo}.`,
			},
			inBranch: {
				error404: (branchInfo: string[]): string => `Error 404: The branch ${branchInfo[1]} was not found in ${branchInfo[0]}.`,
				error403: (branchInfo: string[]): string => `Error 301:  ${branchInfo[1]} was moved permanently (from ${branchInfo[0]}.`,
			},
			success: (repoInfo: string): string => `${repoInfo} seems to be valid!`,
		},
	},
	deletion: {
		errorDeleteDefaultFolder:
			"You need a default folder name in the settings to use this command.",
		errorDeleteRootFolder:
			"You need to configure a root folder in the settings to use this command.",
		successDeleting: (nb: string): string =>
			`Successfully deleted ${nb} files.`,
		failedDeleting: (nb: string): string => `Failed to delete ${nb} files.`,
		noFileDeleted: "No files have been deleted.",
	},
	settings: {
		exportSettings: "Export settings",
		importSettings: "Import settings",
		github: {
			apiType: {
				title: "API Type",
				desc: "Choose between the Github API or the Github Enterprise API (only Github Enterprise users — Advanced user!).",
				hostname: "Github Enterprise Hostname",
				hostnameDesc: "The hostname of your Github Enterprise instance.",
				dropdown: {
					free: "Free/Pro/Team (default)",
					enterprise: "Enterprise",
				}
			},
			githubConfiguration: "Github Configuration",
			repoName: "Repo Name",
			repoNameDesc:
				"The name of the repository where you store your blog.",
			mkdocsTemplate: "mkdocs-template",
			githubUsername: "Github Username",
			githubUsernameDesc: "Your github username.",
			ghTokenDesc:
				"A github token with repository permission. You can generate it ",
			here: "here.",
			githubToken: "Github Token",
			githubBranchHeading: "Main branch",
			githubBranchDesc:
				"If you use a different main branch than \"main\", you can specify it here.",
			automaticallyMergePR: "Automatically merge pull requests",
			testConnection: "Test connection",


		},
		uploadConfig: {
			title: "Upload configuration",
			pathSetting: "Path settings",
			folderBehavior: "Folder behavior",
			folderBehaviorDesc:
				"Choose between a fixed folder, the value of a frontmatter key or your obsidian relative path.",
			fixedFolder: "Fixed Folder",
			yaml: "YAML frontmatter",
			obsidianPath: "Obsidian Path",
			defaultFolder: "Default Folder",
			defaultFolderDesc: "Set the default reception folder",
			defaultFolderPlaceholder: "docs",
			pathRemoving: "Path removing",
			pathRemovingDesc:
				"Allow to publish only subfolder by removing the path before that :",
			pathRemovingPlaceholder: "GardenSketch",
			frontmatterKey: "Frontmatter key",
			frontmatterKeyDesc:
				"Set the key where to get the value of the folder",
			frontmatterKeyPlaceholder: "category",
			rootFolder: "Root folder",
			rootFolderDesc:
				"Append this path to the folder set by the frontmatter key.",
			useFrontmatterTitle: {
				title: "Set the key where to get the value of the filename",
				desc: "Use a frontmatter value to generate the filename. By default, \"title\" is used. ",
			},
			frontmatterRegex: {
				placeholder: "Apply a replacement to the filename",
				desc:
					"If the text is between \"//\", it will be used as a regex. Otherwise, it will be used as a string.",
			},
		},
		textConversion: {
			textConversion: "Content's conversion",
			textConversionDesc:
				"Theses option won't change the content of the file in your Obsidian Vault, but will change the content of the file in Github.",
			textHeader: "Text",
			hardBreakTitle: "Markdown hard line break",
			hardBreakDesc:
				"Add a markdown hard line break (double whitespace) after each line. This settings can be overridden by the frontmatter key \"hardbreak\".",
			links: {
				header: "Links",
				desc: "You can prevent links to be converted and keep the alt text (or filename) by using the frontmatter key \"links\" with the value \"false\".",
				internals: "Internals Links",
				internalsDesc:
					"Convert the internal link in shared file to match the folder settings",
				wikilinks: "[[Wikilinks]]",
				wikilinksDesc:
					"Convert Wikilinks to MDlinks, without changing the contents. This option can be overridden by the frontmatter key \"mdlinks\".",
				folderNote: "Folder note",
				folderNoteDesc:
					"Rename files to a specified name (default: index.md) if it has the same name as their parent folder/category (also works if the note is outside of the folder).",
				nonShared: "Convert internal links pointing to unshared files",
				nonSharedDesc:
					"Convert internal links pointing to a non shared file to their counterpart in the website, with relative path. Disabled, the plugin will keep the filename.",
			},
			censor: {
				TextHeader: "Text replacer",
				edit: "Edit the parameters (flags and running order)",
				TextDesc:
					"Replace text (or regex) in the file with the given value.",
				TextFlags: "Flags (based on JS regex and can be combined) :",
				flags: {
					insensitive: "i : Insensitive.",
					global: "g : Global",
					multiline: "m : Multiline",
					dotAll: "s : DotAll",
					unicode: "u : Unicode",
					sticky: "y : Sticky",
					error: (flag: string): string =>
						`The flag "${flag}" is not valid.`,
				},
				TextEmpty:
					"Replacement can be empty to remove the whole string.",
				save: "Save",
				ToolTipAdd: "Add a new text replacer",
				ToolTipRemove: "Delete this text replacer",
				PlaceHolder: "Regex or text to replace",
				ValuePlaceHolder: "Replacement value",
				MomentReplaceRegex: {
					desc: "Choose when the regex will be executed : before or after the other conversion (dataview, internal links...).",
					before: "Before",
					after: "After",
				}
			},
			dataview: {
				header: "Dataview",
				desc: "Convert dataview to markdown. This settings can be overridden by the frontmatter key \"dataview\".",
			},
			tags: {
				header: "Convert frontmatter/dataview field into tags",
				desc: "This will convert any frontmatter or dataview inline field into frontmatter tags. Separate fields with a comma.",
				ExcludeHeader: "Exclude value from conversion",
				ExcludeDesc:
					"This will exclude value from being converted. Separate fields with a comma.",
				inlineTagsHeader: "Inline tags",
				inlineTagsDesc:
					"Add your inline tags in your frontmatter tags field and converting nested tags with replacing \"/\" with \"_\"",
			},
		},
		embed: {
			embed: "Embed",
			transferImage: "Transfer attachments",
			transferImageDesc:
				"Send attachments embedded in a file to github. This option can be overridden by the frontmatter key \"attachment\".",
			transferEmbeddedNotes: "Transfer embedded notes",
			transferEmbeddedNotesDesc:
				"Send embedded notes in a shared file to github. Only shared files will be send! This option can be overridden by the frontmatter key \"embed\".",
			defaultImageFolder: "Default attachment folder",
			defaultImageFolderDesc: "To use a folder different from default",
			transferMetaFile: "Send files using a metadata field",
			transferMetaFileDesc:
				"Set the names of the metadata field you want to use to send files. Separate fields with a comma. Dataview inline field are supported.",
		},
		githubWorkflow: {
			githubActionName: "Github action name",
			githubActionNameDesc:
				"If you want to activate a github action when the plugin push the file, set the name of the file (in your .github/worfklows folder).",
			autoCleanUp: "Auto clean up",
			autoCleanUpDesc:
				"If the plugin must remove from github the removed files (stop share or deleted)",
			excludedFiles: "Excluded files",
			excludedFilesDesc:
				"If you want to exclude some folder from the auto clean up, set their path.",
			useMetadataExtractor: "Metadata-extractor files",
			useMetadataExtractorDesc:
				"Send the files generated by the metadata-extractor plugin in this folder.",
			prRequest: {
				title: "Commit message",
				desc: "The message send when the pull-request is merged. Will always followed by the pull-request number."
			}
		},
		plugin: {
			pluginSettings: "Plugin Settings",
			shareKey: "Share Key",
			shareKeyDesc:
				"The frontmatter key to publish your file on the website.",
			excludedFolder: "Excluded Folder",
			excludedFolderDesc:
				"Never publish file in these folder, regardless of the share key. Separate folder name by comma.",
			fileMenu: "File Menu",
			fileMenuDesc: "Add an sharing commands in the file menu",
			editorMenu: "Editor Menu",
			editorMenuDesc: "Add a sharing commands in the right-click menu",
			copyLink: {
				copylinkSetting: "Copy link",
				copylinkDesc: "Send a link to your note in your clipboard",
				baselink: "Blog link",
				baselinkDesc:
					"Create the clipboard link with this base. By default : https://username.github.io/repo/",
				linkpathremover: "Remove link part",
				linkpathremoverDesc:
					"Remove this part from the created links. Separate by comma if multiple value must be removed.",
			},
			logNoticeHeader: "Notice every error",
			logNoticeDesc:
				"On mobile, it can be hard to debug the plugin. Enable this option to log every error in a Notice.",
			shareExternalModifiedTitle: "Share external modified file",
			shareExternalModifiedDesc:
				"Send edited file if they are different from the active file. Useful when editing metadata using MetaEdit or Metadata Menu.",
		},
		help: {
			help: "Help",
			usefulLinks: {
				title: "Useful links",
				documentation: "Documentation",
				repository: "Repository",
				issue: "Issue",
				discussion: "Discussion",
				links: "https://obsidian-publisher.netlify.app/",
			},
			frontmatter: {
				title: "Frontmatter keys cheatsheet",
				desc: "Moreover, there are some frontmatter YAML keys that can be usefull for your workflow. The YAML code below show the default settings, but feel free to change it to your needs in each notes!",
				share: "This key is used to share a note with the plugin.",
				mdlinks: "Convert all wikilinks to markdown links",
				convert: {
					enableOrDisable:
						"Enable or disable the conversion of links. Disabling this will remove the",
					or: "or",
					syntax: "syntax, while keeping the file name or the alternative text.",
				},
				internals:
					"Convert internals links to their counterpart in the website, with relative path. Disabled, the plugin will keep the internal link as is.",
				nonShared:
					"Convert internal links pointing to a non shared file to their counterpart in the website, with relative path. Disabled, the plugin will keep the filename.",
				embed: {
					send: "Send embedded note to GitHub",
					remove: "Remove the embed from the note, leaving empty line.",
				},
				attachment: {
					send: "Send all attachments to github",
					folder: "Change the default folder for the attachments",
				},
				dataview: "Convert dataview queries to markdown.",
				hardBreak: "Convert all linebreaks to markdown «hard break».",
				repo: {
					desc: "Change the default repo for the note.",
					owner: "Owner of the repo",
					repo: "Name of the repo",
					branch: "Branch of the repo",
				},
				titleKey: "Change the title of the note.",
				autoclean: "Disable or enable autocleaning",
				baselink: "Change the base link for the copy link command",
			},
			multiRepoHelp: {
				title: "Send to multiple repository",
				desc: "If you want to send your notes to multiple repository, you can use the ",
				desc2: "key in your frontmatter. The value of this key must be a list of repository. Each repository must have the following keys ",
				exampleDesc:
					"The YAML code below show an example based on your settings.",
			},
		},
	},
	informations: {
		startingClean: (repoInfo: string): string =>
			`Starting cleaning ${repoInfo}`,
		scanningRepo: "Scanning the repository, may take a while...",
		foundNoteToSend: (noteLength: string) =>
			`Found ${noteLength} new notes to send`,
		noNewNote: "No new notes to share.",
		successfullPublish: (noticeValue: string[]) =>
			`Successfully published ${noticeValue[0]} to ${noticeValue[1]}.`,
		waitingWorkflow: "Now, waiting for the workflow to be completed...",
		sendMessage: (noticeValue: string[]) =>
			`Send ${noticeValue[0]} to ${noticeValue[1]}${noticeValue[2]}`,
	},
	error: {
		unablePublishNote: (fileInfo: string): string =>
			`Unable to upload note ${fileInfo}，skipping it`,
		errorPublish: (repoInfo: string): string =>
			`Error during upload to ${repoInfo}.`,
		unablePublishMultiNotes:
			"Unable to upload multiple notes, something went wrong.",
		mergeconflic: "Pull-request is not mergeable, you need to do it manually.",
		errorConfig: (repoInfo: string): string =>
			`Error configuring ${repoInfo}. Please check your settings.`,
		isEmpty: (repoInfo: string): string => `${repoInfo} is empty.`,
		whatEmpty: {
			owner: "Owner",
			repo: "Repository",
			branch: "Branch",
			ghToken: "GitHub Token",
		},
	},
	modals: {
		import: {
			title: "Import",
			desc: "Import settings from text or a file. Note : this will overwrite your current settings (except for username, repo name and token).",
			importFromFile: "Import from file",
			save: "Save",
			paste: "Paste configuration here...",
			error : {
				span: "Error importing configuration: ",
				isEmpty: "the configuration is empty.",
			}
		},
		export: {
			title: "Export",
			desc: "Export settings to clipboard or a file.",
			copy: "Copy to clipboard",
			download: "Download",
		}
	}

};
