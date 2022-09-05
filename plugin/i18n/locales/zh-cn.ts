export default {
	/* ------------ *
	 *	 Commands   *
	 * ------------ */
	shareActiveFile: "上传当前文件",
	publisherDeleteClean: "云端移除本地未分享和已删除的文件",
	uploadAllNotes: "上传所有分享的文件",
	uploadNewNotes: "上传新分享的文件",
	uploadAllNewEditedNote: "上传新建立文件的和更新已编辑的分享文件",
	uploadAllEditedNote: "更新所有已编辑的文件",
	shareViewFiles: (viewFile: string): string => `用Mkdocs Publisher共享"${viewFile}"。`,

	/* ------------ *
	 *	 Settings   *
	 * ------------ */
	githubConfiguration: "Github设置",
	repoName: "仓库名",
	repoNameDesc: "你博客所在的github仓库名",
	mkdocsTemplate: "mkdocs模板",
	githubUsername: "Github用户名",
	githubUsernameDesc: "你github的用户名",
	ghTokenDesc: "github仓库的操作需要github token给予权限，你可以在",
	here: "这里生成",
	githubToken: "Github Token",

	// ---
	// # Upload configuration # //
	uploadConfig: "上传设置",
	pathSetting: "路径设置",
	folderBehavior: "文件夹操作",
	folderBehaviorDesc: "选择依据固定文件夹，frontmatter key还是ob的相对路径上传文件",
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

	// ---
	// # Text conversion # //
	textConversion: "文本转换",
	textHeader: "文本",
	linkHeader: "链接",
	folderNote: "Folder note",
	folderNoteDesc: "重命名文件为其父文件夹名(或category名) \"index.md\"",
	internalsLinks: "内部链接",
	internalsLinksDesc: "转换发布文件中的内部链接",
	wikilinks: "Wikilinks",
	wikilinksDesc: "转换wiki link为md link，不改变文件内容",
	hardBreakTitle: "马克顿的硬断行",
	hardBreakDesc: "在每一行之后添加一个标记性的硬断行（双倍空白）。",
	headerDataview: "Dataview",
	headerDataviewDesc: "Convert dataview to markdown.",
	useFrontmatterFileName: "Use frontmatter title",
	useFrontmatterFileNameDesc: "Use frontmatter \"filename\" field instead of the file name.",
	censorTextHeader: "Text replacer",
	censorTextDesc: "Replace text (or regex) in the file with the given value.",
	censorTextInsensitive: "Case insensitive",
	censorTextEmpty: 'Replacement can be empty to remove the whole string.',
	censorToolTipAdd: 'Add a new text replacer',
	censorToolTipRemove: 'Delete this text replacer',
	censorPlaceHolder: 'Regex or text to replace',
	censorValuePlaceHolder: 'Replacement value',
	inlineTagsHeader: 'Inline tags',
	inlineTagsDesc: 'Add your inline tags in your frontmatter tags field and converting nested tags with replacing "/" with "_"',
	dataviewFieldHeader: 'Convert frontmatter/dataview field to tags',
	dataviewFieldDesc: 'This will convert any frontmatter or dataview inline field into frontmatter tags. Separate fields with a comma.',
	dataviewExcludeHeader: 'Exclude value from conversion',
	dataviewExcludeDesc: 'This will exclude value from being converted. Separate fields with a comma.',
	// ---
	// # Embed # //
	embed: "嵌入",
	transferImage: "转换图片",
	transferImageDesc: "发送文件中插入的图片至github",
	transferEmbeddedNotes: "转换嵌入的笔记",
	transferEmbeddedNotesDesc: "发布文件中嵌入的文件至github.该嵌入文件需要允许被发布",
	defaultImageFolder: "默认图片文件夹",
	defaultImageFolderDesc: "使用与默认文档夹不同的文档夹",

	// ---
	// # Github Workflow # //
	githubActionName: "Github action名",
	githubActionNameDesc: "如果要在插件推送文档时激活 github action，请设置对应的action名称（在 .github/worfklows 文档夹中）。",
	autoCleanUp: "自动清理",
	autoCleanUpDesc: "如果插件必须从github中删除本地已删除的文档（停止共享或删除）",
	excludedFiles: "排除文件",
	excludedFilesDesc: "如果要从自动清理中排除某些文档夹，请设置其路径。",

	// ---
	// # Plugin settings # //
	pluginSettings: "插件设置",
	shareKey: "分享键",
	shareKeyDesc: "在网站上发布文档的frontmatter的键",
	excludedFolder: "排除文件夹",
	excludedFolderDesc: "排除该文档夹中所有文档，无论是否有分享键的frontmatter。多个文件夹用逗号分隔。",
	fileMenu: "文件菜单",
	fileMenuDesc: "在文件树添加右键分享命令",
	editorMenu: "编辑器菜单",
	editorMenuDesc: "在右键添加分享命令",
	copylinkSetting: "复制链接设置",
	copylinkDesc: "在你的剪贴板中发送一个链接到你的笔记上",
	baselink: "博客链接",
	baselinkDesc: "以此为基础创建剪贴板链接。默认情况下 : https://username.github.io/repo/",
	linkpathremover: "删除链接部分",
	linkpathremoverDesc: "从创建的链接中删除这部分。如果必须删除多个值，请用逗号分开。",
	logNoticeHeader: '注意每一个错误',
	logNoticeDesc: '在移动设备上，调试模块可能很困难。启用该选项可以通过Obsidian通知来通知所有错误。',

	/* ------------ *
	 *	 Notice   *
	 * ------------ */
	unablePublishNote: (fileInfo: string): string => { return `不能上传文件${fileInfo}，已跳过` },
	errorPublish: (repoInfo: string): string => `上传至${repoInfo}错误！`,
	unablePublishMultiNotes: "不能上传多个文件，出了点问题",
	startingClean: (repoInfo: string): string => `开始清理 ${repoInfo}`,
	scanningRepo: "扫描仓库中，稍等...",
	foundNoteToSend: (noteLength: string) => `发现 ${noteLength} 篇笔记需要上传`,
	noNewNote: "没有新笔记需要上传.",
	successfullPublish: (noticeValue: string[]) => `成功地将${noticeValue[0]}发布到${noticeValue[1]}。`,
	waitingWorkflow: "现在，等待工作流程的完成...",
	sendMessage: (noticeValue: string[]) => `将${noticeValue[0]}发送到${noticeValue[1]}${noticeValue[2]}。`
}
