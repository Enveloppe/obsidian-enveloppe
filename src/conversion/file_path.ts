import {
	FrontMatterCache,
	normalizePath,
	TFile,
	TFolder,
	Vault,
} from "obsidian";
import GithubPublisher from "src/main";
import merge from "ts-deepmerge";

import {
	FIND_REGEX,
	FolderSettings,
	FrontmatterConvert,
	GitHubPublisherSettings,
	LinkedNotes,
	MultiProperties,
	RepoFrontmatter,
	Repository,
} from "../settings/interface";
import {
	logs,
} from "../utils";
import {checkIfRepoIsInAnother, isInternalShared, isShared} from "../utils/data_validation_test";
import { frontmatterFromFile, frontmatterSettingsRepository, getCategory, getFrontmatterSettings, getRepoFrontmatter } from "../utils/parse_frontmatter";
import { createRegexFromText } from "./find_and_replace_text";


/** Search a link in the entire frontmatter value */
/** Link will always be in the form of [[]] */
export function linkIsInFormatter(
	linkedFile: LinkedNotes,
	frontmatter: FrontMatterCache | undefined | null,
): boolean {
	if (frontmatter) {
		for (const key in frontmatter) {
			const wikiLinks = `[[${linkedFile.linkFrom}]]`;
			if (frontmatter[key] === wikiLinks) {
				return true;
			}
		}
	}
	return false;
}

