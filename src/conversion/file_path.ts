import {
	App,
	FrontMatterCache,
	normalizePath,
	TFile,
	TFolder,
	Vault,
} from "obsidian";

import {
	FolderSettings,
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	MultiProperties,
	Repository,
} from "../settings/interface";
import {
	getCategory,
	getFrontmatterSettings,
	getRepoFrontmatter,
	logs,
} from "../utils";
import {checkIfRepoIsInAnother, isInternalShared, isShared} from "../utils/data_validation_test";
import { createRegexFromText } from "./find_and_replace_text";




/**
 * Create relative path from a sourceFile to a targetPath. If the target file is a note, only share if the frontmatter sharekey is present and true
 * @param {TFile} sourceFile the shared file containing all links, embed etc
 * @param {LinkedNotes} targetFile The target file
 * @param {FrontMatterCache | null} frontmatter FrontmatterCache or null
 * @param app
 * @param properties
 * @return {string} relative path
 */

export async function createRelativePath(
	sourceFile: TFile,
	targetFile: LinkedNotes,
	frontmatter: FrontMatterCache | null | undefined,
	app: App,
	properties: MultiProperties,
): Promise<string> {
	const { metadataCache } = app;
	const settings = properties.settings;
	const shortRepo = properties.repository;
	const sourcePath = getReceiptFolder(sourceFile, settings, shortRepo, app);
	const frontmatterTarget = metadataCache.getFileCache(targetFile.linked)!.frontmatter;
	const targetRepo = getRepoFrontmatter(settings, shortRepo, frontmatterTarget);
	const isFromAnotherRepo = checkIfRepoIsInAnother(properties.frontmatter.repo, targetRepo);
	const shared = isInternalShared(
		frontmatter,
		properties,
		targetFile.linked,
	);
	if (
		targetFile.linked.extension === "md" && (!isFromAnotherRepo || !shared)
	) {
		return targetFile.destinationFilePath ? targetFile.destinationFilePath: targetFile.linked.basename;
	}
	if (targetFile.linked.path === sourceFile.path) {
		return getReceiptFolder(targetFile.linked, settings, shortRepo, app).split("/").at(-1) as string;
	}

	const targetPath =
		targetFile.linked.extension === "md"
			? getReceiptFolder(targetFile.linked, settings, shortRepo, app)
			: getImagePath(
				targetFile.linked,
				settings,
				getFrontmatterSettings(frontmatter, settings, shortRepo)
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
	const relative = relativePath.concat(diffTargetPath).join("/");
	if (relative.trim() === "." || relative.trim() === "") {
		//in case of errors
		return getReceiptFolder(
			targetFile.linked,
			settings,
			shortRepo,
			app
		).split("/").at(-1) as string;
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
	const folderParent = file.parent ? `/${file.parent.path}/` : "/" ;
	const defaultPath = `${folderParent}${regexOnFileName(fileName, settings)}`;
	if (!settings.upload.folderNote.enable) return defaultPath;
	const parentFolderName = file.parent ? file.parent.name : "";
	if (fileName.replace(".md", "") === parentFolderName) return `/${file.parent!.path}/${index}`;
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
	const fileNameOnly = path.split("/").at(-1) ?? "";
	pathWithoutEnd = regexOnPath(pathWithoutEnd, settings);
	if (pathWithoutEnd.trim().length === 0) return fileNameOnly;
	return (`${pathWithoutEnd}/${fileNameOnly}`).replace(/^\//, "");
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
	frontmatter: FrontMatterCache | undefined | null,
	settings: GitHubPublisherSettings
): string {
	const category = getCategory(frontmatter, settings);
	logs({settings}, `Category: ${category}`);
	const catSplit = category.split("/");
	const parentCatFolder = !category.endsWith("/") ? catSplit.at(-1) as string : catSplit.at(-2) as string;

	if (!settings.upload.folderNote.enable) return regexOnFileName(fileName, settings);
	if (
		fileName.replace(".md", "").toLowerCase() ===
		parentCatFolder?.toLowerCase()
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
	frontmatter: FrontMatterCache | null | undefined,
	fileName: string
): string {

	const uploadSettings = settings.upload;
	const folderCategory = getCategory(frontmatter, settings);
	const folderNote = folderNoteIndexYAML(fileName, frontmatter, settings);
	const folderRoot = uploadSettings.rootFolder.length > 0 && !folderCategory.includes(uploadSettings.rootFolder) ? `${uploadSettings.rootFolder}/` : "";
	if (folderCategory.trim().length === 0) return folderNote;
	const folderRegex = regexOnPath(folderRoot + folderCategory, settings);
	if (folderRegex.trim().length === 0) return folderNote;
	return (`${folderRegex}/${folderNote}`).replace(/^\//, "");
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
	const extension = fileName.match(/\.[0-9a-z]+$/i)?.at(-1) ?? "";
	fileName = fileName.replace(extension, "");
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
	return `${fileName}${extension}`;
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
	frontmatter: FrontMatterCache | undefined | null,
	file: TFile,
	settings: GitHubPublisherSettings
): string {
	const fileName = file.name;
	if (
		frontmatter &&
		settings.upload.frontmatterTitle.enable &&
		frontmatter[settings.upload.frontmatterTitle.key] &&
		frontmatter[settings.upload.frontmatterTitle.key] !== fileName
	) {
		return `${frontmatter[settings.upload.frontmatterTitle.key]}.md`;
	}
	return fileName;
}



/**
 * Get the path where the file will be saved in the github repository
 */

export function getReceiptFolder(
	file: TFile,
	settings: GitHubPublisherSettings,
	otherRepo: Repository | null,
	app: App,
): string {
	const { vault, metadataCache } = app;
	if (file.extension === "md") {
		const frontmatter = metadataCache.getCache(file.path)?.frontmatter;

		const fileName = getTitleField(frontmatter, file, settings);
		const editedFileName = regexOnFileName(fileName, settings);

		if (
			!isShared(frontmatter, settings, file, otherRepo)
		) {
			return normalizePath(fileName);
		}

		if (frontmatter?.path) {
			const frontmatterPath = frontmatter.path instanceof Array ? frontmatter.path.join("/") : frontmatter.path;
			if (frontmatterPath == "" || frontmatterPath == "/") {
				return normalizePath(editedFileName);
			}
			return normalizePath(`${frontmatterPath}/${editedFileName}`);
		} else if (settings.upload.behavior === FolderSettings.yaml) {
			return normalizePath(createFrontmatterPath(settings, frontmatter, fileName));
		} else if (settings.upload.behavior === FolderSettings.obsidian) {
			return normalizePath(createObsidianPath(file, settings, vault, fileName));
		} else {
			return settings.upload.defaultName.length > 0
				? normalizePath(`${settings.upload.defaultName}/${editedFileName}`)
				: normalizePath(editedFileName);
		}
	}
	return file.path;
}

/**
 * Create filepath in github Repository based on settings and frontmatter for image
 * @param {TFile} file : Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {FrontmatterConvert | null} sourceFrontmatter
 * @return {string} the new filepath
 */

export function getImagePath(
	file: TFile,
	settings: GitHubPublisherSettings,
	sourceFrontmatter: FrontmatterConvert | null
): string {
	let imagePath = createImagePath(file, settings, sourceFrontmatter);
	imagePath = regexOnPath(imagePath, settings);
	return regexOnFileName(imagePath, settings);
}

/**
 * Create filepath in github Repository based on settings and frontmatter for image
 * @param {TFile} file : Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {FrontmatterConvert | null} sourceFrontmatter
 * @return {string} the new filepath
 */

function createImagePath(file: TFile,
	settings: GitHubPublisherSettings,
	sourceFrontmatter: FrontmatterConvert | null):string {
	if (!sourceFrontmatter || !sourceFrontmatter.attachmentLinks) {
		if (settings.embed.useObsidianFolder) {
			if (settings.upload.behavior === FolderSettings.yaml) {
				return settings.upload.rootFolder.length > 0 ? normalizePath(`${settings.upload.rootFolder}/${file.path}`) : file.path;
			}
			else {
				//no root, but default folder name
				return settings.upload.defaultName.length > 0 ? normalizePath(`${settings.upload.defaultName}/${file.path}`) : file.path;
			}
		}
		const defaultImageFolder = settings.embed.folder;
		if (defaultImageFolder.length > 0) {
			return normalizePath(`${defaultImageFolder}/${file.name}`);
		} else if (settings.upload.defaultName.length > 0) {
			return normalizePath(`${settings.upload.defaultName}/${file.name}`);
		} else {
			return file.path;
		}
	} else if (
		sourceFrontmatter?.attachmentLinks
	) {
		return normalizePath(`${sourceFrontmatter.attachmentLinks}/${file.name}`);
	}
	return file.path;
}