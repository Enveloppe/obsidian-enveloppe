// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {FrontMatterCache, MetadataCache, TFile, Vault} from "obsidian";
import {
	ConvertedLink,
	GithubRepo,
	LinkedNotes,
	GitHubPublisherSettings,
	frontmatterConvert
} from "../settings/interface";
import {Octokit} from "@octokit/core";
import {getImageLinkOptions, getReceiptFolder} from "../contents_conversion/filePathConvertor";
import Publisher from "./upload";
import GithubPublisher from "../main";
import {noticeLog} from "plugin/src/utils";
import {getAPI, Link} from "obsidian-dataview";

export class FilesManagement extends Publisher {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	plugin: GithubPublisher
	
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
	
	getSharedFiles(): TFile[] {
		const files = this.vault.getMarkdownFiles();
		const shared_File: TFile[] = [];
		const sharedkey = this.settings.shareKey;
		for (const file of files) {
			try {
				const frontMatter = this.metadataCache.getCache(file.path).frontmatter;
				if (frontMatter && frontMatter[sharedkey] === true) {
					shared_File.push(file);
				}
			} catch {
				// ignore
			}
		}
		return shared_File;
	}
	
	getAllFileWithPath(): ConvertedLink[] {
		const files = this.vault.getFiles();
		const allFileWithPath:ConvertedLink[] = [];
		const shareKey = this.settings.shareKey;
		for (const file of files) {
			const fileExtension = file.extension;
			if (fileExtension.match(/(png|jpe?g|gif|bmp|svg|mp[34]|webm|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf)$/i)) {
				const filepath = getImageLinkOptions(file, this.settings, null);
				allFileWithPath.push({
					converted: filepath,
					real: file.path
				});
			} else if (file.extension == "md") {
				const frontMatter = this.metadataCache.getCache(
					file.path
				).frontmatter;
				if (frontMatter && frontMatter[shareKey] === true) {
					const filepath = getReceiptFolder(file, this.settings, this.metadataCache, this.vault);
					allFileWithPath.push({
						converted: filepath,
						real: file.path
					});
				}
			}
		}
		return allFileWithPath;
	}
	
