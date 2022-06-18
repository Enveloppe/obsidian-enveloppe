// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {MetadataCache, TFile, Vault,} from "obsidian";
import {MkdocsPublicationSettings} from "../settings/interface";
import {Octokit} from "@octokit/core";
import {getImageLinkOptions, getReceiptFolder} from "../utils/filePathConvertor";
import MkdocsPublish from "./upload";

export class FilesManagement extends MkdocsPublish {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: MkdocsPublicationSettings;
	octokit: Octokit;
	
	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: MkdocsPublicationSettings,
		octokit: Octokit
	) {
		super(vault, metadataCache, settings, octokit);
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
		this.octokit = octokit;
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
	
	getAllFileWithPath() {
		const files = this.vault.getFiles();
		const allFileWithPath = [];
		const shareKey = this.settings.shareKey;
		for (const file of files) {
			const fileExtension = file.extension;
			if (fileExtension.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
				const filepath = getImageLinkOptions(file, this.settings);
				allFileWithPath.push({
					'converted': filepath,
					'real': file.path
				});
			} else if (file.extension == "md") {
				const frontMatter = this.metadataCache.getCache(
					file.path
				).frontmatter;
				if (frontMatter && frontMatter[shareKey] === true && file.extension === "md") {
					const filepath = getReceiptFolder(file, this.settings, this.metadataCache);
					allFileWithPath.push({
						'converted': filepath,
						'real': file.path
					});
				}
			}
		}
		return allFileWithPath;
	}
	
	getLinkedImageAndFiles(file: TFile) {
		const linkedFiles = this.getLinkedFiles(file);
		const imageEmbedded = this.metadataCache.getFileCache(file).embeds;
		if (imageEmbedded != undefined) {
			for (const image of imageEmbedded) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(image.link, file.path)
					const imageExt = imageLink.extension;
					if (imageExt.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
						linkedFiles.push({
							'linked': imageLink,
							'linkFrom': image.link,
							'altText': image.displayText
						})
					}
				} catch (e) {
					// ignore error
				}
			}
		}
		return linkedFiles;
	}
	
	getLinkedFiles(file: TFile): { linked: TFile, linkFrom: string, altText: string }[] {
		const embedCaches = this.metadataCache.getCache(file.path).links;
		const embedList = [];
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
								'linked': linkedFile,
								'linkFrom': embedCache.link,
								'altText': embedCache.displayText
							})
						}
					}
				} catch (e) {
					console.log(e)
					console.log("Error with this links : " + embedCache.link);
				}
			}
			return embedList;
		}
		return [];
	}
	
	getLinkedImage(file: TFile) {
		const embedCaches = this.metadataCache.getCache(file.path).embeds;
		const imageList = [];
		if (embedCaches != undefined) {
			for (const embedCach of embedCaches) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						embedCach.link,
						file.path
					);
					if (imageLink.name.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
						imageList.push(imageLink);
					}
				} catch (e) {
					console.log(e)
					console.log("Error with this image : " + embedCach.displayText);
				}
			}
			return imageList;
		}
		return [];
	}
	
	checkExcludedFolder(file: TFile) {
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
	
	async getLastEditedTimeRepo(octokit: Octokit, githubRepo: {file: string, sha: string}, settings: MkdocsPublicationSettings) {
		const commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
			owner: settings.githubName,
			repo: settings.githubRepo,
			path: githubRepo.file,
		})
		const lastCommittedFile = commits.data[0];
		return new Date(lastCommittedFile.commit.committer.date);
	}
	
	async getAllFileFromRepo(ref = "main", octokit: Octokit, settings: MkdocsPublicationSettings) {
		const filesInRepo = [];
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
			console.log(e)
		}
		return filesInRepo;
	}
	
	getNewFiles(allFileWithPath:{converted: string, real: string}[] , githubSharedFiles: { file: string, sha: string }[], vault: Vault): TFile[] {
		const newFiles = []; //new file : present in allFileswithPath but not in githubSharedFiles
		
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
	
	async getEditedFiles(allFileWithPath:{converted: string, real: string}[] , githubSharedFiles: { file: string, sha: string }[], vault: Vault, newFiles: TFile[]): Promise<TFile[]>{
		for (const file of allFileWithPath) {
			if (githubSharedFiles.some((x) => x.file === file.converted.trim())) {
				const githubSharedFile = githubSharedFiles.find((x) => x.file === file.converted.trim());
				const repoEditedTime = await this.getLastEditedTimeRepo(this.octokit, githubSharedFile, this.settings);
				const fileInVault = vault.getAbstractFileByPath(file.real.trim())
				if (fileInVault && (fileInVault instanceof TFile) && (fileInVault.extension === 'md')) {
					const vaultEditedTime = new Date(fileInVault.stat.mtime);
					if (vaultEditedTime > repoEditedTime) {
						console.log('edited file ', fileInVault.path, ' / ', vaultEditedTime, ' vs ', repoEditedTime)
						newFiles.push(fileInVault);
					}
				}
			}
		}
		return newFiles;
	}
}
