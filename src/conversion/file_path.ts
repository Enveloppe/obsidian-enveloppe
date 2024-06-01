import {
	FIND_REGEX,
	FolderSettings,
	type EnveloppeSettings,
	type LinkedNotes,
	type MultiProperties,
	type Properties,
	type PropertiesConversion,
	type Repository,
} from "@interfaces";
import {
	type FrontMatterCache,
	normalizePath,
	type TFile,
	TFolder,
	type Vault,
} from "obsidian";
import { createRegexFromText } from "src/conversion/find_and_replace_text";
import type Enveloppe from "src/main";
import {
	checkIfRepoIsInAnother,
	isInternalShared,
	isShared,
} from "src/utils/data_validation_test";
import {
	frontmatterFromFile,
	frontmatterSettingsRepository,
	getCategory,
	getFrontmatterSettings,
	getProperties,
} from "src/utils/parse_frontmatter";
import merge from "ts-deepmerge";

/** Search a link in the entire frontmatter value */
/** Link will always be in the form of [[]] */
export function linkIsInFormatter(
	linkedFile: LinkedNotes,
	frontmatter: FrontMatterCache | undefined | null
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
	frontmatter: FrontMatterCache | undefined | null
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
 * @param properties - The properties of the source file
 * @return {string} relative path
 */

export async function createRelativePath(
	sourceFile: TFile,
	targetFile: LinkedNotes,
	frontmatter: FrontMatterCache | null | undefined,
	properties: MultiProperties
): Promise<string> {
	const settings = properties.plugin.settings;
	const shortRepo = properties.repository;
	const sourcePath = getReceiptFolder(
		sourceFile,
		shortRepo,
		properties.plugin,
		properties.frontmatter.prop
	);
	const frontmatterTarget = frontmatterFromFile(
		targetFile.linked,
		properties.plugin,
		properties.repository
	);
	const targetRepo = getProperties(properties.plugin, shortRepo, frontmatterTarget);
	const isFromAnotherRepo = checkIfRepoIsInAnother(
		properties.frontmatter.prop,
		targetRepo
	);
	const shared = isInternalShared(frontmatterTarget, properties, targetFile.linked);
	properties.plugin.console.logs({}, `Shared: ${shared} for ${targetFile.linked.path}`);
	if (
		targetFile.linked.extension === "md" &&
		!targetFile.linked.name.includes("excalidraw") &&
		(!isFromAnotherRepo || !shared)
	) {
		return targetFile.destinationFilePath
			? targetFile.destinationFilePath
			: targetFile.linked.basename;
	}
	if (targetFile.linked.path === sourceFile.path) {
		return getReceiptFolder(targetFile.linked, shortRepo, properties.plugin, targetRepo)
			.split("/")
			.at(-1) as string;
	}

	const frontmatterSettingsFromFile = getFrontmatterSettings(
		frontmatter,
		settings,
		shortRepo
	);
	const frontmatterSettingsFromRepository = frontmatterSettingsRepository(
		properties.plugin,
		shortRepo
	);
	const frontmatterSettings = merge.withOptions(
		{ allowUndefinedOverrides: false },
		frontmatterSettingsFromRepository,
		frontmatterSettingsFromFile
	);

	const targetPath =
		targetFile.linked.extension === "md" && !targetFile.linked.name.includes("excalidraw")
			? getReceiptFolder(targetFile.linked, shortRepo, properties.plugin, targetRepo)
			: getImagePath(
					targetFile.linked,
					properties.plugin,
					frontmatterSettings,
					targetRepo
				);
	const sourceList = sourcePath.split("/");
	const targetList = targetPath.split("/");

	/**
	 * Exclude the first different element in the list
	 * @param {string[]} sourceList source list
	 * @param {string[]} targetList target list
	 * @returns {string[]} list with the first different element
	 */
	const excludeUtilDiff = (sourceList: string[], targetList: string[]): string[] => {
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
		return getReceiptFolder(targetFile.linked, shortRepo, properties.plugin, targetRepo)
			.split("/")
			.at(-1) as string;
	}
	return relative;
}

/**
 * Check if the file is a folder note based on the global settings - Run for OBSIDIAN PATH option
 * Change the filename in index.md if folder note
 * @param {TFile} file Source file
 * @param {Vault} vault
 * @param {EnveloppeSettings} settings Global Settings
 * @param {string} fileName the filename after reading the frontmatter
 * @return {string} original file name or index.md
 */

function folderNoteIndexObs(
	file: TFile,
	vault: Vault,
	settings: EnveloppeSettings,
	fileName: string
): string {
	const index = settings.upload.folderNote.rename;
	const folderParent = file.parent ? `/${file.parent.path}/` : "/";
	const defaultPath = `${folderParent}${regexOnFileName(fileName, settings)}`;
	if (!settings.upload.folderNote.enable) return defaultPath;
	const parentFolderName = file.parent ? file.parent.name : "";
	if (fileName.replace(".md", "") === parentFolderName)
		return `/${file.parent!.path}/${index}`;
	const outsideFolder = vault.getAbstractFileByPath(file.path.replace(".md", ""));
	if (outsideFolder && outsideFolder instanceof TFolder)
		return `/${outsideFolder.path}/${index}`;
	return defaultPath;
}

/**
 * Create the path on hypothetical vault using the obsidian path and replacing the name by index.md if needed and removing the subfolder if needed
 * @param {TFile} file Source file
 * @param {Vault} vault
 * @param {EnveloppeSettings} settings Global Settings
 * @param {string} fileName file name
 * @return {string} path
 */

function createObsidianPath(
	file: TFile,
	settings: EnveloppeSettings,
	vault: Vault,
	fileName: string,
	prop?: Properties
): string {
	fileName = folderNoteIndexObs(file, vault, settings, fileName);

	const defaultFolder =
		prop?.path?.defaultName && prop.path.defaultName.length > 0
			? prop.path.defaultName
			: settings.upload.defaultName.length > 0
				? settings.upload.defaultName
				: "";
	const path = defaultFolder + fileName;
	//remove last word from path splitted with /
	let pathWithoutEnd = path.split("/").slice(0, -1).join("/");
	//get file name only
	const fileNameOnly = path.split("/").at(-1) ?? "";
	pathWithoutEnd = regexOnPath(pathWithoutEnd, settings);
	if (pathWithoutEnd.trim().length === 0) return fileNameOnly;
	return `${pathWithoutEnd}/${fileNameOnly}`.replace(/^\//, "");
}

/**
 * Check if a file (using category frontmatter option) is a folder note, and rename it to index.md if it is
 * @param {string} fileName file name
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {EnveloppeSettings} settings Settings
 * @returns {string} renamed file name or original file name
 */

function folderNoteIndexYaml(
	fileName: string,
	frontmatter: FrontMatterCache | undefined | null,
	settings: EnveloppeSettings,
	prop?: Properties
): string {
	const category = getCategory(frontmatter, settings, prop?.path);
	const catSplit = category.split("/");
	const parentCatFolder = category.endsWith("/")
		? (catSplit.at(-2) as string)
		: (catSplit.at(-1) as string);

	if (!settings.upload.folderNote.enable) return regexOnFileName(fileName, settings);
	if (fileName.replace(".md", "").toLowerCase() === parentCatFolder?.toLowerCase())
		return settings.upload.folderNote.rename;
	return regexOnFileName(fileName, settings);
}

/**
 * Create filepath based on settings and frontmatter for the github repository
 * @param {EnveloppeSettings} settings Settings
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {string} fileName file name
 * @returns {string} filepath
 */

function createFrontmatterPath(
	settings: EnveloppeSettings,
	frontmatter: FrontMatterCache | null | undefined,
	fileName: string,
	prop?: Properties
): string {
	const uploadSettings = settings.upload;
	const folderCategory = getCategory(frontmatter, settings, prop?.path);
	const path = prop?.path;
	const folderNote = folderNoteIndexYaml(fileName, frontmatter, settings, prop);
	const root =
		path?.rootFolder && path.rootFolder.length > 0
			? path.rootFolder
			: uploadSettings.rootFolder.length > 0
				? uploadSettings.rootFolder
				: undefined;
	const folderRoot = root && !folderCategory.includes(root) ? `${root}/` : "";
	if (folderCategory.trim().length === 0) return folderNote;
	const folderRegex = regexOnPath(folderRoot + folderCategory, settings);
	if (folderRegex.trim().length === 0) return folderNote;
	return `${folderRegex}/${folderNote}`.replace(/^\//, "");
}

/**
 * Apply a regex edition on the title. It can be used to remove special characters or to add a prefix or suffix
 * ! Not applied on the index.md file (folder note)
 * @param {string} fileName file name
 * @param {EnveloppeSettings} settings Settings
 * @return {string} edited file name
 */
export function regexOnFileName(fileName: string, settings: EnveloppeSettings): string {
	const uploadSettings = settings.upload;
	if (
		(fileName === uploadSettings.folderNote.rename && uploadSettings.folderNote.enable) ||
		uploadSettings.replaceTitle.length === 0
	)
		return fileName;
	const extension = fileName.match(/\.[0-9a-z]+$/i)?.at(-1) ?? "";
	fileName = fileName.replace(extension, "");
	for (const regexTitle of uploadSettings.replaceTitle) {
		if (regexTitle.regex?.trim().length > 0) {
			const toReplace = regexTitle.regex;
			const replaceWith = regexTitle.replacement;
			if (toReplace.match(FIND_REGEX)) {
				const regex = createRegexFromText(toReplace);

				fileName = fileName.replace(regex, replaceWith);
			} else {
				fileName = fileName.replaceAll(toReplace, replaceWith);
			}
		}
	}
	return `${fileName}${extension}`;
}

/**
 * Allow to modify enterely the path of a file, using regex / string replace
 * @param {string} path path
 * @param {EnveloppeSettings} settings Settings
 * @return {string} edited path
 */
export function regexOnPath(path: string, settings: EnveloppeSettings): string {
	const uploadSettings = settings.upload;
	if (
		uploadSettings.behavior === FolderSettings.Fixed ||
		uploadSettings.replacePath.length === 0
	)
		return path;
	for (const regexTitle of uploadSettings.replacePath) {
		if (regexTitle.regex.trim().length > 0) {
			const toReplace = regexTitle.regex;
			const replaceWith = regexTitle.replacement;
			if (toReplace.match(FIND_REGEX)) {
				const regex = createRegexFromText(toReplace);
				path = path.replace(regex, replaceWith);
			} else {
				path = path.replaceAll(toReplace, replaceWith);
			}
		}
	}
	return path;
}

/**
 * Get the title field from frontmatter or file name
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {TFile} file file
 * @param {EnveloppeSettings} settings Settings
 * @returns {string} title
 */
export function getTitleField(
	frontmatter: FrontMatterCache | undefined | null,
	file: TFile,
	settings: EnveloppeSettings
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
	plugin: Enveloppe,
	prop?: Properties | Properties[]
): string {
	const { vault } = plugin.app;
	const settings = plugin.settings;
	if (file.extension === "md") {
		const frontmatter = frontmatterFromFile(file, plugin, otherRepo);
		if (!prop) prop = getProperties(plugin, otherRepo, frontmatter);
		prop = prop instanceof Array ? prop : [prop];
		let targetRepo = prop.find(
			(repo) => repo.path?.smartkey === otherRepo?.smartKey || "default"
		);
		if (!targetRepo) targetRepo = prop[0];
		const fileName = getTitleField(frontmatter, file, settings);
		const editedFileName = regexOnFileName(fileName, settings);
		if (!isShared(frontmatter, settings, file, otherRepo)) {
			return normalizePath(fileName);
		}
		if (targetRepo.path?.override) {
			const frontmatterPath = targetRepo.path.override;
			if (frontmatterPath == "" || frontmatterPath == "/") {
				return normalizePath(editedFileName);
			}
			return normalizePath(`${frontmatterPath}/${editedFileName}`);
		} else if (targetRepo.path?.type === FolderSettings.Yaml) {
			return normalizePath(
				createFrontmatterPath(settings, frontmatter, fileName, targetRepo)
			);
		} else if (targetRepo.path?.type === FolderSettings.Obsidian) {
			return normalizePath(
				createObsidianPath(file, settings, vault, fileName, targetRepo)
			);
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
 * @param {PropertiesConversion | null} sourceFrontmatter
 * @return {string} the new filepath
 */
export function getImagePath(
	file: TFile,
	plugin: Enveloppe,
	sourceFrontmatter: PropertiesConversion | null,
	repository: Properties | Properties[]
): string {
	const settings = plugin.settings;
	const overridePath = repository instanceof Array ? repository[0] : repository;

	const imagePath = createImagePath(file, settings, sourceFrontmatter, overridePath);
	let path = regexOnPath(imagePath.path, settings);
	let name = regexOnFileName(imagePath.name, settings);
	let originalFileName = file.name;
	if (originalFileName.includes("excalidraw")) {
		name = name.replace(".excalidraw.md", ".svg");
		path = path.replace(".excalidraw.md", ".svg");
		originalFileName = originalFileName.replace(".excalidraw.md", ".svg");
	}
	return normalizePath(path.replace(originalFileName, name));
}

/**
 * Create filepath in github Repository based on settings and frontmatter for image
 * @param {TFile} file : Source file
 * @param {EnveloppeSettings} settings Settings
 * @param {PropertiesConversion | null} sourceFrontmatter
 * @return {string} the new filepath
 */

function createImagePath(
	file: TFile,
	settings: EnveloppeSettings,
	sourceFrontmatter: PropertiesConversion | null,
	overridePath?: Properties
): { path: string; name: string } {
	const fileName = file.name;
	const filePath = file.path;

	const result: { path: string; name: string } = {
		path: filePath,
		name: fileName,
	};
	const behavior = overridePath?.path?.type
		? overridePath.path.type
		: settings.upload.behavior;
	const rootFolder = overridePath?.path?.rootFolder
		? overridePath.path.rootFolder
		: settings.upload.rootFolder;
	const defaultFolderName = overridePath?.path?.defaultName
		? overridePath.path.defaultName
		: settings.upload.defaultName;
	if (
		sourceFrontmatter?.attachmentLinks &&
		sourceFrontmatter.attachmentLinks.length > 0
	) {
		result.path = normalizePath(`${sourceFrontmatter.attachmentLinks}/${fileName}`);
		return result;
	}
	if (settings.embed.useObsidianFolder) {
		if (behavior === FolderSettings.Yaml) {
			result.path =
				rootFolder.length > 0 ? normalizePath(`${rootFolder}/${filePath}`) : filePath;
		} else {
			//no root, but default folder name
			result.path =
				defaultFolderName.length > 0
					? normalizePath(`${defaultFolderName}/${filePath}`)
					: filePath;
		}
		result.path = applyOverriddenPath(fileName, result.path, settings).filePath;
		return result;
	}
	const defaultImageFolder = overridePath?.path?.attachment?.folder
		? overridePath.path?.attachment?.folder
		: settings.embed.folder;
	//find in override
	const overriddenPath = applyOverriddenPath(fileName, filePath, settings);
	if (overriddenPath.overridden) {
		result.path = overriddenPath.filePath;
	} else if (defaultImageFolder.length > 0) {
		result.path = normalizePath(`${defaultImageFolder}/${fileName}`);
	} else if (defaultFolderName.length > 0) {
		result.path = normalizePath(`${defaultFolderName}/${fileName}`);
	} else {
		result.path = filePath;
	}
	return result;
}

/**
 * Override the path of an attachment using the settings (regex or string replace)
 * @param fileName - The name of the file
 * @param filePath - The (original) path of the file
 * @param settings - The settings of the plugin
 * @returns The new path of the file and whether it was overridden
 */
function applyOverriddenPath(
	fileName: string,
	filePath: string,
	settings: EnveloppeSettings
): { filePath: string; overridden: boolean } {
	let overridden = false;
	const isOverridden = settings.embed.overrideAttachments.filter((override) => {
		const isRegex = override.path.match(FIND_REGEX);
		const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : undefined;
		return (
			(regex?.test(filePath) ||
				filePath === override.path ||
				override.path.contains("{{all}}")) &&
			!override.destination.contains("{{default}}")
		);
	});
	if (isOverridden.length > 0) {
		overridden = true;
		for (const override of isOverridden) {
			const isRegex = override.path.match(FIND_REGEX);
			const regex = isRegex ? new RegExp(isRegex[1], isRegex[2]) : null;
			const dest = override.destination.replace("{{name}}", fileName);
			filePath = regex
				? normalizePath(filePath.replace(regex, dest))
				: normalizePath(filePath.replace(override.path, dest));
		}
	}
	return { filePath, overridden };
}
