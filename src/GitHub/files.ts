import { Octokit } from "@octokit/core";
import {FrontMatterCache, TFile, TFolder} from "obsidian";
import { getAPI, Link } from "obsidian-dataview";

import {
	getImageLinkOptions,
	getReceiptFolder,
} from "../conversion/file_path";
import GithubPublisher from "../main";
import {
	ConvertedLink,
	FrontmatterConvert,
	GithubRepo,
	LinkedNotes,
	RepoFrontmatter, Repository,
} from "../settings/interface";
import {getRepoFrontmatter, logs} from "../utils";
import { isAttachment, isShared } from "../utils/data_validation_test";
import Publisher from "./upload";

export class FilesManagement extends Publisher {
	octokit: Octokit;
	plugin: GithubPublisher;

	/**
	 * @param {Octokit} octokit The octokit instance
	 * @param {GitHubPublisherSettings} plugin The plugin
	 */

	constructor(
		octokit: Octokit,
		plugin: GithubPublisher
	) {
		super(octokit, plugin);
		this.vault = plugin.app.vault;
		this.metadataCache = plugin.app.metadataCache;
		this.settings = plugin.settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	/**
	 * Get all shared files in the vault, by scanning the frontmatter and the state of the shareKey
	 * @return {TFile[]} The shared files
	 */

	getSharedFiles(repo: Repository | null): TFile[] {
		const files = this.vault.getMarkdownFiles();
		const shared_File: TFile[] = [];
		for (const file of files) {
			try {
				const frontMatter = this.metadataCache.getCache(
					file.path
				)?.frontmatter;
				if (isShared(frontMatter, this.settings, file, repo)) {
					shared_File.push(file);
				}
			} catch(e) {
				logs({settings: this.settings, e: true}, e);
			}
		}
		return shared_File;
	}

	/**
	 * Get all shared files in a specified TFolder
	 * @param {TFolder} folder The folder to scan
	 * @param {Repository | null} repo The repository
	 * @return {TFile[]} The shared files
	 */
	getSharedFileOfFolder(folder: TFolder, repo: Repository | null): TFile[] {
		const files: TFile[] = [];
		for (const file of folder.children) {
			if (file instanceof TFolder) {
				files.push(... this.getSharedFileOfFolder(file, repo));
			} else {
				try {
					const frontMatter = this.metadataCache.getCache(file.path)?.frontmatter;
					if (isShared(frontMatter, this.settings, file as TFile, repo)) {
						files.push(file as TFile);
					}
				} catch(e) {
					logs({settings: this.settings, e: true}, e);
				}
			}
		}

		logs({settings: this.settings}, files);
		return files;
	}

	/**
	 * Get all shared file in the vault, but create an ConvertedLink object with the real path and the converted path
	 * @return {ConvertedLink[]} The shared files
	 */

	getAllFileWithPath(repo: Repository | null): ConvertedLink[] {
		const files = this.vault.getFiles();
		const allFileWithPath: ConvertedLink[] = [];
		for (const file of files) {
			if (isAttachment(file.extension)) {
				const filepath = getImageLinkOptions(file, this.settings, null);
				allFileWithPath.push({
					converted: filepath,
					real: file.path,
				});
			} else if (file.extension == "md") {
				const frontMatter = this.metadataCache.getCache(file.path)?.frontmatter;
				if (isShared(frontMatter, this.settings, file, repo)) {
					const filepath = getReceiptFolder(file, this.settings, repo, this.plugin.app);
					allFileWithPath.push({
						converted: filepath,
						real: file.path,
						repoFrontmatter: getRepoFrontmatter(
							this.settings,
							repo,
							frontMatter
						),
					});
				}
			}
		}
		return allFileWithPath;
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
						let altText = image.displayText !== imageLink.path.replace(".md", "") ? image.displayText : imageLink.basename;
						let frontmatterDestinationFilePath;

						if (this.settings.upload.frontmatterTitle.enable) {
							const frontmatter = this.metadataCache.getCache(imageLink.path)?.frontmatter;

							/**
							 * In case there's a frontmatter configuration, pass along
							 * `filename` so we can later use that to convert wikilinks.
							 */
							if (frontmatter && frontmatter[this.settings.upload.frontmatterTitle.key]) {
								frontmatterDestinationFilePath = frontmatter[this.settings.upload.frontmatterTitle.key];
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
							}
						};
						if (image.link.includes("#")) {
							thisLinkedFile.anchor = "#" + image.link.split("#")[1];
						}
						linkedFiles.push(thisLinkedFile);
					}
				} catch (e) {
					logs({settings: this.settings}, e);
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
						let altText = embedCache.original.match(/\[.*\]\(.*\)/) ? embedCache.original!.match(/\[(.*)\]/)![1] : embedCache.displayText !== linkedFile.path.replace(".md", "") ? embedCache.displayText : linkedFile.basename;
						let frontmatterDestinationFilePath;

						if (this.settings.upload.frontmatterTitle.enable) {
							const frontmatter = this.metadataCache.getCache(linkedFile.path)?.frontmatter;

							/**
							 * In case there's a frontmatter configuration, pass along
							 * `filename` so we can later use that to convert wikilinks.
							 */
							if (frontmatter && frontmatter[this.settings.upload.frontmatterTitle.key]) {
								frontmatterDestinationFilePath = frontmatter[this.settings.upload.frontmatterTitle.key];
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
					logs(
						{settings: this.settings, e: true},
						`Error with this links : ${embedCache.link}`,
						e
					);
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
	 * @param {FrontmatterConvert} frontmatterSourceFile frontmatter of the file
	 * @return {TFile[]} the file embedded & shared in form of an array of TFile
	 */
	getSharedEmbed(
		file: TFile,
		frontmatterSourceFile: FrontmatterConvert
	): TFile[] {
		const embedCaches = this.metadataCache.getCache(file.path)?.embeds;
		const imageList: TFile[] = [];

		if (embedCaches != undefined) {
			for (const embed of embedCaches) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						embed.link.replace(/#(.*)/, ""),
						file.path
					);
					if (imageLink) imageList.push(this.imageSharedOrNote(imageLink as TFile, frontmatterSourceFile) as TFile);
				} catch (e) {
					logs(
						{settings: this.settings, e: true},
						`Error with this file : ${embed.displayText}`,
						e
					);
				}
			}
			return [...new Set(imageList)].filter((x) => x !== null);
		}
		return [];
	}
	/**
	 * Get the last time the file from the github Repo was edited
	 * @param {GithubRepo} githubRepo
	 * @return {Promise<Date>}
	 */

	async getLastEditedTimeRepo(
		githubRepo: GithubRepo,
	): Promise<Date | null> {
		const commits = await this.octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner: this.settings.github.user,
				repo: this.settings.github.repo,
				path: githubRepo.file,
			}
		);
		const lastCommittedFile = commits.data[0];
		if (!lastCommittedFile || !lastCommittedFile.commit || !lastCommittedFile.commit.committer || !lastCommittedFile.commit.committer.date) {
			return null;
		}
		return new Date(lastCommittedFile.commit.committer.date);
	}

	/**
	 * Get all file from the github Repo
	 */

	async getAllFileFromRepo(
		branchToScan: string,
		repo: RepoFrontmatter
	): Promise<GithubRepo[]> {
		const filesInRepo: GithubRepo[] = [];
		try {
			const repoContents = await this.octokit.request(
				"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
				{
					owner: repo.owner,
					repo: repo.repo,
					tree_sha: branchToScan,
					recursive: "true",
				}
			);

			if (repoContents.status === 200) {
				const files = repoContents.data.tree;
				for (const file of files) {
					if (!file.path || !file.sha) continue;
					const basename = (name: string) =>
						/([^/\\.]*)(\..*)?$/.exec(name)![1]; //don't delete file starting with .
					if (
						file.type === "blob" &&
						basename(file.path).length > 0
					) {
						filesInRepo.push({
							file: file.path,
							sha: file.sha,
						});
					}
				}
			}
		} catch (e) {
			logs({settings: this.settings, e: true}, e);
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
		githubSharedFiles: GithubRepo[],
	): TFile[] {
		const newFiles: TFile[] = []; //new file : present in allFileswithPath but not in githubSharedFiles

		for (const file of allFileWithPath) {
			if (
				!githubSharedFiles.some((x) => x.file === file.converted.trim())
			) {
				//get TFile from file
				const fileInVault = this.vault.getAbstractFileByPath(
					file.real.trim()
				);
				if (
					fileInVault &&
					fileInVault instanceof TFile &&
					fileInVault.extension === "md"
				) {
					newFiles.push(fileInVault);
				}
			}
		}
		return newFiles;
	}

	/**
	 * Get the filepath of a file shared in a dataview field and return the file if it exists in the vault
	 * @param {Link | string} path
	 * @param {Link | string} field
	 * @param {FrontmatterConvert} frontmatterSourceFile
	 * @return {TFile}
	 */

	getImageByPath(
		path: Link | string,
		field: Link | string,
		frontmatterSourceFile: FrontmatterConvert
	): TFile | undefined {
		if (field.constructor.name === "Link") {
			// @ts-ignore
			field = field.path;
		}
		if (path.constructor.name === "Link") {
			// @ts-ignore
			path = path.path;
		}
		// @ts-ignore
		const imageLink = this.metadataCache.getFirstLinkpathDest(field, path);
		if (imageLink) {
			return this.imageSharedOrNote(imageLink as TFile, frontmatterSourceFile) as TFile;
		}
		return undefined;
	}

	/**
	 * Check if the file is a image or a note based on the extension
	 * Check if the sharing is allowing based on the frontmatter
	 * @param {TFile} file
	 * @param {FrontmatterConvert} settingsConversion
	 * @return {null | TFile}
	 * @private
	 */

	private imageSharedOrNote(
		file: TFile,
		settingsConversion: FrontmatterConvert
	): undefined | TFile {
		const transferImage = settingsConversion.attachment;
		const transferEmbeds = settingsConversion.embed;
		if (
			(isAttachment(file.extension) && transferImage) ||
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
	 * @param {FrontmatterConvert} frontmatterSettings
	 * @return {Promise<TFile[]>}
	 */
	async getMetadataLinks(
		file: TFile,
		embedFiles: TFile[],
		frontmatterSourceFile: FrontMatterCache | undefined | null,
		frontmatterSettings: FrontmatterConvert
	): Promise<TFile[]> {
		for (const field of this.settings.embed.keySendFile) {
			if (frontmatterSourceFile&&frontmatterSourceFile[field] != undefined) {
				const imageLink = this.metadataCache.getFirstLinkpathDest(
					frontmatterSourceFile[field],
					file.path
				) ?? this.vault.getAbstractFileByPath(frontmatterSourceFile[field]);
				if (imageLink !== null) {
					embedFiles.push(
						this.imageSharedOrNote(file, frontmatterSettings) as TFile
					);
				}
			}
		}
		// @ts-ignore
		if (this.plugin.app.plugins.enabledPlugins.has("dataview")) {
			const dvApi = getAPI();
			if (!dvApi) return embedFiles;
			const dataviewMetadata = await dvApi.page(file.path);
			if (!dataviewMetadata) return embedFiles;
			for (const field of this.settings.embed.keySendFile) {
				const fieldValue = dataviewMetadata[field];

				if (fieldValue != undefined) {
					if (fieldValue.constructor.name === "Array") {
						for (const value of fieldValue) {
							const path = this.getImageByPath(
								value,
								fieldValue,
								frontmatterSettings
							);
							if (path) embedFiles.push(path);
						}
					} else {
						const path = this.getImageByPath(
							fieldValue,
							fieldValue,
							frontmatterSettings
						);
						if (path)
							embedFiles.push(path);
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
	 * @param {Vault} vault - vault
	 * @param {TFile[]} newFiles - new file to add to the repo
	 * @return {Promise<TFile[]>} newFiles - File to add in the repo
	 */

	async getEditedFiles(
		allFileWithPath: ConvertedLink[],
		githubSharedFiles: GithubRepo[],
		newFiles: TFile[]
	): Promise<TFile[]> {
		for (const file of allFileWithPath) {
			if (
				githubSharedFiles.some((x) => x.file === file.converted.trim())
			) {
				const githubSharedFile = githubSharedFiles.find(
					(x) => x.file === file.converted.trim()
				);
				if (!githubSharedFile) continue;
				const repoEditedTime = await this.getLastEditedTimeRepo(githubSharedFile);
				const fileInVault = this.vault.getAbstractFileByPath(
					file.real.trim()
				);
				if (
					fileInVault &&
					fileInVault instanceof TFile &&
					fileInVault.extension === "md"
				) {
					const vaultEditedTime = new Date(fileInVault.stat.mtime);
					if (repoEditedTime && vaultEditedTime > repoEditedTime) {
						logs(
							{settings: this.settings},
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
