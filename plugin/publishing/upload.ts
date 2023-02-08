import {
	arrayBufferToBase64,
	MetadataCache,
	Notice,
	TFile,
	Vault,
} from "obsidian";
import {
	FrontmatterConvert,
	GitHubPublisherSettings,
	MetadataExtractor,
	RepoFrontmatter,
} from "../settings/interface";
import { FilesManagement } from "./filesManagement";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";
import { deleteFromGithub } from "./delete";
import { StringFunc, error } from "../i18n";

import {
	getReceiptFolder,
	getImageLinkOptions,
} from "../contents_conversion/filePathConvertor";
import { ShareStatusBar } from "../src/status_bar";
import GithubPublisherPlugin from "../main";
import {checkEmptyConfiguration, checkIfRepoIsInAnother, isShared, isAttachment} from "../src/data_validation_test";
import {
	getFrontmatterCondition,
	getRepoFrontmatter,
	noticeLog,
} from "plugin/src/utils";
import { mainConverting } from "../contents_conversion/convertText";

/** Class to manage the branch
 * @extends FilesManagement
 */

export default class Publisher {
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;
	octokit: Octokit;
	plugin: GithubPublisherPlugin;

	/**
	 * Class to manage the branch
	 * @param {Vault} vault Obsidian vault
	 * @param {MetadataCache} metadataCache Obsidian metadataCache
	 * @param {GitHubPublisherSettings} settings Settings of the plugin
	 * @param {Octokit} octokit Octokit instance
	 * @param {GithubPublisher} plugin GithubPublisher instance
	 */

