import type {
	Deleted,
	EnveloppeSettings,
	MetadataExtractor,
	MonoProperties,
	MonoRepoProperties,
	MultiProperties,
	MultiRepoProperties,
	Properties,
	UploadedFiles,
} from "@interfaces";
import type { Octokit } from "@octokit/core";
import i18next from "i18next";
import { Base64 } from "js-base64";
import {
	arrayBufferToBase64,
	type FrontMatterCache,
	type MetadataCache,
	normalizePath,
	Notice,
	setIcon,
	TFile,
	TFolder,
	type Vault,
} from "obsidian";
import { mainConverting } from "src/conversion";
import { convertToHTMLSVG } from "src/conversion/compiler/excalidraw";
import { getImagePath, getReceiptFolder } from "src/conversion/file_path";
import { deleteFromGithub } from "src/GitHub/delete";
import { FilesManagement } from "src/GitHub/files";
import type Enveloppe from "src/main";
import {
	checkEmptyConfiguration,
	checkIfRepoIsInAnother,
	forcePushAttachment,
	isAttachment,
	isShared,
} from "src/utils/data_validation_test";
import {
	frontmatterFromFile,
	frontmatterSettingsRepository,
	getFrontmatterSettings,
	getProperties,
} from "src/utils/parse_frontmatter";
import { ShareStatusBar } from "src/utils/status_bar";
import merge from "ts-deepmerge";
import type { Logs } from "../utils/logs";

/** Class to manage the branch
 * @extends FilesManagement
 */

export default class Publisher {
	octokit: Octokit;
	plugin: Enveloppe;
	vault: Vault;
	metadataCache: MetadataCache;
	settings: EnveloppeSettings;
	branchName: string;
	console: Logs;

	/**
	 * Class to manage the branch
	 * @param {Octokit} octokit Octokit instance
	 * @param {Enveloppe} plugin Enveloppe instance
	 */

