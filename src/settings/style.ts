import { EnumbSettingsTabId, FolderSettings, type EnveloppeSettings } from "@interfaces";
import i18next from "i18next";
import { Notice, type Setting } from "obsidian";
import type Enveloppe from "src/main";
import type { EnveloppeSettingsTab } from "src/settings";
/**
 * show a settings
 * @param {Setting} containerEl setting to show
 */

export function showSettings(containerEl: Setting) {
	for (const [type, elem] of Object.entries(containerEl)) {
		if (type != "components") {
			elem.show();
		}
	}
}

/**
 * Hide a settings
 * @param {Setting} containerEl settings to hide
 */

export function hideSettings(containerEl: Setting) {
	for (const [type, elem] of Object.entries(containerEl)) {
		if (type != "components") {
			elem.hide();
		}
	}
}

export function showHideBasedOnFolder(
	settings: EnveloppeSettings,
	frontmatterKeySettings: Setting,
	rootFolderSettings: Setting,
	folderNoteSettings: Setting
) {
	const upload = settings.upload;
	if (upload.behavior === FolderSettings.Yaml) {
		showSettings(frontmatterKeySettings);
		showSettings(rootFolderSettings);
		showSettings(folderNoteSettings);
	} else {
		hideSettings(frontmatterKeySettings);
		hideSettings(rootFolderSettings);
		if (upload.behavior === FolderSettings.Obsidian) {
			showSettings(folderNoteSettings);
		} else {
			hideSettings(folderNoteSettings);
		}
	}
}

/**
 * Show or hide the autoclean settings
 */

export async function autoCleanCondition(
	value: string,
	autoCleanSetting: Setting,
	plugin: Enveloppe,
	what: "rootFolder" | "defaultName" = "defaultName",
	settingsTab: EnveloppeSettingsTab
) {
	const settings = plugin.settings.upload;
	const translation =
		what === "rootFolder"
			? i18next.t("common.rootFolder")
			: i18next.t("common.defaultName");
	if (value.length === 0 && settings.defaultName) {
		if (settings.autoclean.enable)
			new Notice(i18next.t("error.autoClean", { what: translation }));
		settings.autoclean.enable = false;
		await plugin.saveSettings();
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove("is-enabled");
		settingsTab.renderSettingsPage(EnumbSettingsTabId.Upload);
	}
	if (value.length === 0 && settings.behavior !== FolderSettings.Yaml) {
		if (settings.autoclean.enable)
			new Notice(i18next.t("error.autoClean", { what: i18next.t("common.defaultName") }));
		settings.autoclean.enable = false;
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove("is-enabled");
		settingsTab.renderSettingsPage(EnumbSettingsTabId.Upload);
	}
	if (settings.autoclean.enable) {
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.add("is-enabled");
	}
}

/**
 * Show or hide settings based on the value of the folder settings
 * Will :
 * @example
 * If the settings is set to YAML:
 * - Show the frontmatterKey setting (to set the category key)
 * - Show the rootFolder settings
 * - Check the condition to show or hide the autoClean settings (with checking the length of the defaultFolder)
 *
 * @example
 * - If obsidian path or fixed folder : hide the frontmatterKey setting and the rootFolder settings
 */

export async function folderHideShowSettings(
	frontmatterKeySettings: Setting,
	rootFolderSettings: Setting,
	autoCleanSetting: Setting,
	value: string,
	plugin: Enveloppe
) {
	const settings = plugin.settings.upload;
	if (value === FolderSettings.Yaml) {
		showSettings(frontmatterKeySettings);
		showSettings(rootFolderSettings);
		return;
	}
	if (settings.defaultName.length > 0 && settings.autoclean.enable) {
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.add("is-enabled");
	}
	hideSettings(frontmatterKeySettings);
	hideSettings(rootFolderSettings);
}

/**
 * show or hide with disabling the autoclean settings based on the condition
 * @param {boolean} condition
 * @param {Setting} autoCleanSetting
 * @param {Enveloppe} plugin
 */

export function autoCleanUpSettingsOnCondition(
	condition: boolean,
	autoCleanSetting: Setting,
	plugin: Enveloppe
) {
	const settings = plugin.settings.upload;
	if (condition) {
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove("is-enabled");
		settings.autoclean.enable = false;
		plugin.saveSettings().then();
		return;
	}
	if (settings.autoclean.enable) {
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.add("is-enabled");
	}
}

/**
 * Show or hide the settings based on the condition
 * @param {string | boolean} condition
 * @param {Setting} toDisplay the Settings to display
 */

export function shortcutsHideShow(condition: string | boolean, toDisplay: Setting) {
	if (condition) {
		showSettings(toDisplay);
	} else {
		hideSettings(toDisplay);
	}
}
