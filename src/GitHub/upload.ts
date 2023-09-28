import { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Base64 } from "js-base64";
import {
	arrayBufferToBase64,
	MetadataCache,
	Notice,
	TFile,
	Vault,
} from "obsidian";
import { LOADING_ICON } from "src/utils/icons";

import { mainConverting } from "../conversion/convert_text";
import {
	getImageLinkOptions,
	getReceiptFolder,
} from "../conversion/file_path";
import GithubPublisherPlugin from "../main";
import {
	Deleted,
	GitHubPublisherSettings,
	MetadataExtractor, MonoProperties,
	MonoRepoProperties,
	MultiProperties,
	MultiRepoProperties,
	RepoFrontmatter, UploadedFiles,
} from "../settings/interface";
import {
	getFrontmatterSettings,
	getRepoFrontmatter,
	logs,
	notif,
} from "../utils";
import {
	checkEmptyConfiguration,
	checkIfRepoIsInAnother,
	forcePushAttachment,
	isAttachment,
	isShared,
} from "../utils/data_validation_test";
import { ShareStatusBar } from "../utils/status_bar";
import { deleteFromGithub } from "./delete";
import { FilesManagement } from "./files";

/** Class to manage the branch
 * @extends FilesManagement
 */

export default class Publisher {
	octokit: Octokit;
	plugin: GithubPublisherPlugin;
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;

	/**
	 * Class to manage the branch
	 * @param {Octokit} octokit Octokit instance
	 * @param {GithubPublisher} plugin GithubPublisher instance
	 */

	constructor(
		octokit: Octokit,
		plugin: GithubPublisherPlugin
	) {
		this.vault = plugin.app.vault;
		this.metadataCache = plugin.app.metadataCache;
		this.settings = plugin.settings;
		this.octokit = octokit;
		this.plugin = plugin;
	}

