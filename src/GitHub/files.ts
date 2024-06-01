import type {
	ConvertedLink,
	GithubRepo,
	LinkedNotes,
	Properties,
	PropertiesConversion,
	Repository,
} from "@interfaces/main";
import type { Octokit } from "@octokit/core";
import { type EmbedCache, type LinkCache, TFile, TFolder } from "obsidian";
import { getAPI, type Link } from "obsidian-dataview";
import { getImagePath, getReceiptFolder } from "src/conversion/file_path";
import Publisher from "src/GitHub/upload";
import type Enveloppe from "src/main";
import { isAttachment, isShared } from "src/utils/data_validation_test";
import {
	frontmatterFromFile,
	getFrontmatterSettings,
	getProperties,
} from "src/utils/parse_frontmatter";
import type { Logs } from "../utils/logs";

export class FilesManagement extends Publisher {
	/**
	 * @param {Octokit} octokit The octokit instance
	 * @param {EnveloppeSettings} plugin The plugin
	 */
	console: Logs;
	constructor(octokit: Octokit, plugin: Enveloppe) {
		super(octokit, plugin);
		this.console = plugin.console;
	}

	/**
	 * Get all shared files in the vault, by scanning the frontmatter and the state of the shareKey
	 * @return {TFile[]} The shared files
	 */

	getSharedFiles(repo: Repository | null): TFile[] {
		const files = this.vault.getMarkdownFiles();
		const sharedFile: TFile[] = [];
		for (const file of files) {
			try {
				const frontMatter = this.metadataCache.getCache(file.path)?.frontmatter;
				if (isShared(frontMatter, this.settings, file, repo)) {
					sharedFile.push(file);
				}
			} catch (e) {
				this.console.logs({ e: true }, e);
			}
		}
		return sharedFile;
	}

	/**
	 * Get all shared files in a specified TFolder
	 * @param {TFolder} folder The folder to scan
	 * @param {Repository | null} repo The repository
	 * @return {TFile[]} The shared files
	 */
	getSharedFileOfFolder(
		folder: TFolder,
		repo: Repository | null,
		addFolderNote?: boolean
	): TFile[] {
		const files: TFile[] = [];
		for (const file of folder.children) {
			if (file instanceof TFolder) {
				files.push(...this.getSharedFileOfFolder(file, repo));
			} else {
				try {
					const frontMatter = this.metadataCache.getCache(file.path)?.frontmatter;
					if (isShared(frontMatter, this.settings, file as TFile, repo)) {
						files.push(file as TFile);
					}
				} catch (e) {
					this.console.logs({ e: true }, e);
				}
			}
		}
		/* get if external folder note exists */
		if (addFolderNote) {
			const folderNote = this.vault.getAbstractFileByPath(`${folder.path}.md`);
			if (folderNote && folderNote instanceof TFile) {
				const frontMatter = this.metadataCache.getCache(folderNote.path)?.frontmatter;
				if (
					isShared(frontMatter, this.settings, folderNote, repo) &&
					!files.includes(folderNote)
				) {
					files.push(folderNote);
				}
			}
		}
		return [...new Set(files)]; //prevent duplicate;
	}

	/**
	 * Get all shared file in the vault, but create an ConvertedLink object with the real path and the converted path
	 * @param {Repository | null} repo The repository
	 * @param {PropertiesConversion} convert The frontmatter settings
	 * @param {boolean} withBackLinks If the backlinks should be included (only used for cleaning purpose, as backlinks can be pretty slow to get)
	 * @return {ConvertedLink[]} The shared files
	 */

