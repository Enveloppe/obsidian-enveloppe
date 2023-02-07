import { Setting } from "obsidian";
import GithubPublisherPlugin from "../main";
import {FolderSettings, GitHubPublisherSettings} from "./interface";

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


export function showHideBasedOnFolder(settings: GitHubPublisherSettings, frontmatterKeySettings: Setting, rootFolderSettings: Setting, subFolderSettings: Setting, folderNoteSettings: Setting) {
	const upload = settings.upload;
	if (upload.behavior === FolderSettings.yaml) {
		showSettings(frontmatterKeySettings);
		showSettings(rootFolderSettings);
		hideSettings(subFolderSettings);
		showSettings(folderNoteSettings);
	} else {
		hideSettings(frontmatterKeySettings);
		hideSettings(rootFolderSettings);
		if (
			upload.behavior ===
				FolderSettings.obsidian
		) {
			showSettings(subFolderSettings);
			showSettings(folderNoteSettings);
		} else {
			hideSettings(subFolderSettings);
			hideSettings(folderNoteSettings);
		}
	}
}


/**
 * Show or hide the autoclean settings
 * @param {string} value
 * @param {Setting} autoCleanSetting
 * @param {GithubPublisher} plugin
 * @return {Promise<void>}
 */

export async function autoCleanCondition(
	value: string,
	autoCleanSetting: Setting,
	plugin: GithubPublisherPlugin
) {
	const settings = plugin.settings.upload;
	if (value.length === 0 && settings.defaultName) {
		settings.autoclean.enable = false;
		await plugin.saveSettings();
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove("is-enabled");
	} else if (
		value.length === 0 &&
		settings.behavior !== FolderSettings.yaml
	) {
		settings.autoclean.enable = false;
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove("is-enabled");
	} else {
		autoCleanSetting.setDisabled(false);
		if (settings.autoclean.enable) {
			// @ts-ignore
			autoCleanSetting.components[0].toggleEl.classList.add("is-enabled");
		}
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
 * - Hide the subFolder settings
 *
 * @example
 * - If obsidian path or fixed folder : hide the frontmatterKey setting and the rootFolder settings
 * - If obsidian path : show the subFolder settings
 * - If fixed folder : hide the subFolder settings
 * @param {Setting} frontmatterKeySettings
 * @param {Setting} rootFolderSettings
 * @param {Setting} autoCleanSetting
 * @param {string} value
 * @param {GithubPublisher} plugin
 * @param {Setting} subFolderSettings
 * @return {Promise<void>}
 */

export async function folderHideShowSettings(
	frontmatterKeySettings: Setting,
	rootFolderSettings: Setting,
	autoCleanSetting: Setting,
	value: string,
	plugin: GithubPublisherPlugin,
	subFolderSettings: Setting
) {
	const settings = plugin.settings.upload;
	if (value === FolderSettings.yaml) {
		showSettings(frontmatterKeySettings);
		showSettings(rootFolderSettings);
		autoCleanCondition(
			settings.rootFolder,
			autoCleanSetting,
			plugin
		).then();
		hideSettings(subFolderSettings);
	} else {
		if (settings.defaultName.length > 0) {
			autoCleanSetting.setDisabled(false);
			if (settings.autoclean.enable) {
				// @ts-ignore
				autoCleanSetting.components[0].toggleEl.classList.add(
					"is-enabled"
				);
			}
		}
		if (settings.behavior === FolderSettings.obsidian) {
			showSettings(subFolderSettings);
		} else {
			// is FolderSettings.fixed
			hideSettings(subFolderSettings);
		}
		hideSettings(frontmatterKeySettings);
		hideSettings(rootFolderSettings);
	}
}

/**
 * show or hide with disabling the autoclean settings based on the condition
 * @param {boolean} condition
 * @param {Setting} autoCleanSetting
 * @param {GithubPublisher} plugin
 */

export function autoCleanUpSettingsOnCondition(
	condition: boolean,
	autoCleanSetting: Setting,
	plugin: GithubPublisherPlugin
) {
	const settings = plugin.settings.upload;
	if (condition) {
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove("is-enabled");
		settings.autoclean.enable = false;
		plugin.saveSettings().then();
	} else {
		autoCleanSetting.setDisabled(false);
		if (settings.autoclean.enable) {
			// @ts-ignore
			autoCleanSetting.components[0].toggleEl.classList.add("is-enabled");
		}
	}
}

/**
 * Show or hide the settings based on the condition
 * @param {string | boolean} condition
 * @param {Setting} toDisplay the Settings to display
 */

export function shortcutsHideShow(
	condition: string | boolean,
	toDisplay: Setting
) {
	condition ? showSettings(toDisplay) : hideSettings(toDisplay);
}
