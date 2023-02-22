import { App, PluginSettingTab, setIcon, Setting } from "obsidian";
import GithubPublisherPlugin from "./main";
import { ModalRegexFilePathName, ModalRegexOnContents } from "./settings/modal_regex_edition";
import {
	autoCleanCondition,
	folderHideShowSettings,
	autoCleanUpSettingsOnCondition,
	shortcutsHideShow, showHideBasedOnFolder,
} from "./settings/style";
import {
	FolderSettings,
	PUBLISHER_TABS, GithubTiersVersion,
} from "./settings/interface";
import {
	help,
	multipleRepoExplained,
	supportMe,
	usefullLinks,
	KeyBasedOnSettings
} from "./settings/help";
import "i18next"

import { checkRepositoryValidity } from "./src/data_validation_test";
import { ExportModal, ImportModal } from "./src/modals";
import i18next from "i18next";

export class GithubPublisherSettings extends PluginSettingTab {
	plugin: GithubPublisherPlugin;
	settingsPage: HTMLElement;
	branchName: string;

	constructor(app: App, plugin: GithubPublisherPlugin, branchName: string) {
		super(app, plugin);
		this.plugin = plugin;
		this.branchName = branchName;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl)
			.setClass("github-publisher-export-import")
			.addButton((button) => {
				button.setButtonText(i18next.t("settings.exportSettings") as string)
					.setClass("github-publisher-export")
					.onClick(() => {
						new ExportModal(this.app, this.plugin).open();
					});
			}
			)
			.addButton((button) => {
				button.setButtonText(i18next.t("settings.importSettings") as string)
					.setClass("github-publisher-import")
					.onClick(() => {
						new ImportModal(this.app, this.plugin, this.settingsPage, this).open();
					});
			});
		const tabBar = containerEl.createEl("nav", {
			cls: "settings-tab-bar github-publisher",
		});



