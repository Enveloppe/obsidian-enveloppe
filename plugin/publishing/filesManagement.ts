// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {MetadataCache, TFile, Vault} from "obsidian";
import {ConvertedLink, GithubRepo, LinkedNotes, GitHubPublisherSettings} from "../settings/interface";
import {Octokit} from "@octokit/core";
import {getImageLinkOptions, getReceiptFolder} from "../contents_conversion/filePathConvertor";
import MkdocsPublish from "./upload";
import MkdocsPublication from "../main";
import { noticeLog } from "plugin/src/utils";

export class FilesManagement extends MkdocsPublish {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	plugin: MkdocsPublication
	
	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: GitHubPublisherSettings,
		octokit: Octokit,
		plugin: MkdocsPublication
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
			if (fileExtension.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
				const filepath = getImageLinkOptions(file, this.settings);
				allFileWithPath.push({
					converted: filepath,
					real: file.path
				});
			} else if (file.extension == "md") {
				const frontMatter = this.metadataCache.getCache(
					file.path
				).frontmatter;
				if (frontMatter && frontMatter[shareKey] === true && file.extension === "md") {
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
	
	getLinkedImageAndFiles(file: TFile):LinkedNotes[] {
		/**
		 * Create a database with every internal links and embeded image and files 
		 * @param file: the source file
		 * @return linkedFiles: array of linked files
		 */
		const linkedFiles:LinkedNotes[] = this.getEmbedFiles(file);
		const imageEmbedded = this.metadataCache.getFileCache(file).embeds;
		if (imageEmbedded != undefined) {
			for (const image of imageEmbedded) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(image.link, file.path)
					const imageExt = imageLink.extension;
					if (imageExt.match(/(png|jpe?g|svg|bmp|gif|md)$/i)) {
						linkedFiles.push({
							linked: imageLink, //TFile found
							linkFrom: image.link, //path of the founded file
							altText: image.displayText //alt text if exists, filename otherwise
						})

					}
				} catch (e) {
					// ignore error
				}
			}
		}
		return linkedFiles;
	}
	
	getEmbedFiles(file: TFile): LinkedNotes[] {
		/**
		 * Create an objet of all files embedded in the shared files
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
						if (linkedFile.extension === 'md') {
							embedList.push({
								linked: linkedFile,
								linkFrom: embedCache.link,
								altText: embedCache.displayText
							})
						}
					}
				} catch (e) {
					noticeLog(e, this.settings)
					noticeLog("Error with this links : " + embedCache.link, this.settings);
				}
			}
			return embedList;
		}
		return [];
	}

	
	getEmbed(file: TFile):TFile[] {
		const embedCaches = this.metadataCache.getCache(file.path).embeds;
		const imageList:TFile[] = [];
		if (embedCaches != undefined) {
			for (const embed of embedCaches) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						embed.link,
						file.path
					);
					if (imageLink.name.match(/(png|jpe?g|svg|bmp|gif)$/i) && this.settings.embedImage) {
						imageList.push(imageLink);
					} else if (imageLink.extension==='md') {
						const sharedKey = this.settings.shareKey;
						const frontmatter = this.metadataCache.getFileCache(imageLink).frontmatter;
						if (
							frontmatter && frontmatter[sharedKey] &&
							!this.checkExcludedFolder(imageLink) && this.settings.embedNotes
						) {
							imageList.push(imageLink);
						}
					}
				} catch (e) {
					noticeLog(e, this.settings)
					noticeLog("Error with this file : " + embed.displayText, this.settings);
				}
			}
			return imageList;
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
