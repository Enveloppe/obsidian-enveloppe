import {
	arrayBufferToBase64, FrontMatterCache,
	MetadataCache,
	Notice,
	TFile,
	Vault,
} from "obsidian";
import { GitHubPublisherSettings } from "../settings/interface";
import { FilesManagement } from "./filesManagement";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";
import {deleteFromGithub} from "./delete"

import {
	convertDataviewQueries,
	convertLinkCitation,
	convertWikilinks,
	addHardLineBreak,
	censorText, addInlineTags, convertInlineDataview
} from "../contents_conversion/convertText";

import {
	getReceiptFolder, getImageLinkOptions
} from "../contents_conversion/filePathConvertor";
import {ShareStatusBar} from "../src/status_bar";
import GithubPublisherPlugin from "../main";
import { noticeLog } from "plugin/src/utils";

export default class Publisher {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	plugin: GithubPublisherPlugin;

	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: GitHubPublisherSettings,
		octokit: Octokit,
		plugin: GithubPublisherPlugin,
	) {
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	async statusBarForEmbed(linkedFiles: TFile[], fileHistory:TFile[], ref="main", deepScan:boolean, sourceFrontmatter: FrontMatterCache) {
		/**
		 * Add a status bar + send embed to GitHub. Deep-scanning files.
		 * @param linkedFiles File embedded
		 * @param fileHistory already sent files
		 * @param ref branch name
		 * @param Deepscan starts the conversion+push of md file. If false, just sharing image
		 */
		if (linkedFiles.length > 0) {
			if (linkedFiles.length > 1) {
				const statusBarItems = this.plugin.addStatusBarItem();
				const statusBar = new ShareStatusBar(statusBarItems, linkedFiles.length);
				for (const image of linkedFiles) {
					if ((image.extension === 'md') && !(fileHistory.includes(image)) && deepScan) {
						fileHistory.push(image);
						await this.publish(image, false, ref, fileHistory, true);
					} else {
						await this.uploadImage(image, ref, sourceFrontmatter)
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
					await this.uploadImage(embed, ref, sourceFrontmatter);
				}
			}
		}
		return fileHistory;
	}


	async publish(file: TFile, autoclean = false, ref = "main", fileHistory:TFile[]=[], deepScan=false) {
		/**
		 * Main prog to scan notes, their embed files and send it to GitHub.
		 * @param file Origin file
		 * @param autoclean If the autoclean must be done right after the file
		 * @param ref branch name
		 * @param fileHistory File already sent during DeepScan
		 * @param DeepScan if the plugin must check the embed notes too.
		 */
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
			fileHistory.push(file)
			let embedFiles = shareFiles.getEmbed(file);
			embedFiles = await shareFiles.getMetadataImages(file, embedFiles)
			const linkedFiles = shareFiles.getLinkedImageAndFiles(file);
			let text = await addInlineTags(this.settings, file, this.metadataCache, this.plugin.app);
			text = await convertDataviewQueries(text, file.path, this.settings, this.plugin.app, this.metadataCache, frontmatter, file);
			text = await convertInlineDataview(text, this.settings, file, this.plugin.app);
			text = addHardLineBreak(text, this.settings, frontmatter);
			text = convertLinkCitation(text, this.settings, linkedFiles, this.metadataCache, file, this.vault);
			text = convertWikilinks(text, frontmatter, this.settings, linkedFiles);
			text = censorText(text, this.settings);
			const path = getReceiptFolder(file, this.settings, this.metadataCache, this.vault)
			noticeLog(`Upload ${file.name}:${path} on ${this.settings.githubName}/${this.settings.githubRepo}:${ref}`, this.settings);
			await this.uploadText(file.path, text, path, file.name, ref);
			await this.statusBarForEmbed(embedFiles, fileHistory, ref, deepScan, frontmatter);
			if (autoclean && this.settings.autoCleanUp) {
				await deleteFromGithub(true, this.settings, this.octokit, ref, shareFiles);
			}
			return true;
		} catch (e) {
			noticeLog(e, this.settings);
			return false;
		}
	}
	
	async upload(filePath: string, content: string, path: string, title = "", ref = "main") {
		/**
		 * Upload file to GitHub
		 * @param filePath filepath in obsidian (origin)
		 * @param content Contents of the file sent
		 * @param title for commit message, name of the file
		 * @param ref branch name
		 * @param path path in GitHub
		 */
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
		let msg = `PUSH NOTE : ${title}`;
		if (path.match(/(png|jpe?g|svg|bmp|gif)$/i)) {
			title = path.split('/')[path.split('/').length - 1];
			msg = `PUSH IMAGE : ${title}`;
		}
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
			noticeLog(
				"The 404 error is normal ! It means that the file does not exist yet. Don't worry ❤️.", this.settings
			);
		}

		payload.message = msg;
		await octokit.request(
			"PUT /repos/{owner}/{repo}/contents/{path}",
			payload
		);
	}

	async uploadImage(imageFile: TFile, ref = "main", sourcefrontmatter: FrontMatterCache) {
		/**
		 * Convert image in base64
		 * @param imageFile the image
		 * @param ref branch name
		 */
		const imageBin = await this.vault.readBinary(imageFile);
		const image64 = arrayBufferToBase64(imageBin);
		const path = getImageLinkOptions(imageFile, this.settings, sourcefrontmatter);
		await this.upload(imageFile.path, image64, path, "", ref);
	}

	async uploadText(filePath: string, text: string, path: string, title = "", ref = "main") {
		/**
		 * Convert text contents to base64
		 * @param filePath Obsidian filepath (origin)
		 * @param text contents of the note
		 * @param path new Path in GitHub
		 * @param title name note for message commit
		 * @param ref branch name
		 */
		try {
			const contentBase64 = Base64.encode(text).toString();
			await this.upload(filePath, contentBase64, path, title, ref);
		} catch (e) {
			console.error(e);
		}
	}
	
	async workflowGestion() {
		/**
		 * Allow to activate a workflow dispatch GitHub action
		 *
		 */
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

