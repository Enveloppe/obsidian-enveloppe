import {
	MetadataCache,
	TFile,
	Vault,
	TFolder,
	FrontMatterCache,
} from "obsidian";
import {
	FolderSettings,
	LinkedNotes,
	GitHubPublisherSettings,
	FrontmatterConvert,
	RepoFrontmatter,
} from "../settings/interface";
import {
	getCategory,
	getFrontmatterCondition,
	getRepoFrontmatter,
} from "../src/utils";
import {isInternalShared, checkIfRepoIsInAnother, isShared} from "../src/data_validation_test";
import { createRegexFromText } from "./findAndReplaceText";

/**
 * Get the dataview path from a markdown file
 * @param {string} markdown Markdown file content
 * @param {GitHubPublisherSettings} settings Settings
 * @param {Vault} vault Vault
 * @returns {LinkedNotes[]} Array of linked notes
 */

export function getDataviewPath(
	markdown: string,
	settings: GitHubPublisherSettings,
	vault: Vault
): LinkedNotes[] {
	if (!settings.conversion.dataview) {
		return [];
	}
	const wikiRegex = /\[\[(.*?)\]\]/gim;
	const wikiMatches = markdown.matchAll(wikiRegex);
	const linkedFiles: LinkedNotes[] = [];
	if (!wikiMatches) return [];
	if (wikiMatches) {
		for (const wikiMatch of wikiMatches) {
			const altText = wikiMatch[1].replace(/(.*)\\?\|/i, "");
			const linkFrom = wikiMatch[1].replace(/\\?\|(.*)/, "");
			const linked =
				vault.getAbstractFileByPath(linkFrom) instanceof TFile
					? (vault.getAbstractFileByPath(linkFrom) as TFile)
					: null;
			if (linked) {
				linkedFiles.push({
					linked: linked,
					linkFrom: linkFrom,
					altText: altText,
				});
			}
		}
	}
	return linkedFiles;
}


/**
 * Create relative path from a sourceFile to a targetPath. If the target file is a note, only share if the frontmatter sharekey is present and true
 * @param {TFile} sourceFile the shared file containing all links, embed etc
 * @param {LinkedNotes} targetFile The target file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {MetadataCache} metadata metadataCache
 * @param {Vault} vault Vault
 * @param {FrontMatterCache | null} frontmatter FrontmatterCache or null
 * @param {RepoFrontmatter[] | RepoFrontmatter} sourceRepo The repoFrontmatter from the original file
 * @param {FrontmatterConvert} frontmatterSettings FrontmatterConvert
 * @return {string} relative path
 */

export async function createRelativePath(
	sourceFile: TFile,
	targetFile: LinkedNotes,
	metadata: MetadataCache,
	settings: GitHubPublisherSettings,
	vault: Vault,
	frontmatter: FrontMatterCache | null,
	sourceRepo: RepoFrontmatter[] | RepoFrontmatter,
	frontmatterSettings: FrontmatterConvert
): Promise<string> {
	const sourcePath = getReceiptFolder(sourceFile, settings, metadata, vault);
	const frontmatterTarget = await metadata.getFileCache(targetFile.linked)
		.frontmatter;
	const targetRepo = await getRepoFrontmatter(settings, frontmatterTarget);
	const isFromAnotherRepo = checkIfRepoIsInAnother(sourceRepo, targetRepo);
	const shared = isInternalShared(
		settings.plugin.shareKey,
		frontmatterTarget,
		frontmatterSettings
	);
	if (
		targetFile.linked.extension === "md" && (isFromAnotherRepo === false || shared === false)
	) {
		return targetFile.destinationFilePath ? targetFile.destinationFilePath: targetFile.linked.basename;
	}
	if (targetFile.linked.path === sourceFile.path) {
		return getReceiptFolder(targetFile.linked, settings, metadata, vault)
			.split("/")
			.at(-1);
	}

	const targetPath =
		targetFile.linked.extension === "md"
			? getReceiptFolder(targetFile.linked, settings, metadata, vault)
			: getImageLinkOptions(
				targetFile.linked,
				settings,
				getFrontmatterCondition(frontmatter, settings)
			);
	const sourceList = sourcePath.split("/");
	const targetList = targetPath.split("/");

	/**
	 * Exclude the first different element in the list
	 * @param {string[]} sourceList source list
	 * @param {string[]} targetList target list
	 * @returns {string[]} list with the first different element
	 */
	const excludeUtilDiff = (
		sourceList: string[],
		targetList: string[]
	): string[] => {
		let i = 0;
		while (sourceList[i] === targetList[i]) {
			i++;
		}
		return sourceList.slice(i);
	};

	const diffSourcePath = excludeUtilDiff(sourceList, targetList);
	const diffTargetPath = excludeUtilDiff(targetList, sourceList);
	const diffTarget = function (folderPath: string[]) {
		const relativePath = [];
		for (const folder of folderPath) {
			if (folder != folderPath.at(-1)) {
				relativePath.push("..");
			}
		}

		return relativePath;
	};
	const relativePath = diffTarget(diffSourcePath);
	if (relativePath.length === 0) {
		relativePath.push(".");
	}
	let relative = relativePath.concat(diffTargetPath).join("/");
	if (relative.trim() === "." || relative.trim() === "") {
		//in case of errors
		relative = getReceiptFolder(
			targetFile.linked,
			settings,
			metadata,
			vault
		)
			.split("/")
			.at(-1);
	}
	return relative;
}

