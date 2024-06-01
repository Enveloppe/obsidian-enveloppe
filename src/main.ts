import {
	DEFAULT_SETTINGS,
	type EnveloppeSettings,
	GithubTiersVersion,
	type Repository,
	type SetRepositoryFrontmatter,
} from "@interfaces";
import { Octokit } from "@octokit/core";
import dedent from "dedent";
import i18next from "i18next";
import {
	type FrontMatterCache,
	type Menu,
	normalizePath,
	Plugin,
	type TAbstractFile,
	TFile,
	TFolder,
} from "obsidian";
import {
	checkRepositoryValidityCallback,
	createLinkCallback,
	purgeNotesRemoteCallback,
	refreshAllSets,
	refreshOpenedSet,
	shareEditedOnlyCallback,
	shareOneNoteCallback,
	uploadAllEditedNotesCallback,
	uploadAllNotesCallback,
	uploadNewNotesCallback,
} from "src/commands";
import { addMenuFile, addMenuFolder } from "src/commands/file_menu";
import { ChooseWhichRepoToRun } from "src/commands/suggest_other_repo_commands_modal";
import { getTitleField, regexOnFileName } from "src/conversion/file_path";
import { GithubBranch } from "src/GitHub/branch";
import { resources, translationLanguage } from "src/i18n/i18next";
import { EnveloppeSettingsTab } from "src/settings";
import { migrateSettings, type OldSettings } from "src/settings/migrate";
import { createTokenPath } from "src/utils";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import merge from "ts-deepmerge";
import { Logs } from "./utils/logs";

/**
 * Main class of the plugin
 * @extends Plugin
 */

export default class Enveloppe extends Plugin {
	settings!: EnveloppeSettings;
	branchName: string = "";
	repositoryFrontmatter: SetRepositoryFrontmatter = {};
	console: Logs = new Logs(this);

	/**
	 * Get the title field of a file
	 * @param {TFile} file - The file to get the title field from
	 * @param {FrontMatterCache} frontmatter - The frontmatter of the file
	 * @return {string} - The title field of the file
	 */
	getTitleFieldForCommand(
		file: TFile,
		frontmatter: FrontMatterCache | undefined | null
	): string {
		return regexOnFileName(
			getTitleField(frontmatter, file, this.settings),
			this.settings
		);
	}

	async chargeAllCommands(repo: Repository | null, plugin: Enveloppe) {
		if (plugin.settings.plugin.copyLink.addCmd) {
			this.addCommand(await createLinkCallback(repo, this));
		}
		this.addCommand(await shareOneNoteCallback(repo, this));
		if (plugin.settings.upload.autoclean.enable) {
			this.addCommand(await purgeNotesRemoteCallback(this, repo, this.branchName));
		}
		this.addCommand(await uploadAllNotesCallback(this, repo, this.branchName));
		this.addCommand(await uploadNewNotesCallback(this, repo, this.branchName));
		this.addCommand(await uploadAllEditedNotesCallback(this, repo, this.branchName));
		this.addCommand(await shareEditedOnlyCallback(repo, this.branchName, this));
		this.addCommand(await checkRepositoryValidityCallback(this, repo));
	}

	cleanSpecificCommands(repo: Repository) {
		const allCommands = this.app.commands.listCommands();
		for (const command of allCommands) {
			if (command.id.startsWith("obsidian-mkdocs-publisher")) {
				const publisherCmDsName = command.id
					.replace("obsidian-mkdocs-publisher:", "")
					.split("-");
				//repo will be the last element of the array
				const repoCmd = publisherCmDsName[publisherCmDsName.length - 1];
				if (repoCmd.startsWith("K") && repo.smartKey === repoCmd.replace("K", "")) {
					this.app.commands.removeCommand(command.id);
				}
			}
		}
	}

	cleanOldCommands() {
		const allRepo: Repository[] = this.settings.github?.otherRepo ?? [];
		const allCommands = this.app.commands.listCommands();
		for (const command of allCommands) {
			if (command.id.startsWith("obsidian-mkdocs-publisher")) {
				const commandName = command.id.replace("obsidian-mkdocs-publisher:", "");
				//repo will be the last element of the array
				const repoCmd = commandName.split("-")[commandName.split("-").length - 1];
				if (repoCmd.startsWith("K")) {
					const repoIndex = allRepo.findIndex(
						(repo) => repo.smartKey === repoCmd.replace("K", "")
					);
					if (repoIndex === -1) {
						this.app.commands.removeCommand(command.id);
					}
				}
				if (!this.settings.upload.autoclean.enable && commandName === "delete-clean") {
					this.app.commands.removeCommand(command.id);
				}
			}
		}
	}