	getAllFileWithPath(
		repo: Repository | null,
		convert: PropertiesConversion,
		withBackLinks?: boolean
	): ConvertedLink[] {
		const files = this.vault
			.getFiles()
			.filter((x) => !x.path.startsWith(this.settings.github.dryRun.folderName));
		const allFileWithPath: ConvertedLink[] = [];
		const sourceFrontmatter = getProperties(this.plugin, repo, null, true);
		for (const file of files) {
			if (isAttachment(file.name, this.settings.embed.unHandledObsidianExt)) {
				const filepath = getImagePath(file, this.plugin, convert, sourceFrontmatter);
				allFileWithPath.push({
					converted: filepath,
					real: file,
					otherPaths: this.getBackLinksOfImage(file, repo, withBackLinks),
				});
			} else if (file.extension == "md") {
				const frontMatter = frontmatterFromFile(file, this.plugin, repo);
				if (isShared(frontMatter, this.settings, file, repo)) {
					const prop = getProperties(this.plugin, repo, frontMatter);
					const filepath = getReceiptFolder(file, repo, this.plugin, prop);
					allFileWithPath.push({
						converted: filepath,
						real: file,
						prop,
					});
				}
			}
		}
		return allFileWithPath;
	}

	getBackLinksOfImage(
		file: TFile,
		repository: Repository | null,
		withBackLinks?: boolean
	): string[] | undefined {
		if (!withBackLinks) return undefined;
		const backlinks = this.metadataCache.getBacklinksForFile(file);
		if (backlinks.count() === 0) return undefined;
		const otherPath: string[] = [];
		for (const backlink of backlinks.keys()) {
			//get tfile of theses files
			const tfile = this.vault.getAbstractFileByPath(backlink);
			if (tfile && tfile instanceof TFile) {
				const frontmatter = this.metadataCache.getFileCache(tfile)?.frontmatter;
				if (!frontmatter) continue;
				const propertiesConversion = getFrontmatterSettings(
					frontmatter,
					this.settings,
					repository
				);
				const properties = getProperties(this.plugin, repository, frontmatter);
				const path = getImagePath(file, this.plugin, propertiesConversion, properties);
				otherPath.push(path);
			}
		}
		return otherPath.length > 0 ? otherPath : undefined;
	}

