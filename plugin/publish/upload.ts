import {
	arrayBufferToBase64,
	MetadataCache,
	Notice,
	TFile,
	Vault,
} from "obsidian";
import {
	Deleted,
	FrontmatterConvert,
	GitHubPublisherSettings,
	MetadataExtractor,
	RepoFrontmatter,
	UploadedFiles,
} from "../settings/interface";
import { FilesManagement } from "./files";
import { Octokit } from "@octokit/core";
import { Base64 } from "js-base64";
import { deleteFromGithub } from "./delete";
import i18next from "i18next";

import {
	getReceiptFolder,
	getImageLinkOptions,
} from "../conversion/filePathConvertor";
import { ShareStatusBar } from "../src/status_bar";
import GithubPublisherPlugin from "../main";
import {
	checkEmptyConfiguration,
	checkIfRepoIsInAnother,
	isShared,
	isAttachment,
} from "../src/data_validation_test";
import {
	getFrontmatterCondition,
	getRepoFrontmatter,
	noticeLog,
} from "plugin/src/utils";
import { mainConverting } from "../conversion/convertText";

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
		const uploadedFile: UploadedFiles[] = [];
		const fileError: string[] = [];
		if (linkedFiles.length > 0) {
			if (linkedFiles.length > 1) {
				const statusBarItems = this.plugin.addStatusBarItem();
				const statusBar = new ShareStatusBar(
					statusBarItems,
					linkedFiles.length,
					true
				);

				try {
					for (const file of linkedFiles) {
						try {
							if (!fileHistory.includes(file)) {
								if (file.extension === "md" && deepScan) {
									const published = await this.publish(
										file,
										false,
										branchName,
										repoFrontmatter,
										fileHistory,
										true
									);
									if (published) {
										uploadedFile.push(...published.uploaded);
									}
								} else if (
									isAttachment(file.extension) &&
									sourceFrontmatter.attachment
								) {
									const published = await this.uploadImage(
										file,
										branchName,
										sourceFrontmatter,
										repoFrontmatter
									);
									fileHistory.push(file);
									if (published) {
										uploadedFile.push(published);
									}

								}
							}
							statusBar.increment();
						} catch (e) {
							new Notice(
								(i18next.t("error.unablePublishNote", {file: file.name})
								)
							);
							fileError.push(file.name);
							console.error(e);
						}
					}
					statusBar.finish(8000);
				} catch (e) {
					noticeLog(e, this.settings);
					new Notice(
						(i18next.t("error.errorPublish", {repo: repoFrontmatter}))
					);
					statusBar.error();
				}
			} else {
				// 1 one item to send
				const embed = linkedFiles[0];
				if (!fileHistory.includes(embed)) {
					if (embed.extension === "md" && deepScan) {
						const published = await this.publish(
							embed,
							false,
							branchName,
							repoFrontmatter,
							fileHistory,
							true
						);
						if (published) {
							uploadedFile.push(...published.uploaded);
						}
					} else if (
						isAttachment(embed.extension) &&
						sourceFrontmatter.attachment
					) {
						const published = await this.uploadImage(
							embed,
							branchName,
							sourceFrontmatter,
							repoFrontmatter
						);
						fileHistory.push(embed);
						if (published) {
							uploadedFile.push(published);
						}
					}
				}
			}
		}
		console.log(uploadedFile, fileError, fileHistory);
		return {
			fileHistory: fileHistory,
			uploaded: uploadedFile,
			error: fileError,
		};
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
		const frontmatter = this.metadataCache.getFileCache(file).frontmatter;
		const isNotEmpty = checkEmptyConfiguration(getRepoFrontmatter(this.settings, frontmatter), this.settings);
		if (
			!isShared(frontmatter, this.settings, file) ||
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
			const fileDeleted: Deleted[] = [];
			const updated: UploadedFiles[][] = [];
			const fileError: string[] = [];
			for (const repo of repoFrontmatter) {
				const deleted = 
					await this.uploadOnMultipleRepo(
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
					);
				fileDeleted.push(deleted.deleted);
				// convert to UploadedFiles[]
				updated.push(deleted.uploaded);
				fileError.push(...deleted.error);
			}
			return {deleted: fileDeleted[0], uploaded: updated[0], error: fileError};
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
	 */

	async uploadOnMultipleRepo(
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
		const uploaded: UploadedFiles = await this.uploadText(text, path, file.name, branchName, repo);
		let deleted: Deleted; 
		const embeded = await this.statusBarForEmbed(
			embedFiles,
			fileHistory,
			branchName,
			deepScan,
			frontmatterSettings,
			repo
		);
		const embeddedUploaded = embeded.uploaded;
		embeddedUploaded.push(uploaded);
		if (autoclean && repo.autoclean) {
			deleted = await deleteFromGithub(
				true,
				this.settings,
				this.octokit,
				branchName,
				shareFiles,
				repo
			);
		}
		console.log(deleted, embeddedUploaded, embeded.error);
		return {
			deleted: deleted,
			uploaded: embeddedUploaded,
			error: embeded.error
		};
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
		const result: UploadedFiles = {
			isUpdated: false,
			file: title
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
				result.isUpdated = true;
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
		return result;
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
		return await this.upload(image64, path, "", branchName, repoFrontmatter);
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
	): Promise<UploadedFiles | undefined> {
		try {
			const contentBase64 = Base64.encode(text).toString();
			return await this.upload(
				contentBase64,
				path,
				title,
				branchName,
				repoFrontmatter
			);
		} catch (e) {
			console.error(e);
			return undefined;
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
