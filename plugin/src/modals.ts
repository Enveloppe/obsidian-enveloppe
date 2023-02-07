import GithubPublisher from "../main";
import { App, Modal, Setting, TextAreaComponent, ButtonComponent, Platform } from "obsidian";
import {settings, subSettings, t} from "../i18n";
import {GithubPublisherSettings} from "../settings";
import {GitHubPublisherSettings, OldSettings} from "../settings/interface";

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
			.setName(t("modals.import.title") as string)
			.setDesc(t("modals.import.desc") as string);

		new Setting(contentEl).then((setting) => {
			// Build an error message container
			const errorSpan = createSpan({
				cls: "github-publisher-import-error",
				text: t("modals.import.error.span") as string,
			});
			setting.nameEl.appendChild(errorSpan);
			const importAndClose = async (str: string) => {
				if (str) {
					try {
						let importedSettings = JSON.parse(str);
						if (Object.keys(importedSettings).includes("editorMenu")) {
							//need to convert old settings to new settings
							const oldSettings = importedSettings as unknown as OldSettings;
							this.plugin.migrateSettings(oldSettings);
							console.log("Migrated settings from old to new format");
						} else {
							console.log("Imported settings as new format");
							importedSettings = importedSettings as unknown as GitHubPublisherSettings;
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
						errorSpan.setText(`${t("modals.import.error.span")}${e}`);
					}
				} else {
					errorSpan.addClass("active");
					errorSpan.setText(`${t("modals.import.error.span")}: ${t("modals.import.error.empty")}`);
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
				text: t("modals.import.importFromFile") as string,
				attr: {
					for: "github-publisher-import-input",
				},
			});

			const textArea = new TextAreaComponent(contentEl)
				.setPlaceholder(t("modals.import.paste") as string).then((ta) => {
					const saveButton = new ButtonComponent(contentEl).setButtonText(t("modals.import.save") as string).onClick(async () => {
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
		const openedTab = document.querySelector(".settings-tab-active.github-publisher") ? document.querySelector(".settings-tab-active.github-publisher").innerText : settings("github", "githubConfiguration") as string;
		switch (openedTab) {
		case settings("github", "githubConfiguration") as string:
			this.settingsTab.renderGithubConfiguration();
			break;
		case "Upload Configuration":
			this.settingsTab.renderUploadConfiguration();
			break;
		case settings("textConversion", "textConversion") as string:
			this.settingsTab.renderTextConversion();
			break;
		case settings("embed", "embed") as string:
			this.settingsTab.renderEmbedConfiguration();
			break;
		case settings("plugin", "pluginSettings") as string:
			this.settingsTab.renderPluginSettings();
			break;
		case subSettings("help.help") as string:
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
			.setName(t("modals.export.title") as string)
			.setDesc(t("modals.export.desc") as string)
			.then((setting) => {
				const censuredSettings: Record<string, SettingValue> = {};
				for (const [key, value] of Object.entries(this.plugin.settings)) {
					if (key === "github") {
						value.repo = "";
						value.user = "";
						value.token = "";
					}
					// @ts-ignore
					censuredSettings[key] = value;

				}
				const output = JSON.stringify(censuredSettings, null, 2);

				setting.controlEl.createEl("a",
					{
						cls: "github-publisher-copy",
						text: t("modals.export.copy") as string,
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
						text: t("modals.export.download") as string,
						attr: {
							download: "github-publisher.json",
							href: `data:application/json;charset=utf-8,${encodeURIComponent(output)}`,
						},
					});
				} else if (Platform.isMobile) {
					setting.addButton((b) =>
						b
							.setButtonText(t("modals.export.download") as string)
							.onClick(() => {
								// Can't use the method above on mobile, so we'll just open a new tab
								//create a temporary file
								this.app.vault.adapter.write(`${app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`, output);
								//open the file with default application
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
