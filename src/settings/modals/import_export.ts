import { ESettingsTabId } from "@interfaces";
import type { EnveloppeSettings, Preset, RegexReplace } from "@interfaces/main";
import type { GitHub, PluginBehavior } from "@interfaces/settings";
import type { Octokit } from "@octokit/core";
import i18next from "i18next";
import { klona } from "klona";
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
import { type OldSettings, migrateSettings } from "src/settings/migrate";
import type { Logs } from "../../utils/logs";

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
		this.console.trace("original settings:", original);
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
		this.plugin.settings.tabsId = original.tabsId;
		this.plugin.settings.plugin.copyLink.links = original.plugin.copyLink.links;
		this.settings.github.tokenPath = original.github.tokenPath;
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
							this.console.trace(i18next.t("informations.migrating.oldSettings"));
						} else {
							this.console.trace(i18next.t("informations.migrating.normalFormat"));
							importedSettings = importedSettings as unknown as EnveloppeSettings;
							//create a copy of actual settings
							const actualSettings = klona(this.plugin.settings);
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
			case ESettingsTabId.Github:
				this.settingsTab.renderGithubConfiguration();
				break;
			case ESettingsTabId.Upload:
				this.settingsTab.renderUploadConfiguration();
				break;
			case ESettingsTabId.Text:
				this.settingsTab.renderTextConversion();
				break;
			case ESettingsTabId.Embed:
				this.settingsTab.renderEmbedConfiguration().then();
				break;
			case ESettingsTabId.Plugin:
				this.settingsTab.renderPluginSettings();
				break;
			case ESettingsTabId.Help:
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

	censorGithubSettingsData(
		censuredSettings: Partial<EnveloppeSettings>
	): Partial<EnveloppeSettings> {
		const cloneCensored = klona(censuredSettings);
		const github: Partial<GitHub> | undefined = cloneCensored.github;
		const plugin: Partial<PluginBehavior> | undefined = cloneCensored.plugin;
		if (censuredSettings.tabsId) delete cloneCensored.tabsId;
		//@ts-ignore
		if (censuredSettings.tabsID) delete cloneCensored.tabsID;
		if (github) {
			delete github.repo;
			delete github.user;
			delete github.otherRepo;
			delete github.rateLimit;
			delete github.tokenPath;
		}
		if (plugin) {
			delete plugin.dev;
			delete plugin.migrated;
			delete plugin.displayModalRepoEditing;
			delete plugin.noticeError;
			if (plugin.copyLink) {
				if (plugin.copyLink.addCmd)
					delete (plugin.copyLink as Partial<PluginBehavior["copyLink"]>).addCmd;
				if (plugin.copyLink.links)
					delete (plugin.copyLink as Partial<PluginBehavior["copyLink"]>).links;
			}
			delete plugin.fileMenu;
			delete plugin.editorMenu;
		}
		//fix old version with autoclean.excluded is a string
		// noinspection SuspiciousTypeOfGuard
		if (typeof cloneCensored.upload?.autoclean?.excluded === "string") {
			cloneCensored.upload.autoclean.excluded = [
				cloneCensored.upload?.autoclean?.excluded,
			];
		}
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
					klona(this.plugin.settings)
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
							this.app.vault.adapter
								.write(
									`${this.app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`,
									output
								)
								.then();
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
			this.app.vault.adapter
				.trashSystem(
					`${this.app.vault.configDir}/plugins/obsidian-mkdocs-publisher/._tempSettings.json`
				)
				.then();
		} catch (e) {
			this.console.debug("Error while deleting temporary file", e);
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
		try {
			const original = klona(this.plugin.settings);

			// noinspection SuspiciousTypeOfGuard
			if (!(presetSettings.upload.replaceTitle instanceof Array)) {
				presetSettings.upload.replaceTitle = [
					presetSettings.upload.replaceTitle as RegexReplace,
				];
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

			this.plugin.saveSettings().then();
			this.page.renderSettingsPage("github-configuration").then();
		} catch (e) {
			new Notice(
				i18next.t("modals.import.error.span") + e,
				this.settings.plugin.noticeLength
			);
			this.console.error(e as Error);
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
		plugin.console.trace("# LoadAllPreset", githubPreset);
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
		const err = new Error("Error while loading presets:\n");
		err.stack = (e as Error).stack;
		err.message = err.message + (e as Error).message;
		plugin.console.error(err);
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
			owner: "Enveloppe",
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
