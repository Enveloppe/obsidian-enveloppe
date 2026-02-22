// noinspection JSIgnoredPromiseFromCall

import { type EnveloppeSettings, ESettingsTabId } from "@interfaces";
import i18next from "i18next";
import { klona } from "klona";
import { type App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type EnveloppePlugin from "src/main";
import {
	ExportModal,
	ImportLoadPreset,
	ImportModal,
	loadAllPresets,
} from "src/settings/modals/import_export";
import { renderEmbedConfiguration } from "src/settings/renders/embed";
import { renderGithubConfiguration } from "src/settings/renders/github";
import { renderHelp } from "src/settings/renders/help";
import { renderPluginSettings } from "src/settings/renders/plugin";
import { renderTextConversion } from "src/settings/renders/text_conversion";
import { renderUploadConfiguration } from "src/settings/renders/upload";

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
		const defaultTabId = ESettingsTabId.Github;
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
				await this.renderSettingsPage(tabId);
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
	async renderSettingsPage(tabId: string | ESettingsTabId) {
		if (this.settings.plugin.saveTabId || this.settings.plugin.saveTabId === undefined) {
			this.settings.tabsId = tabId as ESettingsTabId;
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
				await this.renderEmbedConfiguration();
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
		renderGithubConfiguration({
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			settingsPage: this.settingsPage,
			branchName: this.branchName,
			renderSettingsPage: this.renderSettingsPage.bind(this),
			copy: this.copy.bind(this),
		});
	}

	/**
	 * Render the settings tab for the upload configuration
	 */
	renderUploadConfiguration() {
		renderUploadConfiguration({
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			settingsPage: this.settingsPage,
			branchName: this.branchName,
			renderSettingsPage: this.renderSettingsPage.bind(this),
			copy: this.copy.bind(this),
		});
	}

	/**
	 * Render the settings page for the text conversion parameters
	 */
	renderTextConversion() {
		renderTextConversion({
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			settingsPage: this.settingsPage,
			branchName: this.branchName,
			renderSettingsPage: this.renderSettingsPage.bind(this),
			copy: this.copy.bind(this),
		});
	}

	/**
	 * Render the settings page for the embeds settings
	 */
	async renderEmbedConfiguration() {
		await renderEmbedConfiguration({
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			settingsPage: this.settingsPage,
			branchName: this.branchName,
			renderSettingsPage: this.renderSettingsPage.bind(this),
			copy: this.copy.bind(this),
		});
	}

	/**
	 * Render the settings page for the plugin settings (general settings, as shareKey)
	 */
	renderPluginSettings() {
		renderPluginSettings({
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			settingsPage: this.settingsPage,
			branchName: this.branchName,
			renderSettingsPage: this.renderSettingsPage.bind(this),
			copy: this.copy.bind(this),
		});
	}

	/**
	 * Render the help page
	 */
	renderHelp() {
		renderHelp({
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			settingsPage: this.settingsPage,
			branchName: this.branchName,
			renderSettingsPage: this.renderSettingsPage.bind(this),
			copy: this.copy.bind(this),
		});
	}

	copy(object: any) {
		try {
			return klona(object);
		} catch (_e) {
			this.plugin.console.debug("error with stringify for", object);
		}
	}
}
