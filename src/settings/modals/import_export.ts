import type { EnveloppeSettings, Preset } from "@interfaces/main";
import type { Octokit } from "@octokit/core";
import i18next from "i18next";
import {
	type App,
	ButtonComponent,
	FuzzySuggestModal,
	Modal,
	Notice,
	Platform,
	Setting,
	TextAreaComponent,
} from "obsidian";
import type Enveloppe from "src/main";
import type { EnveloppeSettingsTab } from "src/settings";
import { migrateSettings, type OldSettings } from "src/settings/migrate";
import type { Logs } from "../../utils/logs";
import { klona } from "klona";

export type SettingValue = number | string | boolean | unknown;

function clone(obj: EnveloppeSettings): EnveloppeSettings {
	return klona(obj);
}
/**
 *
 * Credit : Style Settings Plugin
 * URL : https://github.com/mgmeyers/obsidian-enveloppe
 **/

export class ImportModal extends Modal {
	plugin: Enveloppe;
	settingsPage: HTMLElement;
	settingsTab: EnveloppeSettingsTab;
	settings: EnveloppeSettings;
	console: Logs;
	constructor(
		app: App,
		plugin: Enveloppe,
		settingsPage: HTMLElement,
		settingsTab: EnveloppeSettingsTab
	) {
		super(app);
		this.plugin = plugin;
		this.settingsPage = settingsPage;
		this.settingsTab = settingsTab;
		this.settings = plugin.settings;
		this.console = plugin.console;
	}

	async censorRepositoryData(original: EnveloppeSettings) {
		this.console.logs({}, "original settings:", original);
		this.settings.plugin.dev = original.plugin.dev;
		this.settings.plugin.migrated = original.plugin.migrated;
		this.settings.plugin.displayModalRepoEditing =
			original.plugin.displayModalRepoEditing;
		this.settings.plugin.noticeError = original.plugin.noticeError;
		this.settings.plugin.copyLink.addCmd = original.plugin.copyLink.addCmd;
		this.settings.plugin.fileMenu = original.plugin.fileMenu;
		this.settings.plugin.editorMenu = original.plugin.editorMenu;
		this.plugin.settings.github.repo = original.github.repo;
		this.plugin.settings.github.user = original.github.user;
		this.plugin.settings.github.otherRepo = original.github.otherRepo;
		await this.plugin.saveSettings();
	}

