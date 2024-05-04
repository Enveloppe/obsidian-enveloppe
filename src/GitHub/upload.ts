import { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Base64 } from "js-base64";
import {
	arrayBufferToBase64,
	MetadataCache,
	normalizePath,
	Notice,
	TFile,
	TFolder,
	Vault,
} from "obsidian";

import { mainConverting } from "../conversion";
import { convertToHTMLSVG } from "../conversion/compiler/excalidraw";
import {
	getImagePath,
	getReceiptFolder,
} from "../conversion/file_path";
import GithubPublisher from "../main";
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
	logs,
	noticeMobile,
	notif,
	notifError,
} from "../utils";
import {
	checkEmptyConfiguration,
	checkIfRepoIsInAnother,
	forcePushAttachment,
	isAttachment,
	isShared,
} from "../utils/data_validation_test";
import { LOADING_ICON } from "../utils/icons";
import { frontmatterFromFile, getFrontmatterSettings, getRepoFrontmatter } from "../utils/parse_frontmatter";
import { ShareStatusBar } from "../utils/status_bar";
import { deleteFromGithub } from "./delete";
import { FilesManagement } from "./files";

/** Class to manage the branch
 * @extends FilesManagement
 */

export default class Publisher {
	octokit: Octokit;
	plugin: GithubPublisher;
	vault: Vault;
	metadataCache: MetadataCache;
	settings: GitHubPublisherSettings;
	branchName: string;

	/**
	 * Class to manage the branch
	 * @param {Octokit} octokit Octokit instance
	 * @param {GithubPublisher} plugin GithubPublisher instance
	 */

	constructor(
		octokit: Octokit,
		plugin: GithubPublisher,
	) {
		this.vault = plugin.app.vault;
		this.metadataCache = plugin.app.metadataCache;
		this.settings = plugin.settings;
		this.octokit = octokit;
		this.plugin = plugin;
		this.branchName = plugin.branchName;
	}

