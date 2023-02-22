export default {
	commands: {
		shareActiveFile: "上传当前文件",
		publisherDeleteClean: "云端移除本地未分享和已删除的文件",
		uploadAllNotes: "上传所有分享的文件",
		uploadNewNotes: "上传新分享的文件",
		uploadAllNewEditedNote: "上传新建立文件的和更新已编辑的分享文件",
		uploadAllEditedNote: "更新所有已编辑的文件",
		shareViewFiles: (viewFile: string): string =>
			`用Mkdocs Publisher共享"${viewFile}"。`,
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
			githubConfiguration: "Github设置",
			repoName: "仓库名",
			repoNameDesc: "你博客所在的github仓库名",
			mkdocsTemplate: "mkdocs模板",
			githubUsername: "Github用户名",
			githubUsernameDesc: "你github的用户名",
			ghTokenDesc: "github仓库的操作需要github token给予权限，你可以在",
			here: "这里生成",
			githubToken: "Github Token",
			githubBranchHeading: "Main branch",
			githubBranchDesc:
				"If you use a different main branch than \"main\", you can specify it here.",
			automaticallyMergePR: "Automatically merge PR",
			testConnection: "Test connection",

		},
		uploadConfig: {
			title: "上传设置",
			pathSetting: "路径设置",
			folderBehavior: "文件夹操作",
			folderBehaviorDesc:
				"选择依据固定文件夹，frontmatter key还是ob的相对路径上传文件",
			fixedFolder: "固定文件夹",
			yaml: "YAML frontmatter",
			obsidianPath: "Obsidian相对路径",
			defaultFolder: "默认github接收的文件夹",
			defaultFolderDesc: "默认github默认接收的文件夹",
			defaultFolderPlaceholder: "docs",
			pathRemoving: "移除路径",
			pathRemovingDesc: "允许通过删除之前的路径仅发布子文件夹:",
			pathRemovingPlaceholder: "GardenSketch",
			frontmatterKey: "Frontmatter key",
			frontmatterKeyDesc: "设置云端用于建立文件夹名的键，默认为category",
			frontmatterKeyPlaceholder: "category",
			rootFolder: "根文件夹",
			rootFolderDesc: "将此路径追加到文件夹前",
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
			textConversion: "文本转换",
			textConversionDesc:
				"Theses option won't change the content of the file in your Obsidian Vault, but will change the content of the file in Github.",
			textHeader: "文本",
			hardBreakTitle: "马克顿的硬断行",
			hardBreakDesc: "在每一行之后添加一个标记性的硬断行（双倍空白）。",
			links: {
				header: "链接",
				internals: "内部链接",
				internalsDesc: "转换发布文件中的内部链接",
				desc: "You can prevent links to be converted and keep the alt text (or filename) by using the frontmatter key \"links\" with the value \"false\".",
				wikilinks: "[[Wikilinks]]",
				wikilinksDesc: "转换wiki link为md link，不改变文件内容",
				folderNote: "Folder note",
				folderNoteDesc:
					"重命名文件为其父文件夹名(或category名) \"index.md\" (by default, can be edited)",
				nonShared: "Convert internal links pointing to unshared files",
				nonSharedDesc:
					"Convert internal links pointing to a non shared file to their counterpart in the website, with relative path. Disabled, the plugin will keep the filename.",
			},
			censor: {
				TextHeader: "Text replacer",
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
				ToolTipAdd: "Add a new text replacer",
				ToolTipRemove: "Delete this text replacer",
				PlaceHolder: "Regex or text to replace",
				ValuePlaceHolder: "Replacement value",
				Before: "Run it before the other plugin conversion (link, dataview, etc.)",
				After: "Run it after the other plugin conversion (link, dataview, etc.)",
			},
			dataview: {
				header: "Dataview",
				desc: "Convert dataview to markdown.",
			},
			tags: {
				inlineTagsHeader: "Inline tags",
				inlineTagsDesc:
					"Add your inline tags in your frontmatter tags field and converting nested tags with replacing \"/\" with \"_\"",
				header: "Convert frontmatter/dataview field to tags",
				desc: "This will convert any frontmatter or dataview inline field into frontmatter tags. Separate fields with a comma.",
				ExcludeHeader: "Exclude value from conversion",
				ExcludeDesc:
					"This will exclude value from being converted. Separate fields with a comma.",
			},
		},
		embed: {
			embed: "嵌入",
			transferImage: "转换图片",
			transferImageDesc: "发送文件中插入的图片至github",
			transferEmbeddedNotes: "转换嵌入的笔记",
			transferEmbeddedNotesDesc:
				"发布文件中嵌入的文件至github.该嵌入文件需要允许被发布",
			defaultImageFolder: "默认图片文件夹",
			defaultImageFolderDesc: "使用与默认文档夹不同的文档夹",
			transferMetaFile: "Send files using a metadata field",
			transferMetaFileDesc:
				"Set the names of the metadata field you want to use to send files. Separate fields with a comma. Dataview inline field are supported.",
		},
		githubWorkflow: {
			githubActionName: "Github action名",
			githubActionNameDesc:
				"如果要在插件推送文档时激活 github action，请设置对应的action名称（在 .github/worfklows 文档夹中）。",
			autoCleanUp: "自动清理",
			autoCleanUpDesc:
				"如果插件必须从github中删除本地已删除的文档（停止共享或删除）",
			excludedFiles: "排除文件",
			excludedFilesDesc:
				"如果要从自动清理中排除某些文档夹，请设置其路径。",
			useMetadataExtractor: "Metadata-extractor files",
			useMetadataExtractorDesc:
				"Send the files generated by the metadata-extractor plugin in this folder.",
			prRequest: {
				title: "Commit message",
				desc: "The message send when the pull-request is merged. Will always followed by the pull-request number."
			}
		},
		plugin: {
			pluginSettings: "插件设置",
			shareKey: "分享键",
			shareKeyDesc: "在网站上发布文档的frontmatter的键",
			excludedFolder: "排除文件夹",
			excludedFolderDesc:
				"排除该文档夹中所有文档，无论是否有分享键的frontmatter。多个文件夹用逗号分隔。",
			fileMenu: "文件菜单",
			fileMenuDesc: "在文件树添加右键分享命令",
			editorMenu: "编辑器菜单",
			editorMenuDesc: "在右键添加分享命令",
			copyLink: {
				copylinkSetting: "复制链接设置",
				copylinkDesc: "在你的剪贴板中发送一个链接到你的笔记上",
				baselink: "博客链接",
				baselinkDesc:
					"以此为基础创建剪贴板链接。默认情况下 : https://username.github.io/repo/",
				linkpathremover: "删除链接部分",
				linkpathremoverDesc:
					"从创建的链接中删除这部分。如果必须删除多个值，请用逗号分开。",
			},
			logNoticeHeader: "注意每一个错误",
			logNoticeDesc:
				"在移动设备上，调试模块可能很困难。启用该选项可以通过Obsidian通知来通知所有错误。",
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
				mdlinks: "convert all wikilinks to markdown links",
				convert: {
					enableOrDisable:
						"enable or disable the conversion of links. Disabling this will remove the",
					or: "or",
					syntax: "syntax, while keeping the file name or the alias.",
				},
				internals:
					"Convert internals links to their counterpart in the website, with relative path. Disabled, the plugin will keep the internal link as is.",
				nonShared:
					"Convert internal links pointing to a non shared file to their counterpart in the website, with relative path. Disabled, the plugin will keep the filename.",
				embed: {
					send: "send embedded note to GitHub",
					remove: "remove the embed from the note, leaving empty line.",
				},
				attachment: {
					send: "send all attachments to github",
					folder: "change the default folder for the attachments",
				},
				dataview: "convert dataview queries to markdown.",
				hardBreak: "convert all linebreaks to markdown «hard break».",
				repo: {
					desc: "change the default repo for the note.",
					owner: "owner of the repo",
					repo: "name of the repo",
					branch: "branch of the repo",
				},
				titleKey: "change the title of the note.",
				autoclean: "disable or enable autocleaning",
				baselink: "change the base link for the copy link command",
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
	information: {
		startingClean: (repoInfo: string): string => `开始清理 ${repoInfo}`,
		scanningRepo: "扫描仓库中，稍等...",
		foundNoteToSend: (noteLength: string) =>
			`发现 ${noteLength} 篇笔记需要上传`,
		noNewNote: "没有新笔记需要上传.",
		successfullPublish: (noticeValue: string[]) =>
			`成功地将${noticeValue[0]}发布到${noticeValue[1]}。`,
		waitingWorkflow: "现在，等待工作流程的完成...",
		sendMessage: (noticeValue: string[]) =>
			`将${noticeValue[0]}发送到${noticeValue[1]}${noticeValue[2]}。`,
	},
	error: {
		unablePublishNote: (fileInfo: string): string => {
			return `不能上传文件${fileInfo}，已跳过`;
		},
		errorPublish: (repoInfo: string): string => `上传至${repoInfo}错误！`,
		unablePublishMultiNotes: "不能上传多个文件，出了点问题",
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
	},
};