	getLinkedByEmbedding(file: TFile):LinkedNotes[] {
		/**
		 * Create a database with every internal links and embeded image and files
		 * Used for the links conversion (for markdown links and receipt folder)
		 * @param file: the source file
		 * @return linkedFiles: array of linked files
		 */
		const linkedFiles:LinkedNotes[] = this.getLinkedFiles(file);
		const imageEmbedded = this.metadataCache.getFileCache(file).embeds;
		if (imageEmbedded != undefined) {
			for (const image of imageEmbedded) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(image.link, file.path)
					if (imageLink !== null) {
						if (imageLink.extension === 'md') {
							const checkFrontmatter = this.metadataCache.getCache(imageLink.path).frontmatter;
							if (checkFrontmatter && checkFrontmatter[this.settings.shareKey] === true) {
								linkedFiles.push({
									linked: imageLink, //TFile found
									linkFrom: image.link, //path of the founded file
									altText: image.displayText //alt text if exists, filename otherwise
								})
							}
						} else {
							linkedFiles.push({
								linked: imageLink, //TFile found
								linkFrom: image.link, //path of the founded file
								altText: image.displayText //alt text if exists, filename otherwise
							})
						}
					}
				} catch (e) {
					// ignore error
				}
			}
		}
		return [...new Set(linkedFiles)];
	}
	
	getLinkedFiles(file: TFile): LinkedNotes[] {
		/**
		 * Create an objet of all files embedded in the shared files
		 * Used during links conversion (for markdown links and receipt folder)
		 * @param file: The file shared
		 * @return the file linked (TFile), the path to it, and the alt text if exists
		 */
		const embedCaches = this.metadataCache.getCache(file.path).links;
		const embedList:LinkedNotes[] = [];
		if (embedCaches != undefined) {
			for (const embedCache of embedCaches) {
				try {
					const linkedFile = this.metadataCache.getFirstLinkpathDest(
						embedCache.link,
						file.path
					);
					if (linkedFile) {
						embedList.push({
							linked: linkedFile,
							linkFrom: embedCache.link,
							altText: embedCache.displayText
						})
					}
				} catch (e) {
					noticeLog(e, this.settings)
					noticeLog("Error with this links : " + embedCache.link, this.settings);
				}
			}
			return [...new Set(embedList)];
		}
		return [];
	}

	
	getSharedEmbed(file: TFile, frontmatterSourceFile: frontmatterConvert):TFile[] {
		/*
		* Get all files embedded in the shared file
		* If the settings are true, allowing to publish the files (for attachments)
		* Markdown files attachments are always verified using the main publish function
		 */
		const embedCaches = this.metadataCache.getCache(file.path).embeds;
		const imageList:TFile[] = [];

		if (embedCaches != undefined) {
			for (const embed of embedCaches) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						embed.link,
						file.path
					);

					imageList.push(this.imageSharedOrNote(imageLink, frontmatterSourceFile));
				} catch (e) {
					noticeLog(e, this.settings)
					noticeLog("Error with this file : " + embed.displayText, this.settings);
				}
			}
			return [...new Set(imageList)].filter(x => x !== null);
		}
		return [];
	}
	
	checkExcludedFolder(file: TFile): boolean {
		const excludedFolder = this.settings.ExcludedFolder.split(",").filter(
			(x) => x != ""
		);
		if (excludedFolder.length > 0) {
			for (let i = 0; i < excludedFolder.length; i++) {
				if (file.path.contains(excludedFolder[i].trim())) {
					return true;
				}
			}
		}
		return false;
	}
	
	async getLastEditedTimeRepo(octokit: Octokit, githubRepo: GithubRepo, settings: GitHubPublisherSettings) {
		const commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
			owner: settings.githubName,
			repo: settings.githubRepo,
			path: githubRepo.file,
		})
		const lastCommittedFile = commits.data[0];
		return new Date(lastCommittedFile.commit.committer.date);
	}
	
	async getAllFileFromRepo(ref = "main", octokit: Octokit, settings: GitHubPublisherSettings):Promise<GithubRepo[]> {
		const filesInRepo:GithubRepo[] = [];
		try {
			const repoContents = await octokit.request(
				"GET" + " /repos/{owner}/{repo}/git/trees/{tree_sha}",
				{
					owner: settings.githubName,
					repo: settings.githubRepo,
					tree_sha: ref,
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
						basename(file.path).length > 0 &&
						basename(file.path) != 'vault_published'
					) {
						filesInRepo.push({
							file: file.path,
							sha: file.sha,
						});
					}
				}
			}
		} catch (e) {
			noticeLog(e, settings)
		}
		return filesInRepo;
	}
	
	getNewFiles(allFileWithPath:ConvertedLink[] , githubSharedFiles: GithubRepo[], vault: Vault): TFile[] {
		const newFiles:TFile[] = []; //new file : present in allFileswithPath but not in githubSharedFiles
		
		for (const file of allFileWithPath) {
			if (!githubSharedFiles.some((x) => x.file === file.converted.trim())) {
				//get TFile from file
				const fileInVault = vault.getAbstractFileByPath(file.real.trim())
				if (fileInVault && (fileInVault instanceof TFile) && (fileInVault.extension === 'md')) {
					newFiles.push(fileInVault);
				}
			}
		}
		return newFiles;
	}

	getImageByPath(path: Link | string, field: Link | string, frontmatterSourceFile: frontmatterConvert): TFile {
		if (field.constructor.name === 'Link') {
			// @ts-ignore
			field = field.path
		}
		if (path.constructor.name === 'Link') {
			// @ts-ignore
			path = path.path
		}
		// @ts-ignore
		const imageLink = this.metadataCache.getFirstLinkpathDest(field, path);
		if (imageLink !== null) {
			return this.imageSharedOrNote(imageLink, frontmatterSourceFile);
		}
		return null
	}

	private imageSharedOrNote(file: TFile, settingsConversion: frontmatterConvert) {
		const transferImage = settingsConversion.image;
		const transferEmbeds = settingsConversion.embed;
		if (
			(file.extension.match(/(png|jpe?g|gif|bmp|svg|mp[34]|webm|wav|m4a|ogg|3gp|flac|ogv|mov|mkv|pdf)/i)
			&& transferImage)
			|| (transferEmbeds && file.extension === 'md')
		) {
			return file
		}
		return null
	}

	async getMetadataLinks(file: TFile, embedFiles: TFile[], frontmatterSourceFile: FrontMatterCache, frontmatterSettings: frontmatterConvert) {
		for (const field of this.settings.metadataFileFields) {
			if (frontmatterSourceFile[field] != undefined) {
				const imageLink = this.metadataCache.getFirstLinkpathDest(
					frontmatterSourceFile[field],
					file.path
				);
				if (imageLink !== null) {
					embedFiles.push(this.imageSharedOrNote(file, frontmatterSettings));
				}
			}
		}
		// @ts-ignore
		if (this.plugin.app.plugins.enabledPlugins.has('dataview')) {
			const dvApi = getAPI();
			const dataviewMetadata = await dvApi.page(file.path)
			for (const field of this.settings.metadataFileFields) {
				const fieldValue = dataviewMetadata[field];

				if (fieldValue != undefined) {
					if (fieldValue.constructor.name === 'Array') {
						for (const value of fieldValue) {
							embedFiles.push(this.getImageByPath(value, fieldValue, frontmatterSettings))
						}
					}
					else {
						embedFiles.push(this.getImageByPath(fieldValue, fieldValue, frontmatterSettings))
					}
				}
			}
		}

		return [...new Set(embedFiles)].filter((x) => x != null);
	}
	
	async getEditedFiles(allFileWithPath:ConvertedLink[] , githubSharedFiles: GithubRepo[], vault: Vault, newFiles: TFile[]): Promise<TFile[]>{
		for (const file of allFileWithPath) {
			if (githubSharedFiles.some((x) => x.file === file.converted.trim())) {
				const githubSharedFile = githubSharedFiles.find((x) => x.file === file.converted.trim());
				const repoEditedTime = await this.getLastEditedTimeRepo(this.octokit, githubSharedFile, this.settings);
				const fileInVault = vault.getAbstractFileByPath(file.real.trim())
				if (fileInVault && (fileInVault instanceof TFile) && (fileInVault.extension === 'md')) {
					const vaultEditedTime = new Date(fileInVault.stat.mtime);
					if (vaultEditedTime > repoEditedTime) {
						noticeLog(`edited file : ${fileInVault.path} / ${vaultEditedTime} vs ${repoEditedTime}`, this.settings);
						newFiles.push(fileInVault);
					}
				}
			}
		}
		return newFiles;
	}
}

