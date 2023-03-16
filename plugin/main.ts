import {FrontMatterCache, Menu, Plugin, TFile} from "obsidian";
import {GithubPublisherSettings} from "./settings";
import {
	DEFAULT_SETTINGS,
	FolderSettings,
	GitHubPublisherSettings,
	GithubTiersVersion,
	RepoFrontmatter,
} from "./settings/interface";
import { OldSettings } from "./settings/migrate";
import { getRepoFrontmatter, createLink } from "./src/utils";
import {GithubBranch} from "./publish/branch";
import {Octokit} from "@octokit/core";
import {checkRepositoryValidity, isShared} from "./src/data_validation_test";
import {
	deleteUnsharedDeletedNotes,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote,
	shareOnlyEdited
} from "./commands";
import i18next from "i18next";
import {getTitleField, regexOnFileName} from "./conversion/filePathConvertor";
import { ressources, translationLanguage } from "./i18n/i18next";
import {migrateSettings} from "./settings/migrate";

/**
 * Main class of the plugin
 * @extends Plugin
 */

export default class GithubPublisher extends Plugin {
	settings: GitHubPublisherSettings;

	/**
	 * Get the title field of a file
	 * @param {TFile} file - The file to get the title field from
	 * @param {FrontMatterCache} frontmatter - The frontmatter of the file
	 * @return {string} - The title field of the file
	 */
	getTitleFieldForCommand(file:TFile, frontmatter: FrontMatterCache): string {
		return regexOnFileName(getTitleField(frontmatter, file, this.settings), this.settings);
	}	
	/**
	 * Create a new instance of Octokit to load a new instance of GithubBranch 
	*/
	reloadOctokit() {
		let octokit: Octokit;
		const apiSettings = this.settings.github.api;
		const githubSettings = this.settings.github;
		if (apiSettings.tiersForApi === GithubTiersVersion.entreprise && apiSettings.hostname.length > 0) {
			octokit = new Octokit(
				{
					baseUrl: `${apiSettings.hostname}/api/v3`,
					auth: githubSettings.token,
				});
		} else {
			octokit = new Octokit({auth: githubSettings.token});
		}
		return new GithubBranch(
			this.settings,
			octokit,
			this.app.vault,
			this.app.metadataCache,
			this
		);
	}

			