		for (const [tabID, tabInfo] of Object.entries(PUBLISHER_TABS)) {
			const tabEl = tabBar.createEl("div", {
				cls: "settings-tab github-publisher",
			});
			const tabIcon = tabEl.createEl("div", {
				cls: "settings-tab-icon github-publisher",
			});
			setIcon(tabIcon, tabInfo.icon);
			tabEl.createEl("div", {
				cls: "settings-tab-name github-publisher",
				text: tabInfo.name,
			});
			if (tabID === "github-configuration")
				tabEl.addClass("settings-tab-active");

			tabEl.addEventListener("click", () => {
				// @ts-ignore
				for (const tabEl of tabBar.children)
					tabEl.removeClass("settings-tab-active");

				tabEl.addClass("settings-tab-active");
				this.renderSettingsPage(tabID);
			});
		}
		this.settingsPage = containerEl.createEl("div", {
			cls: "settings-tab-page github-publisher",
		});
		this.renderSettingsPage("github-configuration");
	}

	renderSettingsPage(tabId: string) {
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

	renderGithubConfiguration() {
		const githubSettings = this.plugin.settings.github;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.apiType.title") as string)
			.setDesc(i18next.t("settings.github.apiType.desc") as string)
			.addDropdown((dropdown) => {
				dropdown
					.addOption(GithubTiersVersion.free, i18next.t("settings.github.apiType.dropdown.free") as string)
					.addOption(GithubTiersVersion.entreprise, i18next.t("settings.github.apiType.dropdown.enterprise") as string)
					.setValue(githubSettings.api.tiersForApi)
					.onChange(async (value) => {
						githubSettings.api.tiersForApi = value as GithubTiersVersion;
						await this.plugin.saveSettings();
						this.settingsPage.empty();
						this.renderGithubConfiguration();
					});
			});
		if (githubSettings.api.tiersForApi === GithubTiersVersion.entreprise) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.github.apiType.hostname.title") as string)
				.setDesc(i18next.t("settings.github.apiType.hostname.desc") as string)
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
			.setName(i18next.t("settings.github.repoName.title") as string)
			.setDesc(i18next.t("settings.github.repoName.desc") as string)
			.addText((text) =>
				text
					.setPlaceholder("mkdocs-template")
					.setValue(githubSettings.repo)
					.onChange(async (value) => {
						githubSettings.repo = value.trim();
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.username.title") as string)
			.setDesc(i18next.t("settings.github.username.desc") as string)
			.addText((text) =>
				text
					.setPlaceholder(
						i18next.t("settings.github.username.title") as string
					)
					.setValue(githubSettings.user)
					.onChange(async (value) => {
						githubSettings.user = value.trim();
						await this.plugin.saveSettings();
					})
			);
		const desc_ghToken = document.createDocumentFragment();
		desc_ghToken.createEl("span", null, (span) => {
			span.innerText = i18next.t("settings.github.ghToken.desc") as string;
			span.createEl("a", null, (link) => {
				link.innerText = i18next.t("settings.github.ghToken.here") as string;
				link.href =
					"https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.ghToken.title") as string)
			.setDesc(desc_ghToken)
			.addText((text) =>
				text
					.setPlaceholder("ghb-15457498545647987987112184")
					.setValue(githubSettings.token)
					.onChange(async (value) => {
						githubSettings.token = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.branch.title") as string)
			.setDesc(i18next.t("settings.github.branch.desc") as string)
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
			.setName(i18next.t("settings.github.automaticallyMergePR") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(githubSettings.automaticallyMergePR)
					.onChange(async (value) => {
						githubSettings.automaticallyMergePR = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setClass("github-publisher-no-display")
			.addButton((button) =>
				button
					.setButtonText(i18next.t("settings.github.testConnection") as string)
					.setClass("github-publisher-connect-button")
					.onClick(async () => {
						await checkRepositoryValidity(this.branchName, this.plugin.reloadOctokit(), this.plugin.settings, null, this.app.metadataCache);
					})
			);
		this.settingsPage.createEl("h3", { text: "Github Workflow" });
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.prRequest.title") as string)
			.setDesc(i18next.t("settings.githubWorkflow.prRequest.desc") as string)
			.addText((text) =>
				text
					.setPlaceholder("[PUBLISHER] MERGE")
					.setValue(githubSettings.worflow.customCommitMsg)
					.onChange(async (value) => {
						githubSettings.worflow.customCommitMsg = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.githubAction.title") as string)
			.setDesc(
				i18next.t("settings.githubWorkflow.githubAction.desc") as string
			)
			.addText((text) => {
				text.setPlaceholder("ci")
					.setValue(githubSettings.worflow.workflowName)
					.onChange(async (value) => {
						value =
							value.length > 0
								? value.trim().replace(".yml", "") + ".yml"
								: value;
						githubSettings.worflow.customCommitMsg = value;
						await this.plugin.saveSettings();
					});
			});


	}

	renderUploadConfiguration() {
		const uploadSettings = this.plugin.settings.upload;
		this.settingsPage.createEl("h3", {
			text: i18next.t("settings.upload.title") as string,
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.folderBehavior.title") as string)
			.setDesc(i18next.t("settings.upload.folderBehavior.desc") as string)
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						fixed: i18next.t(
							"settings.upload.folderBehavior.fixedFolder") as string,
						yaml: i18next.t("settings.upload.folderBehavior.yaml") as string,
						obsidian: i18next.t(
							"settings.upload.folderBehavior.obsidianPath") as string,
					})
					.setValue(uploadSettings.behavior)
					.onChange(async (value: string) => {
						uploadSettings.behavior = value as FolderSettings;
						await folderHideShowSettings(
							frontmatterKeySettings,
							rootFolderSettings,
							autoCleanSetting,
							value,
							this.plugin,
							subFolderSettings
						);
						this.settingsPage.empty();
						this.renderUploadConfiguration();
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.defaultFolder.title") as string)
			.setDesc(i18next.t("settings.upload.defaultFolder.desc") as string)
			.addText((text) => {
				text.setPlaceholder("docs")
					.setValue(uploadSettings.defaultName)
					.onChange(async (value) => {
						uploadSettings.defaultName = value.replace(
							/\/$/,
							""
						);
						await autoCleanCondition(
							value,
							autoCleanSetting,
							this.plugin
						);
						await this.plugin.saveSettings();
					});
			});

		const subFolderSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.pathRemoving.title") as string)
			.setClass("github-publisher")
			.setDesc(i18next.t("settings.upload.pathRemoving.desc"))
			.addText((text) => {
				text.setPlaceholder(
					i18next.t(
						"settings.upload.pathRemoving.placeholder"
					) as string
				)
					.setValue(uploadSettings.subFolder)
					.onChange(async (value) => {
						uploadSettings.subFolder = value
							.replace(/\/$/, "")
							.trim();
						await this.plugin.saveSettings();
					});
			});

		const frontmatterKeySettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.frontmatterKey.title") as string)
			.setClass("github-publisher")
			.setDesc(i18next.t("settings.upload.frontmatterKey.desc") as string)
			.addText((text) => {
				text.setPlaceholder("category")
					.setValue(uploadSettings.yamlFolderKey)
					.onChange(async (value) => {
						uploadSettings.yamlFolderKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		const rootFolderSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.rootFolder.title") as string)
			.setClass("github-publisher")
			.setDesc(i18next.t("settings.upload.rootFolder.desc") as string)
			.addText((text) => {
				text.setPlaceholder("docs")
					.setValue(uploadSettings.rootFolder)
					.onChange(async (value) => {
						uploadSettings.rootFolder = value.replace(
							/\/$/,
							""
						);
						await autoCleanCondition(
							value,
							autoCleanSetting,
							this.plugin
						);
						await this.plugin.saveSettings();
					});
			});
		const frontmatterTitleSet = new Setting(this.settingsPage)
			.setName(
				i18next.t("settings.upload.useFrontmatterTitle.title") as string
			)
			.setDesc(
				i18next.t("settings.upload.useFrontmatterTitle.desc") as string
			)
			.setClass("github-publisher-title")
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.frontmatterTitle.enable)
					.onChange(async (value) => {
						uploadSettings.frontmatterTitle.enable = value;
						await this.plugin.saveSettings();
						this.settingsPage.empty();
						this.renderUploadConfiguration();
					});
			});
		if (uploadSettings.frontmatterTitle.enable) {
			frontmatterTitleSet.addText((text) => {
				text.setPlaceholder("title")
					.setValue(uploadSettings.frontmatterTitle.key)
					.onChange(async (value) => {
						uploadSettings.frontmatterTitle.key = value.trim();
						await this.plugin.saveSettings();
					});
			});
		}
		new Setting(this.settingsPage)
			.setName(
				i18next.t(
					"settings.upload.frontmatterRegex.placeholder"
				) as string
			)
			.setDesc(
				i18next.t("settings.upload.frontmatterRegex.desc") as string
			)
			.addButton((button) => {
				button
					.setIcon("pencil")
					.onClick(async () => {
						new ModalRegexFilePathName(this.app, this.plugin.settings, "file", (result => {
							this.plugin.settings.upload.replaceTitle = result.upload.replaceTitle;
							this.plugin.saveSettings();
						})).open();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.filepathRegex.placeholder") as string)
			.setDesc(i18next.t("settings.upload.filepathRegex.desc") as string)
			.addButton((button) => {
				button
					.setIcon("pencil")
					.onClick(async () => {
						new ModalRegexFilePathName(this.app, this.plugin.settings, "path", (result => {
							this.plugin.settings.upload.replacePath = result.upload.replacePath;
							this.plugin.saveSettings();
						})).open();
					});
			});

		const folderNoteSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.folderNote.title") as string)
			.setClass("github-publisher-folderNote")
			.setDesc(
				i18next.t("settings.conversion.links.folderNote.desc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.folderNote.enable)
					.onChange(async (value) => {
						uploadSettings.folderNote.enable = value;
						await this.plugin.saveSettings();
						this.settingsPage.empty();
						await this.renderUploadConfiguration();
					});
			});

		if (uploadSettings.folderNote.enable) {
			folderNoteSettings.addText((text) => {
				text.setPlaceholder("folderNote")
					.setValue(uploadSettings.folderNote.rename)
					.onChange(async (value) => {
						uploadSettings.folderNote.rename = value;
						await this.plugin.saveSettings();

					});
			});
		}

		showHideBasedOnFolder(this.plugin.settings, frontmatterKeySettings, rootFolderSettings, subFolderSettings, folderNoteSettings);


		//@ts-ignore
		if (app.plugins.enabledPlugins.has("metadata-extractor")) {
			new Setting(this.settingsPage)
				.setName(
					i18next.t("settings.githubWorkflow.useMetadataExtractor.title") as string
				)
				.setDesc(
					i18next.t("settings.githubWorkflow.useMetadataExtractor.desc") as string
				)
				.addText((text) => {
					text.setPlaceholder("docs/_assets/metadata")
						.setValue(uploadSettings.metadataExtractorPath)
						.onChange(async (value) => {
							uploadSettings.metadataExtractorPath =
								value.trim();
							await this.plugin.saveSettings();
						});
				});
		}

		const condition =
			(uploadSettings.behavior === FolderSettings.yaml &&
				uploadSettings.rootFolder.length === 0) ||
			uploadSettings.defaultName.length === 0;

		const autoCleanSetting = new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.autoCleanUp.title") as string)
			.setDesc(i18next.t("settings.githubWorkflow.autoCleanUp.desc") as string)
			.setDisabled(condition)
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.autoclean.enable)
					.onChange(async (value) => {
						uploadSettings.autoclean.enable = value;
						shortcutsHideShow(value, autoCleanExcludedSettings);
						await this.plugin.saveSettings();
					});
			});

		const autoCleanExcludedSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.excludedFiles.title") as string)
			.setDesc(i18next.t("settings.githubWorkflow.excludedFiles.desc") as string)
			.setClass("github-publisher-textarea")
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder(
						"docs/assets/js, docs/assets/logo, /\\.js$/"
					)
					.setValue(
						uploadSettings.autoclean.excluded.join(", ")
					)
					.onChange(async (value) => {
						uploadSettings.autoclean.excluded = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});
		autoCleanUpSettingsOnCondition(
			condition,
			autoCleanSetting,
			this.plugin
		);
		shortcutsHideShow(
			uploadSettings.autoclean.enable,
			autoCleanExcludedSettings
		);
		folderHideShowSettings(
			frontmatterKeySettings,
			rootFolderSettings,
			autoCleanSetting,
			uploadSettings.behavior,
			this.plugin,
			subFolderSettings
		).then();

	}

	renderTextConversion() {
		const textSettings = this.plugin.settings.conversion;
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.conversion.desc") as string,
		});
		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.conversion.header") as string,
		});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.hardBreak.title") as string)
			.setDesc(i18next.t("settings.conversion.hardBreak.desc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.hardbreak)
					.onChange(async (value) => {
						textSettings.hardbreak = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.dataview.title") as string)
			.setDesc(i18next.t("settings.conversion.dataview.desc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.dataview)
					.onChange(async (value) => {
						textSettings.dataview = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.censor.modal.title") as string)
			.setDesc(i18next.t("settings.conversion.censor.modal.desc") as string)
			.addButton((button) => {
				button
					.setIcon("pencil")
					.onClick(async () => {
						new ModalRegexOnContents(this.app, this.plugin.settings, (result => {
							this.plugin.settings.conversion.censorText = result.conversion.censorText;
							this.plugin.saveSettings();
						})).open();
					});
			});

		this.settingsPage.createEl("h5", { text: "Tags" });
		new Setting(this.settingsPage)
			.setName(
				i18next.t("settings.conversion.tags.inlineTags.title") as string
			)
			.setDesc(
				i18next.t("settings.conversion.tags.inlineTags.desc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.tags.inline)
					.onChange(async (value) => {
						textSettings.tags.inline = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.tags.title") as string)
			.setDesc(i18next.t("settings.conversion.tags.desc") as string)
			.setClass("github-publisher-textarea")
			.addTextArea((text) => {
				text.setPlaceholder("field_name")
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
			.setName(i18next.t("settings.conversion.tags.exclude.title") as string)
			.setDesc(i18next.t("settings.conversion.tags.exclude.desc") as string)
			.setClass("github-publisher-textarea")
			.addTextArea((text) => {
				text.setPlaceholder("field value")
					.setValue(
						textSettings.tags.exclude.join(",")
					)
					.onChange(async (value) => {
						textSettings.tags.exclude = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});

		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.conversion.links.title") as string,
		});
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.conversion.links.desc") as string,
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.internals.title") as string)
			.setDesc(
				i18next.t("settings.conversion.links.internals.desc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.links.internal)
					.onChange(async (value) => {
						textSettings.links.internal = value;
						await this.plugin.saveSettings();
						this.settingsPage.empty();
						this.renderTextConversion();
					});
			});
		if (textSettings.links.internal) {
			new Setting(this.settingsPage)
				.setName(
					i18next.t("settings.conversion.links.nonShared.title") as string
				)
				.setDesc(
					i18next.t("settings.conversion.links.nonShared.desc") as string
				)
				.addToggle((toggle) => {
					toggle
						.setValue(textSettings.links.unshared)
						.onChange(async (value) => {
							textSettings.links.unshared =
								value;
							await this.plugin.saveSettings();
						});
				});
		}

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.wikilinks.title") as string)
			.setDesc(
				i18next.t("settings.conversion.links.wikilinks.desc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.links.wiki)
					.onChange(async (value) => {
						textSettings.links.wiki = value;
						await this.plugin.saveSettings();
					});
			});
	}

	renderEmbedConfiguration() {
		const embedSettings = this.plugin.settings.embed;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.transferImage.title") as string)
			.setDesc(i18next.t("settings.embed.transferImage.desc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(embedSettings.attachments)
					.onChange(async (value) => {
						embedSettings.attachments = value;
						shortcutsHideShow(value, settingsDefaultImage);
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.transferMetaFile.title") as string)
			.setDesc(i18next.t("settings.embed.transferMetaFile.desc") as string)
			.setClass("github-publisher-textarea")
			.addTextArea((text) => {
				text.setPlaceholder("banner")
					.setValue(
						embedSettings.keySendFile.join(", ")
					)
					.onChange(async (value) => {
						embedSettings.keySendFile = value
							.split(/[,\n]\W*/)
							.map((item) => item.trim())
							.filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.transferNotes.title") as string)
			.setDesc(i18next.t("settings.embed.transferNotes.desc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(embedSettings.notes)
					.onChange(async (value) => {
						embedSettings.notes = value;
						await this.plugin.saveSettings();
					});
			});

		const settingsDefaultImage = new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.defaultImageFolder.title") as string)
			.setDesc(i18next.t("settings.embed.defaultImageFolder.desc") as string)
			.addText((text) => {
				text.setPlaceholder("docs/images")
					.setValue(embedSettings.folder)
					.onChange(async (value) => {
						embedSettings.folder = value.replace(
							/\/$/,
							""
						);
						await this.plugin.saveSettings();
					});
			});
	}

	renderPluginSettings() {
		const pluginSettings = this.plugin.settings.plugin;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.shareKey.title") as string)
			.setDesc(i18next.t("settings.plugin.shareKey.desc") as string)
			.addText((text) =>
				text
					.setPlaceholder("share")
					.setValue(pluginSettings.shareKey)
					.onChange(async (value) => {
						pluginSettings.shareKey = value.trim();
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.excludedFolder.title") as string)
			.setDesc(i18next.t("settings.plugin.excludedFolder.desc") as string)
			.setClass("github-publisher-textarea")
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
			.setName(i18next.t("settings.plugin.fileMenu.title") as string)
			.setDesc(i18next.t("settings.plugin.fileMenu.desc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.fileMenu)
					.onChange(async (value) => {
						pluginSettings.fileMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.editorMenu.title") as string)
			.setDesc(i18next.t("settings.plugin.editorMenu.desc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.editorMenu)
					.onChange(async (value) => {
						pluginSettings.editorMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.shareExternalModified.title") as string)
			.setDesc(i18next.t("settings.plugin.shareExternalModified.desc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.externalShare)
					.onChange(async (value) => {
						pluginSettings.externalShare = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.title") as string)
			.setDesc(i18next.t("settings.plugin.copyLink.desc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.copyLink.enable)
					.onChange(async (value) => {
						pluginSettings.copyLink.enable = value;
						shortcutsHideShow(value, baseLinkSettings);
						shortcutsHideShow(value, pathRemover);
						await this.plugin.saveSettings();
					})
			);

		const baseLinkSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.baselink.title") as string)
			.setDesc(i18next.t("settings.plugin.copyLink.baselink.desc") as string)
			.setClass("github-publisher")
			.addText((text) => {
				text.setPlaceholder("my_blog.com")
					.setValue(pluginSettings.copyLink.links)
					.onChange(async (value) => {
						pluginSettings.copyLink.links = value;
						await this.plugin.saveSettings();
					});
			});
		const pathRemover = new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.linkpathremover.desc") as string)
			.setDesc(
				i18next.t("settings.plugin.copyLink.linkpathremover.desc") as string
			)
			.setClass("github-publisher")
			.addText((text) => {
				text.setPlaceholder("docs")
					.setValue(pluginSettings.copyLink.removePart.join(", "))
					.onChange(async (value) => {
						pluginSettings.copyLink.removePart = value.split(/[,\n]\W*/).map((item) => item.trim()).filter((item) => item.length > 0);
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.logNoticeHeader.title") as string)
			.setDesc(i18next.t("settings.plugin.logNoticeHeader.desc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.noticeError)
					.onChange(async (value) => {
						pluginSettings.noticeError = value;
						await this.plugin.saveSettings();
					})
			);
		shortcutsHideShow(pluginSettings.copyLink.links, baseLinkSettings);
		shortcutsHideShow(pluginSettings.copyLink.links, pathRemover);
	}
	renderHelp() {
		this.settingsPage.createEl("h2", {
			text: i18next.t("settings.help.usefulLinks.title") as string,
		});
		this.settingsPage.appendChild(usefullLinks());
		this.settingsPage.createEl("hr");
		this.settingsPage.createEl("h2", {
			text: i18next.t("settings.help.frontmatter.title") as string,
		});
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.help.frontmatter.desc") as string,
		});
		this.settingsPage
			.createEl("pre", { cls: "language-yaml" })
			.createEl("code", {
				text: KeyBasedOnSettings(this.plugin.settings),
				cls: "language-yaml",
			});
		this.settingsPage.appendChild(help(this.plugin.settings));
		this.settingsPage.createEl("h2", {
			text: i18next.t("settings.help.multiRepoHelp.title") as string,
		});
		this.settingsPage.appendChild(
			multipleRepoExplained(this.plugin.settings)
		);
		this.settingsPage.appendChild(supportMe());
	}
}
