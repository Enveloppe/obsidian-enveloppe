import { MetadataCache, TFile, Vault, TFolder, FrontMatterCache } from "obsidian";
import { folderSettings, LinkedNotes, GitHubPublisherSettings } from "../settings/interface";

function getDataviewPath(
	markdown: string,
	settings: GitHubPublisherSettings,
	vault: Vault): LinkedNotes[] {
	if (!settings.convertDataview) {
		return [];
	}
	const wikiRegex = /\[\[(.*?)\]\]/gmi;
	const wikiMatches = markdown.matchAll(wikiRegex);
	const linkedFiles: LinkedNotes[] = [];
	if (!wikiMatches) return [];
	if (wikiMatches) {
		for (const wikiMatch of wikiMatches) {
			const altText = wikiMatch[1].replace(/(.*)\|/i, '');
			const linkFrom = wikiMatch[1].replace(/\|(.*)/, '');
			const linked = vault.getAbstractFileByPath(linkFrom) instanceof TFile ? vault.getAbstractFileByPath(linkFrom) as TFile : null;
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
	targetFile: LinkedNotes,
	metadata: MetadataCache,
	settings: GitHubPublisherSettings,
	vault: Vault): string {
	/**
	 * Create relative path from a sourceFile to a targetPath. If the target file is a note, only share if the frontmatter sharekey is present and true
	 * @param sourceFile: TFile, the shared file containing all links, embed etc
	 * @param targetFile: {linked: TFile, linkFrom: string, altText: string}
	 * @param settings: GitHubPublisherSettings
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
	const targetPath = targetFile.linked.extension === 'md' ? getReceiptFolder(targetFile.linked, settings, metadata, vault) : getImageLinkOptions(targetFile.linked, settings, frontmatter);
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
	settings: GitHubPublisherSettings): string {
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
	settings: GitHubPublisherSettings,
	vault: Vault,
	fileName: string): string {
	/**
	 * Create link path based on settings and file path
	 * @param file : TFile - Image TFile
	 * @param settings : GitHubPublisherSettings - Settings
	 * @returns string - Link path
	 */

	const folderDefault = settings.folderDefaultName;
	fileName = folderNoteIndex(file, vault, settings);

	const rootFolder = folderDefault.length > 0 ? folderDefault + "/" : ''
	const path = rootFolder + file.path.replace(file.name, fileName);
	if (settings.subFolder.length > 0) {
		return path.replace(settings.subFolder + '/', '');
	}
	return path;
}

function createFrontmatterPath(
	file: TFile,
	settings: GitHubPublisherSettings,
	frontmatter: FrontMatterCache,
	fileName: string): string {
	let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + file.name : file.name;
	let folderRoot = settings.rootFolder;
	if (folderRoot.length > 0) {
		folderRoot = folderRoot + "/";
	}
	if (frontmatter && frontmatter[settings.yamlFolderKey]) {
		const category = frontmatter[settings.yamlFolderKey]
		const parentCatFolder = !category.endsWith('/') ? category.split('/').at(-1) : category.split('/').at(-2);
		fileName = settings.folderNote && parentCatFolder === file.name.replace('.md', '') ? 'index.md' : fileName
		path = folderRoot + frontmatter[settings.yamlFolderKey] + "/" + fileName;
	}
	return path
}

function getTitleField(frontmatter: FrontMatterCache, file: TFile, settings: GitHubPublisherSettings): string {
	if (!settings.useFrontmatterFileName || !frontmatter) {
		return file.name;
	} else if (frontmatter && frontmatter['filename'] && frontmatter['filename'] !== file.name) {
		return frontmatter['filename'] + '.md';
	}
	return file.name;
}

function getReceiptFolder(
	file: TFile,
	settings: GitHubPublisherSettings,
	metadataCache: MetadataCache,
	vault: Vault): string {
	if (file.extension === 'md') {
		const frontmatter = metadataCache.getCache(file.path)?.frontmatter

		const fileName = getTitleField(frontmatter, file, settings)
		if (!frontmatter[settings.shareKey]) {
			return fileName;
		}

		let path = settings.folderDefaultName.length > 0 ? settings.folderDefaultName + "/" + fileName : fileName;

		if (settings.downloadedFolder === folderSettings.yaml) {
			path = createFrontmatterPath(file, settings, frontmatter, fileName);
		} else if (settings.downloadedFolder === folderSettings.obsidian) {
			path = createObsidianPath(file, settings, vault, fileName);
		}

		return path
	}
}

function getImageLinkOptions(file: TFile, settings: GitHubPublisherSettings, sourceFrontmatter: FrontMatterCache | null): string {
	/**
	 * Create link path based on settings and file path
	 * @param file : TFile - Image TFile
	 * @param settings : GitHubPublisherSettings - Settings
	 * @returns string - Link path
	 */

	if (sourceFrontmatter?.imageLink) {
		return sourceFrontmatter.imageLink.toString().replace(/\/$/, '') + "/" + file.name;
	}
	else if (settings.defaultImageFolder.length > 0) {
		return settings.defaultImageFolder + "/" + file.name;
	} else if (settings.folderDefaultName.length > 0) {
		return settings.folderDefaultName + "/" + file.name;
	}
	return file.path;
}

export {
	getReceiptFolder,
	getImageLinkOptions,
	createRelativePath,
	getDataviewPath
}
