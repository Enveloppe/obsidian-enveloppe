import {MetadataCache, TFile, Vault, TFolder} from "obsidian";
import {folderSettings, MkdocsPublicationSettings} from "../settings/interface";

function getDataviewPath(
	markdown: string,
	settings: MkdocsPublicationSettings,
	vault: Vault) {
	if (!settings.convertDataview) {
		return [];
	}
	const wikiRegex = /\[\[(.*?)\]\]/gmi;
	const wikiMatches = markdown.matchAll(wikiRegex);
	const linkedFiles = [];
	if (!wikiMatches) return [];
	if (wikiMatches) {
		for (const wikiMatch of wikiMatches) {
			const altText = wikiMatch[1].replace(/(.*)\|/i, '');
			const linkFrom = wikiMatch[1].replace(/\|(.*)/, '');
			const linked = vault.getAbstractFileByPath(linkFrom) instanceof TFile ? vault.getAbstractFileByPath(linkFrom) as TFile: null;
			if (linked) {
				linkedFiles.push({
					linked: linked,
					linkFrom: linkFrom,
					altText: altText
				})
			}
		}
	}
	return linkedFiles;
}

function createRelativePath(
	sourceFile: TFile,
	targetFile: {linked: TFile, linkFrom: string, altText: string },
	metadata: MetadataCache,
	settings: MkdocsPublicationSettings,
	vault: Vault) {
	/**
	 * Create relative path from a sourceFile to a targetPath. If the target file is a note, only share if the frontmatter sharekey is present and true
	 * @param sourceFile: TFile, the shared file containing all links, embed etc
	 * @param targetFile: {linked: TFile, linkFrom: string, altText: string}
	 * @param settings: MkdocsPublicationSettings
	 * @param metadata: metadataCache
	 * @return string : relative created path
	 */
	const sourcePath = getReceiptFolder(sourceFile, settings, metadata, vault);
	const frontmatter = metadata.getCache(targetFile.linked.path) ? metadata.getCache(targetFile.linked.path).frontmatter : null;
	if (
		targetFile.linked.extension === 'md'
		&& (
			!frontmatter
			|| !frontmatter[settings.shareKey]
			|| (frontmatter[settings.shareKey] === false))) {
		return targetFile.altText;
	}
	const targetPath = targetFile.linked.extension === 'md' ? getReceiptFolder(targetFile.linked, settings, metadata, vault) : getImageLinkOptions(targetFile.linked, settings);
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

function folderNoteIndex(
	file: TFile,
	vault: Vault,
	settings: MkdocsPublicationSettings)
{
	if (!settings.folderNote) return file.name;
	const fileName = file.name.replace('.md', '');
	const folderParent = file.parent.name;
	if (fileName === folderParent) return 'index.md';
	const outsideFolder = vault.getAbstractFileByPath(file.path.replace('.md', ''));
	if (outsideFolder && outsideFolder instanceof TFolder) return 'index.md'
	return file.name;
}

function createObsidianPath(
	file: TFile,
	settings:MkdocsPublicationSettings,
	vault: Vault,
	metadataCache: MetadataCache) {
	/**
	 * Create link path based on settings and file path
	 * @param file : TFile - Image TFile
	 * @param settings : MkdocsPublicationSettings - Settings
	 * @returns string - Link path
	 */
	const frontmatter = metadataCache.getCache(file.path).frontmatter
	if (!frontmatter || !frontmatter[settings.shareKey]) {
		return file.name
	}
	const folderDefault = settings.folderDefaultName;
	let fileName = folderNoteIndex(file, vault, settings);
	if (fileName === file.name && settings.useFrontmatterTitle && frontmatter['title']) {
		fileName = frontmatter['title'];
	}
	const rootFolder = folderDefault.length > 0 ? folderDefault + "/" : ''
	const path = rootFolder + file.path.replace(file.name, fileName);
	if (settings.subFolder.length > 0) {
		return path.replace(settings.subFolder + '/', '');
	}
	return path;
}

function createFrontmatterPath(
	file: TFile,
	settings: MkdocsPublicationSettings,
	metadataCache: MetadataCache) {
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

function getReceiptFolder(
	file: TFile,
	settings:MkdocsPublicationSettings,
	metadataCache: MetadataCache,
	vault: Vault) {
	if (file.extension === 'md') {
		let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;
		
		if (settings.downloadedFolder === folderSettings.yaml) {
			path = createFrontmatterPath(file, settings, metadataCache);
		} else if (settings.downloadedFolder === folderSettings.obsidian) {
			path = createObsidianPath(file, settings, vault, metadataCache);
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
	createRelativePath,
	getDataviewPath
}
