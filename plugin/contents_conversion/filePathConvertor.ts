import {
	MetadataCache,
	TFile,
	Vault,
	TFolder,
	FrontMatterCache,
} from "obsidian";
import {
	folderSettings,
	LinkedNotes,
	GitHubPublisherSettings,
	FrontmatterConvert, RepoFrontmatter,
} from "../settings/interface";
import {checkIfRepoIsInAnother, getFrontmatterCondition, getRepoFrontmatter} from "../src/utils";

/**
 * Get the dataview path from a markdown file
 * @param {string} markdown Markdown file content
 * @param {GitHubPublisherSettings} settings Settings
 * @param {Vault} vault Vault
 * @returns {LinkedNotes[]} Array of linked notes
 */

function getDataviewPath(
	markdown: string,
	settings: GitHubPublisherSettings,
	vault: Vault
): LinkedNotes[] {
	if (!settings.convertDataview) {
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
 * @return {string} relative path
 */

async function createRelativePath(
	sourceFile: TFile,
	targetFile: LinkedNotes,
	metadata: MetadataCache,
	settings: GitHubPublisherSettings,
	vault: Vault,
	frontmatter: FrontMatterCache | null,
	sourceRepo: RepoFrontmatter[] | RepoFrontmatter
): Promise<string> {
	const sourcePath = getReceiptFolder(sourceFile, settings, metadata, vault);
	const frontmatterTarget = await metadata.getFileCache(targetFile.linked).frontmatter;
	const targetRepo = await getRepoFrontmatter(settings, frontmatterTarget);
	const isFromAnotherRepo = checkIfRepoIsInAnother(sourceRepo, targetRepo);
	const shared = frontmatterTarget && frontmatterTarget[settings.shareKey] ? frontmatterTarget[settings.shareKey] : false;

	if (
		targetFile.linked.extension === "md"
		&&
		(isFromAnotherRepo === false || shared === false)
	) {
		return targetFile.altText;
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
 * @return {string} original file name or index.md
 */

function folderNoteIndexOBS(
	file: TFile,
	vault: Vault,
	settings: GitHubPublisherSettings
): string {
	if (!settings.folderNote) return file.name;
	const fileName = file.name.replace(".md", "");
	const folderParent = file.parent.name;
	if (fileName === folderParent) return "index.md";
	const outsideFolder = vault.getAbstractFileByPath(
		file.path.replace(".md", "")
	);
	if (outsideFolder && outsideFolder instanceof TFolder) return "index.md";
	return file.name;
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
	const folderDefault = settings.folderDefaultName;
	fileName = folderNoteIndexOBS(file, vault, settings);

	const rootFolder = folderDefault.length > 0 ? folderDefault + "/" : "";
	const path = rootFolder + file.path.replace(file.name, fileName);
	if (settings.subFolder.length > 0) {
		return path.replace(settings.subFolder + "/", "");
	}
	return path;
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
	const category = frontmatter[settings.yamlFolderKey];
	const parentCatFolder = !category.endsWith("/")
		? category.split("/").at(-1)
		: category.split("/").at(-2);
	if (!settings.folderNote) return fileName;
	if (
		fileName.replace(".md", "").toLowerCase() ===
		parentCatFolder.toLowerCase()
	)
		return "index.md";
	return fileName;
}

/**
 * Create filepath based on settings and frontmatter for the github repository
 * @param {TFile} file Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {FrontMatterCache} frontmatter frontmatter
 * @param {string} fileName file name
 * @returns {string} filepath
 */

function createFrontmatterPath(
	file: TFile,
	settings: GitHubPublisherSettings,
	frontmatter: FrontMatterCache,
	fileName: string
): string {
	let path =
		settings.folderDefaultName.length > 0
			? settings.folderDefaultName + "/" + fileName
			: fileName;
	let folderRoot = settings.rootFolder;
	if (folderRoot.length > 0) {
		folderRoot = folderRoot + "/";
	}
	if (frontmatter && frontmatter[settings.yamlFolderKey]) {
		path =
			folderRoot +
			frontmatter[settings.yamlFolderKey] +
			"/" +
			folderNoteIndexYAML(fileName, frontmatter, settings);
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

function getTitleField(
	frontmatter: FrontMatterCache,
	file: TFile,
	settings: GitHubPublisherSettings
): string {
	if (!settings.useFrontmatterTitle || !frontmatter) {
		return file.name;
	} else if (
		frontmatter &&
		frontmatter[settings.frontmatterTitleKey] &&
		frontmatter[settings.frontmatterTitleKey] !== file.name
	) {
		return frontmatter[settings.frontmatterTitleKey] + ".md";
	}
	return file.name;
}

/**
 * Get the path where the file will be saved in the github repository
 * @param {TFile} file Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {MetadataCache} metadataCache Metadata
 * @param {Vault} vault Vault
 * @return {string} folder path
 */

function getReceiptFolder(
	file: TFile,
	settings: GitHubPublisherSettings,
	metadataCache: MetadataCache,
	vault: Vault
): string {
	if (file.extension === "md") {
		const frontmatter = metadataCache.getCache(file.path)?.frontmatter;

		const fileName = getTitleField(frontmatter, file, settings);

		if (
			!frontmatter ||
			frontmatter[settings.shareKey] === undefined ||
			!frontmatter[settings.shareKey]
		) {
			return fileName;
		}

		let path =
			settings.folderDefaultName.length > 0
				? settings.folderDefaultName + "/" + fileName
				: fileName;

		if (settings.downloadedFolder === folderSettings.yaml) {
			path = createFrontmatterPath(file, settings, frontmatter, fileName);
		} else if (settings.downloadedFolder === folderSettings.obsidian) {
			path = createObsidianPath(file, settings, vault, fileName);
		}
		return path;
	}
}

/**
 * Create filepath in github Repository based on settings and frontmatter for image
 * @param {TFile} file : Source file
 * @param {GitHubPublisherSettings} settings Settings
 * @param {FrontmatterConvert | null} sourceFrontmatter
 * @return {string} the new filepath
 */

function getImageLinkOptions(
	file: TFile,
	settings: GitHubPublisherSettings,
	sourceFrontmatter: FrontmatterConvert | null
): string {
	if (!sourceFrontmatter) {
		if (settings.defaultImageFolder.length > 0) {
			return settings.defaultImageFolder + "/" + file.name;
		} else if (settings.folderDefaultName.length > 0) {
			return settings.folderDefaultName + "/" + file.name;
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

export {
	getReceiptFolder,
	getImageLinkOptions,
	createRelativePath,
	getDataviewPath,
};