/**
 * Check if the file is a folder note based on the global settings - Run for OBSIDIAN PATH option
 * Change the filename in index.md if folder note
 * @param {TFile} file Source file
 * @param {Vault} vault
 * @param {GitHubPublisherSettings} settings Global Settings
 * @param {string} fileName the filename after reading the frontmatter
 * @return {string} original file name or index.md
 */

function folderNoteIndexOBS(
	file: TFile,
	vault: Vault,
	settings: GitHubPublisherSettings,
	fileName: string
): string {
	const index = settings.upload.folderNote.rename;
	const folderParent = file.parent.path !== "/" ? `/${file.parent.path}/` : "/" ;
	const defaultPath = `${folderParent}${regexOnFileName(fileName, settings)}`;
	if (!settings.upload.folderNote.enable) return defaultPath;
	const parentFolderName = file.parent.name;
	if (fileName.replace(".md", "") === parentFolderName) return `/${file.parent.path}/${index}`;
	const outsideFolder = vault.getAbstractFileByPath(
		file.path.replace(".md", "")
	);
	if (outsideFolder && outsideFolder instanceof TFolder) return `/${outsideFolder.path}/${index}`;
	return defaultPath;
}

/**
 * Create the path on hypothetical vault using the obsidian path and replacing the name by index.md if needed and removing the subfolder if needed
 * @param {TFile} file Source file
 * @param {Vault} vault
 * @param {GitHubPublisherSettings} settings Global Settings
 * @param {string} fileName file name
 * @return {string} path
 */

