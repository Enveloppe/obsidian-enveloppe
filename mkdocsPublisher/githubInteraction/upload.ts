import {
	arrayBufferToBase64,
	MetadataCache,
	Notice,
	TFile,
	Vault
} from "obsidian";
import { MkdocsPublicationSettings } from "../settings/interface";
import { FilesManagement } from "./filesManagement";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";
import {deleteFromGithub} from "./delete"

import {
	convertLinkCitation,
	convertWikilinks
} from "../utils/convertText";

import {
	getReceiptFolder, getImageLinkOptions
} from "../utils/filePathConvertor";
import {ShareStatusBar} from "../utils/status_bar";
import MkdocsPublication from "../main";

export default class MkdocsPublish {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: MkdocsPublicationSettings;
	octokit: Octokit;
	plugin: MkdocsPublication;

	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: MkdocsPublicationSettings,
		octokit: Octokit,
		plugin: MkdocsPublication
	) {
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	async statusBarForEmbed(linkedFiles: TFile[], fileHistory:TFile[], ref="main", deepScan:boolean){
		console.log(fileHistory);
		if (linkedFiles.length > 0) {
			if (linkedFiles.length > 1) {
				const statusBarItems = this.plugin.addStatusBarItem();
				const statusBar = new ShareStatusBar(statusBarItems, linkedFiles.length);
				for (const image of linkedFiles) {
					if ((image.extension === 'md') && !(fileHistory.includes(image)) && deepScan) {
						fileHistory.push(image);
						await this.publish(image, false, ref, fileHistory, true);
					} else {
						await this.uploadImage(image, ref)
					}
					statusBar.increment();
				}
				statusBar.finish(8000);
			} else { // 1 one item to send
				const embed = linkedFiles[0];
				if (embed.extension === 'md' && !(fileHistory.includes(embed)) && deepScan) {
					fileHistory.push(embed);
					await this.publish(embed, false, ref, fileHistory, true);
				} else {
					await this.uploadImage(embed, ref);
				}
			}
		}
		return fileHistory;
	}


	async publish(file: TFile, autoclean = false, ref = "main", fileHistory:TFile[]=[], deepScan=false) {
		const shareFiles = new FilesManagement(this.vault, this.metadataCache, this.settings, this.octokit, this.plugin);
		const sharedKey = this.settings.shareKey;
		const frontmatter = this.metadataCache.getFileCache(file).frontmatter;
		if (
			!frontmatter ||
			!frontmatter[sharedKey] ||
			shareFiles.checkExcludedFolder(file) ||
			file.extension !== "md" || fileHistory.includes(file)
		) {
			return false;
		}
		try {
			let text = await this.vault.cachedRead(file);
			fileHistory.push(file)
			const embedFiles = shareFiles.getEmbed(file);
			const linkedFiles = shareFiles.getLinkedImageAndFiles(file);
			text = convertLinkCitation(text, this.settings, linkedFiles, this.metadataCache, file)
			text = convertWikilinks(text, this.settings, linkedFiles);
			const path = getReceiptFolder(file, this.settings, this.metadataCache)
			await this.uploadText(file.path, text, path, file.name, ref);
			await this.statusBarForEmbed(embedFiles, fileHistory, ref, deepScan);
			if (autoclean) {
				await deleteFromGithub(true, this.settings, this.octokit, ref, shareFiles);
			}
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
	
	async upload(filePath: string, content: string, path: string, title = "", ref = "main") {
		if (!this.settings.githubRepo) {
			new Notice(
				"Config error : You need to define a github repo in the plugin settings"
			);
			throw {};
		}
		if (!this.settings.githubName) {
			new Notice(
				"Config error : You need to define your github username in the plugin settings"
			);
			throw {};
		}
		const octokit = this.octokit;
		const payload = {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
			path,
			message: `Adding ${title}`,
			content: content,
			sha: "",
			branch: ref,
		};
		try {
			const response = await octokit.request(
				"GET /repos/{owner}/{repo}/contents/{path}",
				{
					owner: this.settings.githubName,
					repo: this.settings.githubRepo,
					path,
					ref: ref,
				}
			);
			// @ts-ignore
			if (response.status === 200 && response.data.type === "file") {
				// @ts-ignore
				payload.sha = response.data.sha;
			}
		} catch {
			console.log(
				"The 404 error is normal ! It means that the file does not exist yet. Don't worry ❤️."
			);
		}
		payload.message = `Update note ${title}`;
		await octokit.request(
			"PUT /repos/{owner}/{repo}/contents/{path}",
			payload
		);
	}

	async uploadImage(imageFile: TFile, ref = "main") {
		const imageBin = await this.vault.readBinary(imageFile);
		const image64 = arrayBufferToBase64(imageBin);
		const path = getImageLinkOptions(imageFile, this.settings);
		await this.upload(imageFile.path, image64, path, "", ref);
	}

	async uploadText(filePath: string, text: string, path: string, title = "", ref = "main") {
		try {
			const contentBase64 = Base64.encode(text).toString();
			await this.upload(filePath, contentBase64, path, title, ref);
		} catch (e) {
			console.error(e);
		}
	}
	
	async workflowGestion() {
		let finished = false;
		if (this.settings.workflowName.length === 0) {
			return false;
		} else {
			const octokit = this.octokit;
			await octokit.request(
				"POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
				{
					owner: this.settings.githubName,
					repo: this.settings.githubRepo,
					workflow_id: this.settings.workflowName,
					ref: "main",
				}
			);
			while (!finished) {
				await sleep(10000);
				const workflowGet = await octokit.request(
					"GET /repos/{owner}/{repo}/actions/runs",
					{
						owner: this.settings.githubName,
						repo: this.settings.githubRepo,
					}
				);
				if (workflowGet.data.workflow_runs.length > 0) {
					const build = workflowGet.data.workflow_runs.find(
						(run) =>
							run.name ===
							this.settings.workflowName.replace(".yml", "")
					);
					if (build.status === "completed") {
						finished = true;
						return true;
					}
				}
			}
		}
	}
}