	constructor(octokit: Octokit, plugin: Enveloppe) {
		this.vault = plugin.app.vault;
		this.metadataCache = plugin.app.metadataCache;
		this.settings = plugin.settings;
		this.octokit = octokit;
		this.plugin = plugin;
		this.branchName = plugin.branchName;
		this.console = plugin.console;
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
		properties: MonoProperties
	) {
		const uploadedFile: UploadedFiles[] = [];
		const fileError: string[] = [];
		if (linkedFiles.length > 0) {
			const statusBarItems = this.plugin.addStatusBarItem();
			const statusBar = new ShareStatusBar(
				statusBarItems,
				linkedFiles.length,
				true,
				this.console
			);
			const prop = properties.frontmatter.prop;
			const repoProperties: MonoRepoProperties = {
				frontmatter: properties.frontmatter.prop,
				repository: properties.repository,
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
									true,
									properties.frontmatter.source
								);
								if (published) {
									uploadedFile.push(...published.uploaded);
								}
							} else if (
								isAttachment(file.name, this.settings.embed.unHandledObsidianExt) &&
								properties.frontmatter.general.attachment
							) {
								const published = await this.uploadImage(file, properties);
								fileHistory.push(file);
								if (published) {
									uploadedFile.push(published);
								}
							}
						}
						statusBar.increment();
					} catch (e) {
						new Notice(i18next.t("error.unablePublishNote", { file: file.name }));
						fileError.push(file.name);
						this.console.logs({ e: true }, e);
					}
				}
				statusBar.finish(8000);
			} catch (e) {
				this.console.logs({ e: true }, e);
				this.console.notifError(prop);
				statusBar.error(prop);
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
		sourceFrontmatter: FrontMatterCache | null | undefined
	) {
		const shareFiles = new FilesManagement(this.octokit, this.plugin);
		let frontmatter = frontmatterFromFile(file, this.plugin, null);
		if (sourceFrontmatter && frontmatter)
			frontmatter = merge.withOptions(
				{ allowUndefinedOverrides: false },
				sourceFrontmatter,
				frontmatter
			);
		const prop = getProperties(this.plugin, repo.repository, frontmatter);
		const isNotEmpty = await checkEmptyConfiguration(prop, this.plugin);
		repo.frontmatter = prop;
		if (
			!isShared(frontmatter, this.settings, file, repo.repository) ||
			fileHistory.includes(file) ||
			!checkIfRepoIsInAnother(prop, repo.frontmatter) ||
			!isNotEmpty
		) {
			return false;
		}
		try {
			this.console.logs({}, `Publishing file: ${file.path}`);
			fileHistory.push(file);
			const frontmatterSettingsFromFile = getFrontmatterSettings(
				frontmatter,
				this.settings,
				repo.repository
			);

			const frontmatterRepository = frontmatterSettingsRepository(
				this.plugin,
				repo.repository
			);
			const frontmatterSettings = merge.withOptions(
				{ allowUndefinedOverrides: false },
				frontmatterRepository,
				frontmatterSettingsFromFile
			);
			let embedFiles = shareFiles.getSharedEmbed(file, frontmatterSettings);
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
					prop: repo.frontmatter,
				},
				repository: repo.repository,
				filepath: getReceiptFolder(file, repo.repository, this.plugin, repo.frontmatter),
			};
			text = await mainConverting(text, file, frontmatter, linkedFiles, multiProperties);
			const path = multiProperties.filepath;
			const prop = Array.isArray(repo.frontmatter)
				? repo.frontmatter
				: [repo.frontmatter];
			let multiRepMsg = "";
			for (const repo of prop) {
				multiRepMsg += `[${repo.owner}/${repo.repo}/${repo.branch}] `;
			}
			const msg = `Publishing ${file.name} to ${multiRepMsg}`;
			this.console.logs({}, msg);
			const fileDeleted: Deleted[] = [];
			const updated: UploadedFiles[][] = [];
			const fileError: string[] = [];
			for (const repo of prop) {
				const monoProperties: MonoProperties = {
					plugin: this.plugin,
					frontmatter: {
						general: frontmatterSettings,
						prop: repo,
						source: sourceFrontmatter,
					},
					repository: multiProperties.repository,
					filepath: multiProperties.filepath,
				};
				const deleted = await this.uploadOnMultipleRepo(
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
			this.console.logs({ e: true }, e);
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
		properties: MonoProperties
	) {
		const load = this.plugin.addStatusBarItem();
		//add a little load icon from lucide icons, using SVG
		load.createEl("span", { cls: ["enveloppe", "loading", "icons"] });
		setIcon(load, "loader");
		load.createEl("span", {
			text: i18next.t("statusBar.loading"),
			cls: ["enveloppe", "loading", "icons"],
		});
		embedFiles = await this.cleanLinkedImageIfAlreadyInRepo(embedFiles, properties);
		const repo = properties.frontmatter.prop;
		this.console.notif(
			{},
			`Upload ${file.name}:${path} on ${repo.owner}/${repo.repo}:${this.branchName}`
		);
		const notifMob = this.console.noticeMobile(
			"wait",
			"loader",
			i18next.t("statusBar.loading")
		);
		let deleted: Deleted = {
			success: false,
			deleted: [],
			undeleted: [],
		};
		load.remove();
		notifMob?.hide();
		const uploaded: UploadedFiles | undefined = await this.uploadText(
			text,
			path,
			file.name,
			repo
		);
		if (!uploaded) {
			return {
				deleted,
				uploaded: [],
				error: [
					`Error while uploading ${file.name} to ${repo.owner}/${repo.repo}/${repo.branch}`,
				],
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
			deleted = await deleteFromGithub(true, this.branchName, shareFiles, {
				frontmatter: repo,
				repository: properties.repository,
				convert: properties.frontmatter.general,
			});
		}
		return {
			deleted,
			uploaded: embeddedUploaded,
			error: embeded.error,
		};
	}

	/**
	 * Upload file to GitHub
	 * @param {string} content Contents of the file sent
	 * @param {string} title for commit message, name of the file
	 * @param {string} path path in GitHub
	 * @param {Properties} prop frontmatter settings
	 */

	async upload(content: string, path: string, title: string = "", prop: Properties) {
		if (!prop.repo) {
			new Notice(
				"Config error : You need to define a github repo in the plugin settings"
			);
			throw {};
		}
		if (!prop.owner) {
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
			owner: prop.owner,
			repo: prop.repo,
			path,
			message: `Adding ${title}`,
			content,
			sha: "",
			branch: this.branchName,
		};
		const result: UploadedFiles = {
			isUpdated: false,
			file: title,
		};
		try {
			const response = await octokit.request(
				"GET /repos/{owner}/{repo}/contents/{path}",
				{
					owner: prop.owner,
					repo: prop.repo,
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
			this.console.logs({}, i18next.t("error.normal"));
		}

		payload.message = msg;
		await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", payload);
		return result;
	}

	/**
	 * Convert image in base64 and upload it to GitHub
	 */

	async uploadImage(imageFile: TFile, properties: MonoProperties) {
		let imageBin = await this.vault.readBinary(imageFile);
		const prop = properties.frontmatter.prop;
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
			this.plugin,
			properties.frontmatter.general,
			properties.frontmatter.prop
		);
		if (this.settings.github.dryRun.enable) {
			const folderName = this.settings.github.dryRun.folderName
				.replace("{{repo}}", prop.repo)
				.replace("{{branch}}", prop.branch)
				.replace("{{owner}}", prop.owner);
			const dryRunPath = normalizePath(`${folderName}/${path}`);
			const isAlreadyExist = this.vault.getAbstractFileByPath(dryRunPath);
			if (isAlreadyExist && isAlreadyExist instanceof TFile) {
				const needToByUpdated = isAlreadyExist.stat.mtime > imageFile.stat.mtime;
				if (needToByUpdated) {
					this.vault.modifyBinary(isAlreadyExist, imageBin);
				}
				return {
					isUpdated: needToByUpdated,
					file: imageFile.name,
				};
			}
			const folder = dryRunPath.split("/").slice(0, -1).join("/");
			const folderExists = this.vault.getAbstractFileByPath(folder);
			if (!folderExists || !(folderExists instanceof TFolder))
				await this.vault.createFolder(folder);
			await this.vault.createBinary(dryRunPath, imageBin);
			return {
				isUpdated: true,
				file: imageFile.name,
			};
		}
		return await this.upload(image64, path, "", properties.frontmatter.prop);
	}

	/**
	 * Convert text contents to base64
	 * @param {string} text contents of the note
	 * @param {string} path new Path in GitHub
	 * @param {string} title name note for message commit
	 * @param {Properties} prop frontmatter settings
	 * @return {Promise<void>}
	 */

	async uploadText(
		text: string,
		path: string,
		title: string = "",
		prop: Properties
	): Promise<UploadedFiles | undefined> {
		if (this.settings.github.dryRun.enable) {
			//create a new file in the vault
			const folderName = this.settings.github.dryRun.folderName
				.replace("{{repo}}", prop.repo)
				.replace("{{branch}}", prop.branch)
				.replace("{{owner}}", prop.owner);

			const newPath = normalizePath(`${folderName}/${path}`);
			const isAlreadyExist = this.vault.getAbstractFileByPath(newPath);
			if (isAlreadyExist && isAlreadyExist instanceof TFile) {
				//modify
				await this.vault.modify(isAlreadyExist, text);
				return {
					isUpdated: true,
					file: title,
				};
			} //create
			const folder = newPath.split("/").slice(0, -1).join("/");
			const folderExists = this.vault.getAbstractFileByPath(folder);
			if (!folderExists || !(folderExists instanceof TFolder))
				await this.vault.createFolder(folder);
			await this.vault.create(newPath, text);
			return {
				isUpdated: false,
				file: title,
			};
		}
		try {
			const contentBase64 = Base64.encode(text).toString();
			return await this.upload(contentBase64, path, title, prop);
		} catch (e) {
			this.console.notif({ e: true }, e);
			return undefined;
		}
	}

	/**
	 * Upload the metadataExtractor json file
	 * @param {MetadataExtractor} metadataExtractor metadataExtractor
	 * @param {Properties | Properties[]} prop frontmatter settings
	 * @return {Promise<void>}
	 */

	async uploadMetadataExtractorFiles(
		metadataExtractor: MetadataExtractor,
		prop: Properties | Properties[]
	): Promise<void> {
		if (metadataExtractor) {
			if (this.settings.github.dryRun.enable) return;
			for (const file of Object.values(metadataExtractor)) {
				if (file) {
					const contents = await this.vault.adapter.read(file);
					const path = `${this.settings.upload.metadataExtractorPath}/${file
						.split("/")
						.pop()}`;
					prop = Array.isArray(prop) ? prop : [prop];
					for (const repo of prop) {
						await this.uploadText(contents, path, file.split("/").pop(), repo);
					}
				}
			}
		}
	}

	/**
	 * Allow to activate a workflow dispatch github actions
	 * @param {Properties} prop frontmatter settings
	 * @return {Promise<boolean>}
	 */

	async workflowGestion(prop: Properties): Promise<boolean> {
		if (this.settings.github.dryRun.enable) return false;
		let finished = false;
		if (prop.workflowName.length === 0) {
			return false;
		}
		const octokit = this.octokit;
		await octokit.request(
			"POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
			{
				owner: prop.owner,
				repo: prop.repo,
				// biome-ignore lint/style/useNamingConvention: GitHub API :(
				workflow_id: prop.workflowName,
				ref: prop.branch,
			}
		);
		while (!finished) {
			// biome-ignore lint/correctness/noUndeclaredVariables: directly build with obsidianAPI
			await sleep(10000);
			const workflowGet = await octokit.request(
				"GET /repos/{owner}/{repo}/actions/runs",
				{
					owner: prop.owner,
					repo: prop.repo,
				}
			);
			if (workflowGet.data.workflow_runs.length > 0) {
				const build = workflowGet.data.workflow_runs.find(
					(run) => run.name === prop.workflowName.replace(".yml", "").replace(".yaml", "")
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
		properties: MonoProperties
	): Promise<TFile[]> {
		const newLinkedFiles: TFile[] = [];
		for (const file of embedFiles) {
			if (isAttachment(file.name, this.settings.embed.unHandledObsidianExt)) {
				const imagePath = getImagePath(
					file,
					this.plugin,
					properties.frontmatter.general,
					properties.frontmatter.prop
				);
				const prop = properties.frontmatter;
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
							owner: prop.prop.owner,
							repo: prop.prop.repo,
							path: imagePath,
							ref: this.branchName,
						}
					);
					if (response.status === 200) {
						const reply = await this.octokit.request(
							"GET /repos/{owner}/{repo}/commits",
							{
								owner: prop.prop.owner,
								repo: prop.prop.repo,
								path: imagePath,
								sha: this.branchName,
							}
						);
						if (reply.status === 200) {
							const data = reply.data;
							const lastEditedInRepo = data[0]?.commit?.committer?.date;
							const lastEditedDate = lastEditedInRepo
								? new Date(lastEditedInRepo)
								: undefined;
							const lastEditedAttachment = new Date(file.stat.mtime);
							//if the file in the vault is newer than the file in the repo, push it
							if (
								(lastEditedDate && lastEditedAttachment > lastEditedDate) ||
								!lastEditedDate
							) {
								newLinkedFiles.push(file);
							} else
								this.console.logs(
									{},
									i18next.t("error.alreadyExists", { file: file.name })
								);
						}
					}
				} catch (_e) {
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