function createObsidianPath(
	file: TFile,
	settings: GitHubPublisherSettings,
	vault: Vault,
	fileName: string
): string {
	fileName = folderNoteIndexOBS(file, vault, settings, fileName);
	const rootFolder = settings.upload.defaultName.length > 0 ? settings.upload.defaultName : "";
	const path = rootFolder + fileName;
	//remove last word from path splitted with /
	let pathWithoutEnd = path.split("/").slice(0, -1).join("/");
	//get file name only
	const fileNameOnly = path.split("/").at(-1);
	pathWithoutEnd = regexOnPath(pathWithoutEnd, settings);
	if (pathWithoutEnd.trim().length === 0) return fileNameOnly;
	return (pathWithoutEnd + "/" + fileNameOnly).replace(/^\//, "");
}

/**
 * Check if a file (using category frontmatter option) is a folder note, and rename it to index.md if it is
 * @param {string} fileName file name
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {GitHubPublisherSettings} settings Settings
 * @returns {string} renamed file name or original file name
 */

function folderNoteIndexYAML(
	fileName: string,
	frontmatter: FrontMatterCache,
	settings: GitHubPublisherSettings
): string {
	const category = getCategory(frontmatter, settings);
	const parentCatFolder = !category.endsWith("/")
		? category.split("/").at(-1)
		: category.split("/").at(-2);
	if (!settings.upload.folderNote.enable) return regexOnFileName(fileName, settings);
	if (
		fileName.replace(".md", "").toLowerCase() ===
		parentCatFolder.toLowerCase()
	)
		return settings.upload.folderNote.rename;
	return regexOnFileName(fileName, settings);
}

/**
 * Create filepath based on settings and frontmatter for the github repository
 * @param {GitHubPublisherSettings} settings Settings
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {string} fileName file name
 * @returns {string} filepath
 */

function createFrontmatterPath(
	settings: GitHubPublisherSettings,
	frontmatter: FrontMatterCache,
	fileName: string
): string {
	
	const uploadSettings = settings.upload;
	const folderCategory = getCategory(frontmatter, settings);
	const folderNote = folderNoteIndexYAML(fileName, frontmatter, settings);
	let folderRoot = "";
	if (uploadSettings.rootFolder.length > 0 && !folderCategory.includes(uploadSettings.rootFolder)) {
		folderRoot = uploadSettings.rootFolder + "/";
	}
	if (folderCategory.trim().length === 0) return folderNote;
	const folderRegex = regexOnPath(folderRoot + folderCategory, settings);
	if (folderRegex.trim().length === 0) return folderNote;
	return (folderRegex + "/" + folderNote).replace(/^\//, "");
}

/**
 * Apply a regex edition on the title. It can be used to remove special characters or to add a prefix or suffix
 * ! Not applied on the index.md file (folder note)
 * @param {string} fileName file name
 * @param {GitHubPublisherSettings} settings Settings
 * @return {string} edited file name
 */
export function regexOnFileName(fileName: string, settings: GitHubPublisherSettings): string {
	const uploadSettings = settings.upload;
	if (fileName === uploadSettings.folderNote.rename && uploadSettings.folderNote.enable || uploadSettings.replaceTitle.length === 0) return fileName;
	fileName = fileName.replace(".md", "");
	for (const regexTitle of uploadSettings.replaceTitle) {
		if (regexTitle.regex.trim().length > 0) {
			const toReplace = regexTitle.regex;
			const replaceWith = regexTitle.replacement;
			if (toReplace.match(/\/.+\//)) {
				const regex = createRegexFromText(toReplace);
				fileName = fileName.replace(
					regex,
					replaceWith
				);
			} else {
				fileName = fileName.replaceAll(
					toReplace,
					replaceWith
				);
			}
		}
	}
	return fileName + ".md";
}


/** 
 * Allow to modify enterely the path of a file, using regex / string replace 
 * @param {string} path path
 * @param {GitHubPublisherSettings} settings Settings
 * @return {string} edited path
 */
function regexOnPath(path: string, settings: GitHubPublisherSettings) {
	const uploadSettings = settings.upload;
	if (uploadSettings.behavior === FolderSettings.fixed || uploadSettings.replacePath.length === 0) return path;
	for (const regexTitle of uploadSettings.replacePath) {
		if (regexTitle.regex.trim().length > 0) {
			const toReplace = regexTitle.regex;
			const replaceWith = regexTitle.replacement;
			if (toReplace.match(/\/.+\//)) {
				const flagsRegex = toReplace.match(/\/([gimy]+)$/);
				const flags = flagsRegex ? Array.from(new Set(flagsRegex[1].split(""))).join("") : "";
				const regex = new RegExp(toReplace.replace(/\/(.+)\/.*/, "$1"), flags);
				path = path.replace(
					regex,
					replaceWith
				);
			} else {
				path = path.replaceAll(
					toReplace,
					replaceWith
				);
			}
		}
	}
	return path;
}

/**
 * Get the title field from frontmatter or file name
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {TFile} file file
 * @param {GitHubPublisherSettings} settings Settings
 * @returns {string} title
 */
export function getTitleField(
	frontmatter: FrontMatterCache,
	file: TFile,
	settings: GitHubPublisherSettings
): string {
	let fileName = file.name;
	if (
		frontmatter &&
		settings.upload.frontmatterTitle.enable &&
		frontmatter[settings.upload.frontmatterTitle.key] &&
		frontmatter[settings.upload.frontmatterTitle.key] !== file.name
	) {
		fileName= frontmatter[settings.upload.frontmatterTitle.key] + ".md";
	}
	return fileName;
}



/**
 * Get the path where the file will be saved in the github repository
 * @param {TFile} file Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {MetadataCache} metadataCache Metadata
 * @param {Vault} vault Vault
 * @return {string} folder path
 */

export function getReceiptFolder(
	file: TFile,
	settings: GitHubPublisherSettings,
	metadataCache: MetadataCache,
	vault: Vault
): string {
	if (file.extension === "md") {
		const frontmatter = metadataCache.getCache(file.path)?.frontmatter;

		const fileName = getTitleField(frontmatter, file, settings);
		const editedFileName = regexOnFileName(fileName, settings);

		if (
			!isShared(frontmatter, settings, file)
		) {
			return fileName;
		}

		if (frontmatter.path) {
			const frontmatterPath = frontmatter["path"] instanceof Array ? frontmatter["path"].join("/") : frontmatter["path"];
			if (frontmatterPath == "" || frontmatterPath == "/") {
				return editedFileName;
			}
			return frontmatterPath + "/" + editedFileName;
		} else if (settings.upload.behavior === FolderSettings.yaml) {
			return createFrontmatterPath(settings, frontmatter, fileName);
		} else if (settings.upload.behavior === FolderSettings.obsidian) {
			return createObsidianPath(file, settings, vault, fileName);
		} else {
			return settings.upload.defaultName.length > 0
				? settings.upload.defaultName + "/" + editedFileName
				: editedFileName;
		}
	}
}

/**
 * Create filepath in github Repository based on settings and frontmatter for image
 * @param {TFile} file : Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {FrontmatterConvert | null} sourceFrontmatter
 * @return {string} the new filepath
 */

export function getImageLinkOptions(
	file: TFile,
	settings: GitHubPublisherSettings,
	sourceFrontmatter: FrontmatterConvert | null
): string {
	if (!sourceFrontmatter) {
		const defaultImageFolder = settings.embed.folder;
		if (defaultImageFolder.length > 0) {
			return defaultImageFolder + "/" + file.name;
		} else if (settings.upload.defaultName.length > 0) {
			return settings.upload.defaultName + "/" + file.name;
		} else {
			return file.path;
		}
	} else if (
		sourceFrontmatter &&
		sourceFrontmatter.attachmentLinks !== undefined
	) {
		return sourceFrontmatter.attachmentLinks + "/" + file.name;
	}
	return file.path;
}