	onOpen() {
		const { contentEl } = this;

		new Setting(contentEl)
			.setName(i18next.t("modals.import.title"))
			.setDesc(i18next.t("modals.import.desc"));

		new Setting(contentEl).then((setting) => {
			// biome-ignore lint/correctness/noUndeclaredVariables: createSpan is a function builded with the plugin
			const errorSpan = createSpan({
				cls: "enveloppe-import-error",
				text: i18next.t("modals.import.error.span"),
			});
			setting.nameEl.appendChild(errorSpan);
			const importAndClose = async (str: string) => {
				if (str) {
					try {
						let importedSettings = JSON.parse(str);
						if (Object.keys(importedSettings).includes("editorMenu")) {
							//need to convert old settings to new settings
							const oldSettings = importedSettings as unknown as OldSettings;
							await migrateSettings(oldSettings, this.plugin, true);
							this.console.logs({}, i18next.t("informations.migrating.oldSettings"));
						} else {
							this.console.logs({}, i18next.t("informations.migrating.normalFormat"));
							importedSettings = importedSettings as unknown as EnveloppeSettings;
							//create a copy of actual settings
							const actualSettings = clone(this.plugin.settings);
							if (!(importedSettings.upload.replaceTitle instanceof Array)) {
								importedSettings.upload.replaceTitle = [
									importedSettings.upload.replaceTitle,
								];
							}

							for (const [key, value] of Object.entries(importedSettings)) {
								// @ts-ignore
								this.plugin.settings[key] = value;
							}
							await this.censorRepositoryData(actualSettings);
							await this.plugin.saveSettings();
						}
						this.close();
					} catch (e) {
						errorSpan.addClass("active");
						errorSpan.setText(`${i18next.t("modals.import.error.span")}${e}`);
					}
				} else {
					errorSpan.addClass("active");
					errorSpan.setText(
						`${i18next.t("modals.import.error.span")}: ${i18next.t(
							"modals.import.error.isEmpty"
						)}`
					);
				}
			};
			setting.controlEl.createEl(
				"input",
				{
					cls: "enveloppe-import-input",
					attr: {
						id: "enveloppe-import-input",
						name: "enveloppe-import-input",
						type: "file",
						accept: ".json",
					},
				},
				(importInput) => {
					// Set up a FileReader so we can parse the file contents
					importInput.addEventListener("change", (e) => {
						const reader = new FileReader();

						reader.onload = async (e: ProgressEvent<FileReader>) => {
							await importAndClose(e.target!.result!.toString().trim());
						};

						reader.readAsText((e.target as HTMLInputElement).files![0]);
					});
				}
			);

			// Build a label we will style as a link
			setting.controlEl.createEl("label", {
				cls: "enveloppe-import-label",
				text: i18next.t("modals.import.importFromFile"),
				attr: {
					for: "enveloppe-import-input",
				},
			});

			const textArea = new TextAreaComponent(contentEl)
				.setPlaceholder(i18next.t("modals.import.paste"))
				.then((ta) => {
					const saveButton = new ButtonComponent(contentEl)
						.setButtonText(i18next.t("common.save"))
						.onClick(async () => {
							await importAndClose(ta.getValue().trim());
						});
					saveButton.buttonEl.addClass("enveloppe-import-save-button");
				});
			textArea.inputEl.addClass("enveloppe-import-textarea");
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.settingsPage.empty();
		let openedTab =
			this.plugin.settings.tabsId ??
			document.querySelector(".settings-tab.settings-tab-active .settings-tab-name")
				?.textContent ??
			i18next.t("settings.github.title");
		openedTab = openedTab.trim();
		switch (openedTab) {
			case i18next.t("settings.github.title"):
				this.settingsTab.renderGithubConfiguration();
				break;
			case i18next.t("settings.upload.title"):
				this.settingsTab.renderUploadConfiguration();
				break;
			case i18next.t("settings.conversion.title"):
				this.settingsTab.renderTextConversion();
				break;
			case i18next.t("settings.embed.title"):
				this.settingsTab.renderEmbedConfiguration();
				break;
			case i18next.t("settings.plugin.title"):
				this.settingsTab.renderPluginSettings();
				break;
			case i18next.t("settings.help.title"):
				this.settingsTab.renderHelp();
				break;
		}
	}
}

export class ExportModal extends Modal {
	plugin: Enveloppe;
	console: Logs;

	constructor(app: App, plugin: Enveloppe) {
		super(app);
		this.plugin = plugin;
		this.console = plugin.console;
	}

	censorGithubSettingsData(censuredSettings: EnveloppeSettings) {
		const cloneCensored = Object(censuredSettings);
		const { github } = cloneCensored;
		if (cloneCensored.tabsID) delete cloneCensored.tabsID;
		if (github) {
			delete github.repo;
			delete github.user;
			delete github.otherRepo;
			delete github.rateLimit;
		}
		delete cloneCensored.plugin.dev;
		delete cloneCensored.plugin.migrated;
		delete cloneCensored.plugin.displayModalRepoEditing;
		delete cloneCensored.plugin.noticeError;
		delete cloneCensored.plugin.copyLink.addCmd;
		delete cloneCensored.plugin.fileMenu;
		delete cloneCensored.plugin.editorMenu;
		return cloneCensored;
	}

	onOpen() {
		const { contentEl, modalEl } = this;
		modalEl.addClass("modal-enveloppe");
		new Setting(contentEl)
			.setName(i18next.t("modals.export.title"))
			.setDesc(i18next.t("modals.export.desc"))
			.then((setting) => {
				//create a copy of the settings object
				const censuredSettings = this.censorGithubSettingsData(
					clone(this.plugin.settings)
				);
				const output = JSON.stringify(censuredSettings, null, 2);
				setting.controlEl.createEl(
					"a",
					{
						cls: "enveloppe-copy",
						text: i18next.t("modals.export.copy"),
						href: "#",
					},
					(copyButton) => {
						const textArea = new TextAreaComponent(contentEl)
							.setValue(output)
							.then((textarea) => {
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
						textArea.inputEl.addClass("enveloppe-export-textarea");
					}
				);

				if (Platform.isDesktop) {
					setting.controlEl.createEl("a", {
						cls: "enveloppe-download",
						text: i18next.t("modals.export.download"),
						attr: {
							download: "enveloppe.json",
							href: `data:application/json;charset=utf-8,${encodeURIComponent(output)}`,
						},
					});
				} else if (Platform.isMobile) {
					setting.addButton((b) =>
						b.setButtonText(i18next.t("modals.export.download")).onClick(() => {
							// Can't use the method above on mobile, so we'll just open a new tab
							//create a temporary file
							this.app.vault.adapter.write(
								`${this.app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`,
								output
							);
							//open the file with default application
							(this.app as any).openWithDefaultApp(
								`${this.app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`
							);
						})
					);
				}
			});
	}

	onClose() {
		try {
			this.app.vault.adapter.trashSystem(
				`${this.app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`
			);
		} catch (e) {
			this.console.logs({}, "Error while deleting temporary file", e);
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ImportLoadPreset extends FuzzySuggestModal<Preset> {
	octokit: Octokit;
	plugin: Enveloppe;
	presetList: Preset[];
	page: EnveloppeSettingsTab;
	settings: EnveloppeSettings;
	console: Logs;

	constructor(
		app: App,
		plugin: Enveloppe,
		presetList: Preset[],
		octokit: Octokit,
		page: EnveloppeSettingsTab
	) {
		super(app);
		this.plugin = plugin;
		this.presetList = presetList;
		this.octokit = octokit;
		this.page = page;
		this.settings = plugin.settings;
		this.console = plugin.console;
	}

	getItems(): Preset[] {
		return this.presetList;
	}

	getItemText(item: Preset): string {
		return item.name;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onChooseItem(item: Preset, _evt: MouseEvent | KeyboardEvent): void {
		const presetSettings = item.settings;
		this.console.logs({}, "onChooseItem");
		try {
			const original = clone(this.plugin.settings);
			if (!(presetSettings.upload.replaceTitle instanceof Array)) {
				presetSettings.upload.replaceTitle = [presetSettings.upload.replaceTitle];
			}

			for (const [key, value] of Object.entries(presetSettings)) {
				// @ts-ignore
				this.settings[key] = value;
			}
			this.settings.plugin.dev = original.plugin.dev;
			this.settings.plugin.migrated = original.plugin.migrated;
			this.settings.plugin.displayModalRepoEditing =
				original.plugin.displayModalRepoEditing;
			this.settings.plugin.noticeError = original.plugin.noticeError;
			this.settings.plugin.copyLink.addCmd = original.plugin.copyLink.addCmd;
			this.settings.plugin.fileMenu = original.plugin.fileMenu;
			this.settings.plugin.editorMenu = original.plugin.editorMenu;
			this.settings.github.repo = original.github.repo;
			this.settings.github.user = original.github.user;
			this.settings.github.otherRepo = original.github.otherRepo;
			this.settings.github.rateLimit = original.github.rateLimit;
			this.settings.tabsId = original.tabsId;

			this.plugin.saveSettings();
			this.page.renderSettingsPage("github-configuration");
		} catch (e) {
			new Notice(i18next.t("modals.import.error.span") + e);
			this.console.notif({}, "onChooseItem", e);
		}
	}
}

export async function loadAllPresets(
	octokit: Octokit,
	plugin: Enveloppe
): Promise<Preset[]> {
	//load from gitHub repository
	try {
		const githubPreset = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner: "ObsidianPublisher",
				repo: "plugin-presets",
				path: "presets",
			}
		);

		//create a list
		const presetList: Preset[] = [];
		if (!Array.isArray(githubPreset.data)) {
			return presetList;
		}
		plugin.console.logs({}, "LoadAllPreset", githubPreset);
		for (const preset of githubPreset.data) {
			if (preset.name.endsWith(".json")) {
				const presetName = preset.name.replace(".json", "");
				presetList.push({
					name: presetName,
					settings: await loadPresetContent(preset.path, octokit, plugin),
				});
			}
		}
		return presetList;
	} catch (e) {
		plugin.console.notif({ e: true }, "Couldn't load preset. Error:", e);
		return [];
	}
}

export async function loadPresetContent(
	path: string,
	octokit: Octokit,
	plugin: Enveloppe
): Promise<EnveloppeSettings> {
	const presetContent = await octokit.request(
		"GET /repos/{owner}/{repo}/contents/{path}",
		{
			owner: "ObsidianPublisher",
			repo: "plugin-presets",
			path,
		}
	);
	// @ts-ignore
	if (!presetContent.data?.content) {
		return plugin.settings;
	}
	// @ts-ignore
	const presetContentDecoded = atob(presetContent.data.content);
	return JSON.parse(presetContentDecoded) as unknown as EnveloppeSettings;
}
