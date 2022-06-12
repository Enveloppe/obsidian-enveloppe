// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {
	MetadataCache,
	TFile,
	Vault,
} from "obsidian";
import { MkdocsPublicationSettings } from "../settings/interface";
import { Octokit } from "@octokit/core";
import {getReceiptFolder} from "../utils/utils";

export class GetFiles {
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

	getAllFileWithPath() {
		const files = this.vault.getFiles();
		const allFileWithPath = [];
		const shareKey = this.settings.shareKey;
		for (const file of files) {
			const fileExtension = file.extension;
			if (fileExtension.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
				const filepath =
					this.settings.defaultImageFolder.length > 0
						? this.settings.defaultImageFolder + "/" + file.path
						: this.settings.folderDefaultName.length > 0
							? this.settings.folderDefaultName + "/" + file.path
							: file.path;
				allFileWithPath.push(filepath);
			} else if (file.extension == "md") {
				const frontMatter = this.metadataCache.getCache(
					file.path
				).frontmatter;
				if (frontMatter && frontMatter[shareKey] === true) {
					const filepath = getReceiptFolder(file, this.settings, this.metadataCache);
					allFileWithPath.push(filepath);
				}
			}
		}
		return allFileWithPath;
	}

	getLinkedFiles(file: TFile): {linked: TFile, linkFrom: string, altText: string}[] {
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
								'linkFrom' : embedCache.link,
								'altText' : embedCache.displayText
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
					const imgExt = imageLink.extension;
					if (imgExt.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
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



}
