import {
	EnumbSettingsTabId,
	FolderSettings,
	type EnveloppeSettings,
	GithubTiersVersion,
	type Repository,
} from "@interfaces";
import i18next from "i18next";
import {
	type App,
	Notice,
	PluginSettingTab,
	sanitizeHTMLToDom,
	setIcon,
	Setting,
} from "obsidian";
import type EnveloppePlugin from "src/main";
import {
	help,
	KeyBasedOnSettings,
	multipleRepoExplained,
	supportMe,
	usefulLinks,
} from "src/settings/help";
import { klona } from "klona";
import { migrateToken } from "src/settings/migrate";
import {
	ExportModal,
	ImportLoadPreset,
	ImportModal,
	loadAllPresets,
} from "src/settings/modals/import_export";
import { ModalAddingNewRepository } from "src/settings/modals/manage_repo";
import { AutoCleanPopup } from "src/settings/modals/popup";
import {
	ModalRegexFilePathName,
	ModalRegexOnContents,
	OverrideAttachmentsModal,
} from "src/settings/modals/regex_edition";
import { TokenEditPath } from "src/settings/modals/token_path";
import {
	autoCleanCondition,
	folderHideShowSettings,
	showHideBasedOnFolder,
} from "src/settings/style";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";

export class EnveloppeSettingsTab extends PluginSettingTab {
	plugin: EnveloppePlugin;
	settingsPage!: HTMLElement;
	branchName: string;
	settings: EnveloppeSettings;

	constructor(app: App, plugin: EnveloppePlugin, branchName: string) {
		super(app, plugin);
		this.plugin = plugin;
		this.branchName = branchName;
		this.settings = plugin.settings;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("enveloppe");
		const defaultTabId = EnumbSettingsTabId.Github;
		let savedId = this.settings.tabsId ?? defaultTabId;
		if (this.settings.plugin.saveTabId != undefined && !this.settings.plugin.saveTabId) {
			//real false
			this.settings.tabsId = defaultTabId;
			savedId = defaultTabId;
			this.plugin.saveSettings();
		}

		const enveloppeTabs = {
			"github-configuration": {
				name: i18next.t("settings.github.title"),
				icon: "cloud",
			},
			"upload-configuration": {
				name: i18next.t("settings.upload.title"),
				icon: "upload",
			},
			"text-conversion": {
				name: i18next.t("settings.conversion.title"),
				icon: "file-text",
			},
			"embed-configuration": {
				name: i18next.t("settings.embed.title"),
				icon: "link",
			},
			"plugin-settings": {
				name: i18next.t("settings.plugin.title"),
				icon: "gear",
			},
			help: {
				name: i18next.t("settings.help.title"),
				icon: "info",
			},
		};

		new Setting(containerEl)
			.setClass("import-export")
			.addButton((button) => {
				button.setButtonText(i18next.t("modals.export.title")).onClick(() => {
					new ExportModal(this.app, this.plugin).open();
				});
			})
			.addButton((button) => {
				button.setButtonText(i18next.t("modals.import.title")).onClick(() => {
					new ImportModal(this.app, this.plugin, this.settingsPage, this).open();
				});
			})
			.addButton((button) => {
				button
					.setButtonText(i18next.t("modals.import.presets.title"))
					.setTooltip(i18next.t("modals.import.presets.desc"))
					.onClick(async () => {
						const octokit = await this.plugin.reloadOctokit();
						const presetLists = await loadAllPresets(octokit.octokit, this.plugin);
						new ImportLoadPreset(
							this.app,
							this.plugin,
							presetLists,
							octokit.octokit,
							this
						).open();
					});
			});
		const tabBar = containerEl.createEl("nav", {
			cls: "settings-tab-bar",
		});

		for (const [tabId, tabInfo] of Object.entries(enveloppeTabs)) {
			const tabEl = tabBar.createEl("div", {
				cls: "settings-tab",
			});
			const tabIcon = tabEl.createEl("div", {
				cls: "settings-tab-icon",
			});
			setIcon(tabIcon, tabInfo.icon);
			tabEl.createEl("div", {
				cls: "settings-tab-name",
				text: tabInfo.name,
			});
			if (tabId === savedId) tabEl.addClass("settings-tab-active");

			tabEl.addEventListener("click", async () => {
				// @ts-ignore
				for (const tabEl of tabBar.children) tabEl.removeClass("settings-tab-active");

				tabEl.addClass("settings-tab-active");
				this.renderSettingsPage(tabId);
			});
		}
		this.settingsPage = containerEl.createEl("div", {
			cls: "settings-tab-page",
		});
		this.renderSettingsPage(savedId);
	}

	/**
	 * Render the settings tab
	 * @param {string} tabId - to know which tab to render
	 */
	async renderSettingsPage(tabId: string | EnumbSettingsTabId) {
		if (this.settings.plugin.saveTabId || this.settings.plugin.saveTabId === undefined) {
			this.settings.tabsId = tabId as EnumbSettingsTabId;
			await this.plugin.saveSettings();
		}
		this.settingsPage.empty();
		switch (tabId) {
			case "github-configuration":
				this.renderGithubConfiguration();
				break;
			case "upload-configuration":
				this.renderUploadConfiguration();
				break;
			case "text-conversion":
				this.renderTextConversion();
				break;
			case "embed-configuration":
				this.renderEmbedConfiguration();
				break;
			case "plugin-settings":
				this.renderPluginSettings();
				break;
			case "help":
				this.renderHelp();
				break;
		}
	}

