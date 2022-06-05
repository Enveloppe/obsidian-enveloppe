import {
	arrayBufferToBase64,
	MetadataCache,
	Notice,
	TFile,
	Vault
} from "obsidian";
import { MkdocsPublicationSettings } from "../settings/interface";
import { GetFiles } from "./getFiles";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";
import {deleteFromGithub} from "./delete"
import {
	convertLinkCitation,
	convertWikilinks,
	getReceiptFolder
} from "../utils/utils";

export default class MkdocsPublish {
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

	async publish(file: TFile, one_file = false, ref = "main") {
		const shareFiles = new GetFiles(this.vault, this.metadataCache, this.settings, this.octokit);
		const sharedKey = this.settings.shareKey;
		const frontmatter = this.metadataCache.getCache(file.path).frontmatter;
		if (
			!frontmatter ||
			!frontmatter[sharedKey] ||
			shareFiles.checkExcludedFolder(file) ||
			file.extension !== "md"
		) {
			return false;
		}
		try {
			let text = await this.vault.cachedRead(file);
			const linkedImage = shareFiles.getLinkedImage(file);
			const linkedFiles = shareFiles.getLinkedFiles(file);
			text = convertLinkCitation(text, this.settings, linkedFiles)
			text = convertWikilinks(text, this.settings, linkedFiles);
			const path = getReceiptFolder(file, this.settings)
			await this.uploadText(file.path, text, path, file.name, ref);
			if (linkedImage.length > 0 && this.settings.transferEmbedded) {
				for (const image of linkedImage) {
					await this.uploadImage(image, ref);
				}
			}
			if (one_file) {
				await this.uploadFolder(ref);
				await deleteFromGithub(true, this.settings, this.octokit, ref, shareFiles);
			}
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
	async uploadFolder(ref = "main") {
		const shareFiles = new GetFiles(this.vault, this.metadataCache, this.settings, this.octokit);
		const folder = shareFiles.getSharedFiles();
		if (folder.length > 0) {
			const publishedFiles = folder.map((file) => file.name);
			const publishedFilesText =
				JSON.stringify(publishedFiles).toString();
			const vaultPublisherJSON =
				this.settings.folderDefaultName.length > 0
					? `${this.settings.folderDefaultName}/vault_published.json`
					: `vault_published.json`;
			await this.uploadText(
				"vault_published.json",
				publishedFilesText,
				vaultPublisherJSON, "", ref
			);
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
		let path = this.settings.folderDefaultName + "/" + imageFile.name;
		if (this.settings.defaultImageFolder.length > 0) {
			path = this.settings.defaultImageFolder + "/" + imageFile.name;
		}
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

