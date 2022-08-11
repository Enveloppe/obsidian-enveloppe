export default {
	/* ------------ *
	 *	 Commands   *
	 * ------------ */
	shareActiveFile: "Поделиться текущим файлом",
	publisherDeleteClean: "Удалить больше не доступные и удаленные файлы из репозитория",
	uploadAllNotes: "Загрузить все общие заметки",
	uploadNewNotes: "Загрузить новые общие заметки",
	uploadAllNewEditedNote: "Загрузить все ноые и отредактированные заметки с последней загрузки",
	uploadAllEditedNote: "Загрузить все отредактированные заметки с последней загрузки",
	shareViewFiles:(viewFile:string): string => `Поделиться "${viewFile}" с Github Publisher`,
	/* ------ Delete string -----	*/
	errorDeleteDefaultFolder: "Вы должны указать название папки по умолчанию в настройках, чтобы воспользоваться этой командой.",
	errorDeleteRootFolder: 'Вы должны указать корневую папку в настройках, чтобы воспользоваться этой командой.',
	successDeleting:(nb:string): string => `Успешно удалено ${nb} файлов.`,
	failedDeleting:(nb:string): string => `Неудалось удалить ${nb} файлов.`,
	noFileDeleted: 'Файлы не были удалены.',

	/* ------------ *
	 *	 Settings   *
	 * ------------ */
	githubConfiguration: "Настройки интеграции с Github",
	repoName: "Repo Name",
	repoNameDesc: "Название репозитория в котором будет храниться блог.",
	mkdocsTemplate: "mkdocs-template",
	githubUsername: "Github Username",
	githubUsernameDesc: "Ваше имя пользователя github.",
	ghTokenDesc: "Github token с правами на доступ к репозиторию. Вы можете сгенерировать его ",
	here: "здесь.",
	githubToken: "Github Token",

	// ---
	// # Upload configuration # //
	uploadConfig: "Настройки загрузки",
	pathSetting: "Настройки путей",
	folderBehavior: "Поведение при создание папок",
	folderBehaviorDesc: "Выберите между фиксированной папкой, значением из Frontmatter или путем относительно хранилища obsidian",
	fixedFolder: "Фиксированная папка",
	yaml: "YAML frontmatter",
	obsidianPath: "Относительно хранилища Obsidian",
	defaultFolder: "Папка по умолчанию",
	defaultFolderDesc: "Укажите папку по умолчанию для публикации",
	defaultFolderPlaceholder: "docs",
	pathRemoving: "Удалять из пути",
	pathRemovingDesc: "Разрешать публикацию только подпапок удаляя из пути следующую строку :",
	pathRemovingPlaceholder: "GardenSketch",
	frontmatterKey: "Frontmatter свойство",
	frontmatterKeyDesc: "Укажите свойство в котором будет указана папка",
	frontmatterKeyPlaceholder: "category",
	rootFolder: "Корневая папка",
	rootFolderDesc: "Добавлять этут папку к путям заданным через свойство frontmatter.",

	// ---
	// # Text conversion # //
	textConversion: "Преобразования текста",
	textHeader: "Текст",
	linkHeader: "Ссылки",
	folderNote: "Индексный файл в папке",
	folderNoteDesc: "Переименовывать файл в \"index.md\" в случае если он называется также как родительская папка (работает и в том случае если файл вне папки).",
	internalsLinks: "Внутренние ссылки",
	internalsLinksDesc: "Преобразовывать внутренние ссылки в общих файла в соответствие с настройками папки",
	wikilinks: "[[Wiki-ссылки]]",
	wikilinksDesc: "Преобразовывать Wiki-ссылки в MarkDown ссылки, не трогая содержимое",
	hardBreakTitle: "Жесткие переносы строк в Markdown",
	hardBreakDesc: "Использовать видимый перенос строки (двойной перенос) в markdown после каждой строки.",
	headerDataview: "Dataview",
	headerDataviewDesc: "Преобразовать dataview в markdown.",
	useFrontmatterTitle: "Использовать заголовок из frontmatter",
	useFrontmatterTitleDesc: "Использовать свойство frontmatter \"title\" вместо названия файла.",

	// ---
	// # Embed # //
	embed: "Вставки",
	transferImage: "Отправлять изображения",
	transferImageDesc: "Отправлять вставленые в заметки изображения на github",
	transferEmbeddedNotes: "Отправлять вставленые заметки",
	transferEmbeddedNotesDesc: "Отправлять вставленые заметки из общих файлов на github. Только общие файлы будут отправлены!",
	defaultImageFolder: "Папка по умолчанию для изображений",
	defaultImageFolderDesc: "Если вы хотите использовать папку отличную от папки по умолчанию",

	// ---
	// # Github Workflow # //
	githubActionName: "Название Github action",
	githubActionNameDesc: "Если вы хотите активировать github action после того как плагин запушит файл, укажите название файла (в папке .github/worfklows).",
	autoCleanUp: "Автоматическая очистка",
	autoCleanUpDesc: "Если плагин должен удалять с github'а удаленные файлы (больше не общедоступные или удаленные)",
	excludedFiles: "Исключенные файлы",
	excludedFilesDesc: "Если вы хотите исключить папки из автоматической очистки, укажите путь к ним.",

	// ---
	// # Plugin settings # //
	pluginSettings: "Настройки плагина",
	shareKey: "Share Key",
	shareKeyDesc: "Свойство Frontmatter(Yaml) для пометке файлов как доступных для публикации.",
	excludedFolder: "Исключенные папки",
	excludedFolderDesc: "Никогда не публиковать файлы из этих папок, вне зависимости от флага публикации. Разделяйте папки с помощью запятой.",
	fileMenu: "Файловое меню",
	fileMenuDesc: "Добавить команды в файловое меню",
	editorMenu: "Меню редактора",
	editorMenuDesc: "Добавить команды в меню по правой-кнопки мыши",
	copylinkSetting: "Скопировать ссылку",
	copylinkDesc: "Скопировать ссылку на общедоступный файл в буфер обмена",
	baselink: "Ссылка на блог",
	baselinkDesc: "Ссылки для буфера обмена будут созданы на базе этой ссылки. По умолчанию : https://username.github.io/repo/",
	linkpathremover: "Удалять часть ссылки",
	linkpathremoverDesc: "Удалять эту часть из созданных ссылок. Если нужно удалять множественные значения, используте запятую.",
	logNoticeHeader: 'Уведомлять о каждой ошибке',
	logNoticeDesc: 'На мобильных устройствах сложно отлаживать плагин. Включите эту опцию, чтобы логгировать каждую ошибку',

	/* ------------ *
	 *	 Notice   *
	 * ------------ */
	unablePublishNote: (fileInfo: string): string => `Не получилось опубликовать заметку ${fileInfo}，пропускаю`,
	errorPublish: (repoInfo: string): string => `Ошибка публикации в ${repoInfo}.`,
	unablePublishMultiNotes: "Не получилось опубликовать несколько заметок, что-то пошло не так.",
	startingClean: (repoInfo: string): string => `Начинаю очистку ${repoInfo}`,
	scanningRepo: "Сканирую репозиторий, это может занять какое-то время...",
	foundNoteToSend: (noteLength: string)=> `Найдено ${noteLength} заметок для отправки`,
	noNewNote: "Отсутствуют новые заметки для публикации.",
	successfullPublish:(noticeValue: string[])=>`Успешно опубликовано ${noticeValue[0]} в ${noticeValue[1]}.`,
	waitingWorkflow: "Ожидаю завершения процесса обработки...",
	sendMessage:(noticeValue: string[])=>`Отправляю ${noticeValue[0]} в ${noticeValue[1]}${noticeValue[2]}`
}