	/**
	 * Function called when the plugin is loaded
	 * @return {Promise<void>}
	 */
	async onload() {
		console.log(
			`Github Publisher v.${this.manifest.version} (lang: ${translationLanguage}) loaded`
		);
		i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources: ressources,
			returnNull: false,
		});
		
		await this.loadSettings();
		
		const oldSettings = this.settings;
		await migrateSettings(oldSettings as unknown as OldSettings, this);
		const branchName =
			app.vault.getName().replaceAll(" ", "-").replaceAll(".", "-") +
			"-" +
			new Date().toLocaleDateString("en-US").replace(/\//g, "-");
		this.addSettingTab(new GithubPublisherSettings(this.app, this, branchName));
		
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				const frontmatter = file instanceof TFile ? this.app.metadataCache.getFileCache(file).frontmatter : null;
				if (
					isShared(frontmatter, this.settings, file) &&
					this.settings.plugin.fileMenu
				) {
					const fileName = this.getTitleFieldForCommand(file, this.app.metadataCache.getFileCache(file).frontmatter).replace(".md", "");
					menu.addItem((item) => {
						item.setSection("action");
						item.setTitle(
							(i18next.t("commands.shareViewFiles", {viewFile: fileName})))
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(
									branchName,
									this.reloadOctokit(),
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
				const frontmatter = this.app.metadataCache.getFileCache(view.file).frontmatter;
				if (
					isShared(frontmatter, this.settings, view.file) &&
					this.settings.plugin.editorMenu
				) {
					const fileName = this.getTitleFieldForCommand(view.file,this.app.metadataCache.getFileCache(view.file).frontmatter).replace(".md", "");
					menu.addSeparator();
					menu.addItem((item) => {
						item.setSection("mkdocs-publisher");
						item.setTitle(
							(i18next.t("commands.shareViewFiles", {viewFile: fileName}))
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(
									branchName,
									this.reloadOctokit(),
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
		if (this.settings.plugin.copyLink.addCmd) {
			this.addCommand({
				id: "publisher-copy-link",
				name: i18next.t("commands.copyLink"),
				hotkeys: [],
				checkCallback: (checking) => {
					const file = this.app.workspace.getActiveFile();
					const frontmatter = file ? this.app.metadataCache.getFileCache(file).frontmatter : null;
					if (
						file && frontmatter && isShared(frontmatter, this.settings, file)
					) {
						if (!checking) {
							createLink(
								file, 
								getRepoFrontmatter(this.settings, frontmatter),
								this.app.metadataCache,
								this.app.vault,
								this.settings
							);
						}
						return true;
					}
					return false;
				},
			});
		}

		this.addCommand({
			id: "publisher-one",
			name: i18next.t("commands.shareActiveFile") ,
			hotkeys: [],
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				const frontmatter = file ? this.app.metadataCache.getFileCache(file).frontmatter : null;
				if (
					file && frontmatter && isShared(frontmatter, this.settings, file)
				) {
					if (!checking) {
						shareOneNote(
							branchName,
							this.reloadOctokit(),
							this.settings,
							file,
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
			name: i18next.t("commands.publisherDeleteClean") ,
			hotkeys: [],
			checkCallback: (checking) => {
				if (this.settings.upload.autoclean.enable && this.settings.upload.behavior !== FolderSettings.fixed) {
					if (!checking) {
						const publisher = this.reloadOctokit();
						deleteUnsharedDeletedNotes(
							publisher,
							this.settings,
							publisher.octokit,
							branchName,
							getRepoFrontmatter(this.settings) as RepoFrontmatter,
						);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-publish-all",
			name: i18next.t("commands.uploadAllNotes") ,
			callback: async () => {
				const sharedFiles = this.reloadOctokit().getSharedFiles();
				const statusBarItems = this.addStatusBarItem();
				const publisher = this.reloadOctokit();
				await shareAllMarkedNotes(
					publisher,
					this.settings,
					publisher.octokit,
					statusBarItems,
					branchName,
					getRepoFrontmatter(this.settings) as RepoFrontmatter,
					sharedFiles,
					true,
					this
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-new",
			name: i18next.t("commands.uploadNewNotes") ,
			callback: async () => {
				const publisher = this.reloadOctokit();
				await shareNewNote(
					publisher,
					publisher.octokit,
					branchName,
					this.app.vault,
					this,
					getRepoFrontmatter(this.settings) as RepoFrontmatter,
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: i18next.t("commands.uploadAllNewEditedNote") ,
			callback: async () => {
				const publisher = this.reloadOctokit();
				await shareAllEditedNotes(
					publisher,
					publisher.octokit,
					branchName,
					this.app.vault,
					this,
					getRepoFrontmatter(this.settings) as RepoFrontmatter,
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-edited",
			name: i18next.t("commands.uploadAllEditedNote") ,
			callback: async () => {
				const publisher = this.reloadOctokit();
				await shareOnlyEdited(
					publisher,
					publisher.octokit,
					branchName,
					this.app.vault,
					this,
					getRepoFrontmatter(this.settings) as RepoFrontmatter,
				);
			},
		});

		this.addCommand({
			id: "check-this-repo-validy",
			name: i18next.t("commands.checkValidity.title") ,
			checkCallback: (checking) => {
				if (this.app.workspace.getActiveFile())
				{
					if (!checking) {
						checkRepositoryValidity(
							branchName,
							this.reloadOctokit(),
							this.settings,
							this.app.workspace.getActiveFile(),
							this.app.metadataCache);
					}
					return true;
				}
				return false;
			},
		});
		
		// get the trigger github:token-changed
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
