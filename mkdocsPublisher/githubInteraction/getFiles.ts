// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {
	MetadataCache,
	TFile,
	Vault,
} from "obsidian";
import { MkdocsPublicationSettings } from "../settings/interface";
import { Octokit } from "@octokit/core";

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

	getSharedFiles() {
		const files = this.vault.getMarkdownFiles();
		const shared_File = [];
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
				let filepath = this.settings.folderDefaultName.length > 0 ? this.settings.folderDefaultName + "/" + file.name : file.name;
				if (frontMatter && frontMatter[shareKey] === true) {
					if (this.settings.downloadedFolder === "yamlFrontmatter") {
						if (frontMatter[this.settings.yamlFolderKey]) {
							const category = frontMatter[this.settings.yamlFolderKey]
							let parentCatFolder = category.split('/').at(-1)
							parentCatFolder = parentCatFolder.length === 0 ? category.split('/').at(-2) : parentCatFolder
							const fileName = this.settings.folderNote && parentCatFolder === file.name ? 'index.md' : file.name
							filepath =
								this.settings.rootFolder.length > 0
									? this.settings.rootFolder + "/" + frontMatter[this.settings.yamlFolderKey] +
									"/" + fileName : fileName;
						}
					} else if (
						this.settings.downloadedFolder === "obsidianPath"
					) {
						const fileName = file.name.replace('.md', '') === file.parent.name && this.settings.folderNote ? 'index.md' : file.name
						filepath = this.settings.folderDefaultName.length > 0 ? this.settings.folderDefaultName + "/" + file.path.replace(file.name, fileName) : file.path.replace(file.name, fileName);
					}
					allFileWithPath.push(filepath);
				}
			}
		}
		return allFileWithPath;
	}

	getLinkedImage(file: TFile) {
		const embed_files = this.metadataCache.getCache(file.path).embeds;
		const image_list = [];
		if (embed_files != undefined) {
			for (const embed_file of embed_files) {
				try {
					const imageLink = this.metadataCache.getFirstLinkpathDest(
						embed_file.link,
						file.path
					);
					const imgExt = imageLink.extension;
					if (imgExt.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
						image_list.push(imageLink);
					}
				} catch (e) {
					console.log("Error with this image : " + embed_file);
				}
			}
			return image_list;
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