	/**
	 * Add a status bar + send embed to GitHub. Deep-scanning files.
	 * @param {TFile[]} linkedFiles File embedded
	 * @param {TFile[]} fileHistory already sent files
	 * @param {string} branchName The name of the branch created by the plugin
	 * @param {boolean} deepScan starts the conversion+push of md file. If false, just sharing image
	 * @param {Properties} properties Object properties will all parameters needed, taken from frontmatter and the plugin settings
	 */
	async statusBarForEmbed(
		linkedFiles: TFile[],
		fileHistory: TFile[],
		branchName: string,
		deepScan: boolean,
		properties: MonoProperties,
	) {
		const uploadedFile: UploadedFiles[] = [];
		const fileError: string[] = [];
		if (linkedFiles.length > 0) {
			const statusBarItems = this.plugin.addStatusBarItem();
			const statusBar = new ShareStatusBar(
				statusBarItems,
				linkedFiles.length,
				true
			);
			const repoFrontmatter = properties.frontmatter.repo;
			const repoProperties: MonoRepoProperties = {
				frontmatter: properties.frontmatter.repo,
				repo: properties.repository,
			};
			try {
				for (const file of linkedFiles) {
					try {
						if (!fileHistory.includes(file)) {
							if (file.extension === "md" && deepScan) {
								const published = await this.publish(
									file,
									false,
									branchName,
									repoProperties,
									fileHistory,
									true
								);
								if (published) {
									uploadedFile.push(...published.uploaded);
								}
							} else if (
								isAttachment(file.extension) &&
								properties.frontmatter.general.attachment
							) {
								const published = await this.uploadImage(
									file,
									branchName,
									properties
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
							(i18next.t("error.unablePublishNote", { file: file.name })
							)
						);
						fileError.push(file.name);
						logs({ settings: this.settings, e: true }, e);
					}
				}
				statusBar.finish(8000);
			} catch (e) {
				logs({ settings: this.settings, e: true }, e);
				new Notice(
					(i18next.t("error.errorPublish", { repo: repoFrontmatter }))
				);
				statusBar.error();
			}
		}
		return {
			fileHistory,
			uploaded: uploadedFile,
			error: fileError,
		};
	}

	/**
	 * Main prog to scan notes, their embed files and send it to GitHub.
	 * @param {TFile} file Origin file
	 * @param {boolean} autoclean If the autoclean must be done right after the file
	 * @param {string} branchName The name of the branch created
	 * @param repo
	 * @param {TFile[]} fileHistory File already sent during DeepScan
	 * @param {boolean} deepScan if the plugin must check the embed notes too.
	 */
	async publish(
		file: TFile,
		autoclean: boolean = false,
		branchName: string,
		repo: MultiRepoProperties | MonoRepoProperties,
		fileHistory: TFile[] = [],
		deepScan: boolean = false,
	) {
		const shareFiles = new FilesManagement(
			this.octokit,
			this.plugin
		);
		const frontmatter = this.metadataCache.getFileCache(file)?.frontmatter;
		const isNotEmpty = checkEmptyConfiguration(getRepoFrontmatter(this.settings, repo.repo, frontmatter), this.plugin);
		if (
			!isShared(frontmatter, this.settings, file, repo.repo) ||
			fileHistory.includes(file) ||
			!checkIfRepoIsInAnother(
				getRepoFrontmatter(this.settings, repo.repo, frontmatter),
				repo.frontmatter
			) || !isNotEmpty
		) {
			return false;
		}
		try {
			logs({ settings: this.settings }, `Publishing file: ${file.path}`);
			fileHistory.push(file);
			const frontmatterSettings = getFrontmatterSettings(
				frontmatter,
				this.settings,
				repo.repo
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

			let text = await this.vault.cachedRead(file);
			const multiProperties: MultiProperties = {
				settings: this.settings,
				frontmatter: {
					general: frontmatterSettings,
					repo: repo.frontmatter,
				},
				repository: repo.repo
			};
			text = await mainConverting(text, file, this.plugin.app, frontmatter, linkedFiles, this.plugin, multiProperties);
			const path = getReceiptFolder(file, this.settings, repo.repo, this.plugin.app);
			const repoFrontmatter = Array.isArray(repo.frontmatter)
				? repo.frontmatter
				: [repo.frontmatter];
			let multiRepMsg = "";
			for (const repo of repoFrontmatter) {
				multiRepMsg += `[${repo.owner}/${repo.repo}/${repo.branch}] `;
			}
			const msg = `Publishing ${file.name} to ${multiRepMsg}`;
			logs({ settings: this.settings }, msg);
			const fileDeleted: Deleted[] = [];
			const updated: UploadedFiles[][] = [];
			const fileError: string[] = [];
			for (const repo of repoFrontmatter) {
				const monoProperties: MonoProperties = {
					settings: this.settings,
					frontmatter: {
						general: frontmatterSettings,
						repo
					},
					repository: multiProperties.repository
				};
				const deleted =
					await this.uploadOnMultipleRepo(
						file,
						text,
						branchName,
						path,
						embedFiles,
						fileHistory,
						deepScan,
						shareFiles,
						autoclean,
						monoProperties
					);
				fileDeleted.push(deleted.deleted);
				// convert to UploadedFiles[]
				updated.push(deleted.uploaded);
				fileError.push(...deleted.error);
			}
			return { deleted: fileDeleted[0], uploaded: updated[0], error: fileError };
		} catch (e) {
			logs({ settings: this.settings, e: true }, e);
			return false;
		}
	}

	/**
	 * Upload the file to GitHub
	 * @param {TFile} file sourceFile
	 * @param {string} text text to send
	 * @param {string} branchName the branch name created by the plugin
	 * @param {string} path path to the file in the github repo
	 * @param {TFile[]} embedFiles File embedded in the note
	 * @param {TFile[]} fileHistory File already sent during DeepScan
	 * @param {boolean} deepScan if the plugin must check the embed notes too.
	 * @param {FilesManagement} shareFiles FilesManagement class
	 * @param {boolean} autoclean If the autoclean must be done right after the file upload
	 * @param properties
	 */

	async uploadOnMultipleRepo(
		file: TFile,
		text: string,
		branchName: string,
		path: string,
		embedFiles: TFile[],
		fileHistory: TFile[],
		deepScan: boolean,
		shareFiles: FilesManagement,
		autoclean: boolean,
		properties: MonoProperties,
	) {
		const repo = properties.frontmatter.repo;
		notif(
			{ settings: this.settings },
			`Upload ${file.name}:${path} on ${repo.owner}/${repo.repo}:${branchName}`
		);
		let deleted: Deleted = {
			success: false,
			deleted: [],
			undeleted: [],
		};
		const uploaded: UploadedFiles | undefined = await this.uploadText(text, path, file.name, branchName, repo);
		if (!uploaded) {
			return {
				deleted,
				uploaded: [],
				error: [`Error while uploading ${file.name} to ${repo.owner}/${repo.repo}/${repo.branch}`]
			};
		}
		const load = this.plugin.addStatusBarItem();
		//add a little load icon from lucide icons, using SVG
		load.createEl("span",{cls: ["obsidian-publisher", "loading", "icons"]}).innerHTML = LOADING_ICON;
		load.createEl("span", { text: i18next.t("statusBar.loading"), cls: ["obsidian-publisher", "loading", "icons"] });

		embedFiles = await this.cleanLinkedImageIfAlreadyInRepo(embedFiles, properties);
		load.remove();
		logs({ settings: this.settings }, `length: ${embedFiles.length}`, embedFiles);

		const embeded = await this.statusBarForEmbed(
			embedFiles,
			fileHistory,
			branchName,
			deepScan,
			properties
		);

		const embeddedUploaded = embeded.uploaded;
		embeddedUploaded.push(uploaded);
		if (autoclean && repo.autoclean) {
			deleted = await deleteFromGithub(
				true,
				branchName,
				shareFiles,
				{
					frontmatter: repo,
					repo: properties.repository,
				} as MonoRepoProperties
			);
		}
		return {
			deleted,
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
		title: string = "",
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
			content,
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
			notif(
				{ settings: this.settings },
				i18next.t("error.normal")
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
	 */

	async uploadImage(
		imageFile: TFile,
		branchName: string,
		properties: MonoProperties,
	) {
		const imageBin = await this.vault.readBinary(imageFile);
		const image64 = arrayBufferToBase64(imageBin);
		const path = getImageLinkOptions(
			imageFile,
			this.settings,
			properties.frontmatter.general
		);
		return await this.upload(image64, path, "", branchName, properties.frontmatter.repo);

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
		title: string = "",
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
			notif({ settings: this.settings, e: true }, e);
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
	): Promise<void> {
		if (metadataExtractor) {
			for (const file of Object.values(metadataExtractor)) {
				if (file) {
					const contents = await this.vault.adapter.read(file);
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
		if (repoFrontmatter.workflowName.length === 0) {
			return false;
		}
		const octokit = this.octokit;
		await octokit.request(
			"POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
			{
				owner: repoFrontmatter.owner,
				repo: repoFrontmatter.repo,
				workflow_id: repoFrontmatter.workflowName,
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
						repoFrontmatter.workflowName.replace(".yml", "")
				);
				if (build && build.status === "completed") {
					finished = true;
					return true;
				}
			}
		}
		return false;
	}


	/**
	 * Remove all image embed in the note if they are already in the repo (same path)
	 * @param embedFiles {TFile[]} File embedded in the note
	 * @param properties {MonoProperties} Properties of the note
	 * @returns {Promise<TFile[]>} New list of embed files
	 */
	async cleanLinkedImageIfAlreadyInRepo(
		embedFiles: TFile[],
		properties: MonoProperties
	): Promise<TFile[]> {
		const newLinkedFiles: TFile[] = [];
		for (const file of embedFiles) {
			if (isAttachment(file.name)) {
				const imagePath = getImageLinkOptions(
					file,
					this.settings,
					properties.frontmatter.general
				);
				const repoFrontmatter = properties.frontmatter;
				try {
					const {status} = await this.octokit.request(
						"GET /repos/{owner}/{repo}/contents/{path}",
						{
							owner: repoFrontmatter.repo.owner,
							repo: repoFrontmatter.repo.repo,
							path: imagePath,
						});
					if (status === 200) {
						if (forcePushAttachment(file, properties.settings)) {
							newLinkedFiles.push(file);
						} else notif({ settings: this.settings }, i18next.t("error.alreadyExists", { file: file.name }));
						continue;
					}
				} catch (e) {
					newLinkedFiles.push(file);
				}
			} else {
				newLinkedFiles.push(file);
			}
		}
		return newLinkedFiles;
	}
}
