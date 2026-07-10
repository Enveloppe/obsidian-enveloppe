import type { EnveloppeSettings } from "@interfaces";
import i18next from "i18next";
import { klona } from "klona";
import { type App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type EnveloppePlugin from "src/main";
import {
	ExportModal,
	ImportLoadPreset,
	ImportModal,
	loadAllPresets,
} from "src/settings/modals/import_export";
import { buildEmbedItems } from "src/settings/renders/embed";
import { buildGithubItems } from "src/settings/renders/github";
import { buildHelpItems } from "src/settings/renders/help";
import { buildPluginItems } from "src/settings/renders/plugin";
import { buildTextConversionItems } from "src/settings/renders/text_conversion";
import { buildUploadItems } from "src/settings/renders/upload";
import type { RenderContext } from "./settings/renders";

export class EnveloppeSettingsTab extends PluginSettingTab {
	plugin: EnveloppePlugin;
	branchName: string;
	settings: EnveloppeSettings;

	constructor(app: App, plugin: EnveloppePlugin, branchName: string) {
		super(app, plugin);
		this.plugin = plugin;
		this.branchName = branchName;
		this.settings = plugin.settings;
		this.containerEl.addClass("enveloppe");
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const ctx = this.context();
		return [
			{
				name: "",
				searchable: false,
				render: (setting) => {
					setting
						.setClass("import-export")
						.addButton((button) => {
							button.setButtonText(i18next.t("modals.export.title")).onClick(() => {
								new ExportModal(this.app, this.plugin).open();
							});
						})
						.addButton((button) => {
							button.setButtonText(i18next.t("modals.import.title")).onClick(() => {
								new ImportModal(this.app, this.plugin, this).open();
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
				},
			},
			{
				type: "page",
				name: i18next.t("settings.github.title"),
				items: buildGithubItems(ctx),
			},
			{
				type: "page",
				name: i18next.t("settings.upload.title"),
				items: buildUploadItems(ctx),
			},
			{
				type: "page",
				name: i18next.t("settings.conversion.title"),
				items: buildTextConversionItems(ctx),
			},
			{
				type: "page",
				name: i18next.t("settings.embed.title"),
				items: buildEmbedItems(ctx),
			},
			{
				type: "page",
				name: i18next.t("settings.plugin.title"),
				items: buildPluginItems(ctx),
			},
			{
				type: "page",
				name: i18next.t("settings.help.title"),
				items: buildHelpItems(ctx),
			},
		];
	}

	/**
	 * Settings are stored as a nested object (`github.user`, `conversion.links.wiki`…) rather
	 * than flat keys, so control bindings use dot-notation paths resolved against `plugin.settings`.
	 */
	getControlValue(key: string): unknown {
		return key
			.split(".")
			.reduce<unknown>(
				(value, part) => (value as Record<string, unknown> | undefined)?.[part],
				this.plugin.settings
			);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const parts = key.split(".");
		const last = parts.pop()!;
		let target = this.plugin.settings as unknown as Record<string, unknown>;
		for (const part of parts) {
			if (target[part] == null) target[part] = {};
			target = target[part] as Record<string, unknown>;
		}
		target[last] = value;
		await this.plugin.saveSettings();
	}

	context(): RenderContext {
		return {
			app: this.app,
			plugin: this.plugin,
			settings: this.settings,
			branchName: this.branchName,
			copy: this.copy.bind(this),
			refresh: () => this.refreshDomState(),
			update: () => this.update(),
		};
	}

	copy<T>(object: T): T | undefined {
		try {
			return klona(object);
		} catch {
			this.plugin.console.debug("error with stringify for", object);
			return undefined;
		}
	}
}
