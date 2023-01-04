import { Plugin, TFile, Menu, FrontMatterCache } from "obsidian";
import { GithubPublisherSettings } from "./settings";
import { GitHubPublisherSettings } from "./settings/interface";
import {
	DEFAULT_SETTINGS,
	RepoFrontmatter,
} from "./settings/interface";
import {
	convertOldSettings,
	disablePublish,
	getRepoFrontmatter,
} from "./src/utils";
import { GithubBranch } from "./publishing/branch";
import { Octokit } from "@octokit/core";
import {
	deleteUnsharedDeletedNotes,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote,
	shareOnlyEdited,
	checkRepositoryValidity
} from "./commands";
import {StringFunc, commands, translationLanguage, t} from "./i18n";
import {getTitleField, regexOnFileName} from "./contents_conversion/filePathConvertor";

/**
 * Main class of the plugin
 * @extends Plugin
 */

export default class GithubPublisher extends Plugin {
	settings: GitHubPublisherSettings;

	getTitleFieldForCommand(file:TFile, frontmatter: FrontMatterCache): string {
		return regexOnFileName(getTitleField(frontmatter, file, this.settings), this.settings);
	}

	/**
	 * Function called when the plugin is loaded
	 * @return {Promise<void>}
	 */
	async onload() {
		console.log(
			`Github Publisher v.${this.manifest.version} (lang: ${translationLanguage}) loaded`
		);
		await this.loadSettings();
		const octokit = new Octokit({ auth: this.settings.GhToken });
		const PublisherManager = new GithubBranch(
			this.settings,
			octokit,
			this.app.vault,
			this.app.metadataCache,
			this
		);
		await convertOldSettings("ExcludedFolder", this);
		await convertOldSettings("autoCleanUpExcluded", this);

		const branchName =
			app.vault.getName().replaceAll(" ", "-").replaceAll(".", "-") +
			"-" +
			new Date().toLocaleDateString("en-US").replace(/\//g, "-");
		const repo = getRepoFrontmatter(this.settings) as RepoFrontmatter;
		this.addSettingTab(new GithubPublisherSettings(this.app, this, branchName, PublisherManager));

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				if (
					disablePublish(this.app, this.settings, file) &&
					this.settings.fileMenu
				) {
					const fileName = this.getTitleFieldForCommand(file,this.app.metadataCache.getFileCache(file).frontmatter).replace(".md", "");
					menu.addItem((item) => {
						item.setSection("action");
						item.setTitle(
							(commands("shareViewFiles") as StringFunc)(
								fileName
							)
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(
									branchName,
									PublisherManager,
									this.settings,
									file,
									this.app.metadataCache,
									this.app.vault
								);
							});
					});
					menu.addSeparator();
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				if (
					disablePublish(this.app, this.settings, view.file) &&
					this.settings.editorMenu
				) {
					const fileName = this.getTitleFieldForCommand(view.file,this.app.metadataCache.getFileCache(view.file).frontmatter).replace(".md", "");
					menu.addSeparator();
					menu.addItem((item) => {
						item.setSection("mkdocs-publisher");
						item.setTitle(
							(commands("shareViewFiles") as StringFunc)(
								fileName
							)
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(
									branchName,
									PublisherManager,
									this.settings,
									view.file,
									this.app.metadataCache,
									this.app.vault
								);
							});
					});
				}
			})
		);
		if (this.settings.shareExternalModified) {
			this.registerEvent(
				this.app.vault.on("modify", async (file: TFile) => {
					if (file !== this.app.workspace.getActiveFile()) {
						const frontmatter = this.app.metadataCache.getFileCache(
							file).frontmatter;
						const isShared = frontmatter ? frontmatter[this.settings.shareKey] : false;
						if (isShared) {
							await shareOneNote(
								branchName,
								PublisherManager,
								this.settings,
								file,
								this.app.metadataCache,
								this.app.vault
							);
						}
					}
				})
			);
		}

		this.addCommand({
			id: "publisher-one",
			name: commands("shareActiveFile") as string,
			hotkeys: [],
			checkCallback: (checking) => {
				if (
					disablePublish(
						this.app,
						this.settings,
						this.app.workspace.getActiveFile()
					)
				) {
					if (!checking) {
						shareOneNote(
							branchName,
							PublisherManager,
							this.settings,
							this.app.workspace.getActiveFile(),
							this.app.metadataCache,
							this.app.vault
						);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-delete-clean",
			name: commands("publisherDeleteClean") as string,
			hotkeys: [],
			checkCallback: (checking) => {
				if (this.settings.autoCleanUp) {
					if (!checking) {
						deleteUnsharedDeletedNotes(
							PublisherManager,
							this.settings,
							octokit,
							branchName,
							repo
						);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-publish-all",
			name: commands("uploadAllNotes") as string,
			callback: async () => {
				const sharedFiles = PublisherManager.getSharedFiles();
				const statusBarItems = this.addStatusBarItem();
				await shareAllMarkedNotes(
					PublisherManager,
					this.settings,
					octokit,
					statusBarItems,
					branchName,
					repo,
					sharedFiles,
					true
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-new",
			name: commands("uploadNewNotes") as string,
			callback: async () => {
				await shareNewNote(
					PublisherManager,
					octokit,
					branchName,
					this.app.vault,
					this,
					repo
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: commands("uploadAllNewEditedNote") as string,
			callback: async () => {
				await shareAllEditedNotes(
					PublisherManager,
					octokit,
					branchName,
					this.app.vault,
					this,
					repo
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-edited",
			name: commands("uploadAllEditedNote") as string,
			callback: async () => {
				await shareOnlyEdited(
					PublisherManager,
					octokit,
					branchName,
					this.app.vault,
					this,
					repo
				);
			},
		});

		this.addCommand({
			id: "check-this-repo-validy",
			name: t("commands.checkValidity.name") as string,
			checkCallback: (checking) => {
				if (this.app.workspace.getActiveFile())
				{
					if (!checking) {
						checkRepositoryValidity(
							branchName,
							PublisherManager,
							this.settings,
							this.app.workspace.getActiveFile(),
							this.app.metadataCache);
					}
					return true;
				}
				return false;
			},
		});
	}

	/**
	 * Called when the plugin is disabled
	 */
	onunload() {
		console.log("Github Publisher unloaded");
	}

	/**
	 * Get the settings of the plugin
	 * @return {Promise<void>}
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	/**
	 * Save the settings of the plugin
	 * @return {Promise<void>}
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
