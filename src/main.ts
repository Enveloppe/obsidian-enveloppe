import {FrontMatterCache, Menu, Plugin, TFile, TFolder} from "obsidian";
import {GithubPublisherSettingsTab} from "./settings";
import {
	DEFAULT_SETTINGS,
	GitHubPublisherSettings,
	GithubTiersVersion,
	Repository,
} from "./settings/interface";
import { OldSettings } from "./settings/migrate";
import {createTokenPath, noticeLog, verifyRateLimitAPI} from "./utils";
import {GithubBranch} from "./publish/branch";
import {Octokit} from "@octokit/core";
import {checkRepositoryValidity, getRepoSharedKey} from "./utils/data_validation_test";
import i18next from "i18next";
import {getTitleField, regexOnFileName} from "./conversion/file_path";
import { resources, translationLanguage } from "./i18n/i18next";
import {migrateSettings} from "./settings/migrate";
import {ChooseWhichRepoToRun} from "./commands/suggest_other_repo_commands_modal";
import {
	createLinkCallback,
	purgeNotesRemoteCallback,
	shareOneNoteCallback,
	uploadAllNotesCallback, uploadAllEditedNotesCallback, shareEditedOnlyCallback,
	uploadNewNotesCallback, checkRepositoryValidityCallback
} from "./commands/callback";
import {addSubMenuCommandsFolder, addMenuFile, shareFolderRepo, addMenuFolder} from "./commands/file_menu";

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
			this.addCommand(await createLinkCallback(repo, branchName, this));
		}
		this.addCommand(await shareOneNoteCallback(repo, this, branchName));
		this.addCommand(await purgeNotesRemoteCallback(this, repo, branchName));
		this.addCommand(await uploadAllNotesCallback(this, repo, branchName));
		this.addCommand(await uploadNewNotesCallback(this, repo, branchName));
		this.addCommand(await uploadAllEditedNotesCallback(this, repo, branchName));
		this.addCommand(await shareEditedOnlyCallback(repo, branchName, this));
		this.addCommand(await checkRepositoryValidityCallback(this, repo));
	}

	cleanSpecificCommands(repo: Repository) {
		//@ts-ignore
		const allCommands = this.app.commands.listCommands();
		for (const command of allCommands) {
			if (command.id.startsWith("obsidian-mkdocs-publisher")) {
				const publisherCMDsName = command.id.replace("obsidian-mkdocs-publisher:", "").split("-");
				//repo will be the last element of the array
				const repoCmd = publisherCMDsName[publisherCMDsName.length - 1];
				if (repoCmd.startsWith("K")) {
					if (repo.smartKey === repoCmd.replace("K", "")) {
						//@ts-ignore
						this.app.commands.removeCommand(command.id);
					}
				}
			}
		}
	}

	cleanOldCommands() {
		const allRepo:Repository[] = this.settings.github?.otherRepo ?? [];
		//@ts-ignore
		const allCommands = this.app.commands.listCommands();
		for (const command of allCommands) {
			if (command.id.startsWith("obsidian-mkdocs-publisher")) {
				const publisherCMDsName = command.id.replace("obsidian-mkdocs-publisher:", "").split("-");
				//repo will be the last element of the array
				const repoCmd = publisherCMDsName[publisherCMDsName.length - 1];
				if (repoCmd.startsWith("K")) {
					const repoIndex = allRepo.findIndex((repo) => repo.smartKey === repoCmd.replace("K", ""));
					if (repoIndex === -1) {
						//@ts-ignore
						this.app.commands.removeCommand(command.id);
					}
				}
			}
		}
	}
	
	async reloadCommands(branchName: string) {
		//compare old and new repo to delete old commands
		noticeLog("Reloading commands", this.settings);
		const newRepo:Repository[] = this.settings.github?.otherRepo ?? [];
		this.cleanOldCommands();
		for (const repo of newRepo) {
			if (repo.createShortcuts) {
				await this.chargeAllCommands(repo, this, branchName);
			} else {
				this.cleanSpecificCommands(repo);
			}
		}
	}

	/**
	 * Read the env file to get the token of the plugin
	 * Form of the file:
	 * ```
	 * GITHUB_TOKEN=token
	 * ```
	 * @returns {Promise<string>} - The token of the plugin
	 */
	
	async loadToken(): Promise<string> {
		const tokenPath = createTokenPath(this, this.settings.github.tokenPath);

		const tokenFileExists = await this.app.vault.adapter.exists(`${tokenPath}`);
		if (!tokenFileExists) {
			return "";
		}
		try {
			const tokenFile = await this.app.vault.adapter.read(`${tokenPath}`);
			if (tokenFile) {
				return tokenFile.split("=")[1]; 
			}
		} catch (e) {
			return "";
		}
	}

	/**
	 * Create a new instance of Octokit to load a new instance of GithubBranch 
	*/
	async reloadOctokit() {
		let octokit: Octokit;
		const apiSettings = this.settings.github.api;
		const token = await this.loadToken();
		if (apiSettings.tiersForApi === GithubTiersVersion.entreprise && apiSettings.hostname.length > 0) {
			octokit = new Octokit(
				{
					baseUrl: `${apiSettings.hostname}/api/v3`,
					auth: token,
				});
		} else {
			octokit = new Octokit({auth: token});
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
		console.log(`[GITHUB PUBLISHER] v.${this.manifest.version} (lang: ${translationLanguage}) loaded`);
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources: resources,
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
		// verify rate limit
		const octokit = await this.reloadOctokit();
		if (!this.settings.github.verifiedRepo) {
			this.settings.github.verifiedRepo = await checkRepositoryValidity(octokit, this.settings, null, null, this.app.metadataCache);
			this.settings.github.rateLimit = await verifyRateLimitAPI(octokit.octokit, this.settings);
			await this.saveSettings();
		}
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				addMenuFile(this, file, branchName, menu);
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, folder: TFolder) => {
				if (this.settings.plugin.fileMenu && folder instanceof TFolder) {
					addMenuFolder(menu, folder, branchName, this);
				}
			})
		);
		
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				addMenuFile(this, view.file, branchName, menu);
			})
		);
		await this.chargeAllCommands(null, this, branchName);

		this.addCommand({
			id: "check-rate-limit",
			name: i18next.t("commands.checkValidity.rateLimit.command"),
			callback: async () => {
				const octokit = await this.reloadOctokit();
				this.settings.github.rateLimit = await verifyRateLimitAPI(octokit.octokit, this.settings);
				await this.saveSettings();
			}
		});


		if (this.settings.github.otherRepo.length > 0) {
			this.addCommand({
				id: "run-cmd-for-repo",
				name: i18next.t("commands.runOtherRepo.title"),
				callback: async () => {
					new ChooseWhichRepoToRun(this.app, this, branchName).open();
				}
			});
		}
		
		const repoWithShortcuts = this.settings.github.otherRepo.filter((repo) => repo.createShortcuts);
		for (const repo of repoWithShortcuts) {
			await this.chargeAllCommands(repo, this, branchName);
		}
	}

	/**
	 * Called when the plugin is disabled
	 */
	onunload() {
		console.log("[Github Publisher] unloaded");
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
