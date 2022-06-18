import { Setting } from "obsidian";
import MkdocsPublication from "../main";
import {folderSettings} from "./interface";

export function showSettings(containerEl: Setting) {
	containerEl.descEl.show();
	containerEl.nameEl.show();
	containerEl.controlEl.show();
}

export function hideSettings(containerEl: Setting) {
	containerEl.descEl.hide();
	containerEl.nameEl.hide();
	containerEl.controlEl.hide();
}

export async function autoCleanCondition(value: string, autoCleanSetting: Setting, plugin: MkdocsPublication) {
	const settings = plugin.settings;
	if (value.length === 0 && settings.downloadedFolder) {
		settings.autoCleanUp = false;
		await plugin.saveSettings();
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove('is-enabled')
	} else if (value.length === 0 && settings.downloadedFolder !== folderSettings.yaml) {
		settings.autoCleanUp = false;
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove('is-enabled')
	} else {
		autoCleanSetting.setDisabled(false);
		if (settings.autoCleanUp) {
			// @ts-ignore
			autoCleanSetting.components[0].toggleEl.classList.add('is-enabled')
		}
	}
}

export async function folderHideShowSettings(frontmatterKeySettings: Setting, rootFolderSettings: Setting, autoCleanSetting: Setting, value: string, plugin: MkdocsPublication, subFolderSettings: Setting) {
	const settings = plugin.settings;
	if (value === folderSettings.yaml) {
		showSettings(frontmatterKeySettings);
		showSettings(rootFolderSettings);
		autoCleanCondition(settings.rootFolder, autoCleanSetting, plugin).then();
		hideSettings(subFolderSettings)
	} else {
		if (settings.folderDefaultName.length > 0) {
			autoCleanSetting.setDisabled(false);
			if (settings.autoCleanUp)
			{
				// @ts-ignore
				autoCleanSetting.components[0].toggleEl.classList.add('is-enabled')
			}
		}
		if (settings.downloadedFolder === folderSettings.obsidian) {
			showSettings(subFolderSettings)
		} else { // is folderSettings.fixed
			hideSettings(subFolderSettings)
			
		}
		hideSettings(frontmatterKeySettings);
		hideSettings(rootFolderSettings);
	}
}

export function autoCleanUpSettingsOnCondition(condition: boolean, autoCleanSetting: Setting,plugin: MkdocsPublication) {
	const settings = plugin.settings;
	if (condition) {
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove('is-enabled')
		settings.autoCleanUp = false;
		plugin.saveSettings().then();
	} else {
		autoCleanSetting.setDisabled(false);
		if (settings.autoCleanUp) {
			// @ts-ignore
			autoCleanSetting.components[0].toggleEl.classList.add('is-enabled')
		}
	}
}
