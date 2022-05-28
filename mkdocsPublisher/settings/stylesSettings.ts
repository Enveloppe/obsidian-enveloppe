import { Setting } from "obsidian";
import MkdocsPublication from "../main";

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
	if (value.length === 0 && settings.downloadedFolder === 'yamlFrontmatter') {
		settings.autoCleanUp = false;
		await plugin.saveSettings();
		autoCleanSetting.setDisabled(true);
		// @ts-ignore
		autoCleanSetting.components[0].toggleEl.classList.remove('is-enabled')
	} else if (value.length === 0 && settings.downloadedFolder !== "yamlFrontmatter") {
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

export async function yamlFrontmatterSettings(frontmatterKeySettings: Setting, rootFolderSettings: Setting, autoCleanSetting: Setting, value: string, plugin: MkdocsPublication) {
	const settings = plugin.settings;
	if (value == 'yamlFrontmatter') {
		showSettings(frontmatterKeySettings);
		showSettings(rootFolderSettings);
		autoCleanCondition(settings.rootFolder, autoCleanSetting, plugin).then();
	} else {
		if (settings.folderDefaultName.length > 0) {
			autoCleanSetting.setDisabled(false);
			if (settings.autoCleanUp)	{
				// @ts-ignore
				autoCleanSetting.components[0].toggleEl.classList.add('is-enabled')
			}
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