	/**
	 * Create a database with every internal links and embedded image and files
	 * Used for the links conversion (for markdown links and receipt folder)
	 * @param {TFile} file source file
	 * @return {LinkedNotes[]} array of linked files
	 */
	getLinkedByEmbedding(file: TFile): LinkedNotes[] {
		const linkedFiles: LinkedNotes[] = this.getLinkedFiles(file);
		const imageEmbedded = this.metadataCache.getFileCache(file)?.embeds;
		if (imageEmbedded != undefined) {
			for (const image of imageEmbedded) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						image.link.replace(/#.*/, ""),
						file.path
					);
					if (imageLink !== null) {
						let altText =
							image.displayText !== imageLink.path.replace(".md", "")
								? image.displayText
								: imageLink.basename;
						let frontmatterDestinationFilePath;

						if (this.settings.upload.frontmatterTitle.enable) {
							const frontmatter = this.metadataCache.getCache(
								imageLink.path
							)?.frontmatter;

							/**
							 * In case there's a frontmatter configuration, pass along
							 * `filename` so we can later use that to convert wikilinks.
							 */
							if (frontmatter?.[this.settings.upload.frontmatterTitle.key]) {
								frontmatterDestinationFilePath =
									frontmatter[this.settings.upload.frontmatterTitle.key];
								if (altText === imageLink.basename) {
									altText = frontmatterDestinationFilePath;
								}
							}
						}
						const thisLinkedFile: LinkedNotes = {
							linked: imageLink, //TFile found
							linkFrom: image.link, //path of the founded file
							altText, //alt text if exists, filename otherwise
							destinationFilePath: frontmatterDestinationFilePath,
							type: "embed",
							position: {
								start: image.position.start.offset,
								end: image.position.end.offset,
							},
						};
						if (image.link.includes("#")) {
							thisLinkedFile.anchor = `#${image.link.split("#")[1]}`;
						}
						linkedFiles.push(thisLinkedFile);
					}
				} catch (e) {
					this.console.logs({}, e);
				}
			}
		}
		return [...new Set(linkedFiles)];
	}

	/**
	 * Create an objet of all files linked (not embed!) in the shared files
	 * Used during links conversion (for markdown links and receipt folder)
	 * @param {TFile} file The file shared
	 * @return {LinkedNotes[]} the file linked (TFile), the path to it, and the alt text if exists
	 */
	getLinkedFiles(file: TFile): LinkedNotes[] {
		const embedCaches = this.metadataCache.getCache(file.path)?.links;
		const embedList: LinkedNotes[] = [];
		if (embedCaches != undefined) {
			for (const embedCache of embedCaches) {
				try {
					const linkedFile = this.metadataCache.getFirstLinkpathDest(
						embedCache.link.replace(/#.*/, ""),
						file.path
					);
					if (linkedFile) {
						let altText = embedCache.original.match(/\[.*\]\(.*\)/)
							? embedCache.original!.match(/\[(.*)\]/)![1]
							: embedCache.displayText !== linkedFile.path.replace(".md", "")
								? embedCache.displayText
								: linkedFile.basename;
						let frontmatterDestinationFilePath;

						if (this.settings.upload.frontmatterTitle.enable) {
							const frontmatter = this.metadataCache.getCache(
								linkedFile.path
							)?.frontmatter;

							/**
							 * In case there's a frontmatter configuration, pass along
							 * `filename` so we can later use that to convert wikilinks.
							 */
							if (frontmatter?.[this.settings.upload.frontmatterTitle.key]) {
								frontmatterDestinationFilePath =
									frontmatter[this.settings.upload.frontmatterTitle.key];
								if (altText === linkedFile.basename) {
									altText = frontmatterDestinationFilePath;
								}
							}
						}
						const thisEmbed: LinkedNotes = {
							linked: linkedFile,
							linkFrom: embedCache.link,
							altText,
							destinationFilePath: frontmatterDestinationFilePath,
							type: "link",
						};
						if (embedCache.link.includes("#")) {
							thisEmbed.anchor = `#${embedCache.link.split("#")[1]}`;
						}
						embedList.push(thisEmbed);
					}
				} catch (e) {
					this.console.logs({ e: true }, `Error with this links : ${embedCache.link}`, e);
				}
			}
			return [...new Set(embedList)];
		}
		return [];
	}

	/**
	 * Get all files embedded in the shared file
	 * If the settings are true, allowing to publish the files (for attachments)
	 * Markdown files attachments are always verified using the main publish function
	 * @param {TFile} file The file shared
	 * @param {PropertiesConversion} frontmatterSourceFile frontmatter of the file
	 * @return {TFile[]} the file embedded & shared in form of an array of TFile
	 */
	getSharedEmbed(file: TFile, frontmatterSourceFile: PropertiesConversion): TFile[] {
		const embedCaches = this.metadataCache.getCache(file.path)?.embeds ?? [];
		const cacheLinks = this.metadataCache.getCache(file.path)?.links ?? [];
		const imageList: TFile[] = [];

		for (const embed of embedCaches) {
			const embedFile = this.checkIfFileIsShared(
				embed,
				file,
				frontmatterSourceFile,
				"embed"
			);
			if (embedFile) imageList.push(embedFile);
		}

		for (const link of cacheLinks) {
			const linkFile = this.checkIfFileIsShared(
				link,
				file,
				frontmatterSourceFile,
				"link"
			);
			if (linkFile) imageList.push(linkFile);
		}

		return [...new Set(imageList)].filter((x) => x !== null);
	}

	private checkIfFileIsShared(
		embed: EmbedCache | LinkCache,
		file: TFile,
		frontmatterSourceFile: PropertiesConversion,
		fromWhat: "link" | "embed"
	): TFile | undefined {
		try {
			const imageLink = this.metadataCache.getFirstLinkpathDest(
				embed.link.replace(/#(.*)/, ""),
				file.path
			);
			if (imageLink)
				return this.imageSharedOrNote(
					imageLink as TFile,
					frontmatterSourceFile,
					fromWhat
				) as TFile;
		} catch (e) {
			this.console.logs({ e: true }, `Error with this file : ${embed.displayText}`, e);
		}
		return undefined;
	}

	/**
	 * Get the last time the file from the github Repo was edited
	 * @param {GithubRepo} githubRepo
	 * @return {Promise<Date>}
	 */

	async getLastEditedTimeRepo(githubRepo: GithubRepo): Promise<Date | null> {
		const commits = await this.octokit.request("GET /repos/{owner}/{repo}/commits", {
			owner: this.settings.github.user,
			repo: this.settings.github.repo,
			path: githubRepo.file,
		});
		const lastCommittedFile = commits.data[0];
		if (
			!lastCommittedFile ||
			!lastCommittedFile.commit ||
			!lastCommittedFile.commit.committer ||
			!lastCommittedFile.commit.committer.date
		) {
			return null;
		}
		return new Date(lastCommittedFile.commit.committer.date);
	}

	/**
	 * Get all file from the github Repo
	 */

	async getAllFileFromRepo(
		branchToScan: string,
		repo: Properties
	): Promise<GithubRepo[]> {
		const filesInRepo: GithubRepo[] = [];
		try {
			const repoContents = await this.octokit.request(
				"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
				{
					owner: repo.owner,
					repo: repo.repo,
					// biome-ignore lint/style/useNamingConvention: github api
					tree_sha: branchToScan,
					recursive: "true",
				}
			);

			if (repoContents.status === 200) {
				const files = repoContents.data.tree;
				for (const file of files) {
					if (!file.path || !file.sha) continue;
					const basename = (name: string) => /([^/\\.]*)(\..*)?$/.exec(name)![1]; //don't delete file starting with .
					if (file.type === "blob" && basename(file.path).length > 0) {
						filesInRepo.push({
							file: file.path,
							sha: file.sha,
						});
					}
				}
			}
		} catch (e) {
			this.console.logs({ e: true }, e);
		}
		return filesInRepo;
	}

	/**
	 * Compare the last edited time of the file in the github repo and the file in the vault
	 * Always push in the list if the file doesn't exist in the github repo
	 * @param {ConvertedLink[]} allFileWithPath
	 * @param {GithubRepo[]} githubSharedFiles
	 * @return {TFile[]}
	 */

	getNewFiles(
		allFileWithPath: ConvertedLink[],
		githubSharedFiles: GithubRepo[]
	): TFile[] {
		const newFiles: TFile[] = []; //new file : present in allFileswithPath but not in githubSharedFiles

		for (const file of allFileWithPath) {
			if (!githubSharedFiles.some((x) => x.file === file.converted.trim())) {
				//get TFile from file
				const fileInVault = this.vault.getAbstractFileByPath(file.real.path.trim());
				const isMarkdown =
					fileInVault instanceof TFile &&
					fileInVault.extension === "md" &&
					!fileInVault.name.endsWith(".excalidraw.md");
				if (fileInVault && isMarkdown) newFiles.push(fileInVault);
			}
		}
		return newFiles;
	}

	/**
	 * Get the filepath of a file shared in a dataview field and return the file if it exists in the vault
	 * @param {Link | string} source
	 * @param {Link | string} field
	 * @param {PropertiesConversion} frontmatterSourceFile
	 * @return {TFile}
	 */

	getImageByPath(
		source: Link | string,
		field: Link | string,
		frontmatterSourceFile: PropertiesConversion
	): TFile | undefined {
		if (field.constructor.name === "Link") {
			// @ts-ignore
			field = field.path;
		}
		if (source.constructor.name === "Link") {
			// @ts-ignore
			source = source.path;
		}
		// @ts-ignore
		const imageLink = this.metadataCache.getFirstLinkpathDest(field, source);
		if (imageLink) {
			return this.imageSharedOrNote(imageLink as TFile, frontmatterSourceFile) as TFile;
		}
		return undefined;
	}

	/**
	 * Check if the file is a image or a note based on the extension
	 * Check if the sharing is allowing based on the frontmatter
	 * @param {TFile} file
	 * @param {PropertiesConversion} settingsConversion
	 * @return {null | TFile}
	 * @private
	 */

	private imageSharedOrNote(
		file: TFile,
		settingsConversion: PropertiesConversion,
		fromWhat: "embed" | "link" = "embed"
	): undefined | TFile {
		const transferImage =
			fromWhat === "embed"
				? settingsConversion.attachment
				: settingsConversion.includeLinks;
		const transferEmbeds =
			fromWhat === "embed" ? settingsConversion.embed : settingsConversion.includeLinks;
		if (
			(isAttachment(file.name, this.settings.embed.unHandledObsidianExt) &&
				transferImage) ||
			(transferEmbeds && file.extension === "md")
		) {
			return file;
		}
		return undefined;
	}

	/**
	 * Get all files linked to a metadata field, based on the frontmatter or dataview
	 * if frontmatter, get the path of the file and check if it exists in the vault
	 * @param {TFile} file
	 * @param {TFile[]} embedFiles
	 * @param {FrontMatterCache} frontmatterSourceFile
	 * @param {PropertiesConversion} frontmatterSettings
	 * @return {Promise<TFile[]>}
	 */
	async getMetadataLinks(
		file: TFile,
		embedFiles: TFile[],
		frontmatterSettings: PropertiesConversion
	): Promise<TFile[]> {
		for (const field of this.settings.embed.keySendFile) {
			const frontmatterLink = this.metadataCache.getFileCache(file)?.frontmatterLinks;
			const imageLinkPath: string[] = [];
			if (frontmatterLink) {
				frontmatterLink.forEach((link) => {
					const fieldRegex = new RegExp(`${field}(\\.\\d+)?`, "g");
					if (link.key.match(fieldRegex)) {
						imageLinkPath.push(link.link);
					}
				});
			}
			for (const path of imageLinkPath) {
				const imageLink =
					this.metadataCache.getFirstLinkpathDest(path, file.path) ??
					this.vault.getAbstractFileByPath(path);
				if (imageLink instanceof TFile && !embedFiles.includes(imageLink)) {
					embedFiles.push(
						this.imageSharedOrNote(imageLink, frontmatterSettings) as TFile
					);
				}
			}
		}

		embedFiles = [...new Set(embedFiles)].filter((x) => x != null);
		if (this.plugin.app.plugins.enabledPlugins.has("dataview")) {
			const dvApi = getAPI();
			if (!dvApi) return embedFiles;
			const dataviewMetadata = dvApi.page(file.path);
			if (!dataviewMetadata) return embedFiles;
			for (const field of this.settings.embed.keySendFile) {
				const fieldValue = dataviewMetadata[field];
				if (fieldValue != undefined) {
					if (fieldValue.constructor.name === "Array") {
						// @ts-ignore
						for (const value of fieldValue) {
							const path = this.getImageByPath(file.path, value, frontmatterSettings);
							if (path) embedFiles.push(path);
						}
					} else {
						const path = this.getImageByPath(
							file.path,
							fieldValue.toString() as string,
							frontmatterSettings
						);
						if (path) embedFiles.push(path);
					}
				}
			}
		}

		return [...new Set(embedFiles)].filter((x) => x != null);
	}

	/**
	 * Get all edited file since the last sync, compared to the github repo
	 * @param {ConvertedLink[]} allFileWithPath - all shared file with their path
	 * @param {GithubRepo[]} githubSharedFiles - all file in the github repo
	 * @param {TFile[]} newFiles - new file to add to the repo
	 * @return {Promise<TFile[]>} newFiles - File to add in the repo
	 */

	async getEditedFiles(
		allFileWithPath: ConvertedLink[],
		githubSharedFiles: GithubRepo[],
		newFiles: TFile[]
	): Promise<TFile[]> {
		for (const file of allFileWithPath) {
			if (githubSharedFiles.some((x) => x.file === file.converted.trim())) {
				const githubSharedFile = githubSharedFiles.find(
					(x) => x.file === file.converted.trim()
				);
				if (!githubSharedFile) continue;
				const repoEditedTime = await this.getLastEditedTimeRepo(githubSharedFile);
				const fileInVault = this.vault.getAbstractFileByPath(file.real.path.trim());
				const isMarkdown =
					fileInVault instanceof TFile &&
					fileInVault?.extension === "md" &&
					!fileInVault?.name.endsWith(".excalidraw.md");
				if (fileInVault && isMarkdown) {
					const vaultEditedTime = new Date(fileInVault.stat.mtime);
					if (repoEditedTime && vaultEditedTime > repoEditedTime) {
						this.console.logs(
							{},
							`edited file : ${fileInVault.path} / ${vaultEditedTime} vs ${repoEditedTime}`
						);
						newFiles.push(fileInVault);
					}
				}
			}
		}
		return newFiles;
	}
}