	constructor(
		vault: Vault,
		metadataCache: MetadataCache,
		settings: GitHubPublisherSettings,
		octokit: Octokit,
		plugin: GithubPublisherPlugin
	) {
		this.vault = vault;
		this.metadataCache = metadataCache;
		this.settings = settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	/**
	 * Add a status bar + send embed to GitHub. Deep-scanning files.
	 * @param {TFile[]} linkedFiles File embedded
	 * @param {TFile[]} fileHistory already sent files
	 * @param {string} branchName The name of the branch created by the plugin
	 * @param {boolean} deepScan starts the conversion+push of md file. If false, just sharing image
	 * @param {FrontmatterConvert} sourceFrontmatter frontmatter settings
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 * @returns {Promise<TFile[]>}
	 */
	async statusBarForEmbed(
		linkedFiles: TFile[],
		fileHistory: TFile[],
		branchName: string,
		deepScan: boolean,
		sourceFrontmatter: FrontmatterConvert,
		repoFrontmatter: RepoFrontmatter
	) {
		if (linkedFiles.length > 0) {
			if (linkedFiles.length > 1) {
				const statusBarItems = this.plugin.addStatusBarItem();
				const statusBar = new ShareStatusBar(
					statusBarItems,
					linkedFiles.length,
					true
				);
				try {
					for (const image of linkedFiles) {
						try {
							if (!fileHistory.includes(image)) {
								if (image.extension === "md" && deepScan) {
									await this.publish(
										image,
										false,
										branchName,
										repoFrontmatter,
										fileHistory,
										true
									);
								} else if (
									isAttachment(image.extension) &&
									sourceFrontmatter.attachment
								) {
									await this.uploadImage(
										image,
										branchName,
										sourceFrontmatter,
										repoFrontmatter
									);
									fileHistory.push(image);
								}
							}
							statusBar.increment();
						} catch (e) {
							new Notice(
								(error("unablePublishNote") as StringFunc)(
									image.name
								)
							);
							console.error(e);
						}
					}
					statusBar.finish(8000);
				} catch (e) {
					noticeLog(e, this.settings);
					new Notice(
						(error("errorPublish") as StringFunc)(
							repoFrontmatter.repo
						)
					);
					statusBar.error();
				}
			} else {
				// 1 one item to send
				const embed = linkedFiles[0];
				if (!fileHistory.includes(embed)) {
					if (embed.extension === "md" && deepScan) {
						await this.publish(
							embed,
							false,
							branchName,
							repoFrontmatter,
							fileHistory,
							true
						);
					} else if (
						isAttachment(embed.extension) &&
						sourceFrontmatter.attachment
					) {
						await this.uploadImage(
							embed,
							branchName,
							sourceFrontmatter,
							repoFrontmatter
						);
						fileHistory.push(embed);
					}
				}
			}
		}
		return fileHistory;
	}

	/**
	 * Main prog to scan notes, their embed files and send it to GitHub.
	 * @param {TFile} file Origin file
	 * @param {boolean} autoclean If the autoclean must be done right after the file
	 * @param {string} branchName The name of the branch created
	 * @param {TFile[]} fileHistory File already sent during DeepScan
	 * @param {boolean} deepScan if the plugin must check the embed notes too.
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 */
	async publish(
		file: TFile,
		autoclean = false,
		branchName: string,
		repoFrontmatter: RepoFrontmatter[] | RepoFrontmatter,
		fileHistory: TFile[] = [],
		deepScan = false
	) {
		const shareFiles = new FilesManagement(
			this.vault,
			this.metadataCache,
			this.settings,
			this.octokit,
			this.plugin
		);
		const sharedKey = this.settings.plugin.shareKey;
		const frontmatter = this.metadataCache.getFileCache(file).frontmatter;
		const isNotEmpty = checkEmptyConfiguration(getRepoFrontmatter(this.settings, frontmatter), this.settings);
		if (
			!isShared(frontmatter, sharedKey) ||
			shareFiles.checkExcludedFolder(file) ||
			file.extension !== "md" ||
			fileHistory.includes(file) ||
			!checkIfRepoIsInAnother(
				getRepoFrontmatter(this.settings, frontmatter),
				repoFrontmatter
			) || !isNotEmpty
		) {
			return false;
		}
		try {
			noticeLog("Publishing file: " + file.path, this.settings);
			fileHistory.push(file);
			const frontmatterSettings = getFrontmatterCondition(
				frontmatter,
				this.settings
			);
			let embedFiles = shareFiles.getSharedEmbed(
				file,
				frontmatterSettings
			);
			embedFiles = await shareFiles.getMetadataLinks(
				file,
				embedFiles,
				frontmatter,
				frontmatterSettings
			);
			const linkedFiles = shareFiles.getLinkedByEmbedding(file);
			let text = await app.vault.cachedRead(file);
			text = await mainConverting(
				text,
				this.settings,
				frontmatterSettings,
				file,
				app,
				this.metadataCache,
				frontmatter,
				linkedFiles,
				this.plugin,
				this.vault,
				repoFrontmatter
			);
			const path = getReceiptFolder(
				file,
				this.settings,
				this.metadataCache,
				this.vault
			);
			repoFrontmatter = Array.isArray(repoFrontmatter)
				? repoFrontmatter
				: [repoFrontmatter];
			let multiRepMsg = "";
			for (const repo of repoFrontmatter) {
				multiRepMsg += `[${repo.owner}/${repo.repo}/${repo.branch}] `;
			}
			const msg = `Publishing ${file.name} to ${multiRepMsg}`;
			noticeLog(msg, this.settings);
			const success: boolean[] = [];
			for (const repo of repoFrontmatter) {
				success.push(
					await this.uploadMultiple(
						file,
						text,
						branchName,
						frontmatterSettings,
						path,
						repo,
						embedFiles,
						fileHistory,
						deepScan,
						shareFiles,
						autoclean
					)
				);
			}
			return !success.every((value) => value === false);
		} catch (e) {
			noticeLog(e, this.settings);
			return false;
		}
	}

	/**
	 * Upload the file to GitHub
	 * @param {TFile} file sourceFile
	 * @param {string} text text to send
	 * @param {string} branchName the branch name created by the plugin
	 * @param {FrontmatterConvert} frontmatterSettings frontmatter settings
	 * @param {string} path path to the file in the github repo
	 * @param {RepoFrontmatter} repo frontmatter settings
	 * @param {TFile[]} embedFiles File embedded in the note
	 * @param {TFile[]} fileHistory File already sent during DeepScan
	 * @param {boolean} deepScan if the plugin must check the embed notes too.
	 * @param {FilesManagement} shareFiles FilesManagement class
	 * @param {boolean} autoclean If the autoclean must be done right after the file upload
	 * @return {Promise<boolean>}
	 */

	async uploadMultiple(
		file: TFile,
		text: string,
		branchName: string,
		frontmatterSettings: FrontmatterConvert,
		path: string,
		repo: RepoFrontmatter,
		embedFiles: TFile[],
		fileHistory: TFile[],
		deepScan: boolean,
		shareFiles: FilesManagement,
		autoclean: boolean
	) {
		noticeLog(
			`Upload ${file.name}:${path} on ${repo.owner}/${repo.repo}:${branchName}`,
			this.settings
		);
		await this.uploadText(text, path, file.name, branchName, repo);
		await this.statusBarForEmbed(
			embedFiles,
			fileHistory,
			branchName,
			deepScan,
			frontmatterSettings,
			repo
		);
		if (autoclean && repo.autoclean) {
			await deleteFromGithub(
				true,
				this.settings,
				this.octokit,
				branchName,
				shareFiles,
				repo
			);
		}
		return true;
	}

	/**
	 * Upload file to GitHub
	 * @param {string} content Contents of the file sent
	 * @param {string} title for commit message, name of the file
	 * @param {string} branchName the branch name created by the plugin
	 * @param {string} path path in GitHub
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 */

	async upload(
		content: string,
		path: string,
		title = "",
		branchName: string,
		repoFrontmatter: RepoFrontmatter
	) {
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
			title = path.split("/")[path.split("/").length - 1];
			msg = `PUSH ATTACHMENT : ${title}`;
		}
		const payload = {
			owner: repoFrontmatter.owner,
			repo: repoFrontmatter.repo,
			path,
			message: `Adding ${title}`,
			content: content,
			sha: "",
			branch: branchName,
		};
		try {
			const response = await octokit.request(
				"GET /repos/{owner}/{repo}/contents/{path}",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					path,
					ref: branchName,
				}
			);
			// @ts-ignore
			if (response.status === 200 && response.data.type === "file") {
				// @ts-ignore
				payload.sha = response.data.sha;
			}
		} catch {
			noticeLog(
				"The 404 error is normal ! It means that the file does not exist yet. Don't worry ❤️.",
				this.settings
			);
		}

