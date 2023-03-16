import { FrontMatterCache, MetadataCache, TFile, Vault } from "obsidian";
import {
	ConvertedLink,
	GithubRepo,
	LinkedNotes,
	GitHubPublisherSettings,
	FrontmatterConvert,
	RepoFrontmatter,
} from "../settings/interface";
import { Octokit } from "@octokit/core";
import {
	getImageLinkOptions,
	getReceiptFolder,
} from "../conversion/filePathConvertor";
import Publisher from "./upload";
import GithubPublisher from "../main";
import { getRepoFrontmatter, noticeLog } from "plugin/src/utils";
import { isAttachment } from "../src/data_validation_test";
import { getAPI, Link } from "obsidian-dataview";

/**
 * Manage files in the repo and the vault.
 * @extends Publisher
 *
 * @method getSharedFiles - Get the shared files
 * @method getAllFileWithPath - Get all files with path
 * @method getLinkedByEmbedding - Get the linked files by embedding
 * @method getLinkedFiles - Get the linked files (linked by [[link]] or by []())
 * @method getSharedEmbed - Get the shared embed (share: true)
 * @method checkExcludedFolder - Check if the file is in an excluded folder
 * @method getLastEditedTimeRepo - Get the last edited time of a file in the repo (used for commands to send only edited file/new file)
 * @credits https://github.com/oleeskild/obsidian-digital-garden @oleeskild
 */

export class FilesManagement extends Publisher {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	plugin: GithubPublisher;