export function textIsInFrontmatter(
	text: string,
	frontmatter: FrontMatterCache | undefined | null,
): boolean {

	if (frontmatter) {
		for (const key in frontmatter) {
			if (frontmatter[key] === `[[${text}]]`) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Create relative path from a sourceFile to a targetPath. If the target file is a note, only share if the frontmatter sharekey is present and true
 * @param {TFile} sourceFile the shared file containing all links, embed etc
 * @param {LinkedNotes} targetFile The target file
 * @param {FrontMatterCache | null} frontmatter FrontmatterCache or null
 * @param {plugin} GithubPublisher
 * @param properties
 * @return {string} relative path
 */

export async function createRelativePath(
	sourceFile: TFile,
	targetFile: LinkedNotes,
	frontmatter: FrontMatterCache | null | undefined,
	properties: MultiProperties,
): Promise<string> {
	const settings = properties.plugin.settings;
	const shortRepo = properties.repository;
	const sourcePath = getReceiptFolder(sourceFile, shortRepo, properties.plugin, properties.frontmatter.repo);
	const frontmatterTarget = frontmatterFromFile(targetFile.linked, properties.plugin);
	const targetRepo = getRepoFrontmatter(properties.plugin, shortRepo, frontmatterTarget);
	const isFromAnotherRepo = checkIfRepoIsInAnother(properties.frontmatter.repo, targetRepo);
	const shared = isInternalShared(
		frontmatterTarget,
		properties,
		targetFile.linked,
	);
	logs({settings}, `Shared: ${shared} for ${targetFile.linked.path}`);
	if (
		targetFile.linked.extension === "md" && !targetFile.linked.name.includes("excalidraw") && (!isFromAnotherRepo || !shared)
	) {
		return targetFile.destinationFilePath ? targetFile.destinationFilePath: targetFile.linked.basename;
	}
	if (targetFile.linked.path === sourceFile.path) {
		return getReceiptFolder(targetFile.linked, shortRepo, properties.plugin, targetRepo).split("/").at(-1) as string;
	}

	const frontmatterSettingsFromFile = getFrontmatterSettings(frontmatter, settings, shortRepo);
	const frontmatterSettingsFromRepository = frontmatterSettingsRepository(properties.plugin, shortRepo);
	const frontmatterSettings = merge(frontmatterSettingsFromRepository, frontmatterSettingsFromFile);
	const targetPath =
		targetFile.linked.extension === "md" && !targetFile.linked.name.includes("excalidraw")
			? getReceiptFolder(targetFile.linked, shortRepo, properties.plugin, targetRepo)
			: getImagePath(
				targetFile.linked,
				settings,
				frontmatterSettings
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
			shortRepo,
			properties.plugin,
			targetRepo
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
	fileName: string,
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
	fileName: string,
	repoFrontmatter?: RepoFrontmatter,
): string {
	fileName = folderNoteIndexOBS(file, vault, settings, fileName);

	const defaultFolder = repoFrontmatter?.path?.defaultName && repoFrontmatter.path.defaultName.length > 0 ?
		repoFrontmatter.path.defaultName : settings.upload.defaultName.length > 0 ?
			settings.upload.defaultName : "";
	const path = defaultFolder + fileName;
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
	settings: GitHubPublisherSettings,
	repoFrontmatter?: RepoFrontmatter,
): string {
	const category = repoFrontmatter?.path?.category?.value ?? getCategory(frontmatter, settings, repoFrontmatter?.path);
	const catSplit = category.split("/");
	const parentCatFolder = category.endsWith("/") ? catSplit.at(-2) as string : catSplit.at(-1) as string;

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
	fileName: string,
	repoFrontmatter?: RepoFrontmatter,
): string {

	const uploadSettings = settings.upload;
	const folderCategory = repoFrontmatter?.path?.category?.value ?? getCategory(frontmatter, settings, repoFrontmatter?.path);
	const path = repoFrontmatter?.path;
	const folderNote = folderNoteIndexYAML(fileName, frontmatter, settings, repoFrontmatter);
	const root = path?.rootFolder && path.rootFolder.length > 0 ? path.rootFolder : uploadSettings.rootFolder.length > 0 ? uploadSettings.rootFolder : undefined;
	const folderRoot = root && !folderCategory.includes(root) ? `${root}/` : "";
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
		if (regexTitle.regex?.trim().length > 0) {
			const toReplace = regexTitle.regex;
			const replaceWith = regexTitle.replacement;
			if (toReplace.match(FIND_REGEX)) {
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
export function regexOnPath(path: string, settings: GitHubPublisherSettings):string {
	const uploadSettings = settings.upload;
	if (uploadSettings.behavior === FolderSettings.fixed || uploadSettings.replacePath.length === 0) return path;
	for (const regexTitle of uploadSettings.replacePath) {
		if (regexTitle.regex.trim().length > 0) {
			const toReplace = regexTitle.regex;
			const replaceWith = regexTitle.replacement;
			if (toReplace.match(FIND_REGEX)) {
				const regex = createRegexFromText(toReplace);
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
	otherRepo: Repository | null,
	plugin: GithubPublisher,
	repoFrontmatter?: RepoFrontmatter | RepoFrontmatter[],
): string {
	const { vault} = plugin.app;
	const settings = plugin.settings;
	if (file.extension === "md") {
		const frontmatter = frontmatterFromFile(file, plugin);
		if (!repoFrontmatter) repoFrontmatter = getRepoFrontmatter(plugin, otherRepo, frontmatter);
		repoFrontmatter = repoFrontmatter instanceof Array ? repoFrontmatter : [repoFrontmatter];
		let targetRepo = repoFrontmatter.find((repo) => repo.path?.smartkey === otherRepo?.smartKey || "default");
		if (!targetRepo) targetRepo = repoFrontmatter[0];
		const fileName = getTitleField(frontmatter, file, settings);
		const editedFileName = regexOnFileName(fileName, settings);
		if (
			!isShared(frontmatter, settings, file, otherRepo)
		) {
			return normalizePath(fileName);
		}
		if (targetRepo.path?.override) {
			const frontmatterPath = targetRepo.path.override;
			if (frontmatterPath == "" || frontmatterPath == "/") {
				return normalizePath(editedFileName);
			}
			return normalizePath(`${frontmatterPath}/${editedFileName}`);
		} else if (targetRepo.path?.type === FolderSettings.yaml) {
			return normalizePath(createFrontmatterPath(settings, frontmatter, fileName, targetRepo));
		} else if (targetRepo.path?.type === FolderSettings.obsidian) {
			return normalizePath(createObsidianPath(file, settings, vault, fileName, targetRepo));
		} else {
			return targetRepo.path?.defaultName && targetRepo.path.defaultName.length > 0
				? normalizePath(`${targetRepo.path.defaultName}/${editedFileName}`)
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
	sourceFrontmatter: FrontmatterConvert | null,
	overridePath?: string,
): string {
	const imagePath = createImagePath(file, settings, sourceFrontmatter, overridePath);
	const path = regexOnPath(imagePath.path, settings);
	const name = regexOnFileName(imagePath.name, settings);
	return normalizePath(path.replace(file.name, name));
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
	sourceFrontmatter: FrontmatterConvert | null,
	overridePath?: string,
): { path: string, name: string } {
	let fileName = file.name;
	let filePath = file.path;
	if (file.name.includes(".excalidraw")) {
		fileName = fileName.replace(".excalidraw.md", ".svg");
		filePath = filePath.replace(".excalidraw.md", ".svg");
	}
	const result : { path: string, name: string } = { path: filePath, name: fileName };
	if (!sourceFrontmatter || !sourceFrontmatter.attachmentLinks) {
		if (settings.embed.useObsidianFolder) {
			if (settings.upload.behavior === FolderSettings.yaml) {
				result.path = settings.upload.rootFolder.length > 0 ? normalizePath(`${settings.upload.rootFolder}/${filePath}`) : filePath;
			}
			else {
				//no root, but default folder name
				result.path = settings.upload.defaultName.length > 0 ? normalizePath(`${settings.upload.defaultName}/${filePath}`) : filePath;
			}
			return result;
		}
		const defaultImageFolder = overridePath ? overridePath : settings.embed.folder;
		//find in override
		const isOverridden = settings.embed.overrideAttachments.filter((override) => {
			const isRegex = override.path.match(FIND_REGEX);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : undefined;
			return (
				regex?.test(filePath)
				|| filePath === override.path
				|| override.path.contains("{{all}}"))
				&& !override.destination.contains("{{default}}");
		});
		if (isOverridden.length > 0) {
			for (const override of isOverridden) {
				const isRegex = override.path.match(FIND_REGEX);
				const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
				const dest = override.destination.replace("{{name}}", fileName);
				filePath = regex ? normalizePath(filePath.replace(regex, dest)) : normalizePath(filePath.replace(override.path, dest));
			}
			result.path = filePath;
		}
		else if (defaultImageFolder.length > 0) {
			result.path = normalizePath(`${defaultImageFolder}/${filePath}`);
			
		} else if (settings.upload.defaultName.length > 0) {
			result.path = normalizePath(`${settings.upload.defaultName}/${fileName}`);
		} else {
			result.path = filePath;
		}
	} else if (
		sourceFrontmatter?.attachmentLinks
	) {
		result.path = normalizePath(`${sourceFrontmatter.attachmentLinks}/${fileName}`);
	}
	return result;
}