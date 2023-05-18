import {FrontMatterCache, Menu, Notice, Plugin, TFile} from "obsidian";
import {GithubPublisherSettingsTab} from "./settings";
import {
	DEFAULT_SETTINGS,
	FolderSettings,
	GitHubPublisherSettings,
	GithubTiersVersion,
	RepoFrontmatter, Repository,
} from "./settings/interface";
import { OldSettings } from "./settings/migrate";
import { getRepoFrontmatter, createLink, verifyRateLimitAPI } from "./src/utils";
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
import {getTitleField, regexOnFileName} from "./conversion/filePath";
import { ressources, translationLanguage } from "./i18n/i18next";
import {migrateSettings} from "./settings/migrate";
import {ChooseWhichRepoToRun} from "./settings/modals/commandsModals";

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

	async shareActiveFileCommands(repo: Repository, branchName: string) {
		this.addCommand({
			id: `publisher-one-on-${repo.smartKey}`,
			name: i18next.t("commands.shareActiveFile"),
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
							null,
							this.app.metadataCache,
							this.app.vault
						);
					}
					return true;
				}
				return false;
			},
		});
	}
	
	createLinkCommands(repo: Repository, branchName: string) {
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
							getRepoFrontmatter(this.settings, repo, frontmatter),
							this.app.metadataCache,
							this.app.vault,
							this.settings
						);
						new Notice(i18next.t("settings.plugin.copyLink.command.onActivation"));
					}
					return true;
				}
				return false;
			},
		});
	}
	
	createLinkOnActiveFile(branchName: string, repo: Repository) {
		const file = this.app.workspace.getActiveFile();
		const frontmatter = file ? this.app.metadataCache.getFileCache(file).frontmatter : null;
		if (
			file && frontmatter && isShared(frontmatter, this.settings, file)
		) {
			createLink(
				file,
				getRepoFrontmatter(this.settings, repo, frontmatter),
				this.app.metadataCache,
				this.app.vault,
				this.settings
			);
			new Notice(i18next.t("settings.plugin.copyLink.command.onActivation"));
		}
	}
	
	async shareActiveFile(repo: Repository | null, branchName: string) {
		const file = this.app.workspace.getActiveFile();
		const frontmatter = file ? this.app.metadataCache.getFileCache(file)?.frontmatter : null;
		if (file && frontmatter && isShared(frontmatter, this.settings, file)) {
			await shareOneNote(
				branchName,
				this.reloadOctokit(),
				this.settings,
				file,
				repo,
				this.app.metadataCache,
				this.app.vault,
			);
		} else {
			new Notice("No file is active or the file is not shared");
		}
	}
	
	async deleteCommands(repo: Repository, branchName: string) {
		const repoFrontmatter = getRepoFrontmatter(this.settings, repo);
		const publisher = this.reloadOctokit();
		await deleteUnsharedDeletedNotes(
			publisher,
			this.settings,
			publisher.octokit,
			branchName,
			repoFrontmatter as RepoFrontmatter,
		);
	}

	async deleteCommandsOnRepo(repo: Repository, branchName: string) {
		this.addCommand({
			id: `publisher-delete-clean-${repo.smartKey}`,
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
	}
	
	async uploadAllNotes(repo: Repository, branchName: string) {
		const statusBarItems = this.addStatusBarItem();
		const publisher = this.reloadOctokit();
		const sharedFiles = publisher.getSharedFiles();
		await shareAllMarkedNotes(
			publisher,
			this.settings,
			publisher.octokit,
			statusBarItems,
			branchName,
			getRepoFrontmatter(this.settings, repo) as RepoFrontmatter,
			sharedFiles,
			true,
			this,
			repo
		);
	}
	
	async uploadNewNotes(branchName: string, repo: Repository|null) {
		const publisher = this.reloadOctokit();
		await shareNewNote(
			publisher,
			publisher.octokit,
			branchName,
			this.app.vault,
			this,
			getRepoFrontmatter(this.settings, repo) as RepoFrontmatter,
			repo
		);
	}

	async repositoryValidityCallback(repo: Repository, branchName: string) {
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
							repo,
							this.app.workspace.getActiveFile(),
							this.app.metadataCache);
					}
					return true;
				}
				return false;
			},
		});
	}

	async repositoryValidityActiveFile(branchName: string, repo: Repository) {
		const file = this.app.workspace.getActiveFile();
		if (file) {
			await checkRepositoryValidity(
				branchName,
				this.reloadOctokit(),
				this.settings,
				repo,
				file,
				this.app.metadataCache);
		} else {
			new Notice("No file is active");
		}
	}
	
	async uploadAllEditedNotes(branchName: string, repo: Repository|null=null) {
		const publisher = this.reloadOctokit();
		await shareAllEditedNotes(
			publisher,
			publisher.octokit,
			branchName,
			this.app.vault,
			this,
			getRepoFrontmatter(this.settings, repo) as RepoFrontmatter,
			repo
		);
	}

	/**
	 * Create a new instance of Octokit to load a new instance of GithubBranch 
	*/
	reloadOctokit() {
		let octokit: Octokit;
		const apiSettings = this.settings.github.api;
		if (apiSettings.tiersForApi === GithubTiersVersion.entreprise && apiSettings.hostname.length > 0) {
			octokit = new Octokit(
				{
					baseUrl: `${apiSettings.hostname}/api/v3`,
					auth: this.settings.github.token,
				});
		} else {
			octokit = new Octokit({auth: this.settings.github.token});
		}
		return new GithubBranch(
			this.settings,
			octokit,
			this.app.vault,
			this.app.metadataCache,
			this
		);
	}
	
	async shareEditedOnly(branchName: string, repo: Repository|null) {
		const publisher = this.reloadOctokit();
		await shareOnlyEdited(
			publisher,
			publisher.octokit,
			branchName,
			this.app.vault,
			this,
			getRepoFrontmatter(this.settings, repo) as RepoFrontmatter,
			null
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
		this.addSettingTab(new GithubPublisherSettingsTab(this.app, this, branchName));
		
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
									null,
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
				const frontmatter = view.file instanceof TFile ? this.app.metadataCache.getFileCache(view.file).frontmatter : null;
				if (
					frontmatter && 
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
									null,
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
								getRepoFrontmatter(this.settings, null, frontmatter),
								this.app.metadataCache,
								this.app.vault,
								this.settings
							);
							new Notice(i18next.t("settings.plugin.copyLink.command.onActivation"));
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
							null,
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
				await this.uploadAllNotes(null, branchName);
			},
		});

		this.addCommand({
			id: "publisher-upload-new",
			name: i18next.t("commands.uploadNewNotes") ,
			callback: async () => {
				await this.uploadNewNotes(branchName, null);
			},
		});

		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: i18next.t("commands.uploadAllNewEditedNote") ,
			callback: async () => {
				await this.uploadAllEditedNotes(branchName, null);
			},
		});

		this.addCommand({
			id: "publisher-upload-edited",
			name: i18next.t("commands.uploadAllEditedNote") ,
			callback: async () => {
				await this.shareEditedOnly(branchName, null);
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
							null,
							this.app.workspace.getActiveFile(),
							this.app.metadataCache);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "check-rate-limit",
			name: i18next.t("commands.checkValidity.rateLimit.command"),
			callback: async () => {
				await verifyRateLimitAPI(this.reloadOctokit().octokit, this.settings);
			}
		});

		this.addCommand({
			id: "run-cmd-for-repo",
			name: "Run command for a repository",
			callback: async () => {
				new ChooseWhichRepoToRun(this.app, this, branchName).open();
			}
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
