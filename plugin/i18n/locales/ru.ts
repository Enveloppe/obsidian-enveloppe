export default {
	commands: {
		shareActiveFile: "Поделиться текущим файлом",
		publisherDeleteClean:
			"Удалить больше не доступные и удаленные файлы из репозитория",
		uploadAllNotes: "Загрузить все общие заметки",
		uploadNewNotes: "Загрузить новые общие заметки",
		uploadAllNewEditedNote:
			"Загрузить все ноые и отредактированные заметки с последней загрузки",
		uploadAllEditedNote:
			"Загрузить все отредактированные заметки с последней загрузки",
		shareViewFiles: (viewFile: string): string =>
			`Поделиться "${viewFile}" с Github Publisher`,
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
			"Вы должны указать название папки по умолчанию в настройках, чтобы воспользоваться этой командой.",
		errorDeleteRootFolder:
			"Вы должны указать корневую папку в настройках, чтобы воспользоваться этой командой.",
		successDeleting: (nb: string): string =>
			`Успешно удалено ${nb} файлов.`,
		failedDeleting: (nb: string): string =>
			`Неудалось удалить ${nb} файлов.`,
		noFileDeleted: "Файлы не были удалены.",
	},
	settings: {
		exportSettings: "Export settings",
		importSettings: "Import settings",
		github: {
			githubConfiguration: "Настройки интеграции с Github",
			repoName: "Repo Name",
			repoNameDesc:
				"Название репозитория в котором будет храниться блог.",
			mkdocsTemplate: "mkdocs-template",
			githubUsername: "Github Username",
			githubUsernameDesc: "Ваше имя пользователя github.",
			ghTokenDesc:
				"Github token с правами на доступ к репозиторию. Вы можете сгенерировать его ",
			here: "здесь.",
			githubToken: "Github Token",
			githubBranchHeading: "Main branch",
			githubBranchDesc:
				"If you use a different main branch than \"main\", you can specify it here.",
			automaticallyMergePR: "Automatically merge PR",
			testConnection: "Test connection",

		},
		uploadConfig: {
			uploadConfig: "Настройки загрузки",
			pathSetting: "Настройки путей",
			folderBehavior: "Поведение при создание папок",
			folderBehaviorDesc:
				"Выберите между фиксированной папкой, значением из Frontmatter или путем относительно хранилища obsidian",
			fixedFolder: "Фиксированная папка",
			yaml: "YAML frontmatter",
			obsidianPath: "Относительно хранилища Obsidian",
			defaultFolder: "Папка по умолчанию",
			defaultFolderDesc: "Укажите папку по умолчанию для публикации",
			defaultFolderPlaceholder: "docs",
			pathRemoving: "Удалять из пути",
			pathRemovingDesc:
				"Разрешать публикацию только подпапок удаляя из пути следующую строку :",
			pathRemovingPlaceholder: "GardenSketch",
			frontmatterKey: "Frontmatter свойство",
			frontmatterKeyDesc:
				"Укажите свойство в котором будет указана папка",
			frontmatterKeyPlaceholder: "category",
			rootFolder: "Корневая папка",
			rootFolderDesc:
				"Добавлять этут папку к путям заданным через свойство frontmatter.",
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
			textConversion: "Преобразования текста",
			textConversionDesc:
				"Theses option won't change the content of the file in your Obsidian Vault, but will change the content of the file in Github.",
			textHeader: "Текст",
			hardBreakTitle: "Жесткие переносы строк в Markdown",
			hardBreakDesc:
				"Использовать видимый перенос строки (двойной перенос) в markdown после каждой строки.",
			links: {
				header: "Ссылки",
				desc: "You can prevent links to be converted and keep the alt text (or filename) by using the frontmatter key \"links\" with the value \"false\".",
				folderNote: "Индексный файл в папке",
				folderNoteDesc:
					"Переименовывать файл в \"index.md\" (default) в случае если он называется также как родительская папка (работает и в том случае если файл вне папки).",
				internals: "Внутренние ссылки",
				internalsDesc:
					"Преобразовывать внутренние ссылки в общих файла в соответствие с настройками папки",
				wikilinks: "[[Wiki-ссылки]]",
				wikilinksDesc:
					"Преобразовывать Wiki-ссылки в MarkDown ссылки, не трогая содержимое",
				nonShared: "Convert internal links pointing to unshared files",
				nonSharedDesc:
					"Convert internal links pointing to a non shared file to their counterpart in the website, with relative path. Disabled, the plugin will keep the filename.",
			},
			dataview: {
				header: "Dataview",
				desc: "Преобразовать dataview в markdown.",
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
			embed: "Вставки",
			transferImage: "Отправлять изображения",
			transferImageDesc:
				"Отправлять вставленые в заметки изображения на github",
			transferEmbeddedNotes: "Отправлять вставленые заметки",
			transferEmbeddedNotesDesc:
				"Отправлять вставленые заметки из общих файлов на github. Только общие файлы будут отправлены!",
			defaultImageFolder: "Папка по умолчанию для изображений",
			defaultImageFolderDesc:
				"Если вы хотите использовать папку отличную от папки по умолчанию",
			transferMetaFile: "Send files using a metadata field",
			transferMetaFileDesc:
				"Set the names of the metadata field you want to use to send files. Separate fields with a comma. Dataview inline field are supported.",
		},
		githubWorkflow: {
			githubActionName: "Название Github action",
			githubActionNameDesc:
				"Если вы хотите активировать github action после того как плагин запушит файл, укажите название файла (в папке .github/worfklows).",
			autoCleanUp: "Автоматическая очистка",
			autoCleanUpDesc:
				"Если плагин должен удалять с github'а удаленные файлы (больше не общедоступные или удаленные)",
			excludedFiles: "Исключенные файлы",
			excludedFilesDesc:
				"Если вы хотите исключить папки из автоматической очистки, укажите путь к ним.",
			useMetadataExtractor: "Metadata-extractor files",
			useMetadataExtractorDesc:
				"Send the files generated by the metadata-extractor plugin in this folder.",
			prRequest: {
				title: "Commit message",
				desc: "The message send when the pull-request is merged. Will always followed by the pull-request number."
			}
		},
		plugin: {
			pluginSettings: "Настройки плагина",
			shareKey: "Share Key",
			shareKeyDesc:
				"Свойство Frontmatter(Yaml) для пометке файлов как доступных для публикации.",
			excludedFolder: "Исключенные папки",
			excludedFolderDesc:
				"Никогда не публиковать файлы из этих папок, вне зависимости от флага публикации. Разделяйте папки с помощью запятой.",
			fileMenu: "Файловое меню",
			fileMenuDesc: "Добавить команды в файловое меню",
			editorMenu: "Меню редактора",
			editorMenuDesc: "Добавить команды в меню по правой-кнопки мыши",
			copyLink: {
				copylinkSetting: "Скопировать ссылку",
				copylinkDesc:
					"Скопировать ссылку на общедоступный файл в буфер обмена",
				baselink: "Ссылка на блог",
				baselinkDesc:
					"Ссылки для буфера обмена будут созданы на базе этой ссылки. По умолчанию : https://username.github.io/repo/",
				linkpathremover: "Удалять часть ссылки",
				linkpathremoverDesc:
					"Удалять эту часть из созданных ссылок. Если нужно удалять множественные значения, используте запятую.",
			},
			logNoticeHeader: "Уведомлять о каждой ошибке",
			logNoticeDesc:
				"На мобильных устройствах сложно отлаживать плагин. Включите эту опцию, чтобы логгировать каждую ошибку",
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
	informations: {
		startingClean: (repoInfo: string): string =>
			`Начинаю очистку ${repoInfo}`,
		scanningRepo:
			"Сканирую репозиторий, это может занять какое-то время...",
		foundNoteToSend: (noteLength: string) =>
			`Найдено ${noteLength} заметок для отправки`,
		noNewNote: "Отсутствуют новые заметки для публикации.",
		successfullPublish: (noticeValue: string[]) =>
			`Успешно опубликовано ${noticeValue[0]} в ${noticeValue[1]}.`,
		waitingWorkflow: "Ожидаю завершения процесса обработки...",
		sendMessage: (noticeValue: string[]) =>
			`Отправляю ${noticeValue[0]} в ${noticeValue[1]}${noticeValue[2]}`,
	},
	error: {
		unablePublishNote: (fileInfo: string): string =>
			`Не получилось опубликовать заметку ${fileInfo}，пропускаю`,
		errorPublish: (repoInfo: string): string =>
			`Ошибка публикации в ${repoInfo}.`,
		unablePublishMultiNotes:
			"Не получилось опубликовать несколько заметок, что-то пошло не так.",
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
			desc: "Import settings from text or a file.",
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
