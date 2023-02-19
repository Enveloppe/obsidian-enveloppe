import { App, Notice, PluginSettingTab, setIcon, Setting } from "obsidian";
import GithubPublisherPlugin from "./main";
import { RegexOnFilePathAndName, RegexOnContents } from "./settings/regex_filepath";
import {
	autoCleanCondition,
	folderHideShowSettings,
	autoCleanUpSettingsOnCondition,
	shortcutsHideShow, showHideBasedOnFolder,
} from "./settings/style";
import {
	FolderSettings,
	TextCleaner,
	PUBLISHER_TABS, GithubTiersVersion,
} from "./settings/interface";
import {settings, StringFunc, subSettings, t} from "./i18n";
import {
	help,
	multipleRepoExplained,
	supportMe,
	usefullLinks,
	KeyBasedOnSettings
} from "./settings/help";

import {checkRepositoryValidity} from "./src/data_validation_test";
import {ExportModal, ImportModal} from "./src/modals";

function openDetails(groupName: string, detailsState: boolean) {
	for (let i = 0; i < document.getElementsByTagName("details").length; i++) {
		const details = document.getElementsByTagName("details")[
			i
		] as HTMLDetailsElement;
		if (details.innerText === groupName && detailsState) {
			details.open = true;
		}
	}
}


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
				button.setButtonText(t("settings.exportSettings") as string)
					.setClass("github-publisher-export")
					.onClick(() => {
						new ExportModal(this.app, this.plugin).open();
					});
			}
			)
			.addButton((button) => {
				button.setButtonText(t("settings.importSettings") as string)
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
			.setName(subSettings("github.apiType.title") as string)
			.setDesc(subSettings("github.apiType.desc") as string)
			.addDropdown((dropdown) => {
				dropdown
					.addOption(GithubTiersVersion.free, subSettings("github.apiType.dropdown.free") as string)
					.addOption(GithubTiersVersion.entreprise, subSettings("github.apiType.dropdown.enterprise") as string)
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
				.setName(subSettings("github.apiType.hostname") as string)
				.setDesc(subSettings("github.apiType.hostnameDesc") as string)
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
			.setName(settings("github", "repoName") as string)
			.setDesc(settings("github", "repoNameDesc") as string)
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
			.setName(settings("github", "githubUsername") as string)
			.setDesc(settings("github", "githubUsernameDesc") as string)
			.addText((text) =>
				text
					.setPlaceholder(
						settings("github", "githubUsername") as string
					)
					.setValue(githubSettings.user)
					.onChange(async (value) => {
						githubSettings.user = value.trim();
						await this.plugin.saveSettings();
					})
			);
		const desc_ghToken = document.createDocumentFragment();
		desc_ghToken.createEl("span", null, (span) => {
			span.innerText = settings("github", "ghTokenDesc") as string;
			span.createEl("a", null, (link) => {
				link.innerText = settings("github", "here") as string;
				link.href =
					"https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		});
		new Setting(this.settingsPage)
			.setName(settings("github", "githubToken") as string)
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
			.setName(settings("github", "githubBranchHeading") as string)
			.setDesc(settings("github", "githubBranchDesc") as string)
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
			.setName(settings("github", "automaticallyMergePR") as string)
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
					.setButtonText(settings("github", "testConnection") as string)
					.setClass("github-publisher-connect-button")
					.onClick(async () => {
						await checkRepositoryValidity(this.branchName, this.plugin.reloadOctokit(), this.plugin.settings, null, this.app.metadataCache);
					})
			);
		this.settingsPage.createEl("h3", { text: "Github Workflow" });
		new Setting(this.settingsPage)
			.setName(subSettings("githubWorkflow.prRequest.title") as string)
			.setDesc(subSettings("githubWorkflow.prRequest.desc") as string)
			.addText((text)  =>
				text
					.setPlaceholder("[PUBLISHER] MERGE")
					.setValue(githubSettings.worflow.customCommitMsg)
					.onChange(async (value)  => {
						githubSettings.worflow.customCommitMsg = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(settings("githubWorkflow", "githubActionName") as string)
			.setDesc(
				settings("githubWorkflow", "githubActionNameDesc") as string
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
			text: settings("uploadConfig", "pathSetting") as string,
		});

		new Setting(this.settingsPage)
			.setName(settings("uploadConfig", "folderBehavior") as string)
			.setDesc(settings("uploadConfig", "folderBehaviorDesc") as string)
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						fixed: settings(
							"uploadConfig",
							"fixedFolder"
						) as string,
						yaml: settings("uploadConfig", "yaml") as string,
						obsidian: settings(
							"uploadConfig",
							"obsidianPath"
						) as string,
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
			.setName(settings("uploadConfig", "defaultFolder") as string)
			.setDesc(settings("uploadConfig", "defaultFolderDesc") as string)
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
			.setName(settings("uploadConfig", "pathRemoving") as string)
			.setClass("github-publisher")
			.setDesc(settings("uploadConfig", "pathRemovingDesc") as string)
			.addText((text) => {
				text.setPlaceholder(
					settings(
						"uploadConfig",
						"pathRemovingPlaceholder"
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
			.setName(settings("uploadConfig", "frontmatterKey") as string)
			.setClass("github-publisher")
			.setDesc(settings("uploadConfig", "frontmatterKeyDesc") as string)
			.addText((text) => {
				text.setPlaceholder("category")
					.setValue(uploadSettings.yamlFolderKey)
					.onChange(async (value) => {
						uploadSettings.yamlFolderKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		const rootFolderSettings = new Setting(this.settingsPage)
			.setName(settings("uploadConfig", "rootFolder") as string)
			.setClass("github-publisher")
			.setDesc(settings("uploadConfig", "rootFolderDesc") as string)
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
				subSettings("uploadConfig.useFrontmatterTitle.title") as string
			)
			.setDesc(
				subSettings("uploadConfig.useFrontmatterTitle.desc") as string
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
				subSettings(
					"uploadConfig.frontmatterRegex.placeholder"
				) as string
			)
			.setDesc(
				subSettings("uploadConfig.frontmatterRegex.desc") as string
			)
			.addButton((button) => {
				button
					.setIcon("pencil")
					.onClick(async () => {
						new RegexOnFilePathAndName(this.app, this.plugin.settings, "file", (result =>
							{
								this.plugin.settings.upload.replaceTitle = result.upload.replaceTitle;
								this.plugin.saveSettings();
							})).open();
					});
			});

		new Setting(this.settingsPage)
			.setName("placeholder")
			.setDesc("placeholder")
			.addButton((button) => {
				button
					.setIcon("pencil")
					.onClick(async () => {
						new RegexOnFilePathAndName(this.app, this.plugin.settings, "path", (result =>
							{
								this.plugin.settings.upload.replacePath = result.upload.replacePath;
								this.plugin.saveSettings();
							})).open();
					});
			});

		const folderNoteSettings = new Setting(this.settingsPage)
			.setName(subSettings("textConversion.links.folderNote") as string)
			.setClass("github-publisher-folderNote")
			.setDesc(
				subSettings("textConversion.links.folderNoteDesc") as string
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
					settings("githubWorkflow", "useMetadataExtractor") as string
				)
				.setDesc(
					settings(
						"githubWorkflow",
						"useMetadataExtractorDesc"
					) as string
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
			.setName(settings("githubWorkflow", "autoCleanUp") as string)
			.setDesc(settings("githubWorkflow", "autoCleanUpDesc") as string)
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
			.setName(settings("githubWorkflow", "excludedFiles") as string)
			.setDesc(settings("githubWorkflow", "excludedFilesDesc") as string)
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
			text: settings("textConversion", "textConversionDesc") as string,
		});
		this.settingsPage.createEl("h5", {
			text: settings("textConversion", "textHeader") as string,
		});
		new Setting(this.settingsPage)
			.setName(settings("textConversion", "hardBreakTitle") as string)
			.setDesc(settings("textConversion", "hardBreakDesc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.hardbreak)
					.onChange(async (value) => {
						textSettings.hardbreak = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(subSettings("textConversion.dataview.header") as string)
			.setDesc(subSettings("textConversion.dataview.desc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.dataview)
					.onChange(async (value) => {
						textSettings.dataview = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName("censorText")
			.setDesc("censorTextDesc")
			.addButton((button) => {
				button
					.setButtonText("censorText")
					.onClick(async () => {
						new RegexOnFilePathAndName(
							this.app,
							this.plugin.settings,
							"path", 
							(result => {
								new Notice('Censoring text')
							})).onOpen();
					});
			});

		this.settingsPage.createEl("h5", { text: "Tags" });
		new Setting(this.settingsPage)
			.setName(
				subSettings("textConversion.tags.inlineTagsHeader") as string
			)
			.setDesc(
				subSettings("textConversion.tags.inlineTagsDesc") as string
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
			.setName(subSettings("textConversion.tags.header") as string)
			.setDesc(subSettings("textConversion.tags.desc") as string)
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
			.setName(subSettings("textConversion.tags.ExcludeHeader") as string)
			.setDesc(subSettings("textConversion.tags.ExcludeDesc") as string)
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
			text: subSettings("textConversion.links.header") as string,
		});
		this.settingsPage.createEl("p", {
			text: subSettings("textConversion.links.desc") as string,
		});

		new Setting(this.settingsPage)
			.setName(subSettings("textConversion.links.internals") as string)
			.setDesc(
				subSettings("textConversion.links.internalsDesc") as string
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
					subSettings("textConversion.links.nonShared") as string
				)
				.setDesc(
					subSettings("textConversion.links.nonSharedDesc") as string
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
			.setName(subSettings("textConversion.links.wikilinks") as string)
			.setDesc(
				subSettings("textConversion.links.wikilinksDesc") as string
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
			.setName(settings("embed", "transferImage") as string)
			.setDesc(settings("embed", "transferImageDesc") as string)
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
			.setName(settings("embed", "transferMetaFile") as string)
			.setDesc(settings("embed", "transferMetaFileDesc") as string)
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
			.setName(settings("embed", "transferEmbeddedNotes") as string)
			.setDesc(settings("embed", "transferEmbeddedNotesDesc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(embedSettings.notes)
					.onChange(async (value) => {
						embedSettings.notes = value;
						await this.plugin.saveSettings();
					});
			});

		const settingsDefaultImage = new Setting(this.settingsPage)
			.setName(settings("embed", "defaultImageFolder") as string)
			.setDesc(settings("embed", "defaultImageFolderDesc") as string)
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
			.setName(settings("plugin", "shareKey") as string)
			.setDesc(settings("plugin", "shareKeyDesc") as string)
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
			.setName(settings("plugin", "excludedFolder") as string)
			.setDesc(settings("plugin", "excludedFolderDesc") as string)
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
			.setName(settings("plugin", "fileMenu") as string)
			.setDesc(settings("plugin", "fileMenuDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.fileMenu)
					.onChange(async (value) => {
						pluginSettings.fileMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(settings("plugin", "editorMenu") as string)
			.setDesc(settings("plugin", "editorMenuDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.editorMenu)
					.onChange(async (value) => {
						pluginSettings.editorMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(settings("plugin", "shareExternalModifiedTitle") as string)
			.setDesc(settings("plugin", "shareExternalModifiedDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.externalShare)
					.onChange(async (value) => {
						pluginSettings.externalShare = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(subSettings("plugin.copyLink.copylinkSetting") as string)
			.setDesc(subSettings("plugin.copyLink.copylinkDesc") as string)
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
			.setName(subSettings("plugin.copyLink.baselink") as string)
			.setDesc(subSettings("plugin.copyLink.baselinkDesc") as string)
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
			.setName(subSettings("plugin.copyLink.linkpathremover") as string)
			.setDesc(
				subSettings("plugin.copyLink.linkpathremoverDesc") as string
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
			.setName(settings("plugin", "logNoticeHeader") as string)
			.setDesc(settings("plugin", "logNoticeDesc") as string)
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
			text: subSettings("help.usefulLinks.title") as string,
		});
		this.settingsPage.appendChild(usefullLinks());
		this.settingsPage.createEl("hr");
		this.settingsPage.createEl("h2", {
			text: subSettings("help.frontmatter.title") as string,
		});
		this.settingsPage.createEl("p", {
			text: subSettings("help.frontmatter.desc") as string,
		});
		this.settingsPage
			.createEl("pre", { cls: "language-yaml" })
			.createEl("code", {
				text: KeyBasedOnSettings(this.plugin.settings),
				cls: "language-yaml",
			});
		this.settingsPage.appendChild(help(this.plugin.settings));
		this.settingsPage.createEl("h2", {
			text: subSettings("help.multiRepoHelp.title") as string,
		});
		this.settingsPage.appendChild(
			multipleRepoExplained(this.plugin.settings)
		);
		this.settingsPage.appendChild(supportMe());
	}
}
