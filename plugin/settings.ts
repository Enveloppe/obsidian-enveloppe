import { App, PluginSettingTab, setIcon, Setting } from "obsidian";
import GithubPublisherPlugin from "./main";
import { ModalRegexFilePathName, ModalRegexOnContents } from "./settings/modals/regex_edition";
import {
	autoCleanCondition,
	folderHideShowSettings,
	autoCleanUpSettingsOnCondition,
	shortcutsHideShow, showHideBasedOnFolder,
} from "./settings/style";
import {
	FolderSettings, GithubTiersVersion,
} from "./settings/interface";
import {
	help,
	multipleRepoExplained,
	supportMe,
	usefullLinks,
	KeyBasedOnSettings
} from "./settings/help";
import "i18next";
import { checkRepositoryValidity } from "./src/data_validation_test";
import { ExportModal, ImportModal } from "./settings/modals/import_export";
import i18next from "i18next";
import { enumbSettingsTabId } from "./settings/interface";


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
		
		const PUBLISHER_TABS = {
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
			"help": {
				name: i18next.t("settings.help.title"),
				icon: "info",
			},
		};

		new Setting(containerEl)
			.setClass("github-publisher-export-import")
			.addButton((button) => {
				button.setButtonText(i18next.t("settings.exportSettings") )
					.setClass("github-publisher-export")
					.onClick(() => {
						new ExportModal(this.app, this.plugin).open();
					});
			}
			)
			.addButton((button) => {
				button.setButtonText(i18next.t("settings.importSettings") )
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
			.setName(i18next.t("settings.github.apiType.title") )
			.setDesc(i18next.t("settings.github.apiType.desc") )
			.addDropdown((dropdown) => {
				dropdown
					.addOption(GithubTiersVersion.free, i18next.t("settings.github.apiType.dropdown.free") )
					.addOption(GithubTiersVersion.entreprise, i18next.t("settings.github.apiType.dropdown.enterprise") )
					.setValue(githubSettings.api.tiersForApi)
					.onChange(async (value) => {
						githubSettings.api.tiersForApi = value as GithubTiersVersion;
						await this.plugin.saveSettings();
						this.renderSettingsPage(enumbSettingsTabId.github);
					});
			});
		if (githubSettings.api.tiersForApi === GithubTiersVersion.entreprise) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.github.apiType.hostname.title") )
				.setDesc(i18next.t("settings.github.apiType.hostname.desc") )
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
			.setName(i18next.t("settings.github.repoName.title") )
			.setDesc(i18next.t("settings.github.repoName.desc") )
			.addText((text) =>
				text
					.setPlaceholder(i18next.t("settings.github.repoName.placeholder"))
					.setValue(githubSettings.repo)
					.onChange(async (value) => {
						githubSettings.repo = value.trim();
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.username.title") )
			.setDesc(i18next.t("settings.github.username.desc") )
			.addText((text) =>
				text
					.setPlaceholder(
						i18next.t("settings.github.username.title") 
					)
					.setValue(githubSettings.user)
					.onChange(async (value) => {
						githubSettings.user = value.trim();
						await this.plugin.saveSettings();
					})
			);
		const desc_ghToken = document.createDocumentFragment();
		desc_ghToken.createEl("span", null, (span) => {
			span.innerText = i18next.t("settings.github.ghToken.desc") ;
			span.createEl("a", null, (link) => {
				link.innerText = i18next.t("common.here") ;
				link.href =
					"https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.github.ghToken.title") )
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
			.setName(i18next.t("settings.github.branch.title") )
			.setDesc(i18next.t("settings.github.branch.desc") )
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
			.setName(i18next.t("settings.github.automaticallyMergePR") )
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
					.setButtonText(i18next.t("settings.github.testConnection") )
					.setClass("github-publisher-connect-button")
					.onClick(async () => {
						await checkRepositoryValidity(this.branchName, this.plugin.reloadOctokit(), this.plugin.settings, null, this.app.metadataCache);
					})
			);
		this.settingsPage.createEl("h3", { text: "Github Workflow" });
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.prRequest.title") )
			.setDesc(i18next.t("settings.githubWorkflow.prRequest.desc") )
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
			.setName(i18next.t("settings.githubWorkflow.githubAction.title") )
			.setDesc(
				i18next.t("settings.githubWorkflow.githubAction.desc") 
			)
			.addText((text) => {
				text.setPlaceholder("ci")
					.setValue(githubSettings.worflow.workflowName)
					.onChange(async (value) => {
						if (value.length > 0) {
							value = value.trim();
							const yamlEndings = [".yml", ".yaml"];
							if (! yamlEndings.some(ending => value.endsWith(ending))) {
								value += yamlEndings[0];
							}
						}
						githubSettings.worflow.workflowName = value;
						await this.plugin.saveSettings();
					});
			});


	}

	renderUploadConfiguration() {
		const uploadSettings = this.plugin.settings.upload;
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.folderBehavior.title") )
			.setDesc(i18next.t("settings.upload.folderBehavior.desc") )
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						fixed: i18next.t(
							"settings.upload.folderBehavior.fixedFolder") ,
						yaml: i18next.t("settings.upload.folderBehavior.yaml") ,
						obsidian: i18next.t(
							"settings.upload.folderBehavior.obsidianPath") ,
					})
					.setValue(uploadSettings.behavior)
					.onChange(async (value: string) => {
						uploadSettings.behavior = value as FolderSettings;
						await folderHideShowSettings(
							frontmatterKeySettings,
							rootFolderSettings,
							autoCleanSetting,
							value,
							this.plugin);
						await this.plugin.saveSettings();
						this.renderSettingsPage(enumbSettingsTabId.upload);
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.defaultFolder.title") )
			.setDesc(i18next.t("settings.upload.defaultFolder.desc") )
			.addText((text) => {
				text.setPlaceholder(i18next.t("settings.upload.defaultFolder.placeholder"))
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

		const frontmatterKeySettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.frontmatterKey.title") )
			.setClass("github-publisher")
			.setDesc(i18next.t("settings.upload.frontmatterKey.desc") )
			.addText((text) => {
				text.setPlaceholder(i18next.t("settings.upload.frontmatterKey.placeholder"))
					.setValue(uploadSettings.yamlFolderKey)
					.onChange(async (value) => {
						uploadSettings.yamlFolderKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		const rootFolderSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.upload.rootFolder.title") )
			.setClass("github-publisher")
			.setDesc(i18next.t("settings.upload.rootFolder.desc") )
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
				i18next.t("settings.upload.useFrontmatterTitle.title") 
			)
			.setDesc(
				i18next.t("settings.upload.useFrontmatterTitle.desc") 
			)
			.setClass("github-publisher-title")
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.frontmatterTitle.enable)
					.onChange(async (value) => {
						uploadSettings.frontmatterTitle.enable = value;
						await this.plugin.saveSettings();
						this.renderSettingsPage(enumbSettingsTabId.upload);
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

		let desc = i18next.t("settings.upload.regexFilePathTitle.title.FolderPathTitle") ;
		if (uploadSettings.behavior === FolderSettings.fixed) {
			desc = i18next.t("settings.upload.regexFilePathTitle.title.titleOnly");
		}

		new Setting(this.settingsPage)
			.setName(desc)
			.setDesc(
				i18next.t("settings.upload.regexFilePathTitle.desc") 
			)
			.addButton((button) => {
				button
					.setIcon("pencil")
					.onClick(async () => {
						let allRegex = uploadSettings.replaceTitle;
						if (uploadSettings.behavior !== FolderSettings.fixed) {
							allRegex = allRegex.concat(uploadSettings.replacePath);
						}
						new ModalRegexFilePathName(this.app, this.plugin.settings, allRegex, (result => {
							uploadSettings.replacePath = result.filter(title => {return title.type === "path";});
							uploadSettings.replaceTitle = result.filter(title => {return title.type === "title";});
							this.plugin.saveSettings();
						})).open();
					});
			});
				
		const folderNoteSettings = new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.folderNote.title") )
			.setClass("github-publisher-folderNote")
			.setDesc(
				i18next.t("settings.conversion.links.folderNote.desc") 
			)
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.folderNote.enable)
					.onChange(async (value) => {
						uploadSettings.folderNote.enable = value;
						await this.plugin.saveSettings();
						this.renderSettingsPage("upload-configuration");
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

		showHideBasedOnFolder(this.plugin.settings, frontmatterKeySettings, rootFolderSettings, folderNoteSettings);


		//@ts-ignore
		if (app.plugins.enabledPlugins.has("metadata-extractor")) {
			new Setting(this.settingsPage)
				.setName(
					i18next.t("settings.githubWorkflow.useMetadataExtractor.title") 
				)
				.setDesc(
					i18next.t("settings.githubWorkflow.useMetadataExtractor.desc") 
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
			.setName(i18next.t("settings.githubWorkflow.autoCleanUp.title") )
			.setDesc(i18next.t("settings.githubWorkflow.autoCleanUp.desc") )
			.setDisabled(condition)
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.autoclean.enable)
					.onChange(async (value) => {
						uploadSettings.autoclean.enable = value;
						await this.plugin.saveSettings();
						this.renderSettingsPage(enumbSettingsTabId.upload);
					});
			});
		if (uploadSettings.autoclean.enable) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.githubWorkflow.excludedFiles.title") )
				.setDesc(i18next.t("settings.githubWorkflow.excludedFiles.desc") )
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
		}
		autoCleanUpSettingsOnCondition(
			condition,
			autoCleanSetting,
			this.plugin
		);
		
		folderHideShowSettings(
			frontmatterKeySettings,
			rootFolderSettings,
			autoCleanSetting,
			uploadSettings.behavior,
			this.plugin,
		);

	}

	renderTextConversion() {
		const textSettings = this.plugin.settings.conversion;
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.conversion.desc") ,
		});
		this.settingsPage.createEl("h5", {
			text: i18next.t("settings.conversion.sectionTitle") ,
		});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.hardBreak.title") )
			.setDesc(i18next.t("settings.conversion.hardBreak.desc") )
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.hardbreak)
					.onChange(async (value) => {
						textSettings.hardbreak = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.dataview.title") )
			.setDesc(i18next.t("settings.conversion.dataview.desc") )
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.dataview)
					.onChange(async (value) => {
						textSettings.dataview = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.regexReplacing.modal.title.text") )
			.setDesc(i18next.t("settings.regexReplacing.modal.desc") )
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
				i18next.t("settings.conversion.tags.inlineTags.title") 
			)
			.setDesc(
				i18next.t("settings.conversion.tags.inlineTags.desc") 
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
			.setName(i18next.t("settings.conversion.tags.title") )
			.setDesc(i18next.t("settings.conversion.tags.desc") )
			.setClass("github-publisher-textarea")
			.addTextArea((text) => {
				text.inputEl.style.width = "50%";
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
			.setName(i18next.t("settings.conversion.tags.exclude.title") )
			.setDesc(i18next.t("settings.conversion.tags.exclude.desc") )
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
			text: i18next.t("settings.conversion.links.title") ,
		});
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.conversion.links.desc") ,
		});

		new Setting(this.settingsPage)
			.setName(i18next.t("settings.conversion.links.internals.title") )
			.setDesc(
				i18next.t("settings.conversion.links.internals.desc") 
			)
			.addToggle((toggle) => {
				toggle
					.setValue(textSettings.links.internal)
					.onChange(async (value) => {
						textSettings.links.internal = value;
						await this.plugin.saveSettings();
						this.renderSettingsPage(enumbSettingsTabId.text);
					});
			});
		if (textSettings.links.internal) {
			new Setting(this.settingsPage)
				.setName(
					i18next.t("settings.conversion.links.nonShared.title") 
				)
				.setDesc(
					i18next.t("settings.conversion.links.nonShared.desc") 
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
			.setName(i18next.t("settings.conversion.links.wikilinks.title") )
			.setDesc(
				i18next.t("settings.conversion.links.wikilinks.desc") 
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
			.setName(i18next.t("settings.embed.transferImage.title") )
			.setDesc(i18next.t("settings.embed.transferImage.desc") )
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
			.setName(i18next.t("settings.embed.transferMetaFile.title") )
			.setDesc(i18next.t("settings.embed.transferMetaFile.desc") )
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
			.setName(i18next.t("settings.embed.transferNotes.title") )
			.setDesc(i18next.t("settings.embed.transferNotes.desc") )
			.addToggle((toggle) => {
				toggle
					.setValue(embedSettings.notes)
					.onChange(async (value) => {
						embedSettings.notes = value;
						await this.plugin.saveSettings();
					});
			});

		const settingsDefaultImage = new Setting(this.settingsPage)
			.setName(i18next.t("settings.embed.defaultImageFolder.title") )
			.setDesc(i18next.t("settings.embed.defaultImageFolder.desc") )
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
			.setName(i18next.t("settings.plugin.shareKey.title") )
			.setDesc(i18next.t("settings.plugin.shareKey.desc") )
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
			.setName(i18next.t("settings.plugin.excludedFolder.title") )
			.setDesc(i18next.t("settings.plugin.excludedFolder.desc") )
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
			.setName(i18next.t("settings.plugin.fileMenu.title") )
			.setDesc(i18next.t("settings.plugin.fileMenu.desc") )
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.fileMenu)
					.onChange(async (value) => {
						pluginSettings.fileMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.editorMenu.title") )
			.setDesc(i18next.t("settings.plugin.editorMenu.desc") )
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.editorMenu)
					.onChange(async (value) => {
						pluginSettings.editorMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.title") )
			.setDesc(i18next.t("settings.plugin.copyLink.desc") )
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.copyLink.enable)
					.onChange(async (value) => {
						pluginSettings.copyLink.enable = value;
						await this.plugin.saveSettings();
						this.renderSettingsPage(enumbSettingsTabId.plugin);
						
					})
			);
		if (pluginSettings.copyLink.enable) {
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.baselink.title") )
				.setDesc(i18next.t("settings.plugin.copyLink.baselink.desc") )
				.setClass("github-publisher")
				.addText((text) => {
					text.setPlaceholder("my_blog.com")
						.setValue(pluginSettings.copyLink.links)
						.onChange(async (value) => {
							pluginSettings.copyLink.links = value;
							await this.plugin.saveSettings();
						});
				});
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.linkpathremover.title") )
				.setDesc(
					i18next.t("settings.plugin.copyLink.linkpathremover.desc") 
				)
				.setClass("github-publisher")
				.addText((text) => {
					text.setPlaceholder("docs")
						.setValue(pluginSettings.copyLink.removePart.join(", "))
						.onChange(async (value) => {
							pluginSettings.copyLink.removePart = value.split(/[,\n]\s*/).map((item) => item.trim()).filter((item) => item.length > 0);
							await this.plugin.saveSettings();
						});
				});
			
			new Setting(this.settingsPage)
				.setName(i18next.t("settings.plugin.copyLink.command"))
				.addToggle((toggle) =>
					toggle
						.setValue(pluginSettings.copyLink.addCmd)
						.onChange(async (value) => {
							pluginSettings.copyLink.addCmd = value;
							await this.plugin.saveSettings();
						})
				);
		}
		new Setting(this.settingsPage)
			.setName(i18next.t("settings.plugin.logNoticeHeader.title") )
			.setDesc(i18next.t("settings.plugin.logNoticeHeader.desc") )
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.noticeError)
					.onChange(async (value) => {
						pluginSettings.noticeError = value;
						await this.plugin.saveSettings();
					})
			);
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
	}
	renderHelp() {
		this.settingsPage.createEl("h2", {
			text: i18next.t("settings.help.usefulLinks.title") ,
		});
		this.settingsPage.appendChild(usefullLinks());
		this.settingsPage.createEl("hr");
		this.settingsPage.createEl("h2", {
			text: i18next.t("settings.help.frontmatter.title") ,
		});
		this.settingsPage.createEl("p", {
			text: i18next.t("settings.help.frontmatter.desc") ,
		});
		this.settingsPage
			.createEl("pre", { cls: "language-yaml" })
			.createEl("code", {
				text: KeyBasedOnSettings(this.plugin.settings),
				cls: "language-yaml",
			});
		this.settingsPage.appendChild(help(this.plugin.settings));
		this.settingsPage.createEl("h2", {
			text: i18next.t("settings.help.multiRepoHelp.title") ,
		});
		this.settingsPage.appendChild(
			multipleRepoExplained(this.plugin.settings)
		);
		this.settingsPage.appendChild(supportMe());
	}
}
