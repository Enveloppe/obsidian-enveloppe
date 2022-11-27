import {
	arrayBufferToBase64,
	MetadataCache,
	Notice,
	TFile,
	Vault,
} from "obsidian";
import {frontmatterConvert, GitHubPublisherSettings, RepoFrontmatter} from "../settings/interface";
import { FilesManagement } from "./filesManagement";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";
import {deleteFromGithub} from "./delete"
import {StringFunc, error} from "../i18n";


import {
	getReceiptFolder, getImageLinkOptions
} from "../contents_conversion/filePathConvertor";
import {ShareStatusBar} from "../src/status_bar";
import GithubPublisherPlugin from "../main";
import {getFrontmatterCondition, getRepoFrontmatter, isAttachment, noticeLog} from "plugin/src/utils";
import {mainConverting} from "../contents_conversion/convertText";

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

	async statusBarForEmbed(linkedFiles: TFile[], fileHistory:TFile[], ref="main", deepScan:boolean, sourceFrontmatter: frontmatterConvert, repoFrontmatter: RepoFrontmatter) {
		/**
		 * Add a status bar + send embed to GitHub. Deep-scanning files.
		 * @param linkedFiles File embedded
		 * @param fileHistory already sent files
		 * @param ref branch name
		 * @param Deepscan starts the conversion+push of md file. If false, just sharing image
		 */
		if (linkedFiles.length > 0) {
			if (linkedFiles.length> 1) {
				const statusBarItems = this.plugin.addStatusBarItem();
				const statusBar = new ShareStatusBar(statusBarItems, linkedFiles.length, true);
				try {
					for (const image of linkedFiles) {
						try {
							if (!fileHistory.includes(image)) {
								if ((image.extension === 'md') && deepScan) {
									await this.publish(image, false, ref, repoFrontmatter, fileHistory, true);
								} else if (isAttachment(image.extension) && sourceFrontmatter.attachment) {
									await this.uploadImage(image, ref, sourceFrontmatter, repoFrontmatter);
									fileHistory.push(image);
								}
							}
							statusBar.increment();
						} catch (e) {
							new Notice((error("unablePublishNote") as StringFunc)(image.name));
							console.error(e);
						}
					}
					statusBar.finish(8000);
				} catch (e) {
					noticeLog(e, this.settings);
					new Notice((error('errorPublish') as StringFunc)(repoFrontmatter.repo));
					statusBar.error();
				}
			} else { // 1 one item to send
				const embed = linkedFiles[0];
				if (!fileHistory.includes(embed)) {
					if (embed.extension === 'md' && deepScan) {
						await this.publish(embed, false, ref, repoFrontmatter, fileHistory, true);
					} else if (isAttachment(embed.extension) && sourceFrontmatter.attachment) {
						await this.uploadImage(embed, ref, sourceFrontmatter, repoFrontmatter);
						fileHistory.push(embed);
					}
				}
			}
		}
		return fileHistory;
	}


	async publish(file: TFile, autoclean = false, ref = "main", repoFrontmatter: RepoFrontmatter[] | RepoFrontmatter, fileHistory:TFile[]=[], deepScan=false) {
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
			!frontmatter
			|| !frontmatter[sharedKey]
			|| shareFiles.checkExcludedFolder(file)
			|| file.extension !== "md"
			|| fileHistory.includes(file)
			|| JSON.stringify(getRepoFrontmatter(this.settings, frontmatter)) !== JSON.stringify(repoFrontmatter)
		) {
			return false;
		}
		try {
			noticeLog("Publishing file: " + file.path, this.settings);
			fileHistory.push(file)
			const frontmatterSettings = getFrontmatterCondition(frontmatter, this.settings);
			let embedFiles = shareFiles.getSharedEmbed(file, frontmatterSettings);
			embedFiles = await shareFiles.getMetadataLinks(file, embedFiles, frontmatter, frontmatterSettings);
			const linkedFiles = shareFiles.getLinkedByEmbedding(file);
			let text = await app.vault.cachedRead(file);
			text = await mainConverting(text, this.settings, frontmatterSettings, file, app, this.metadataCache, frontmatter, linkedFiles, this.plugin,
				this.vault);
			const path = getReceiptFolder(file, this.settings, this.metadataCache, this.vault)
			//if repoFrontmatter is an array, it means that the file is in a multiple repo
			if (repoFrontmatter instanceof Array) {
				noticeLog("Multiple repo" + repoFrontmatter, this.settings)
				const success: boolean[] = [];
				for (const repo of repoFrontmatter) {
					success.push(await this.uploadMultiple(file, text, ref, frontmatterSettings, path, repo, embedFiles, fileHistory, deepScan, shareFiles, autoclean));
				}
				return !success.every((value) => value === false);
			} else {
				return await this.uploadMultiple(file, text, ref, frontmatterSettings, path, repoFrontmatter, embedFiles, fileHistory, deepScan, shareFiles, autoclean);
			}
		} catch (e) {
			noticeLog(e, this.settings);
			return false;
		}
	}

	async uploadMultiple(file: TFile, text: string, ref: string, frontmatterSettings: frontmatterConvert, path: string, repo: RepoFrontmatter, embedFiles: TFile[], fileHistory: TFile[], deepScan: boolean, shareFiles: FilesManagement, autoclean: boolean) {
		noticeLog(`Upload ${file.name}:${path} on ${repo.owner}/${repo.repo}:${ref}`, this.settings);
		await this.uploadText(file.path, text, path, file.name, ref, repo);
		await this.statusBarForEmbed(embedFiles, fileHistory, ref, deepScan, frontmatterSettings, repo);
		if (autoclean && repo.autoclean) {
			await deleteFromGithub(true, this.settings, this.octokit, ref, shareFiles, repo);
		}
		return true;
	}

	async upload(filePath: string, content: string, path: string, title = "", ref = "main", repoFrontmatter: RepoFrontmatter) {
		/**
		 * Upload file to GitHub
		 * @param filePath filepath in obsidian (origin)
		 * @param content Contents of the file sent
		 * @param title for commit message, name of the file
		 * @param ref branch name
		 * @param path path in GitHub
		 */
		if (!repoFrontmatter.repo) {
			new Notice(
				"Config error : You need to define a github repo in the plugin settings"
			);
			throw {};
		}
		if (!repoFrontmatter.owner) {
			new Notice(
				"Config error : You need to define your github username in the plugin settings"
			);
			throw {};
		}
		const octokit = this.octokit;
		let msg = `PUSH NOTE : ${title}`;
		if (isAttachment(path)) {
			title = path.split('/')[path.split('/').length - 1];
			msg = `PUSH ATTACHMENT : ${title}`;
		}
		const payload = {
			owner: repoFrontmatter.owner,
			repo: repoFrontmatter.repo,
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
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
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

	async uploadImage(imageFile: TFile, ref = "main", sourcefrontmatter: frontmatterConvert, repoFrontmatter: RepoFrontmatter) {
		/**
		 * Convert image in base64
		 * @param imageFile the image
		 * @param ref branch name
		 */
		const imageBin = await this.vault.readBinary(imageFile);
		const image64 = arrayBufferToBase64(imageBin);
		const path = getImageLinkOptions(imageFile, this.settings, sourcefrontmatter);
		await this.upload(imageFile.path, image64, path, "", ref, repoFrontmatter);
	}

	async uploadText(filePath: string, text: string, path: string, title = "", ref = "main", repoFrontmatter: RepoFrontmatter) {
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
			await this.upload(filePath, contentBase64, path, title, ref, repoFrontmatter);
		} catch (e) {
			console.error(e);
		}
	}
	
	async workflowGestion(repoFrontmatter: RepoFrontmatter) {
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
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					workflow_id: this.settings.workflowName,
					ref: "main",
				}
			);
			while (!finished) {
				await sleep(10000);
				const workflowGet = await octokit.request(
					"GET /repos/{owner}/{repo}/actions/runs",
					{
						owner: repoFrontmatter.owner,
						repo: repoFrontmatter.repo,
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