	/**
	 * Render the github configuration tab
	 */
	renderGithubConfiguration() {
		const githubSettings = this.settings.github;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.apiType.title"))
			.setDesc(i18next.t("settings.github.apiType.desc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption(
						GithubTiersVersion.Free,
						i18next.t("settings.github.apiType.dropdown.free")
					)
					.addOption(
						GithubTiersVersion.Entreprise,
						i18next.t("settings.github.apiType.dropdown.enterprise")
					)
					.setValue(githubSettings.api.tiersForApi)
					.onChange(async (value) => {
						githubSettings.api.tiersForApi = value as GithubTiersVersion;
						await this.plugin.saveSettings();
						this.renderSettingsPage(EnumbSettingsTabId.Github);
					});
			});
		if (githubSettings.api.tiersForApi === GithubTiersVersion.Entreprise) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.github.apiType.hostname.title"))
				.setDesc(i18next.t("settings.github.apiType.hostname.desc"))
				.addText((text) =>
					text
						.setPlaceholder("https://github.mycompany.com")
						.setValue(githubSettings.api.hostname)
						.onChange(async (value) => {
							githubSettings.api.hostname = value.trim();
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.username.title"))
			.setDesc(i18next.t("settings.github.username.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18next.t("settings.github.username.title"))
					.setValue(githubSettings.user)
					.onChange(async (value) => {
						githubSettings.user = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.repoName.title"))
			.setDesc(i18next.t("settings.github.repoName.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18next.t("settings.github.repoName.placeholder"))
					.setValue(githubSettings.repo)
					.onChange(async (value) => {
						githubSettings.repo = value.trim();
						await this.plugin.saveSettings();
					})
			);
		const descGhToken = document.createDocumentFragment();
		descGhToken.createEl("span", undefined, (span) => {
			span.innerText = i18next.t("settings.github.ghToken.desc");
			span.createEl("a", undefined, (link) => {
				link.innerText = `${i18next.t("common.here")}.`;
				link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		});
		const tokenSettings = new Setting(this.settingsPage)
			.setName(i18next.t("common.ghToken"))
			.setDesc(descGhToken)
			.addText(async (text) => {
				const decryptedToken: string = await this.plugin.loadToken();
				text
					.setPlaceholder("ghp_15457498545647987987112184")
					.setValue(decryptedToken)
					.onChange(async (value) => {
						if (value.trim().length === 0) {
							tokenSettings.controlEl.addClass("error");
							new Notice(i18next.t("settings.github.ghToken.error"));
						} else {
							tokenSettings.controlEl.removeClass("error");
							await migrateToken(this.plugin, value.trim());
						}
						await this.plugin.saveSettings();
					});
			})
			.addExtraButton((button) => {
				button
					.setIcon("edit")
					.setTooltip(i18next.t("settings.github.ghToken.button.tooltip"))
					.onClick(async () => {
						const token = await this.plugin.loadToken();
						new TokenEditPath(this.app, this.plugin, token).open();
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.branch.title"))
			.setDesc(i18next.t("settings.github.branch.desc"))
			.addText((text) =>
				text
					.setPlaceholder("main")
					.setValue(githubSettings.branch)
					.onChange(async (value) => {
						githubSettings.branch = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.automaticallyMergePR"))
			.addToggle((toggle) =>
				toggle.setValue(githubSettings.automaticallyMergePR).onChange(async (value) => {
					githubSettings.automaticallyMergePR = value;
					await this.plugin.saveSettings();
				})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.dryRun.enable.title"))
			.setDesc(i18next.t("settings.github.dryRun.enable.desc"))
			.addToggle((toggle) =>
				toggle.setValue(githubSettings.dryRun.enable).onChange(async (value) => {
					githubSettings.dryRun.enable = value;
					await this.plugin.saveSettings();
					this.renderSettingsPage(EnumbSettingsTabId.Github);
				})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.dryRun.folder.title"))
			.setDesc(i18next.t("settings.github.dryRun.folder.desc"))
			.addText((text) =>
				text
					.setPlaceholder("enveloppe")
					.setValue(githubSettings.dryRun.folderName)
					.onChange(async (value) => {
						githubSettings.dryRun.folderName = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setClass("no-display")
			.addButton((button) =>
				button
					.setButtonText(i18next.t("settings.github.testConnection"))
					.setClass("connect-button")
					.onClick(async () => {
						const octokit = await this.plugin.reloadOctokit();
						this.settings.github.verifiedRepo = await checkRepositoryValidity(
							octokit,
							null,
							null
						);
						this.settings.github.rateLimit = await verifyRateLimitAPI(
							octokit.octokit,
							this.plugin
						);
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) =>
				button
					.setButtonText(i18next.t("settings.github.smartRepo.button"))
					.onClick(async () => {
						const repository: Repository[] = this.copy(
							this.settings.github?.otherRepo ?? []
						);
						new ModalAddingNewRepository(
							this.app,
							this.settings,
							this.branchName,
							this.plugin,
							repository,
							async (result) => {
								this.settings.github.otherRepo = result;
								await this.plugin.saveSettings();
								this.plugin.reloadCommands();
							}
						).open();
					})
			);
		this.settingsPage.createEl("h3", { text: "GitHub Workflow" });
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.prRequest.title"))
			.setDesc(i18next.t("settings.githubWorkflow.prRequest.desc"))
			.addText((text) =>
				text
					.setPlaceholder("[PUBLISHER] MERGE")
					.setValue(githubSettings.workflow.commitMessage)
					.onChange(async (value) => {
						if (value.trim().length === 0) {
							value = "[PUBLISHER] MERGE";
							new Notice(i18next.t("settings.githubWorkflow.prRequest.error"));
						}
						githubSettings.workflow.commitMessage = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.githubAction.title"))
			.setDesc(i18next.t("settings.githubWorkflow.githubAction.desc"))
			.addText((text) => {
				text
					.setPlaceholder("ci")
					.setValue(githubSettings.workflow.name)
					.onChange(async (value) => {
						if (value.length > 0) {
							value = value.trim();
							const yamlEndings = [".yml", ".yaml"];
							if (!yamlEndings.some((ending) => value.endsWith(ending))) {
								value += yamlEndings[0];
							}
						}
						githubSettings.workflow.name = value;
						await this.plugin.saveSettings();
					});
			});
	}

	/**
	 * Render the settings tab for the upload configuration
	 */
	renderUploadConfiguration() {
		const uploadSettings = this.settings.upload;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.folderBehavior.title"))
			.setDesc(i18next.t("settings.upload.folderBehavior.desc"))
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						fixed: i18next.t("settings.upload.folderBehavior.fixedFolder"),
						yaml: i18next.t("settings.upload.folderBehavior.yaml"),
						obsidian: i18next.t("settings.upload.folderBehavior.obsidianPath"),
					})
					.setValue(uploadSettings.behavior)
					.onChange(async (value: string) => {
						uploadSettings.behavior = value as FolderSettings;
						await folderHideShowSettings(
							frontmatterKeySettings,
							rootFolderSettings,
							autoCleanSetting,
							value,
							this.plugin
						);
						await this.plugin.saveSettings();
						this.renderSettingsPage(EnumbSettingsTabId.Upload);
					});
			});

		const defaultFolder =
			uploadSettings.behavior === FolderSettings.Yaml
				? {
						desc: i18next.t("settings.upload.defaultFolder.desc"),
						title: i18next.t("settings.upload.defaultFolder.title"),
					}
				: {
						desc: i18next.t("settings.upload.rootFolder.other"),
						title: i18next.t("settings.upload.rootFolder.title"),
					};

		new Setting(this.settingsPage)
			.setName(defaultFolder.title)
			.setDesc(defaultFolder.desc)
			.addText((text) => {
				text
					.setPlaceholder(i18next.t("settings.upload.defaultFolder.placeholder"))
					.setValue(uploadSettings.defaultName)
					.onChange(async (value) => {
						uploadSettings.defaultName = value.replace(/\/$/, "");
						await autoCleanCondition(
							value,
							autoCleanSetting,
							this.plugin,
							"defaultName",
							this
						);
						await this.plugin.saveSettings();
					});
			});

		const frontmatterKeySettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.frontmatterKey.title"))
			.setDesc(i18next.t("settings.upload.frontmatterKey.desc"))
			.addText((text) => {
				text
					.setPlaceholder(i18next.t("settings.upload.frontmatterKey.placeholder"))
					.setValue(uploadSettings.yamlFolderKey)
					.onChange(async (value) => {
						uploadSettings.yamlFolderKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		const rootFolderSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.rootFolder.title"))
			.setDesc(i18next.t("settings.upload.rootFolder.desc"))
			.addText((text) => {
				text
					.setPlaceholder("docs")
					.setValue(uploadSettings.rootFolder)
					.onChange(async (value) => {
						uploadSettings.rootFolder = value.replace(/\/$/, "");
						await autoCleanCondition(
							value,
							autoCleanSetting,
							this.plugin,
							"rootFolder",
							this
						);
						await this.plugin.saveSettings();
					});
			});
		const frontmatterTitleSet = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.useFrontmatterTitle.title"))
			.setDesc(i18next.t("settings.upload.useFrontmatterTitle.desc"))
			.setClass("title")
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.frontmatterTitle.enable)
					.onChange(async (value) => {
						uploadSettings.frontmatterTitle.enable = value;
						await this.plugin.saveSettings();
						this.renderSettingsPage(EnumbSettingsTabId.Upload);
					});
			});
		if (uploadSettings.frontmatterTitle.enable) {
			frontmatterTitleSet.addText((text) => {
				text
					.setPlaceholder("title")
					.setValue(uploadSettings.frontmatterTitle.key)
					.onChange(async (value) => {
						uploadSettings.frontmatterTitle.key = value.trim();
						await this.plugin.saveSettings();
					});
			});
		}

		const desc =
			uploadSettings.behavior === FolderSettings.Fixed
				? i18next.t("settings.upload.regexFilePathTitle.title.titleOnly")
				: i18next.t("settings.upload.regexFilePathTitle.title.FolderPathTitle");

		new Setting(this.settingsPage)
			.setName(desc)
			.setDesc(i18next.t("settings.upload.regexFilePathTitle.desc"))
			.addButton((button) => {
				button.setIcon("pencil").onClick(async () => {
					let allRegex = uploadSettings.replaceTitle;
					if (uploadSettings.behavior !== FolderSettings.Fixed) {
						allRegex = allRegex.concat(uploadSettings.replacePath);
					}
					new ModalRegexFilePathName(
						this.app,
						this.settings,
						this.copy(allRegex),
						async (result) => {
							uploadSettings.replacePath = result.filter((title) => {
								return title.type === "path";
							});
							uploadSettings.replaceTitle = result.filter((title) => {
								return title.type === "title";
							});
							await this.plugin.saveSettings();
						}
					).open();
				});
			});

		const folderNoteSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.folderNote.title"))
			.setDesc(i18next.t("settings.conversion.links.folderNote.desc"))
			.addToggle((toggle) => {
				toggle.setValue(uploadSettings.folderNote.enable).onChange(async (value) => {
					uploadSettings.folderNote.enable = value;
					await this.plugin.saveSettings();
					this.renderSettingsPage(EnumbSettingsTabId.Upload);
				});
			});

		if (uploadSettings.folderNote.enable) {
			folderNoteSettings.addText((text) => {
				text
					.setPlaceholder("folderNote")
					.setValue(uploadSettings.folderNote.rename)
					.onChange(async (value) => {
						uploadSettings.folderNote.rename = value;
						await this.plugin.saveSettings();
					});
			});
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.upload.folderNote.addTitle.title"))
				.addToggle((toggle) => {
					toggle
						.setValue(uploadSettings.folderNote.addTitle.enable)
						.onChange(async (value) => {
							uploadSettings.folderNote.addTitle.enable = value;
							await this.plugin.saveSettings();
							this.renderSettingsPage(EnumbSettingsTabId.Upload);
						});
				});
			if (uploadSettings.folderNote.addTitle.enable) {
				new Setting(this.settingsPage)
					.setName(i18next.t("settings.upload.folderNote.addTitle.key"))
					.addText((text) => {
						text
							.setPlaceholder("title")
							.setValue(uploadSettings.folderNote.addTitle.key)
							.onChange(async (value) => {
								uploadSettings.folderNote.addTitle.key = value;
								await this.plugin.saveSettings();
							});
					});
			}
		}

		showHideBasedOnFolder(
			this.settings,
			frontmatterKeySettings,
			rootFolderSettings,
			folderNoteSettings
		);

		if (this.app.plugins.getPlugin("metadata-extractor")) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.githubWorkflow.useMetadataExtractor.title"))
				.setDesc(i18next.t("settings.githubWorkflow.useMetadataExtractor.desc"))
				.addText((text) => {
					text
						.setPlaceholder("docs/_assets/metadata")
						.setValue(uploadSettings.metadataExtractorPath)
						.onChange(async (value) => {
							uploadSettings.metadataExtractorPath = value.trim();
							await this.plugin.saveSettings();
						});
				});
		}

		const autoCleanSetting = new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.autoCleanUp.title"))
			.setDesc(i18next.t("settings.githubWorkflow.autoCleanUp.desc"))
			.addToggle((toggle) => {
				toggle.setValue(uploadSettings.autoclean.enable).onChange(async (value) => {
					if (
						value &&
						((this.settings.upload.behavior === "yaml" &&
							this.settings.upload.defaultName.length === 0) ||
							this.settings.upload.rootFolder.length === 0)
					)
						new AutoCleanPopup(this.app, this.settings, (result) => {
							uploadSettings.autoclean.enable = result;
							this.renderSettingsPage(EnumbSettingsTabId.Upload);
						}).open();
					else uploadSettings.autoclean.enable = value;
					await this.plugin.saveSettings();
					this.renderSettingsPage(EnumbSettingsTabId.Upload);
					this.plugin.cleanOldCommands();
					await this.plugin.chargeAllCommands(null, this.plugin);
				});
			});
		if (uploadSettings.autoclean.enable) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.githubWorkflow.excludedFiles.title"))
				.setDesc(i18next.t("settings.githubWorkflow.excludedFiles.desc"))
				.addTextArea((textArea) => {
					textArea
						.setPlaceholder("docs/assets/js, docs/assets/logo, /\\.js$/")
						.setValue(uploadSettings.autoclean.excluded.join(", "))
						.onChange(async (value) => {
							uploadSettings.autoclean.excluded = value
								.split(/[,\n]/)
								.map((item) => item.trim())
								.filter((item) => item.length > 0);
							await this.plugin.saveSettings();
						});
				});

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.githubWorkflow.includeAttachments.title"))
				.setDesc(i18next.t("settings.githubWorkflow.includeAttachments.desc"))
				.addToggle((toggle) => {
					toggle
						.setValue(uploadSettings.autoclean.includeAttachments)
						.onChange(async (value) => {
							uploadSettings.autoclean.includeAttachments = value;
							await this.plugin.saveSettings();
						});
				});
		}

		folderHideShowSettings(
			frontmatterKeySettings,
			rootFolderSettings,
			autoCleanSetting,
			uploadSettings.behavior,
			this.plugin
		);
	}

	/**
	 * Render the settings page for the text conversion parameters
	 */
	renderTextConversion() {
		const textSettings = this.settings.conversion;
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.conversion.desc"),
		});

		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.conversion.links.title"),
		});
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.conversion.links.desc"),
		});

		const shareAll = this.settings.plugin.shareAll?.enable
			? ` ${i18next.t("settings.conversion.links.internals.shareAll")}`
			: "";
		const internalLinksDesc = document.createDocumentFragment();
		internalLinksDesc.createEl("p", {
			text: i18next.t("settings.conversion.links.internals.desc") + shareAll,
			cls: "no-margin",
		});
		internalLinksDesc.createEl("p", {
			text: i18next.t("settings.conversion.links.internals.dataview"),
			cls: "no-margin",
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.internals.title"))
			.setDesc(internalLinksDesc)
			.addToggle((toggle) => {
				toggle.setValue(textSettings.links.internal).onChange(async (value) => {
					textSettings.links.internal = value;
					if (this.settings.plugin.shareAll?.enable) {
						textSettings.links.unshared = true;
					}
					await this.plugin.saveSettings();
					this.renderSettingsPage("text-conversion");
				});
			});

		if (textSettings.links.internal && !this.settings.plugin.shareAll?.enable) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.conversion.links.nonShared.title"))
				.setDesc(i18next.t("settings.conversion.links.nonShared.desc"))
				.addToggle((toggle) => {
					toggle.setValue(textSettings.links.unshared).onChange(async (value) => {
						textSettings.links.unshared = value;
						await this.plugin.saveSettings();
					});
				});
		}

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.wikilinks.title"))
			.setDesc(i18next.t("settings.conversion.links.wikilinks.desc"))
			.addToggle((toggle) => {
				toggle.setValue(textSettings.links.wiki).onChange(async (value) => {
					textSettings.links.wiki = value;
					await this.plugin.saveSettings();
					this.renderSettingsPage("text-conversion");
				});
			});
		const slugifySetting =
			typeof textSettings.links.slugify == "boolean"
				? textSettings.links.slugify
					? "strict"
					: "disable"
				: textSettings.links.slugify;
		if (textSettings.links.wiki || textSettings.links.internal) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.conversion.links.slugify.title"))
				.setDesc(i18next.t("settings.conversion.links.slugify.desc"))
				.addDropdown((dropdown) => {
					dropdown
						.addOptions({
							disable: i18next.t("settings.conversion.links.slugify.disable"),
							strict: i18next.t("settings.conversion.links.slugify.strict"),
							lower: i18next.t("settings.conversion.links.slugify.lower"),
						})
						.setValue(slugifySetting)
						.onChange(async (value) => {
							textSettings.links.slugify = ["disable", "strict", "lower"].includes(value)
								? (value as "disable" | "strict" | "lower")
								: "disable";
							await this.plugin.saveSettings();
						});
				});
		}

		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.conversion.sectionTitle"),
		});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.hardBreak.title"))
			.setDesc(i18next.t("settings.conversion.hardBreak.desc"))
			.addToggle((toggle) => {
				toggle.setValue(textSettings.hardbreak).onChange(async (value) => {
					textSettings.hardbreak = value;
					await this.plugin.saveSettings();
				});
			});
		const isDataviewEnabled = this.app.plugins.plugins.dataview;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.dataview.title"))
			.setDesc(i18next.t("settings.conversion.dataview.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(
						textSettings.dataview && isDataviewEnabled && textSettings.links.internal
					)
					.setDisabled(!isDataviewEnabled || !textSettings.links.internal)
					.onChange(async (value) => {
						textSettings.dataview = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.regexReplacing.modal.title.text"))
			.setDesc(i18next.t("settings.regexReplacing.modal.desc"))
			.addButton((button) => {
				button.setIcon("pencil").onClick(async () => {
					new ModalRegexOnContents(this.app, this.copy(this.settings), async (result) => {
						this.settings.conversion.censorText = result.conversion.censorText;
						await this.plugin.saveSettings();
					}).open();
				});
			});

		this.settingsPage.createEl("h5", { text: "Tags" });
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.tags.inlineTags.title"))
			.setDesc(i18next.t("settings.conversion.tags.inlineTags.desc"))
			.addToggle((toggle) => {
				toggle.setValue(textSettings.tags.inline).onChange(async (value) => {
					textSettings.tags.inline = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.tags.title"))
			.setDesc(i18next.t("settings.conversion.tags.desc"))
			.addTextArea((text) => {
				text.inputEl.addClass("mid-height");
				text
					.setPlaceholder("field_name")
					.setValue(textSettings.tags.fields.join(","))
					.onChange(async (value) => {
						textSettings.tags.fields = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.tags.exclude.title"))
			.setDesc(i18next.t("settings.conversion.tags.exclude.desc"))
			.addTextArea((text) => {
				text
					.setPlaceholder(i18next.t("settings.conversion.tags.exclude.placeholder"))
					.setValue(textSettings.tags.exclude.join(","))
					.onChange(async (value) => {
						textSettings.tags.exclude = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});
	}

	/**
	 * Render the settings page for the embeds settings
	 */
	async renderEmbedConfiguration() {
		this.settingsPage.empty();
		const embedSettings = this.settings.embed;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.sendSimpleLinks.title"))
			.setDesc(i18next.t("settings.embed.sendSimpleLinks.desc"))
			.addToggle((toggle) => {
				toggle.setValue(embedSettings.sendSimpleLinks).onChange(async (value) => {
					embedSettings.sendSimpleLinks = value;
					await this.plugin.saveSettings();
					await this.renderEmbedConfiguration();
				});
			});
		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.embed.attachment"),
			cls: "center",
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.transferImage.title"))
			.addToggle((toggle) => {
				toggle.setValue(embedSettings.attachments).onChange(async (value) => {
					embedSettings.attachments = value;
					await this.plugin.saveSettings();
					this.renderSettingsPage(EnumbSettingsTabId.Embed);
				});
			});

		if (embedSettings.attachments) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.embed.imagePath.title"))
				.setDesc(i18next.t("settings.embed.imagePath.desc"))
				.addToggle((toggle) => {
					toggle
						.setValue(embedSettings.useObsidianFolder ?? false)
						.onChange(async (value) => {
							embedSettings.useObsidianFolder = value;
							await this.plugin.saveSettings();
							this.renderSettingsPage(EnumbSettingsTabId.Embed);
						});
				});
			if (!embedSettings.useObsidianFolder) {
				new Setting(this.settingsPage)
					.setName(i18next.t("settings.embed.defaultImageFolder.title"))
					.setDesc(i18next.t("settings.embed.defaultImageFolder.desc"))
					.addText((text) => {
						text
							.setPlaceholder("docs/images")
							.setValue(embedSettings.folder)
							.onChange(async (value) => {
								embedSettings.folder = value.replace(/\/$/, "");
								await this.plugin.saveSettings();
							});
					});
			}

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.embed.overrides.modal.title"))
				.setDesc(i18next.t("settings.embed.overrides.desc"))
				.addButton((button) => {
					button.setIcon("pencil").onClick(async () => {
						new OverrideAttachmentsModal(
							this.app,
							this.settings,
							this.copy(embedSettings.overrideAttachments),
							async (result) => {
								embedSettings.overrideAttachments = result;
								await this.plugin.saveSettings();
							}
						).open();
					});
				});

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.embeds.unHandledObsidianExt.title"))
				.setDesc(i18next.t("settings.embeds.unHandledObsidianExt.desc"))
				.addTextArea((text) => {
					text
						.setPlaceholder("py, mdx")
						.setValue(embedSettings.unHandledObsidianExt.join(", "))
						.onChange(async (value) => {
							embedSettings.unHandledObsidianExt = value
								.split(/[,\n]\W*/)
								.map((item) => item.trim())
								.filter((item) => item.length > 0);
							await this.plugin.saveSettings();
						});
				});
		}

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.transferMetaFile.title"))
			.setDesc(i18next.t("settings.embed.transferMetaFile.desc"))
			.addTextArea((text) => {
				text
					.setPlaceholder("banner")
					.setValue(embedSettings.keySendFile.join(", "))
					.onChange(async (value) => {
						embedSettings.keySendFile = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});

		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.embed.notes"),
			cls: "center",
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.transferNotes.title"))
			.setDesc(i18next.t("settings.embed.transferNotes.desc"))
			.addToggle((toggle) => {
				toggle.setValue(embedSettings.notes).onChange(async (value) => {
					embedSettings.notes = value;
					await this.plugin.saveSettings();
					await this.renderEmbedConfiguration();
				});
			});

		if (embedSettings.notes) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.embed.links.title"))
				.setDesc(i18next.t("settings.embed.links.desc"))
				.addDropdown((dropdown) => {
					dropdown
						.addOption("keep", i18next.t("settings.embed.links.dp.keep"))
						.addOption("remove", i18next.t("settings.embed.links.dp.remove"))
						.addOption("links", i18next.t("settings.embed.links.dp.links"))
						.addOption("bake", i18next.t("settings.embed.links.dp.bake"))
						.setValue(embedSettings.convertEmbedToLinks ?? "keep")
						.onChange(async (value) => {
							embedSettings.convertEmbedToLinks = value as
								| "keep"
								| "remove"
								| "links"
								| "bake";
							await this.plugin.saveSettings();
							await this.renderEmbedConfiguration();
						});
				});

			if (embedSettings.convertEmbedToLinks === "links") {
				new Setting(this.settingsPage)
					.setName(i18next.t("settings.embed.char.title"))
					.setDesc(i18next.t("settings.embed.char.desc"))
					.addText((text) => {
						text
							.setPlaceholder("->")
							.setValue(embedSettings.charConvert ?? "->")
							.onChange(async (value) => {
								embedSettings.charConvert = value;
								await this.plugin.saveSettings();
							});
					});
			} else if (embedSettings.convertEmbedToLinks === "bake") {
				if (!embedSettings.bake) {
					embedSettings.bake = {
						textBefore: "",
						textAfter: "",
					};
					await this.plugin.saveSettings();
				}
				await this.plugin.saveSettings();
				this.settingsPage.createEl("h5", {
					text: i18next.t("settings.embed.bake.title"),
					cls: "border-bottom",
				});
				this.settingsPage.createEl("p", { text: i18next.t("settings.embed.bake.text") });
				this.settingsPage.createEl("p", undefined, (el) => {
					el.createEl("span", {
						text: i18next.t("settings.embed.bake.variable.desc"),
						cls: ["bake"],
					}).createEl("ul", undefined, (ul) => {
						ul.createEl("li", undefined, (li) => {
							li.createEl("code", { text: "{{title}}" });
							li.createEl("span", {
								text: i18next.t("settings.embed.bake.variable.title"),
							});
						});
						ul.createEl("li", undefined, (li) => {
							li.createEl("code", { text: "{{url}}" });
							li.createEl("span", {
								text: i18next.t("settings.embed.bake.variable.url"),
							});
						});
					});
				});

				this.settingsPage.createEl("p", {
					text: `⚠️ ${i18next.t("settings.embed.bake.warning")}`,
					cls: ["warning", "embed"],
				});

				new Setting(this.settingsPage)
					.setName(i18next.t("settings.embed.bake.textBefore.title"))
					.addTextArea((text) => {
						text
							.setValue(embedSettings.bake?.textBefore ?? "")
							.onChange(async (value) => {
								embedSettings.bake!.textBefore = value;
								await this.plugin.saveSettings();
							});
					});

				new Setting(this.settingsPage)
					.setName(i18next.t("settings.embed.bake.textAfter.title"))
					.addTextArea((text) => {
						text.setValue(embedSettings.bake?.textAfter ?? "").onChange(async (value) => {
							embedSettings.bake!.textAfter = value;
							await this.plugin.saveSettings();
						});
					});
			}
		}
	}

	/**
	 * Render the settings page for the plugin settings (general settings, as shareKey)
	 */
	renderPluginSettings() {
		const pluginSettings = this.settings.plugin;

		this.settingsPage.createEl("h3", { text: i18next.t("settings.plugin.head.share") });
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.shareKey.all.title"))
			.setDesc(i18next.t("settings.plugin.shareKey.all.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.shareAll?.enable ?? false)
					.onChange(async (value) => {
						pluginSettings.shareAll = {
							enable: value,
							excludedFileName: pluginSettings.shareAll?.excludedFileName ?? "DRAFT",
						};
						if (value) this.settings.conversion.links.internal = true;
						await this.plugin.saveSettings();
						this.renderSettingsPage(EnumbSettingsTabId.Plugin);
					})
			);
		if (!pluginSettings.shareAll || !pluginSettings.shareAll.enable) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.shareKey.title"))
				.setDesc(i18next.t("settings.plugin.shareKey.desc"))
				.addText((text) =>
					text
						.setPlaceholder("share")
						.setValue(pluginSettings.shareKey)
						.onChange(async (value) => {
							pluginSettings.shareKey = value.trim();
							await this.plugin.saveSettings();
						})
				);
		} else {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.shareKey.excludedFileName.title"))
				.addText((text) =>
					text
						.setPlaceholder("DRAFT")
						.setValue(pluginSettings.shareAll?.excludedFileName ?? "DRAFT")
						.onChange(async (value) => {
							pluginSettings.shareAll!.excludedFileName = value.trim();
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.excludedFolder.title"))
			.setDesc(i18next.t("settings.plugin.excludedFolder.desc"))
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder("_assets, Archive, /^_(.*)/gi")
					.setValue(pluginSettings.excludedFolder.join(", "))
					.onChange(async (value) => {
						pluginSettings.excludedFolder = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.set.title"))
			.setDesc(i18next.t("settings.plugin.set.desc"))
			.addText((text) =>
				text
					.setPlaceholder("Set")
					.setValue(pluginSettings.setFrontmatterKey)
					.onChange(async (value) => {
						pluginSettings.setFrontmatterKey = value.trim();
						await this.plugin.saveSettings();
					})
			);

		this.settingsPage.createEl("h3", { text: i18next.t("settings.plugin.head.menu") });

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.fileMenu.title"))
			.setDesc(i18next.t("settings.plugin.fileMenu.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.fileMenu).onChange(async (value) => {
					pluginSettings.fileMenu = value;
					await this.plugin.saveSettings();
				})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.editorMenu.title"))
			.setDesc(i18next.t("settings.plugin.editorMenu.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.editorMenu).onChange(async (value) => {
					pluginSettings.editorMenu = value;
					await this.plugin.saveSettings();
				})
			);
		this.settingsPage.createEl("h3", {
			text: i18next.t("settings.plugin.head.copyLinks"),
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.title"))
			.setDesc(i18next.t("settings.plugin.copyLink.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.copyLink.enable).onChange(async (value) => {
					pluginSettings.copyLink.enable = value;
					await this.plugin.saveSettings();
					this.renderSettingsPage(EnumbSettingsTabId.Plugin);
				})
			);

		if (pluginSettings.copyLink.enable) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.baselink.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.baselink.desc"))
				.addText((text) => {
					text
						.setPlaceholder("my_blog.com")
						.setValue(pluginSettings.copyLink.links)
						.onChange(async (value) => {
							pluginSettings.copyLink.links = value;
							await this.plugin.saveSettings();
						});
				});
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.linkPathRemover.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.linkPathRemover.desc"))
				.addText((text) => {
					text
						.setPlaceholder("docs")
						.setValue(pluginSettings.copyLink.removePart.join(", "))
						.onChange(async (value) => {
							pluginSettings.copyLink.removePart = value
								.split(/[,\n]\s*/)
								.map((item) => item.trim())
								.filter((item) => item.length > 0);
							await this.plugin.saveSettings();
						});
				});

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.toUri.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.toUri.desc"))
				.addToggle((toggle) =>
					toggle
						.setValue(pluginSettings.copyLink.transform.toUri)
						.onChange(async (value) => {
							pluginSettings.copyLink.transform.toUri = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.slugify.title"))
				.addDropdown((dropdown) => {
					dropdown
						.addOptions({
							disable: i18next.t("settings.plugin.copyLink.slugify.disable"),
							strict: i18next.t("settings.plugin.copyLink.slugify.strict"),
							lower: i18next.t("settings.plugin.copyLink.slugify.lower"),
						})
						.setValue(
							pluginSettings.copyLink.transform.slugify as "disable" | "strict" | "lower"
						)
						.onChange(async (value) => {
							pluginSettings.copyLink.transform.slugify = value as
								| "disable"
								| "strict"
								| "lower";
							await this.plugin.saveSettings();
						});
				});

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.applyRegex.title"))
				.setHeading()
				.setDesc(i18next.t("settings.plugin.copyLink.applyRegex.desc"))
				.addExtraButton((button) => {
					button.setIcon("plus").onClick(async () => {
						pluginSettings.copyLink.transform.applyRegex.push({
							regex: "",
							replacement: "",
						});
						await this.plugin.saveSettings();
						this.renderSettingsPage(EnumbSettingsTabId.Plugin);
					});
				});

			for (const apply of pluginSettings.copyLink.transform.applyRegex) {
				const regex = apply.regex;
				const replacement = apply.replacement;

				new Setting(this.settingsPage)
					.setClass("no-display")
					.addText((text) => {
						text
							.setPlaceholder("regex")
							.setValue(regex)
							.onChange(async (value) => {
								apply.regex = value;
								await this.plugin.saveSettings();
							});
					})
					.setClass("max-width")
					.addText((text) => {
						text
							.setPlaceholder("replacement")
							.setValue(replacement)
							.onChange(async (value) => {
								apply.replacement = value;
								await this.plugin.saveSettings();
							});
					})
					.setClass("max-width")
					.addExtraButton((button) => {
						button.setIcon("trash").onClick(async () => {
							pluginSettings.copyLink.transform.applyRegex =
								pluginSettings.copyLink.transform.applyRegex.filter(
									(item) => item !== apply
								);
							await this.plugin.saveSettings();
							this.renderSettingsPage(EnumbSettingsTabId.Plugin);
						});
					});
			}

			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.command.desc"))
				.addToggle((toggle) =>
					toggle.setValue(pluginSettings.copyLink.addCmd).onChange(async (value) => {
						pluginSettings.copyLink.addCmd = value;
						await this.plugin.saveSettings();
					})
				);
		}

		this.settingsPage.createEl("h3", { text: i18next.t("settings.plugin.head.other") });

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.embedEditRepo.title"))
			.setDesc(i18next.t("settings.plugin.embedEditRepo.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.displayModalRepoEditing)
					.onChange(async (value) => {
						pluginSettings.displayModalRepoEditing = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.saveTab.title"))
			.setDesc(i18next.t("settings.plugin.saveTab.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.saveTabId ?? true).onChange(async (value) => {
					pluginSettings.saveTabId = value;
					this.settings.tabsId = value
						? EnumbSettingsTabId.Plugin
						: EnumbSettingsTabId.Github;
					await this.plugin.saveSettings();
				})
			);

		this.settingsPage.createEl("h4", { text: i18next.t("settings.plugin.head.log") });

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.logNoticeHeader.title"))
			.setDesc(i18next.t("settings.plugin.logNoticeHeader.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.noticeError).onChange(async (value) => {
					pluginSettings.noticeError = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.dev.title"))
			.setDesc(i18next.t("settings.plugin.dev.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.dev ?? false).onChange(async (value) => {
					pluginSettings.dev = value;

					await this.plugin.saveSettings();
				})
			);
	}

	/**
	 * Render the help page
	 */
	renderHelp() {
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.help.usefulLinks.title"))
			.setHeading();
		this.settingsPage.appendChild(usefulLinks());
		this.settingsPage.createEl("hr");
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.help.frontmatter.title"))
			.setHeading();
		const dom = sanitizeHTMLToDom(`
			<p>${i18next.t("settings.help.frontmatter.desc")}</p>
			<p>${i18next.t(
				"settings.help.frontmatter.nestedKey"
			)} <code>key.subkey: value</code>.</p>`);
		this.settingsPage.appendChild(dom);
		this.settingsPage.createEl("pre", { cls: "language-yaml" }).createEl("code", {
			text: KeyBasedOnSettings(this.settings),
			cls: "language-yaml",
		});
		this.settingsPage.appendChild(help(this.settings));

		this.settingsPage.createEl("hr");
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.help.multiRepoHelp.title"))
			.setHeading();
		this.settingsPage.appendChild(multipleRepoExplained(this.settings));
		this.settingsPage.appendChild(supportMe());
	}

	copy(object: any) {
		try {
			return klona(object);
		} catch (_e) {
			this.plugin.console.logs({ e: true }, "error with stringify for", object);
		}
	}
}
