import {MetadataCache, TFile} from "obsidian";
import {MkdocsPublicationSettings} from "../settings/interface";

function createRelativePath(sourcePath: string, targetPath: string) {
	const sourceList = sourcePath.split('/');
	const targetList = targetPath.split('/');
	const diffSourcePath = sourceList.filter(x => !targetList.includes(x));
	const diffTargetPath = targetList.filter(x => !sourceList.includes(x));
	const diffTarget = function (folderPath: string[]) {
		const relativePath = [];
		for (const folder of folderPath) {
			if (folder != folderPath.at(-1)) {
				relativePath.push('..');
			}
		}
		return relativePath;
	};
	return diffTarget(diffSourcePath).concat(diffTargetPath).join('/')
}

function getReceiptFolder(file: TFile, settings:MkdocsPublicationSettings, metadataCache: MetadataCache) {
	if (file.extension === 'md') {
		const folderDefault = settings.folderDefaultName;
		let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;
		
		if (settings.downloadedFolder === "yamlFrontmatter") {
			const frontmatter = metadataCache.getCache(file.path).frontmatter
			let folderRoot = settings.rootFolder;
			if (folderRoot.length > 0) {
				folderRoot = folderRoot + "/";
			}
			if (frontmatter && frontmatter[settings.yamlFolderKey]) {
				const category = frontmatter[settings.yamlFolderKey]
				const parentCatFolder = !category.endsWith('/') ? category.split('/').at(-1): category.split('/').at(-2);
				const fileName = settings.folderNote && parentCatFolder === file.name.replace('.md', '') ? 'index.md' : file.name
				path = folderRoot + frontmatter[settings.yamlFolderKey] + "/" + fileName;
			}
		} else if (settings.downloadedFolder === "obsidianPath") {
			const fileName = file.name.replace('.md', '') === file.parent.name && settings.folderNote ? 'index.md' : file.name
			path = folderDefault + '/' + file.path.replace(file.name, fileName);
		}
		return path
	}
}

function getImageLinkOptions(file: TFile, settings: MkdocsPublicationSettings) {
	let fileDefaultPath = file.path;
	const fileName = file.name;
	if (settings.defaultImageFolder.length > 0) {
		fileDefaultPath = settings.defaultImageFolder + "/" + fileName;
	} else if (settings.folderDefaultName.length > 0) {
		fileDefaultPath = settings.folderDefaultName + "/" + fileName;
	}
	return fileDefaultPath;
}

export {
	getReceiptFolder,
	getImageLinkOptions,
	createRelativePath
}
