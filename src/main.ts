import {FrontMatterCache, Menu, Plugin, TFile} from "obsidian";
import {GithubPublisherSettingsTab} from "./settings";
import {
	DEFAULT_SETTINGS,
	GitHubPublisherSettings,
	GithubTiersVersion,
	RepoFrontmatter, Repository,
} from "./settings/interface";
import { OldSettings } from "./settings/migrate";
import { getRepoFrontmatter, verifyRateLimitAPI } from "./src/utils";
import {GithubBranch} from "./publish/branch";
import {Octokit} from "@octokit/core";
import {isShared} from "./src/data_validation_test";
import {
	shareOneNote,
	shareOnlyEdited
} from "./commands/commands";
import i18next from "i18next";
import {getTitleField, regexOnFileName} from "./conversion/filePath";
import { ressources, translationLanguage } from "./i18n/i18next";
import {migrateSettings} from "./settings/migrate";
import {ChooseWhichRepoToRun} from "./settings/modals/commandsModals";
import {
	createLinkCommands,
	deleteCommandsOnRepo,
	publisherOneCall,
	publisherPublishAll, publisherUploadAllEditedNew, publisherUploadEdited,
	publisherUploadNew, repositoryValidityCallback
} from "./commands/callback";

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

	async chargeAllCommands(repo: Repository|null, plugin: GithubPublisher, branchName: string) {
		if (plugin.settings.plugin.copyLink.addCmd) {
			this.addCommand(createLinkCommands(repo, branchName, this));
		}
		this.addCommand(await publisherOneCall(repo, this, branchName));
		this.addCommand(await deleteCommandsOnRepo(this, repo, branchName));
		this.addCommand(await publisherPublishAll(repo, branchName));
		this.addCommand(await publisherUploadNew(repo, branchName));
		this.addCommand(await publisherUploadAllEditedNew(repo, branchName));
		this.addCommand(await publisherUploadEdited(repo, branchName, this));
		this.addCommand(await repositoryValidityCallback(this, repo, branchName));
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
		await this.chargeAllCommands(null, this, branchName);

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
		
		const repoWithShortcuts = this.settings.github.otherRepo.filter((repo) => repo.createShortcuts);
		for (const repo of repoWithShortcuts) {
			await this.chargeAllCommands(repo, this, branchName);
		}
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
