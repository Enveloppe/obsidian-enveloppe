// Credit : https://github.com/oleeskild/obsidian-digital-garden @oleeskild

import {
	MetadataCache,
	Notice,
	TFile,
	Vault,
	arrayBufferToBase64,
} from "obsidian";
import { MkdocsPublicationSettings } from "../settings/interface";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";

export default class MkdocsPublish {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: MkdocsPublicationSettings;

	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: MkdocsPublicationSettings
	) {
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
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
				let filepath =
					this.settings.folderDefaultName.length > 0
						? this.settings.folderDefaultName + "/" + file.path
						: file.path;
				if (frontMatter && frontMatter[shareKey] === true) {
					if (this.settings.downloadedFolder === "yamlFrontmatter") {
						if (frontMatter[this.settings.yamlFolderKey]) {
							filepath =
								this.settings.rootFolder.length > 0
									? this.settings.rootFolder + "/" + frontMatter[this.settings.yamlFolderKey] +
									"/" + file.name : file.name;
						}
					} else if (
						this.settings.downloadedFolder === "fixedFolder"
					) {
						filepath =
							this.settings.folderDefaultName.length > 0
								? this.settings.folderDefaultName + "/" + file.name : file.name;
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

	async publish(file: TFile, one_file = false) {
		const sharedKey = this.settings.shareKey;
		const frontmatter = this.metadataCache.getCache(file.path).frontmatter;
		if (
			!frontmatter ||
			!frontmatter[sharedKey] ||
			this.checkExcludedFolder(file) ||
			file.extension !== "md"
		) {
			return false;
		}
		try {
			const text = await this.vault.cachedRead(file);
			const linkedImage = this.getLinkedImage(file);
			let folderDefault = this.settings.folderDefaultName;
			if (folderDefault.length > 0) {
				folderDefault = folderDefault + "/";
			}
			let path = folderDefault + file.name;
			if (this.settings.downloadedFolder === "yamlFrontmatter") {
				let folderRoot = this.settings.rootFolder;
				if (folderRoot.length > 0) {
					folderRoot = folderRoot + "/";
				}
				if (frontmatter[this.settings.yamlFolderKey]) {
					path =
						folderRoot +
						frontmatter[this.settings.yamlFolderKey] +
						"/" +
						file.name;
				}
			} else if (this.settings.downloadedFolder === "obsidianPath") {
				path = folderDefault + file.path;
			}
			await this.uploadText(file.path, text, path, file.name);
			if (linkedImage.length > 0 && this.settings.transferEmbedded) {
				for (const image of linkedImage) {
					await this.uploadImage(image);
				}
			}
			if (one_file) {
				await this.uploadFolder();
				await this.deleteFromGithub(true);
			}
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async uploadFolder() {
		const folder = this.getSharedFiles();
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
				vaultPublisherJSON
			);
		}
	}

	async getAllFileFromRepo(octokit: Octokit) {
		const filesInRepo = [];
		try {
			const repoContents = await octokit.request(
				"GET" + " /repos/{owner}/{repo}/git/trees/{tree_sha}",
				{
					owner: this.settings.githubName,
					repo: this.settings.githubRepo,
					tree_sha: "main",
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
		} catch (e){
			console.log(e)
		}
		return filesInRepo;
	}

	async filterGithubFile(fileInRepo: { file: string; sha: string }[]) {
		const sharedFilesInRepo = [];
		for (const file of fileInRepo) {
			if (
				(this.settings.downloadedFolder === "yamlFrontmatter" &&
					this.settings.rootFolder.length === 0) ||
				this.settings.folderDefaultName.length === 0
			) {
				return false;
			}
			if (
				file.file.includes(this.settings.folderDefaultName) ||
				(this.settings.downloadedFolder === "yamlFrontmatter" &&
					file.file.includes(this.settings.rootFolder)) ||
				(this.settings.defaultImageFolder.length > 0 &&
					file.file.includes(this.settings.defaultImageFolder))
			) {
				sharedFilesInRepo.push(file);
			}
		}
		return sharedFilesInRepo;
	}

	async deleteFromGithub(silent = false) {
		const octokit = new Octokit({
			auth: this.settings.GhToken,
		});
		const filesInRepo = await this.filterGithubFile(
			await this.getAllFileFromRepo(octokit)
		);
		if (!filesInRepo) {
			let errorMsg = "";
			if (this.settings.folderDefaultName.length > 0) {
				if (this.settings.folderDefaultName.length > 0) {
					errorMsg =
						"You need to configure a" +
						" default folder name in the" +
						" settings to use this command.";
				} else if (
					this.settings.downloadedFolder === "yamlFrontmatter" &&
					this.settings.rootFolder
				) {
					errorMsg =
						"You need to configure a root folder in the settings to use this command.";
				} if (!silent) {
					new Notice("Error : " + errorMsg);
				}
			}
			return false;
		}
		const allSharedFiles = this.getAllFileWithPath();
		let deletedSuccess = 0;
		let deletedFailed = 0;
		for (const file of filesInRepo) {
			if (!allSharedFiles.includes(file.file)) {
				try {
					console.log('trying to delete file : ' + file.file);
					const reponse = await octokit.request(
						"DELETE" + " /repos/{owner}/{repo}/contents/{path}",
						{
							owner: this.settings.githubName,
							repo: this.settings.githubRepo,
							path: file.file,
							message: "Delete file",
							sha: file.sha,
						}
					);
					if (reponse.status === 200) {
						deletedSuccess++;
					} else {
						deletedFailed++;
					}
				} catch (e) {
					console.error(e);
				}
			}
		}
		let successMsg = 'No files have been deleted';
		let failedMsg = '';
		if (deletedSuccess > 0) {
			successMsg = `Successfully deleted ${deletedSuccess} files`
		}
		if (deletedFailed > 0) {
			failedMsg = `Failed to delete ${deletedFailed} files.`
		}
		if (!silent) {
			new Notice(successMsg + failedMsg)
		}
		return true;
	}

	async upload(filePath: string, content: string, path: string, title = "") {
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
		const octokit = new Octokit({
			auth: this.settings.GhToken,
		});

		const payload = {
			owner: this.settings.githubName,
			repo: this.settings.githubRepo,
			path,
			message: `Adding ${title}`,
			content: content,
			sha: "",
		};
		try {
			const response = await octokit.request(
				"GET /repos/{owner}/{repo}/contents/{path}",
				{
					owner: this.settings.githubName,
					repo: this.settings.githubRepo,
					path,
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

	async uploadImage(imageFile: TFile) {
		const imageBin = await this.vault.readBinary(imageFile);
		const image64 = arrayBufferToBase64(imageBin);
		let path = this.settings.folderDefaultName + "/" + imageFile.name;
		if (this.settings.defaultImageFolder.length > 0) {
			path = this.settings.defaultImageFolder + "/" + imageFile.name;
		}
		await this.upload(imageFile.path, image64, path);
	}

	async uploadText(filePath: string, text: string, path: string, title = "") {
		try {
			const contentBase64 = Base64.encode(text).toString();
			await this.upload(filePath, contentBase64, path, title);
		} catch (e) {
			console.error(e);
		}
	}

	async workflowGestion() {
		let finished = false;
		if (this.settings.workflowName.length === 0) {
			return false;
		} else {
			const octokit = new Octokit({
				auth: this.settings.GhToken,
			});
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
