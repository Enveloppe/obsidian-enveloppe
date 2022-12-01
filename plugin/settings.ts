import {App, Notice, PluginSettingTab, setIcon, Setting} from "obsidian";
import GithubPublisherPlugin from "./main";
import {
	hideSettings,
	showSettings,
	autoCleanCondition,
	folderHideShowSettings,
	autoCleanUpSettingsOnCondition,
	shortcutsHideShow,
} from "./settings/style";
import { folderSettings, TextCleaner, PUBLISHER_TABS } from "./settings/interface";
import {settings, StringFunc, subSettings} from "./i18n";
import {help, multipleRepoExplained, supportMe, usefullLinks} from "./settings/help";

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


	constructor(app: App, plugin: GithubPublisherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		const tabBar = containerEl.createEl('nav', {cls: 'settings-tab-bar obs-git-publisher'});
		for (const [tabID, tabInfo] of Object.entries(PUBLISHER_TABS)) {
			const tabEl = tabBar.createEl('div', {cls: 'settings-tab obs-git-publisher'});
			const tabIcon = tabEl.createEl('div', {cls: 'settings-tab-icon obs-git-publisher'});
			setIcon(tabIcon, tabInfo.icon);
			tabEl.createEl('div', {cls: 'settings-tab-name obs-git-publisher', text: tabInfo.name});
			if (tabID === 'github-configuration')
				tabEl.addClass('settings-tab-active');

			tabEl.addEventListener('click', () => {
				// @ts-ignore
				for (const tabEl of tabBar.children)
					tabEl.removeClass('settings-tab-active');

				tabEl.addClass('settings-tab-active');
				this.renderSettingsPage(tabID);
			});
		}
		this.settingsPage = containerEl.createEl('div', {cls: 'settings-tab-page obs-git-publisher'});
		this.renderSettingsPage('github-configuration');

	}

	renderSettingsPage(tabId: string) {
		this.settingsPage.empty();
		switch (tabId) {
		case 'github-configuration':
			this.renderGithubConfiguration();
			break;
		case 'upload-configuration':
			this.renderUploadConfiguration();
			break;
		case 'text-conversion':
			this.renderTextConversion();
			break;
		case 'embed-configuration':
			this.renderEmbedConfiguration();
			break;
		case 'plugin-settings':
			this.renderPluginSettings();
			break;
		case 'help':
			this.renderHelp();
			break;
		}
	}


	renderGithubConfiguration() {
		new Setting(this.settingsPage)
			.setName(settings("github", "repoName") as string)
			.setDesc(settings("github", "repoNameDesc") as string)
			.addText((text) =>
				text
					.setPlaceholder("mkdocs-template")
					.setValue(this.plugin.settings.githubRepo)
					.onChange(async (value) => {
						this.plugin.settings.githubRepo = value.trim();
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
					.setValue(this.plugin.settings.githubName)
					.onChange(async (value) => {
						this.plugin.settings.githubName = value.trim();
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
					.setValue(this.plugin.settings.GhToken)
					.onChange(async (value) => {
						this.plugin.settings.GhToken = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(settings("github", "githubBranchHeading") as string)
			.setDesc(settings("github", "githubBranchDesc") as string)
			.addText((text) =>
				text
					.setPlaceholder("main")
					.setValue(this.plugin.settings.githubBranch)
					.onChange(async (value) => {
						this.plugin.settings.githubBranch = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(settings("github", "automaticallyMergePR") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.automaticallyMergePR)
					.onChange(async (value) => {
						this.plugin.settings.automaticallyMergePR = value;
						await this.plugin.saveSettings();
					})
			);

	}

	renderUploadConfiguration() {

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
					.setValue(this.plugin.settings.downloadedFolder)
					.onChange(async (value: string) => {
						this.plugin.settings.downloadedFolder = value;
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
					.setValue(this.plugin.settings.folderDefaultName)
					.onChange(async (value) => {
						this.plugin.settings.folderDefaultName = value.replace(
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
			.setClass("obs-git-publisher")
			.setDesc(settings("uploadConfig", "pathRemovingDesc") as string)
			.addText((text) => {
				text.setPlaceholder(
					settings(
						"uploadConfig",
						"pathRemovingPlaceholder"
					) as string
				)
					.setValue(this.plugin.settings.subFolder)
					.onChange(async (value) => {
						this.plugin.settings.subFolder = value
							.replace(/\/$/, "")
							.trim();
						await this.plugin.saveSettings();
					});
			});

		const frontmatterKeySettings = new Setting(this.settingsPage)
			.setName(settings("uploadConfig", "frontmatterKey") as string)
			.setClass("obs-git-publisher")
			.setDesc(settings("uploadConfig", "frontmatterKeyDesc") as string)
			.addText((text) => {
				text.setPlaceholder("category")
					.setValue(this.plugin.settings.yamlFolderKey)
					.onChange(async (value) => {
						this.plugin.settings.yamlFolderKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		const rootFolderSettings = new Setting(this.settingsPage)
			.setName(settings("uploadConfig", "rootFolder") as string)
			.setClass("obs-git-publisher")
			.setDesc(settings("uploadConfig", "rootFolderDesc") as string)
			.addText((text) => {
				text.setPlaceholder("docs")
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async (value) => {
						this.plugin.settings.rootFolder = value.replace(
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
			.setName(settings("uploadConfig", "useFrontmatterTitle") as string)
			.setDesc(
				settings("uploadConfig", "useFrontmatterTitleDesc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useFrontmatterTitle)
					.onChange(async (value) => {
						this.plugin.settings.useFrontmatterTitle = value;
						await this.plugin.saveSettings();
						this.settingsPage.empty();
						this.renderUploadConfiguration();
					});
			});
		if (this.plugin.settings.useFrontmatterTitle) {
			frontmatterTitleSet.addText((text) => {
				text.setPlaceholder("title")
					.setValue(this.plugin.settings.frontmatterTitleKey)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterTitleKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		}
		if (this.plugin.settings.downloadedFolder === folderSettings.yaml){
			showSettings(frontmatterKeySettings);
			showSettings(rootFolderSettings);
			hideSettings(subFolderSettings);
		} else {
			hideSettings(frontmatterKeySettings);
			hideSettings(rootFolderSettings);
			if (this.plugin.settings.downloadedFolder === folderSettings.obsidian){
				showSettings(subFolderSettings);
			} else {
				hideSettings(subFolderSettings)
			}
		}
		this.settingsPage.createEl("h3", {text: "Github Workflow"});
		new Setting(this.settingsPage)
			.setName(settings("githubWorkflow", "githubActionName") as string)
			.setDesc(
				settings("githubWorkflow", "githubActionNameDesc") as string
			)
			.addText((text) => {
				text.setPlaceholder("ci")
					.setValue(this.plugin.settings.workflowName)
					.onChange(async (value) => {
						value =
							value.length > 0
								? value.trim().replace(".yml", "") + ".yml"
								: value;
						this.plugin.settings.workflowName = value;
						await this.plugin.saveSettings();
					});
			});
		const condition =
			(this.plugin.settings.downloadedFolder === folderSettings.yaml &&
				this.plugin.settings.rootFolder.length === 0) ||
			this.plugin.settings.folderDefaultName.length === 0;

		const autoCleanSetting = new Setting(this.settingsPage)
			.setName(settings("githubWorkflow", "autoCleanUp") as string)
			.setDesc(settings("githubWorkflow", "autoCleanUpDesc") as string)
			.setDisabled(condition)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoCleanUp)
					.onChange(async (value) => {
						this.plugin.settings.autoCleanUp = value;
						shortcutsHideShow(value, autoCleanExcludedSettings);
						await this.plugin.saveSettings();
					});
			});

		const autoCleanExcludedSettings = new Setting(this.settingsPage)
			.setName(settings("githubWorkflow", "excludedFiles") as string)
			.setDesc(settings("githubWorkflow", "excludedFilesDesc") as string)
			.setClass("obs-git-publisher-textarea")
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("docs/assets/js, docs/assets/logo")
					.setValue(this.plugin.settings.autoCleanUpExcluded)
					.onChange(async (value) => {
						this.plugin.settings.autoCleanUpExcluded = value;
						await this.plugin.saveSettings();
					});
			});
		autoCleanUpSettingsOnCondition(
			condition,
			autoCleanSetting,
			this.plugin
		);
		shortcutsHideShow(
			this.plugin.settings.autoCleanUp,
			autoCleanExcludedSettings
		);
		folderHideShowSettings(
			frontmatterKeySettings,
			rootFolderSettings,
			autoCleanSetting,
			this.plugin.settings.downloadedFolder,
			this.plugin,
			subFolderSettings
		).then();

	}

	renderTextConversion() {
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
					.setValue(this.plugin.settings.hardBreak)
					.onChange(async (value) => {
						this.plugin.settings.hardBreak = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(subSettings('textConversion.dataview.header') as string)
			.setDesc(subSettings("textConversion.dataview.desc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.convertDataview)
					.onChange(async (value) => {
						this.plugin.settings.convertDataview = value;
						await this.plugin.saveSettings();
					});
			});

		const censorTextDesc = document.createDocumentFragment();
		censorTextDesc
			.createEl("p", {
				text: subSettings("textConversion.censor.TextDesc") as string,
			})
			.createEl("p", {
				text: subSettings("textConversion.censor.TextEmpty") as string,
			});
		const toolTipRegex = subSettings('textConversion.censor.TextFlags') as string
		+ '\n' + subSettings("textConversion.censor.flags.insensitive") as string
		+ "\n" + subSettings("textConversion.censor.flags.global") as string
		+ "\n" + subSettings("textConversion.censor.flags.multiline") as string
		+ "\n" + subSettings("textConversion.censor.flags.dotAll") as string
		+ "\n" + subSettings("textConversion.censor.flags.unicode") as string
		+ "\n" + subSettings("textConversion.censor.flags.sticky") as string;
		const details = this.settingsPage.createEl("details");
		details.createEl("summary", {
			text: subSettings("textConversion.censor.TextHeader") as string,
		}).addClass("obs-git-publisher-summary");
		new Setting(details)
			.setClass("obs-git-publisher-censor-desc")
			.setDesc(censorTextDesc)
			.addButton((btn) => {
				btn.setIcon("plus")
					.setTooltip(
						subSettings(
							"textConversion.censor.ToolTipAdd"
						) as string
					)
					.onClick(async () => {
						const censorText: TextCleaner = {
							entry: "",
							replace: "",
							after: false,
							flags: 'gi'
						};
						this.plugin.settings.censorText.push(censorText);
						await this.plugin.saveSettings();
						this.settingsPage.empty();
						this.renderTextConversion();
						openDetails(
							subSettings(
								"textConversion.censor.TextHeader"
							) as string,
							true
						);
					});
			});

		for (const censorText of this.plugin.settings.censorText) {
			const afterIcon = censorText.after
				? "double-down-arrow-glyph"
				: "double-up-arrow-glyph";
			const afterDesc = censorText.after
				? (subSettings("textConversion.censor.After") as string)
				: (subSettings("textConversion.censor.Before") as string);
			new Setting(details)
				.setClass("obs-git-publisher-censor-entry")
				.addText((text) => {
					text.setPlaceholder(
						subSettings(
							"textConversion.censor.PlaceHolder"
						) as string
					)
						.setValue(censorText.entry)
						.onChange(async (value) => {
							censorText.entry = value;
							await this.plugin.saveSettings();
						});
				})
				.addText((text) => {
					text.setPlaceholder(
						subSettings(
							"textConversion.censor.ValuePlaceHolder"
						) as string
					)
						.setValue(censorText.replace)
						.onChange(async (value) => {
							censorText.replace = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((btn) => {
					btn.setTooltip(toolTipRegex)
						.setIcon("tags")
						.setClass("obs-git-publisher-censor-flags")
				})
				.addText((text) => {
					text.setPlaceholder('flags')
						.setValue(censorText.flags)
						.onChange(async (value) => {
							if (value.match(/^[gimsuy\s]+$/) || value === '') {
								censorText.flags = value;
								await this.plugin.saveSettings();
							} else {
								new Notice(
									(subSettings(
										"textConversion.censor.flags.error"
									) as StringFunc)(value)
								)
							}
						})
				})
				.addExtraButton((btn) => {
					btn.setIcon("trash")
						.setTooltip(
							subSettings(
								"textConversion.censor.ToolTipRemove"
							) as string
						)
						.onClick(async () => {
							this.plugin.settings.censorText.splice(
								this.plugin.settings.censorText.indexOf(
									censorText
								),
								1
							);
							await this.plugin.saveSettings();
							this.settingsPage.empty();
							this.renderTextConversion();
							openDetails(
								subSettings(
									"textConversion.censor.TextHeader"
								) as string,
								true
							);
						});
				})
				.addExtraButton((btn) => {
					btn.setIcon(afterIcon)
						.setTooltip(afterDesc)
						.onClick(async () => {
							censorText.after = !censorText.after;
							await this.plugin.saveSettings();
							this.settingsPage.empty();
							this.renderTextConversion();
							openDetails(
								subSettings(
									"textConversion.censor.TextHeader"
								) as string,
								true
							);
						});
				});
		}

		this.settingsPage.createEl("h5", {text: "Tags"});
		new Setting(this.settingsPage)
			.setName(
				subSettings("textConversion.tags.inlineTagsHeader") as string
			)
			.setDesc(
				subSettings("textConversion.tags.inlineTagsDesc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.inlineTags)
					.onChange(async (value) => {
						this.plugin.settings.inlineTags = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(subSettings("textConversion.tags.header") as string)
			.setDesc(subSettings("textConversion.tags.desc") as string)
			.setClass("obs-git-publisher-textarea")
			.addTextArea((text) => {
				text.setPlaceholder("field_name")
					.setValue(this.plugin.settings.dataviewFields.join(","))
					.onChange(async (value) => {
						this.plugin.settings.dataviewFields = value
							.split(",")
							.map((field) => field.trim());
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(subSettings("textConversion.tags.ExcludeHeader") as string)
			.setDesc(subSettings("textConversion.tags.ExcludeDesc") as string)
			.setClass("obs-git-publisher-textarea")
			.addTextArea((text) => {
				text.setPlaceholder("field value")
					.setValue(
						this.plugin.settings.excludeDataviewValue.join(",")
					)
					.onChange(async (value) => {
						this.plugin.settings.excludeDataviewValue = value
							.split(",")
							.map((field) => field.trim());
						await this.plugin.saveSettings();
					});
			});

		this.settingsPage.createEl("h5", {
			text: subSettings("textConversion.links.header") as string,
		});
		this.settingsPage.createEl("p", {
			text: subSettings("textConversion.links.desc") as string,
		});
		const folderNoteSettings = new Setting(this.settingsPage)
			.setName(subSettings("textConversion.links.folderNote") as string)
			.setClass("obs-git-publisher")
			.setDesc(
				subSettings("textConversion.links.folderNoteDesc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.folderNote)
					.onChange(async (value) => {
						this.plugin.settings.folderNote = value;
						await this.plugin.saveSettings();
					});
			});
		this.plugin.settings.downloadedFolder === folderSettings.fixed
			? hideSettings(folderNoteSettings)
			: showSettings(folderNoteSettings);
		new Setting(this.settingsPage)
			.setName(subSettings("textConversion.links.internals") as string)
			.setDesc(
				subSettings("textConversion.links.internalsDesc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.convertForGithub)
					.onChange(async (value) => {
						this.plugin.settings.convertForGithub = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(subSettings("textConversion.links.wikilinks") as string)
			.setDesc(
				subSettings("textConversion.links.wikilinksDesc") as string
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.convertWikiLinks)
					.onChange(async (value) => {
						this.plugin.settings.convertWikiLinks = value;
						await this.plugin.saveSettings();
					});
			});
	}

	renderEmbedConfiguration() {
		new Setting(this.settingsPage)
			.setName(settings("embed", "transferImage") as string)
			.setDesc(settings("embed", "transferImageDesc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.embedImage)
					.onChange(async (value) => {
						this.plugin.settings.embedImage = value;
						shortcutsHideShow(value, settingsDefaultImage);
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(settings("embed", "transferMetaFile") as string)
			.setDesc(settings("embed", "transferMetaFileDesc") as string)
			.setClass("obs-git-publisher-textarea")
			.addTextArea((text) => {
				text.setPlaceholder("banner")
					.setValue(this.plugin.settings.metadataFileFields.join(","))
					.onChange(async (value) => {
						this.plugin.settings.metadataFileFields = value
							.split(",")
							.map((field) => field.trim());
						await this.plugin.saveSettings();
					});
			});

		new Setting(this.settingsPage)
			.setName(settings("embed", "transferEmbeddedNotes") as string)
			.setDesc(settings("embed", "transferEmbeddedNotesDesc") as string)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.embedNotes)
					.onChange(async (value) => {
						this.plugin.settings.embedNotes = value;
						await this.plugin.saveSettings();
					});
			});

		const settingsDefaultImage = new Setting(this.settingsPage)
			.setName(settings("embed", "defaultImageFolder") as string)
			.setDesc(settings("embed", "defaultImageFolderDesc") as string)
			.addText((text) => {
				text.setPlaceholder("docs/images")
					.setValue(this.plugin.settings.defaultImageFolder)
					.onChange(async (value) => {
						this.plugin.settings.defaultImageFolder = value.replace(
							/\/$/,
							""
						);
						await this.plugin.saveSettings();
					});
			});


	}

	renderPluginSettings() {
		new Setting(this.settingsPage)
			.setName(settings("plugin", "shareKey") as string)
			.setDesc(settings("plugin", "shareKeyDesc") as string)
			.addText((text) =>
				text
					.setPlaceholder("share")
					.setValue(this.plugin.settings.shareKey)
					.onChange(async (value) => {
						this.plugin.settings.shareKey = value.trim();
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(settings("plugin", "excludedFolder") as string)
			.setDesc(settings("plugin", "excludedFolderDesc") as string)
			.setClass("obs-git-publisher-textarea")
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder("_assets, Archive")
					.setValue(this.plugin.settings.ExcludedFolder)
					.onChange(async (value) => {
						this.plugin.settings.ExcludedFolder = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(settings("plugin", "fileMenu") as string)
			.setDesc(settings("plugin", "fileMenuDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.fileMenu)
					.onChange(async (value) => {
						this.plugin.settings.fileMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(settings("plugin", "editorMenu") as string)
			.setDesc(settings("plugin", "editorMenuDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.editorMenu)
					.onChange(async (value) => {
						this.plugin.settings.editorMenu = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(this.settingsPage)
			.setName(settings("plugin", "shareExternalModifiedTitle") as string)
			.setDesc(settings("plugin", "shareExternalModifiedDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.shareExternalModified)
					.onChange(async (value) => {
						this.plugin.settings.shareExternalModified = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(this.settingsPage)
			.setName(subSettings("plugin.copyLink.copylinkSetting") as string)
			.setDesc(subSettings("plugin.copyLink.copylinkDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.copyLink)
					.onChange(async (value) => {
						this.plugin.settings.copyLink = value;
						shortcutsHideShow(value, baseLinkSettings);
						shortcutsHideShow(value, pathRemover);
						await this.plugin.saveSettings();
					})
			);

		const baseLinkSettings = new Setting(this.settingsPage)
			.setName(subSettings("plugin.copyLink.baselink") as string)
			.setDesc(subSettings("plugin.copyLink.baselinkDesc") as string)
			.setClass("obs-git-publisher")
			.addText((text) => {
				text.setPlaceholder("my_blog.com")
					.setValue(this.plugin.settings.mainLink)
					.onChange(async (value) => {
						this.plugin.settings.mainLink = value;
						await this.plugin.saveSettings();
					});
			});
		const pathRemover = new Setting(this.settingsPage)
			.setName(subSettings("plugin.copyLink.linkpathremover") as string)
			.setDesc(
				subSettings("plugin.copyLink.linkpathremoverDesc") as string
			)
			.setClass("obs-git-publisher")
			.addText((text) => {
				text
					.setPlaceholder("docs")
					.setValue(this.plugin.settings.linkRemover)
					.onChange(async (value) => {
						this.plugin.settings.linkRemover = value;
						await this.plugin.saveSettings();
					});
			});
		new Setting(this.settingsPage)
			.setName(settings("plugin", "logNoticeHeader") as string)
			.setDesc(settings("plugin", "logNoticeDesc") as string)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.logNotice)
					.onChange(async (value) => {
						this.plugin.settings.logNotice = value;
						await this.plugin.saveSettings();
					})
			);
		shortcutsHideShow(this.plugin.settings.copyLink, baseLinkSettings);
		shortcutsHideShow(this.plugin.settings.copyLink, pathRemover);
	}
	renderHelp() {
		this.settingsPage.createEl("h2", {text: subSettings("help.usefulLinks.title") as string});
		console.log(subSettings("help.usefulLinks.title"));
		this.settingsPage.appendChild(usefullLinks());
		this.settingsPage.createEl('hr')
		this.settingsPage.createEl("h2", {text: subSettings("help.frontmatter.title") as string});
		this.settingsPage.createEl('p', {text: subSettings("help.frontmatter.desc") as string});
		const yamlKeysUsefullBasedOnYourSettings =
			`${this.plugin.settings.shareKey}: true\n`
			+ `links:\n`+
			`  mdlinks: ${this.plugin.settings.convertWikiLinks}\n`+
			`  convert: true\n`
			+ `embed:\n`+
			`  send: ${this.plugin.settings.embedNotes}\n`+
			`  remove: false\n`
			+ `attachment:\n`+
			`  send: ${this.plugin.settings.embedImage}\n`+
			`  folder: ${this.plugin.settings.defaultImageFolder}\n`
			+ `dataview: ${this.plugin.settings.convertDataview}\n`
			+ `hardBreak: ${this.plugin.settings.hardBreak}\n`
			+ `repo:\n` +
			`  owner: ${this.plugin.settings.githubName}\n`+
			`  repo: ${this.plugin.settings.githubRepo}\n`+
			`  branch: ${this.plugin.settings.githubBranch}\n`
			+ `autoclean: ${this.plugin.settings.autoCleanUp}\n`
			+ `baseLink: ${this.plugin.settings.mainLink}`
		this.settingsPage.createEl('pre', {cls: 'language-yaml'})
			.createEl('code', {text: yamlKeysUsefullBasedOnYourSettings, cls: 'language-yaml'})
		this.settingsPage.appendChild(help(this.plugin.settings));
		this.settingsPage.createEl('h2', {text: subSettings("help.multiRepoHelp.title") as string});
		this.settingsPage.appendChild(multipleRepoExplained(this.plugin.settings));
		this.settingsPage.appendChild(supportMe());
	}
}


