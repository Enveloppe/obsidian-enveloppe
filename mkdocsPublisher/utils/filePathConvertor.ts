import {MetadataCache, TFile} from "obsidian";
import {folderSettings, MkdocsPublicationSettings} from "../settings/interface";

function createRelativePath(sourceFile: TFile, targetPath: string, metadata: MetadataCache, settings: MkdocsPublicationSettings) {
	const sourcePath = getReceiptFolder(sourceFile, settings, metadata);
	const frontmatter = metadata.getCache(sourcePath)? metadata.getCache(sourcePath).frontmatter : null;
	if (!frontmatter || !frontmatter[settings.shareKey]) {
		return sourceFile.name;
	}
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

function createObsidianPath(file: TFile, settings:MkdocsPublicationSettings) {
	/**
	 * Create link path based on settings and file path
	 * @param file : TFile - Image TFile
	 * @param settings : MkdocsPublicationSettings - Settings
	 * @returns string - Link path
	 */
	const folderDefault = settings.folderDefaultName;
	const fileName = file.name.replace('.md', '') === file.parent.name && settings.folderNote ? 'index.md' : file.name
	const rootFolder = folderDefault.length > 0 ? folderDefault + "/" : ''
	const path = rootFolder + file.path.replace(file.name, fileName);
	if (settings.subFolder.length > 0) {
		return path.replace(settings.subFolder + '/', '');
	}
	return path;
}

function createFrontmatterPath(file: TFile, settings: MkdocsPublicationSettings, metadataCache: MetadataCache) {
	let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;
	const frontmatter = metadataCache.getCache(file.path).frontmatter
	let folderRoot = settings.rootFolder;
	if (frontmatter && !frontmatter[settings.shareKey]) {
		return file.name;
	}
	if (folderRoot.length > 0) {
		folderRoot = folderRoot + "/";
	}
	if (frontmatter && frontmatter[settings.yamlFolderKey]) {
		const category = frontmatter[settings.yamlFolderKey]
		const parentCatFolder = !category.endsWith('/') ? category.split('/').at(-1): category.split('/').at(-2);
		const fileName = settings.folderNote && parentCatFolder === file.name.replace('.md', '') ? 'index.md' : file.name
		path = folderRoot + frontmatter[settings.yamlFolderKey] + "/" + fileName;
	}
	return path
}

function getReceiptFolder(file: TFile, settings:MkdocsPublicationSettings, metadataCache: MetadataCache) {
	if (file.extension === 'md') {
		let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;
		
		if (settings.downloadedFolder === folderSettings.yaml) {
			path = createFrontmatterPath(file, settings, metadataCache)
		} else if (settings.downloadedFolder === folderSettings.obsidian) {
			path = createObsidianPath(file, settings)
		}
		return path
	}
}

function getImageLinkOptions(file: TFile, settings: MkdocsPublicationSettings) {
	/**
	 * Create link path based on settings and file path
	 * @param file : TFile - Image TFile
	 * @param settings : MkdocsPublicationSettings - Settings
	 * @returns string - Link path
	 */
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
