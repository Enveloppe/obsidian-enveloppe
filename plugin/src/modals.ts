import GithubPublisher from "../main";
import { App, Modal, Setting, TextAreaComponent, ButtonComponent, Platform } from "obsidian";
import {t} from "../i18n";

export type SettingValue = number | string | boolean;

/**
 *
 * Credit : Style Settings Plugin
 * URL : https://github.com/mgmeyers/obsidian-github-publisher
 **/

export class ImportModal extends Modal {
	plugin: GithubPublisher;
	constructor(app: App, plugin: GithubPublisher) {
		super(app);
		this.plugin = plugin;
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
						const importedSettings = JSON.parse(str) as Record<string, SettingValue>;
						for (const [key, value] of Object.entries(importedSettings)) {
							if (key !== "githubRepo" && key !== "githubName" && key !== "GhToken") {
								// @ts-ignore
								this.plugin.settings[key] = value;
							}
						}
						this.plugin.saveSettings();
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
					if (key !== "githubRepo" && key !== "githubName" && key !== "GhToken") {
						// @ts-ignore
						censuredSettings[key] = value;
					}
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
				} else {
					setting.addButton((b) => 
						b
							.setButtonText(t("modals.export.download") as string).onClick(() => {
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
		this.app.vault.adapter.trashLocal(`${app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`);
		const {contentEl} = this;
		contentEl.empty();
	}
}
