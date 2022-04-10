//Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {getLinkpath, MetadataCache, Vault, TFile, Notice } from 'obsidian';
import {
	mkdocsSettingsTab,
	mkdocsPublicationSettings,
	DEFAULT_SETTINGS,
} from "./settings";
import { Octokit } from "@octokit/core";
import {Base64} from "js-base64";

export interface IMkdocsPublish {
	publish(file:TFile): any,
	getSharedFile(): any,
	getLinkedImage(file:TFile): any,
}

export default class MkdocsPublish {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: mkdocsPublicationSettings;

	constructor(vault: Vault, metadataCache: MetadataCache, settings: mkdocsPublicationSettings) {
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
	}

	async getSharedFiles() {
		const files = this.vault.getMarkdownFiles();
		const shared_File = [];
		const sharedkey = this.settings.shareKey;
		for (const file of files) {
			try {
				const frontMatter = this.metadataCache.getCache(file.path).frontmatter;
				if (frontMatter && frontMatter[sharedkey] === true) {
					shared_File.push(file);
				}
			} catch {
				//ignore
			}
		}
		return shared_File;
	}

	async getLinkedImage(file: TFile) {
		const embed_files = app.metadataCache.getCache(file.path).embeds;
		let image_list=[];
		for (const embed_file of embed_files) {
			if (embed_file.link.endsWith(".png") || embed_file.link.endsWith(".jpg") || embed_file.link.endsWith(".jpeg") || embed_file.link.endsWith(".gif") || embed_file.link.endsWith(".svg") || embed_file.link.endsWith(".bmp")) {
				image_list.push(embed_file.link);
			}
		}
		return image_list;
	}

	async publish(file: TFile) {
		const sharedkey = this.settings.shareKey;
		const frontmatter = this.metadataCache.getCache(file.path).frontmatter
		if (!frontmatter || !frontmatter[sharedkey]) {
			return false;
		}
		try {
			const text = await this.vault.cachedRead(file);
			const linked_image = await this.getLinkedImage(file);
			await this.uploadText(file.path, text);
			if (linked_image) {
				for (const image of linked_image) {
					const Tfcontent = this.vault.getAbstractFileByPath(image);
					// I block here : how I can get image content ? How I can push image to github using API ?
				}
			}
			return true;
		} catch {
			return false;
		}
	}


	async uploadText(filePath: string, text: string) {
		if (!this.settings.githubRepo) {
			new Notice("Config error : You need to define a github repo in the plugin settings");
			throw {};
		}
		if (!this.settings.githubName) {
			new Notice("Config error : You need to define your github username in the plugin settings");
			throw {};
		}
		const octokit = new Octokit({
			auth: this.settings.GhToken
		});
		const contentBase64 = Base64.encode(text);
		const pathLib = require('path')
		const path = `source/${pathLib.basename(filePath)}`;
		const payload = {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
			path,
			message: `Adding ${pathLib.basename(filePath)}`,
			content: contentBase64,
			sha: '',
		};
		try {
			const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
				owner: this.settings.githubName,
				repo: this.settings.githubRepo,
				path
			});
			if (response.status === 200 && response.data.type === "file") {
				payload.sha = response.data.sha;
			}
		} catch (e) {
			console.log(e)
		}
		payload.message = `Update note ${pathLib.basename(filePath)}`;
		await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', payload);
	}
}