		payload.message = msg;
		await octokit.request(
			"PUT /repos/{owner}/{repo}/contents/{path}",
			payload
		);
	}

	/**
	 * Convert image in base64 and upload it to GitHub
	 * @param {TFile} imageFile the image
	 * @param {string} branchName branch name
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 * @param {FrontmatterConvert} sourceFrontmatter frontmatter settings
	 */

	async uploadImage(
		imageFile: TFile,
		branchName: string,
		sourceFrontmatter: FrontmatterConvert,
		repoFrontmatter: RepoFrontmatter
	) {
		const imageBin = await this.vault.readBinary(imageFile);
		const image64 = arrayBufferToBase64(imageBin);
		const path = getImageLinkOptions(
			imageFile,
			this.settings,
			sourceFrontmatter
		);
		await this.upload(image64, path, "", branchName, repoFrontmatter);
	}

	/**
	 * Convert text contents to base64
	 * @param {string} text contents of the note
	 * @param {string} path new Path in GitHub
	 * @param {string} title name note for message commit
	 * @param {string} branchName The branch created by the plugin
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 * @return {Promise<void>}
	 */

	async uploadText(
		text: string,
		path: string,
		title = "",
		branchName: string,
		repoFrontmatter: RepoFrontmatter
	) {
		try {
			const contentBase64 = Base64.encode(text).toString();
			await this.upload(
				contentBase64,
				path,
				title,
				branchName,
				repoFrontmatter
			);
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Upload the metadataExtractor json file
	 * @param {MetadataExtractor} metadataExtractor metadataExtractor
	 * @param {string} branchName The branch name created by the plugin
	 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter frontmatter settings
	 * @return {Promise<void>}
	 */

	async uploadMetadataExtractorFiles(
		metadataExtractor: MetadataExtractor,
		branchName: string,
		repoFrontmatter: RepoFrontmatter | RepoFrontmatter[]
	) {
		if (metadataExtractor) {
			for (const file of Object.values(metadataExtractor)) {
				if (file) {
					const contents = await app.vault.adapter.read(file);
					const path =
						this.settings.upload.metadataExtractorPath +
						"/" +
						file.split("/").pop();
					repoFrontmatter = Array.isArray(repoFrontmatter)
						? repoFrontmatter
						: [repoFrontmatter];
					for (const repo of repoFrontmatter) {
						await this.uploadText(
							contents,
							path,
							file.split("/").pop(),
							branchName,
							repo
						);
					}
				}
			}
		}
	}

	/**
	 * Allow to activate a workflow dispatch github actions
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 * @return {Promise<boolean>}
	 */

	async workflowGestion(repoFrontmatter: RepoFrontmatter): Promise<boolean> {
		let finished = false;
		if (this.settings.github.worflow.workflowName.length === 0) {
			return false;
		} else {
			const octokit = this.octokit;
			await octokit.request(
				"POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
				{
					owner: repoFrontmatter.owner,
					repo: repoFrontmatter.repo,
					workflow_id: this.settings.github.worflow.workflowName,
					ref: repoFrontmatter.branch,
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
							this.settings.github.worflow.workflowName.replace(".yml", "")
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