	/**
	 *
	 * @param {Vault} vault Obsidian Vault API
	 * @param {MetadataCache} metadataCache Obsidian MetadataCache API
	 * @param {GitHubPublisherSettings} settings The settings
	 * @param {Octokit} octokit The octokit instance
	 * @param {GitHubPublisherSettings} plugin The plugin
	 */

	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: GitHubPublisherSettings,
		octokit: Octokit,
		plugin: GithubPublisher
	) {
		super(vault, metadataCache, settings, octokit, plugin);
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	/**
	 * Get all shared files in the vault, by scanning the frontmatter and the state of the shareKey
	 * @return {TFile[]} The shared files
	 */

	getSharedFiles(): TFile[] {
		const files = this.vault.getMarkdownFiles();
		const shared_File: TFile[] = [];
		const sharedkey = this.settings.plugin.shareKey;
		for (const file of files) {
			try {
				const frontMatter = this.metadataCache.getCache(
					file.path
				).frontmatter;
				if (frontMatter && frontMatter[sharedkey] === true) {
					shared_File.push(file);
				}
			} catch {
				// ignore
			}
		}
		return shared_File;
	}

	/**
	 * Get all shared file in the vault, but create an ConvertedLink object with the real path and the converted path
	 * @return {ConvertedLink[]} The shared files
	 */

	getAllFileWithPath(): ConvertedLink[] {
		const files = this.vault.getFiles();
		const allFileWithPath: ConvertedLink[] = [];
		const shareKey = this.settings.plugin.shareKey;
		for (const file of files) {
			if (isAttachment(file.extension)) {
				const filepath = getImageLinkOptions(file, this.settings, null);
				allFileWithPath.push({
					converted: filepath,
					real: file.path,
				});
			} else if (file.extension == "md") {
				const frontMatter = this.metadataCache.getCache(
					file.path
				).frontmatter;
				if (frontMatter && frontMatter[shareKey] === true) {
					const filepath = getReceiptFolder(
						file,
						this.settings,
						this.metadataCache,
						this.vault
					);
					allFileWithPath.push({
						converted: filepath,
						real: file.path,
						repoFrontmatter: getRepoFrontmatter(
							this.settings,
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
		const imageEmbedded = this.metadataCache.getFileCache(file).embeds;
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
							const frontmatter = this.metadataCache.getCache(
								imageLink.path
							).frontmatter;

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
							altText: altText, //alt text if exists, filename otherwise
							destinationFilePath: frontmatterDestinationFilePath,
						};
						if (image.link.includes("#")) {
							thisLinkedFile.anchor = "#" + image.link.split("#")[1];
						}
						linkedFiles.push(thisLinkedFile);
					}
				} catch (e) {
					// ignore error
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
		const embedCaches = this.metadataCache.getCache(file.path).links;
		const embedList: LinkedNotes[] = [];
		if (embedCaches != undefined) {
			for (const embedCache of embedCaches) {
				try {
					const linkedFile = this.metadataCache.getFirstLinkpathDest(
						embedCache.link.replace(/#.*/, ""),
						file.path
					);
					if (linkedFile) {
						let altText = embedCache.displayText !== linkedFile.path.replace(".md", "") ? embedCache.displayText : linkedFile.basename;
						if (embedCache.original.match(/\[.*\]\(.*\)/)) {
							altText = embedCache.original.match(/\[(.*)\]/)[1];
						}
						let frontmatterDestinationFilePath;

						if (this.settings.upload.frontmatterTitle.enable) {
							const frontmatter = this.metadataCache.getCache(
								linkedFile.path
							).frontmatter;

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
							altText: altText,
							destinationFilePath: frontmatterDestinationFilePath,
						};
						if (embedCache.link.includes("#")) {
							thisEmbed.anchor = "#" + embedCache.link.split("#")[1];
						}
						embedList.push(thisEmbed);
					}
				} catch (e) {
					noticeLog(e, this.settings);
					noticeLog(
						"Error with this links : " + embedCache.link,
						this.settings
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
		const embedCaches = this.metadataCache.getCache(file.path).embeds;
		const imageList: TFile[] = [];

		if (embedCaches != undefined) {
			for (const embed of embedCaches) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						embed.link.replace(/#(.*)/, ""),
						file.path
					);

					imageList.push(
						this.imageSharedOrNote(imageLink, frontmatterSourceFile)
					);
				} catch (e) {
					noticeLog(e, this.settings);
					noticeLog(
						"Error with this file : " + embed.displayText,
						this.settings
					);
				}
			}
			return [...new Set(imageList)].filter((x) => x !== null);
		}
		return [];
	}

	/**
	 * Check if the file is in the excluded folder by checking the settings
	 * @param {TFile} file The file shared
	 * @return {boolean} true if the file is in the excluded folder
	 */
	checkExcludedFolder(file: TFile): boolean {
		const excludedFolder = this.settings.plugin.excludedFolder;
		if (excludedFolder.length > 0) {
			for (let i = 0; i < excludedFolder.length; i++) {
				const isRegex = excludedFolder[i].match(/^\/(.*)\/[igmsuy]*$/);
				const regex = isRegex
					? new RegExp(isRegex[1], isRegex[2])
					: null;
				if (regex && regex.test(file.path)) {
					return true;
				} else if (file.path.contains(excludedFolder[i].trim())) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Get the last time the file from the github Repo was edited
	 * @param {Octokit} octokit
	 * @param {GithubRepo} githubRepo
	 * @param {GitHubPublisherSettings} settings
	 * @return {Promise<Date>}
	 */

	async getLastEditedTimeRepo(
		octokit: Octokit,
		githubRepo: GithubRepo,
		settings: GitHubPublisherSettings
	): Promise<Date> {
		const commits = await octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner: settings.github.user,
				repo: settings.github.repo,
				path: githubRepo.file,
			}
		);
		const lastCommittedFile = commits.data[0];
		return new Date(lastCommittedFile.commit.committer.date);
	}

	/**
	 * Get all file from the github Repo
	 * @param {string} branchToScan the branch name to scan the files
	 * @param {Octokit} octokit the octokit instance
	 * @param {GitHubPublisherSettings} settings the settings
	 * @param {RepoFrontmatter} repo
	 * @return {Promise<GithubRepo[]>}
	 */

	async getAllFileFromRepo(
		branchToScan: string,
		octokit: Octokit,
		settings: GitHubPublisherSettings,
		repo: RepoFrontmatter
	): Promise<GithubRepo[]> {
		const filesInRepo: GithubRepo[] = [];
		try {
			const repoContents = await octokit.request(
				"GET" + " /repos/{owner}/{repo}/git/trees/{tree_sha}",
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
					const basename = (name: string) =>
						/([^/\\.]*)(\..*)?$/.exec(name)[1]; //don't delete file starting with .
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
			noticeLog(e, settings);
		}
		return filesInRepo;
	}

	/**
	 * Compare the last edited time of the file in the github repo and the file in the vault
	 * Always push in the list if the file doesn't exist in the github repo
	 * @param {ConvertedLink[]} allFileWithPath
	 * @param {GithubRepo[]} githubSharedFiles
	 * @param {Vault} vault
	 * @return {TFile[]}
	 */

	getNewFiles(
		allFileWithPath: ConvertedLink[],
		githubSharedFiles: GithubRepo[],
		vault: Vault
	): TFile[] {
		const newFiles: TFile[] = []; //new file : present in allFileswithPath but not in githubSharedFiles

		for (const file of allFileWithPath) {
			if (
				!githubSharedFiles.some((x) => x.file === file.converted.trim())
			) {
				//get TFile from file
				const fileInVault = vault.getAbstractFileByPath(
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
	): TFile {
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
		if (imageLink !== null) {
			return this.imageSharedOrNote(imageLink, frontmatterSourceFile);
		}
		return null;
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
	) {
		const transferImage = settingsConversion.attachment;
		const transferEmbeds = settingsConversion.embed;
		if (
			(isAttachment(file.extension) && transferImage) ||
			(transferEmbeds && file.extension === "md")
		) {
			return file;
		}
		return null;
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
		frontmatterSourceFile: FrontMatterCache,
		frontmatterSettings: FrontmatterConvert
	) {
		for (const field of this.settings.embed.keySendFile) {
			if (frontmatterSourceFile[field] != undefined) {
				const imageLink = this.metadataCache.getFirstLinkpathDest(
					frontmatterSourceFile[field],
					file.path
				);
				if (imageLink !== null) {
					embedFiles.push(
						this.imageSharedOrNote(file, frontmatterSettings)
					);
				}
			}
		}
		// @ts-ignore
		if (this.plugin.app.plugins.enabledPlugins.has("dataview")) {
			const dvApi = getAPI();
			const dataviewMetadata = await dvApi.page(file.path);
			for (const field of this.settings.embed.keySendFile) {
				const fieldValue = dataviewMetadata[field];

				if (fieldValue != undefined) {
					if (fieldValue.constructor.name === "Array") {
						for (const value of fieldValue) {
							embedFiles.push(
								this.getImageByPath(
									value,
									fieldValue,
									frontmatterSettings
								)
							);
						}
					} else {
						embedFiles.push(
							this.getImageByPath(
								fieldValue,
								fieldValue,
								frontmatterSettings
							)
						);
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
		vault: Vault,
		newFiles: TFile[]
	): Promise<TFile[]> {
		for (const file of allFileWithPath) {
			if (
				githubSharedFiles.some((x) => x.file === file.converted.trim())
			) {
				const githubSharedFile = githubSharedFiles.find(
					(x) => x.file === file.converted.trim()
				);
				const repoEditedTime = await this.getLastEditedTimeRepo(
					this.octokit,
					githubSharedFile,
					this.settings
				);
				const fileInVault = vault.getAbstractFileByPath(
					file.real.trim()
				);
				if (
					fileInVault &&
					fileInVault instanceof TFile &&
					fileInVault.extension === "md"
				) {
					const vaultEditedTime = new Date(fileInVault.stat.mtime);
					if (vaultEditedTime > repoEditedTime) {
						noticeLog(
							`edited file : ${fileInVault.path} / ${vaultEditedTime} vs ${repoEditedTime}`,
							this.settings
						);
						newFiles.push(fileInVault);
					}
				}
			}
		}
		return newFiles;
	}
}
