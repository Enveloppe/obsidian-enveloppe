import {Octokit} from "@octokit/core";
import i18next from "i18next";
import {FrontMatterCache, Menu, Plugin, TAbstractFile, TFile, TFolder} from "obsidian";
import merge from "ts-deepmerge";

import {
	checkRepositoryValidityCallback,
	createLinkCallback,
	purgeNotesRemoteCallback,
	shareEditedOnlyCallback,
	shareOneNoteCallback,
	uploadAllEditedNotesCallback, 	uploadAllNotesCallback, 	uploadNewNotesCallback} from "./commands/callback";
import {addMenuFile, addMenuFolder} from "./commands/file_menu";
import {ChooseWhichRepoToRun} from "./commands/suggest_other_repo_commands_modal";
import {getTitleField, regexOnFileName} from "./conversion/file_path";
import {GithubBranch} from "./GitHub/branch";
import { resources, translationLanguage } from "./i18n/i18next";
import {GithubPublisherSettingsTab} from "./settings";
import {
	DEFAULT_SETTINGS,
	GitHubPublisherSettings,
	GithubTiersVersion,
	Repository,
} from "./settings/interface";
import { migrateSettings,OldSettings } from "./settings/migrate";
import {createTokenPath, logs, monkeyPatchConsole, notif} from "./utils";
import {checkRepositoryValidity, verifyRateLimitAPI} from "./utils/data_validation_test";

/**
 * Main class of the plugin
 * @extends Plugin
 */

export default class GithubPublisher extends Plugin {
	settings!: GitHubPublisherSettings;
	branchName: string = "";

	/**
	 * Get the title field of a file
	 * @param {TFile} file - The file to get the title field from
	 * @param {FrontMatterCache} frontmatter - The frontmatter of the file
	 * @return {string} - The title field of the file
	 */
	getTitleFieldForCommand(file:TFile, frontmatter: FrontMatterCache | undefined | null): string {
		return regexOnFileName(getTitleField(frontmatter, file, this.settings), this.settings);
	}

	async chargeAllCommands(repo: Repository|null, plugin: GithubPublisher) {
		if (plugin.settings.plugin.copyLink.addCmd) {
			this.addCommand(await createLinkCallback(repo, this));
		}
		this.addCommand(await shareOneNoteCallback(repo, this, this.branchName));
		if (plugin.settings.upload.autoclean.enable) {
			logs({settings: this.settings}, "Adding purge command");
			this.addCommand(await purgeNotesRemoteCallback(this, repo, this.branchName));
		}
		this.addCommand(await uploadAllNotesCallback(this, repo, this.branchName));
		this.addCommand(await uploadNewNotesCallback(this, repo, this.branchName));
		this.addCommand(await uploadAllEditedNotesCallback(this, repo, this.branchName));
		this.addCommand(await shareEditedOnlyCallback(repo, this.branchName, this));
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
				if (repoCmd.startsWith("K") && repo.smartKey === repoCmd.replace("K", "")) {
					//@ts-ignore
					this.app.commands.removeCommand(command.id);
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
				const commandName = command.id.replace("obsidian-mkdocs-publisher:", "");
				//repo will be the last element of the array
				const repoCmd = commandName.split("-")[commandName.split("-").length - 1];
				if (repoCmd.startsWith("K")) {
					const repoIndex = allRepo.findIndex((repo) => repo.smartKey === repoCmd.replace("K", ""));
					if (repoIndex === -1) {
						//@ts-ignore
						this.app.commands.removeCommand(command.id);
					}
				}
				if (!this.settings.upload.autoclean.enable) {
					if (commandName === "publisher-delete-clean") {
						logs({settings: this.settings}, "Removing purge/clean commands");
						//@ts-ignore
						this.app.commands.removeCommand(command.id);
					}
				}
			}
		}
	}

	async reloadCommands() {
		//compare old and new repo to delete old commands
		logs({settings: this.settings}, "Reloading commands");
		const newRepo:Repository[] = this.settings.github?.otherRepo ?? [];
		this.cleanOldCommands();
		for (const repo of newRepo) {
			if (repo.createShortcuts) {
				await this.chargeAllCommands(repo, this);
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
			if (tokenPath.endsWith(".json")) {
				const tokenJSON = JSON.parse(tokenFile);
				return tokenJSON.GITHUB_PUBLISHER_TOKEN;
			}
			if (tokenFile) {
				return tokenFile.split("=")[1];
			}
		} catch (e) {
			notif({settings: this.settings, e: true}, e);
			return "";
		}
		return "";
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
			octokit,
			this,
		);
	}



	/**
	 * Function called when the plugin is loaded
	 * @return {Promise<void>}
	 */
	async onload(): Promise<void> {
		console.info(`[GITHUB PUBLISHER] v.${this.manifest.version} (lang: ${translationLanguage}) loaded`);
		await this.loadSettings();

		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
		});



		const oldSettings = this.settings;
		await migrateSettings(oldSettings as unknown as OldSettings, this);

		this.branchName =
			this.app.vault.getName().replaceAll(" ", "-").replaceAll(".", "-") +
			"-" +
			new Date().toLocaleDateString("en-US").replace(/\//g, "-");
		this.addSettingTab(new GithubPublisherSettingsTab(this.app, this, this.branchName));
		// verify rate limit

		if (!this.settings.github.verifiedRepo && (await this.loadToken()) !== "") {
			const octokit = await this.reloadOctokit();
			this.settings.github.verifiedRepo = await checkRepositoryValidity(octokit, null, null, true);
			this.settings.github.rateLimit = await verifyRateLimitAPI(octokit.octokit, this.settings, false);
			await this.saveSettings();
		}

		this.registerEvent(
			//@ts-ignore
			this.app.workspace.on("file-menu", (menu: Menu, folder: TAbstractFile) => {
				if (this.settings.plugin.fileMenu && folder instanceof TFolder) {
					addMenuFolder(menu, folder, this.branchName, this);
				} else if (folder instanceof TFile) {
					addMenuFile(this, folder, this.branchName, menu);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				if (view.file) addMenuFile(this, view.file, this.branchName, menu);
			})
		);
		await this.chargeAllCommands(null, this);

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
					new ChooseWhichRepoToRun(this.app, this, this.branchName).open();
				}
			});
		}

		const repoWithShortcuts = this.settings.github.otherRepo.filter((repo) => repo.createShortcuts);
		for (const repo of repoWithShortcuts) {
			await this.chargeAllCommands(repo, this);
		}

		monkeyPatchConsole(this);
	}

	/**
	 * Called when the plugin is disabled
	 */
	onunload() {
		console.info("[Github Publisher] unloaded");
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		try {
			this.settings = merge(DEFAULT_SETTINGS, loadedData) as unknown as GitHubPublisherSettings;
		} catch (e) {
			console.warn("[Github Publisher] Error while deep merging settings, using default loading method");
			this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		}
	}

	/**
	 * Save the settings of the plugin
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
