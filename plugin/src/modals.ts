import GithubPublisher from "../main";
import { App, Modal, Setting, TextAreaComponent, ButtonComponent, Platform } from "obsidian";
import {GithubPublisherSettings} from "../settings";
import i18next from "i18next";
import {GitHubPublisherSettings, OldSettings} from "../settings/interface";
import { migrateSettings } from "./utils";

export type SettingValue = number | string | boolean | unknown;

/**
 *
 * Credit : Style Settings Plugin
 * URL : https://github.com/mgmeyers/obsidian-github-publisher
 **/

export class ImportModal extends Modal {
	plugin: GithubPublisher;
	settingsPage: HTMLElement;
	settingsTab: GithubPublisherSettings;
	constructor(app: App, plugin: GithubPublisher, settingsPage: HTMLElement, settingsTab: GithubPublisherSettings) {
		super(app);
		this.plugin = plugin;
		this.settingsPage = settingsPage;
		this.settingsTab = settingsTab;
	}

	onOpen() {
		const {contentEl} = this;

		new Setting(contentEl)
			.setName(i18next.t("modals.import.title") )
			.setDesc(i18next.t("modals.import.desc") );

		new Setting(contentEl).then((setting) => {
			// Build an error message container
			const errorSpan = createSpan({
				cls: "github-publisher-import-error",
				text: i18next.t("modals.import.error.span") ,
			});
			setting.nameEl.appendChild(errorSpan);
			const importAndClose = async (str: string) => {
				if (str) {
					try {
						let importedSettings = JSON.parse(str);
						if (Object.keys(importedSettings).includes("editorMenu")) {
							//need to convert old settings to new settings
							const oldSettings = importedSettings as unknown as OldSettings;
							await migrateSettings(oldSettings, this.plugin);
							console.log("Migrated settings from old to new format");
						} else {
							console.log("Imported settings as new format");
							importedSettings = importedSettings as GitHubPublisherSettings;
							if (!(importedSettings.upload.replaceTitle instanceof Array)) {
								importedSettings.upload.replaceTitle = [importedSettings.upload.replaceTitle];
							}
							
							if (Object.keys(importedSettings).includes("github")) {
								importedSettings.github.repo = this.plugin.settings.github.repo;
								importedSettings.github.token = this.plugin.settings.github.token;
								importedSettings.github.user = this.plugin.settings.github.user;
							}
							for (const [key, value] of Object.entries(importedSettings)) {
								// @ts-ignore
								this.plugin.settings[key] = value;
							}
							this.plugin.saveSettings();
						}
						this.close();
					} catch (e) {
						errorSpan.addClass("active");
						errorSpan.setText(`${i18next.t("modals.import.error.span")}${e}`);
					}
				} else {
					errorSpan.addClass("active");
					errorSpan.setText(`${i18next.t("modals.import.error.span")}: ${i18next.t("modals.import.error.isEmpty")}`);
				}
			};
			setting.controlEl.createEl(
				"input",
				{
					cls: "github-publisher-import-input",
					attr: {
						id: "github-publisher-import-input",
						name: "github-publisher-import-input",
						type: "file",
						accept: ".json",
					},
				},
				(importInput) => {
					// Set up a FileReader so we can parse the file contents
					importInput.addEventListener("change", (e) => {
						const reader = new FileReader();

						reader.onload = async (e: ProgressEvent<FileReader>) => {
							await importAndClose(e.target.result.toString().trim());
						};

						reader.readAsText((e.target as HTMLInputElement).files[0]);
					});
				}
			);

			// Build a label we will style as a link
			setting.controlEl.createEl("label", {
				cls: "github-publisher-import-label",
				text: i18next.t("modals.import.importFromFile") ,
				attr: {
					for: "github-publisher-import-input",
				},
			});

			const textArea = new TextAreaComponent(contentEl)
				.setPlaceholder(i18next.t("modals.import.paste") ).then((ta) => {
					const saveButton = new ButtonComponent(contentEl).setButtonText(i18next.t("common.save") ).onClick(async () => {
						await importAndClose(ta.getValue().trim());
					});
					saveButton.buttonEl.addClass("github-publisher-import-save-button");
				});
			textArea.inputEl.addClass("github-publisher-import-textarea");
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.settingsPage.empty();
		// @ts-ignore
		let openedTab = document.querySelector(".settings-tab-active.github-publisher") ? document.querySelector(".settings-tab-active.github-publisher").innerText : i18next.t("settings.github.title") ;
		openedTab = openedTab.trim();
		switch (openedTab) {
		case i18next.t("settings.github.title") :
			this.settingsTab.renderGithubConfiguration();
			break;
		case i18next.t("settings.upload.title"):
			this.settingsTab.renderUploadConfiguration();
			break;
		case i18next.t("settings.conversion.title") :
			this.settingsTab.renderTextConversion();
			break;
		case i18next.t("settings.embed.title") :
			this.settingsTab.renderEmbedConfiguration();
			break;
		case i18next.t("settings.plugin.title") :
			this.settingsTab.renderPluginSettings();
			break;
		case i18next.t("settings.help.title") :
			this.settingsTab.renderHelp();
			break;
		}

	}
}


export class ExportModal extends Modal {
	plugin: GithubPublisher;

	constructor(app: App, plugin: GithubPublisher) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl, modalEl} = this;
		modalEl.addClass("modal-github-publisher");
		new Setting(contentEl)
			.setName(i18next.t("modals.export.title") )
			.setDesc(i18next.t("modals.export.desc") )
			.then((setting) => {
				const censuredSettings: GitHubPublisherSettings = this.plugin.settings;
				const output = JSON.stringify(censuredSettings, null, 2)
					.replace(/,\s+"(repo|user|token)": "\w*"/g, "");

				setting.controlEl.createEl("a",
					{
						cls: "github-publisher-copy",
						text: i18next.t("modals.export.copy") ,
						href: "#",
					},
					(copyButton) => {
						const textArea = new TextAreaComponent(contentEl).setValue(output).then((textarea) => {
							copyButton.addEventListener("click", (e) => {
								e.preventDefault();

								// Select the textarea contents and copy them to the clipboard
								textarea.inputEl.select();
								textarea.inputEl.setSelectionRange(0, 99999);
								document.execCommand("copy");

								copyButton.addClass("success");

								setTimeout(() => {
									// If the button is still in the dom, remove the success class
									if (copyButton.parentNode) {
										copyButton.removeClass("success");
									}
								}, 2000);
							});
						});
						textArea.inputEl.addClass("github-publisher-export-textarea");
					});

				if (Platform.isDesktop) {
					setting.controlEl.createEl("a", {
						cls: "github-publisher-download",
						text: i18next.t("modals.export.download") ,
						attr: {
							download: "github-publisher.json",
							href: `data:application/json;charset=utf-8,${encodeURIComponent(output)}`,
						},
					});
				} else if (Platform.isMobile) {
					setting.addButton((b) =>
						b
							.setButtonText(i18next.t("modals.export.download") )
							.onClick(() => {
								// Can't use the method above on mobile, so we'll just open a new tab
								//create a temporary file
								this.app.vault.adapter.write(`${app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`, output);
								//open the file with default application
								//eslint-disable-next-line
								(this.app as any).openWithDefaultApp(`${app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`);
							}));
				}
			});
	}

	onClose() {
		try{
			this.app.vault.adapter.trashSystem(`${app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`);
		}catch(e){
			//do nothing if file doesn't exist
		}
		const {contentEl} = this;
		contentEl.empty();
	}
}