	async reloadCommands() {
		//compare old and new repo to delete old commands
		const newRepo: Repository[] = this.settings.github?.otherRepo ?? [];
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

	async loadToken(repo?: string): Promise<string> {
		if (repo == "default") repo = undefined;
		const tokenPath = createTokenPath(this, this.settings.github.tokenPath);

		const tokenFileExists = await this.app.vault.adapter.exists(`${tokenPath}`);
		if (!tokenFileExists) {
			return "";
		}
		try {
			const tokenFile = await this.app.vault.adapter.read(`${tokenPath}`);
			if (tokenPath.endsWith(".json")) {
				const tokenJson = JSON.parse(tokenFile);
				const defaultToken = tokenJson.GITHUB_PUBLISHER_TOKEN;
				if (repo) return tokenJson.GITHUB_PUBLISHER_REPOS?.[repo] ?? defaultToken;
				return defaultToken;
			}
			if (tokenFile) {
				const defaultToken =
					tokenFile
						.split("\n")
						.find((line) => line.startsWith("GITHUB_TOKEN"))
						?.split("=")[1] ?? "";
				if (repo)
					return (
						tokenFile
							.split("\n")
							.find((line) => line.startsWith(`${repo}_TOKEN`))
							?.split("=")[1] ?? defaultToken
					);
				return defaultToken;
			}
		} catch (e) {
			this.console.notif({ e: true }, e);
			return "";
		}
		return "";
	}

	/**
	 * Create a new instance of Octokit to load a new instance of GithubBranch
	 * @param {string} repo - The repository to load the Octokit for
	 */
	async reloadOctokit(repo?: string) {
		const apiSettings = this.settings.github.api;
		const token = await this.loadToken(repo);
		const octokit =
			apiSettings.tiersForApi === GithubTiersVersion.Entreprise &&
			apiSettings.hostname.length > 0
				? new Octokit({
						baseUrl: `${apiSettings.hostname}/api/v3`,
						auth: token,
					})
				: new Octokit({ auth: token });
		return new GithubBranch(octokit, this);
	}

	/**
	 * Function called when the plugin is loaded
	 * @return {Promise<void>}
	 */
	async onload(): Promise<void> {
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
		});

		await this.loadSettings();
		this.console = new Logs(this);
		this.console.logs(
			{},
			dedent(`[Obsidian Enveloppe] v.${this.manifest.version} (lang: ${translationLanguage}) loaded.
		* You can hide HTTP logs in the console with checking the "Hide network" in the console settings.
		* See here: https://developer.chrome.com/docs/devtools/console/reference#network`)
		);

		if (
			!this.settings.plugin.dev &&
			(await this.app.vault.adapter.exists(
				normalizePath(`${this.manifest.dir}/logs.txt`)
			))
		)
			await this.app.vault.adapter.remove(normalizePath(`${this.manifest.dir}/logs.txt`));

		const oldSettings = this.settings;
		await migrateSettings(oldSettings as unknown as OldSettings, this);

		this.branchName = `${this.app.vault
			.getName()
			.replaceAll(" ", "-")
			.replaceAll(".", "-")}-${new Date()
			.toLocaleDateString("en-US")
			.replace(/\//g, "-")}`;
		this.addSettingTab(new EnveloppeSettingsTab(this.app, this, this.branchName));
		// verify rate limit

		if (!this.settings.github.verifiedRepo && (await this.loadToken()) !== "") {
			const octokit = await this.reloadOctokit();
			this.settings.github.verifiedRepo = await checkRepositoryValidity(
				octokit,
				null,
				null,
				true
			);
			this.settings.github.rateLimit = await verifyRateLimitAPI(
				octokit.octokit,
				this,
				false
			);
			await this.saveSettings();
		}

		for (const repository of this.settings.github.otherRepo) {
			if (
				!repository.verifiedRepo &&
				(await this.loadToken(repository.smartKey)) !== ""
			) {
				const repoOctokit = await this.reloadOctokit(repository.smartKey);
				repository.verifiedRepo = await checkRepositoryValidity(
					repoOctokit,
					repository,
					null,
					false
				);
				repository.rateLimit = await verifyRateLimitAPI(repoOctokit.octokit, this);
			}

			if (repository.set) {
				//take the file and update the frontmatter
				const file = this.app.vault.getAbstractFileByPath(repository.set);
				if (file && file instanceof TFile) {
					const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
					if (frontmatter) {
						this.repositoryFrontmatter[repository.smartKey] = frontmatter;
					}
				}
			}
		}
		await this.saveSettings();

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, folder: TAbstractFile) => {
				if (this.settings.plugin.fileMenu && folder instanceof TFolder) {
					addMenuFolder(menu, folder, this.branchName, this);
				} else if (folder instanceof TFile) {
					addMenuFile(this, folder, this.branchName, menu);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, _editor, view) => {
				if (view.file) addMenuFile(this, view.file, this.branchName, menu);
			})
		);
		await this.chargeAllCommands(null, this);

		this.addCommand({
			id: "check-rate-limit",
			name: i18next.t("commands.checkValidity.rateLimit.command"),
			callback: async () => {
				const octokit = await this.reloadOctokit();
				this.settings.github.rateLimit = await verifyRateLimitAPI(octokit.octokit, this);
				await this.saveSettings();
			},
		});

		if (this.settings.github.otherRepo.length > 0) {
			this.addCommand({
				id: "run-cmd-for-repo",
				name: i18next.t("commands.runOtherRepo.title"),
				callback: async () => {
					new ChooseWhichRepoToRun(this.app, this, this.branchName).open();
				},
			});
		}

		const repoWithShortcuts = this.settings.github.otherRepo.filter(
			(repo) => repo.createShortcuts
		);
		for (const repo of repoWithShortcuts) {
			await this.chargeAllCommands(repo, this);
		}
		this.addCommand(refreshOpenedSet(this));
		this.addCommand(refreshAllSets(this));
		this.app.vault.adapter.removeFile(normalizePath(`${this.manifest.dir}/logs.txt`));
	}

	/**
	 * Called when the plugin is disabled
	 */
	onunload() {
		console.info("[Obsidian Enveloppe] Unloaded");
	}

	/**
	 * Load the settings of the plugin
	 * Use merge methods to merge the default settings with the loaded settings as I use a lot of nested objects
	 * If the deep merge fails, I use the default method
	 */
	async loadSettings() {
		const loadedData = await this.loadData();
		try {
			this.settings = merge(DEFAULT_SETTINGS, loadedData) as unknown as EnveloppeSettings;
		} catch (_e) {
			console.warn(
				"[Obsidian Enveloppe] Error while deep merging settings, using default loading method"
			);
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