	/**
	 * Add a status bar + send embed to GitHub. Deep-scanning files.
	 * @param {TFile[]} linkedFiles File embedded
	 * @param {TFile[]} fileHistory already sent files
	 * @param {boolean} deepScan starts the conversion+push of md file. If false, just sharing image
	 * @param {Properties} properties Object properties will all parameters needed, taken from frontmatter and the plugin settings
	 */
	async statusBarForEmbed(
		linkedFiles: TFile[],
		fileHistory: TFile[],
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
				convert: properties.frontmatter.general,
			};
			try {
				for (const file of linkedFiles) {
					try {
						if (!fileHistory.includes(file)) {
							const isExcalidraw = file.name.includes("excalidraw");
							if (file.extension === "md" && !isExcalidraw && deepScan) {
								const published = await this.publish(
									file,
									false,
									repoProperties,
									fileHistory,
									true
								);
								if (published) {
									uploadedFile.push(...published.uploaded);
								}
							} else if (
								isAttachment(file.name, this.settings.embed.unHandledObsidianExt) &&
								properties.frontmatter.general.attachment
							) {
								const published = await this.uploadImage(
									file,
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
				notifError(repoFrontmatter);
				statusBar.error(repoFrontmatter);
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
	 * @param repo
	 * @param {TFile[]} fileHistory File already sent during DeepScan
	 * @param {boolean} deepScan if the plugin must check the embed notes too.
	 */
	async publish(
		file: TFile,
		autoclean: boolean = false,
		repo: MultiRepoProperties | MonoRepoProperties,
		fileHistory: TFile[] = [],
		deepScan: boolean = false,
	) {
		const shareFiles = new FilesManagement(
			this.octokit,
			this.plugin,
		);
		const frontmatter = frontmatterFromFile(file, this.plugin);
		const repoFrontmatter = getRepoFrontmatter(this.settings, repo.repo, frontmatter);
		const isNotEmpty = await checkEmptyConfiguration(repoFrontmatter, this.plugin);
		repo.frontmatter = repoFrontmatter;
		if (
			!isShared(frontmatter, this.settings, file, repo.repo) ||
			fileHistory.includes(file) ||
			!checkIfRepoIsInAnother(
				repoFrontmatter,
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
				frontmatterSettings,
			);
			embedFiles = await shareFiles.getMetadataLinks(
				file,
				embedFiles,
				frontmatterSettings
			);
			const linkedFiles = shareFiles.getLinkedByEmbedding(file);
			
			let text = await this.vault.cachedRead(file);
			const multiProperties: MultiProperties = {
				plugin: this.plugin,
				frontmatter: {
					general: frontmatterSettings,
					repo: repo.frontmatter,
				},
				repository: repo.repo,
				filepath: getReceiptFolder(file, repo.repo, this.plugin, repo.frontmatter),
			};
			text = await mainConverting(text, file, frontmatter, linkedFiles, multiProperties);
			const path = multiProperties.filepath;
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
					plugin: this.plugin,
					frontmatter: {
						general: frontmatterSettings,
						repo
					},
					repository: multiProperties.repository,
					filepath: multiProperties.filepath,
				};
				const deleted =
					await this.uploadOnMultipleRepo(
						file,
						text,
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
		path: string,
		embedFiles: TFile[],
		fileHistory: TFile[],
		deepScan: boolean,
		shareFiles: FilesManagement,
		autoclean: boolean,
		properties: MonoProperties,
	) {
		const load = this.plugin.addStatusBarItem();
		//add a little load icon from lucide icons, using SVG
		load.createEl("span", { cls: ["obsidian-publisher", "loading", "icons"] }).innerHTML = LOADING_ICON;
		load.createEl("span", { text: i18next.t("statusBar.loading"), cls: ["obsidian-publisher", "loading", "icons"] });
		embedFiles = await this.cleanLinkedImageIfAlreadyInRepo(embedFiles, properties);
		const repo = properties.frontmatter.repo;
		notif(
			{ settings: this.settings },
			`Upload ${file.name}:${path} on ${repo.owner}/${repo.repo}:${this.branchName}`
		);
		const notifMob = noticeMobile("wait", LOADING_ICON, i18next.t("statusBar.loading"));
		let deleted: Deleted = {
			success: false,
			deleted: [],
			undeleted: [],
		};
		load.remove();
		notifMob?.hide();
		const uploaded: UploadedFiles | undefined = await this.uploadText(text, path, file.name, repo);
		if (!uploaded) {
			return {
				deleted,
				uploaded: [],
				error: [`Error while uploading ${file.name} to ${repo.owner}/${repo.repo}/${repo.branch}`]
			};
		}
		const embeded = await this.statusBarForEmbed(
			embedFiles,
			fileHistory,
			deepScan,
			properties
		);

		const embeddedUploaded = embeded.uploaded;
		embeddedUploaded.push(uploaded);
		if (autoclean || repo.dryRun.autoclean) {
			deleted = await deleteFromGithub(
				true,
				this.branchName,
				shareFiles,
				{
					frontmatter: repo,
					repo: properties.repository,
					convert: properties.frontmatter.general,
				}
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
	 * @param {string} path path in GitHub
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 */

	async upload(
		content: string,
		path: string,
		title: string = "",
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
		if (isAttachment(path, this.settings.embed.unHandledObsidianExt)) {
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
			branch: this.branchName,
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
					ref: this.branchName,
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
		properties: MonoProperties,
	) {
		let imageBin = await this.vault.readBinary(imageFile);
		const repoFrontmatter = properties.frontmatter.repo;
		let image64 = arrayBufferToBase64(imageBin);
		if (imageFile.name.includes("excalidraw")) {
			const svg = await convertToHTMLSVG(imageFile, this.plugin.app);
			if (svg) {
				//convert to base64
				image64 = Base64.encode(svg).toString();
				imageBin = Buffer.from(image64, "base64");
			}
		}
		const path = getImagePath(
			imageFile,
			this.settings,
			properties.frontmatter.general
		);
		if (this.settings.github.dryRun.enable) {
			const folderName = this.settings.github.dryRun.folderName
				.replace("{{repo}}", repoFrontmatter.repo)
				.replace("{{branch}}", repoFrontmatter.branch)
				.replace("{{owner}}", repoFrontmatter.owner);
			const dryRunPath = normalizePath(`${folderName}/${path}`);
			const isAlreadyExist = this.vault.getAbstractFileByPath(dryRunPath);
			if (isAlreadyExist && isAlreadyExist instanceof TFile) {
				const needToByUpdated = isAlreadyExist.stat.mtime > imageFile.stat.mtime;
				if (needToByUpdated) {
					this.vault.modifyBinary(isAlreadyExist, imageBin);
				}
				return {
					isUpdated: needToByUpdated,
					file: imageFile.name
				};
			} 
			const folder = dryRunPath.split("/").slice(0, -1).join("/");
			const folderExists = this.vault.getAbstractFileByPath(folder);
			if (!folderExists || !(folderExists instanceof TFolder))
				await this.vault.createFolder(folder);
			await this.vault.createBinary(dryRunPath, imageBin);
			return {
				isUpdated: true,
				file: imageFile.name
			};
		}
		return await this.upload(image64, path, "", properties.frontmatter.repo);

	}

	/**
	 * Convert text contents to base64
	 * @param {string} text contents of the note
	 * @param {string} path new Path in GitHub
	 * @param {string} title name note for message commit
	 * @param {RepoFrontmatter} repoFrontmatter frontmatter settings
	 * @return {Promise<void>}
	 */

	async uploadText(
		text: string,
		path: string,
		title: string = "",
		repoFrontmatter: RepoFrontmatter,
	): Promise<UploadedFiles | undefined> {
		if (this.settings.github.dryRun.enable) {
			//create a new file in the vault
			const folderName = this.settings.github.dryRun.folderName
				.replace("{{repo}}", repoFrontmatter.repo)
				.replace("{{branch}}", repoFrontmatter.branch)
				.replace("{{owner}}", repoFrontmatter.owner);

			const newPath = normalizePath(`${folderName}/${path}`);
			const isAlreadyExist = this.vault.getAbstractFileByPath(newPath);
			if (isAlreadyExist && isAlreadyExist instanceof TFile) {
				//modify
				await this.vault.modify(isAlreadyExist, text);
				return {
					isUpdated: true,
					file: title
				};
			} //create
			const folder = newPath.split("/").slice(0, -1).join("/");
			const folderExists = this.vault.getAbstractFileByPath(folder);
			if (!folderExists || !(folderExists instanceof TFolder))
				await this.vault.createFolder(folder);
			await this.vault.create(newPath, text);
			return {
				isUpdated: false,
				file: title
			};
		}
		try {
			const contentBase64 = Base64.encode(text).toString();
			return await this.upload(
				contentBase64,
				path,
				title,
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
	 * @param {RepoFrontmatter | RepoFrontmatter[]} repoFrontmatter frontmatter settings
	 * @return {Promise<void>}
	 */

	async uploadMetadataExtractorFiles(
		metadataExtractor: MetadataExtractor,
		repoFrontmatter: RepoFrontmatter | RepoFrontmatter[]
	): Promise<void> {
		if (metadataExtractor) {
			if (this.settings.github.dryRun.enable) return;
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
		if (this.settings.github.dryRun.enable) return false;
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
						repoFrontmatter.workflowName.replace(".yml", "").replace(".yaml", "")
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
	 * Skip for files, as they are updated by GitHub directly (basic git behavior)
	 * @param {TFile[]} embedFiles  File embedded in the note
	 * @param {MonoProperties} properties Properties of the note
	 * @returns {Promise<TFile[]>} New list of embed files
	 */
	async cleanLinkedImageIfAlreadyInRepo(
		embedFiles: TFile[],
		properties: MonoProperties,
	): Promise<TFile[]> {
		const newLinkedFiles: TFile[] = [];
		for (const file of embedFiles) {
			if (isAttachment(file.name, this.settings.embed.unHandledObsidianExt)) {
				const imagePath = getImagePath(
					file,
					this.settings,
					properties.frontmatter.general
				);
				const repoFrontmatter = properties.frontmatter;
				if (this.settings.github.dryRun.enable) {
					newLinkedFiles.push(file);
					continue;
				}
				try {
					if (forcePushAttachment(file, this.settings)) {
						newLinkedFiles.push(file);
						continue;
					}
					//first search if the file exists
					const response = await this.octokit.request(
						"GET /repos/{owner}/{repo}/contents/{path}",
						{
							owner: repoFrontmatter.repo.owner,
							repo: repoFrontmatter.repo.repo,
							path: imagePath,
							ref: this.branchName,
						});
					if (response.status === 200) {
						const reply =  await this.octokit.request(
							"GET /repos/{owner}/{repo}/commits",
							{
								owner: repoFrontmatter.repo.owner,
								repo: repoFrontmatter.repo.repo,
								path: imagePath,
								sha: this.branchName,
							});
						if (reply.status === 200) {
							const data = reply.data;
							const lastEditedInRepo = data[0]?.commit?.committer?.date;
							const lastEditedDate = lastEditedInRepo ? new Date(lastEditedInRepo) : undefined;
							const lastEditedAttachment = new Date(file.stat.mtime);
							//if the file in the vault is newer than the file in the repo, push it
							if (lastEditedDate && lastEditedAttachment > lastEditedDate || !lastEditedDate) {
								newLinkedFiles.push(file);
							} else logs({ settings: this.settings }, i18next.t("error.alreadyExists", { file: file.name }));
						}
					}
				} catch (e) {
					newLinkedFiles.push(file);
				}
			//pass non image file as they are updated basically by GitHub with checking the content (basic git behavior)
			} else {
				newLinkedFiles.push(file);
			}
		}
		return newLinkedFiles;
	}
}

