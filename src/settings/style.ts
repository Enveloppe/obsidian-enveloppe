import { FolderSettings } from "@interfaces";
import i18next from "i18next";
import { Notice } from "obsidian";
import type Enveloppe from "src/main";

/**
 * Disable autoclean (with a notice) when the folder it depends on gets emptied.
 * `update` rebuilds the page so the autoclean-dependent rows re-evaluate their visibility.
 */
export async function autoCleanCondition(
	value: string,
	plugin: Enveloppe,
	what: "rootFolder" | "defaultName" = "defaultName",
	update: () => void
) {
	const settings = plugin.settings.upload;
	const translation =
		what === "rootFolder"
			? i18next.t("common.rootFolder")
			: i18next.t("common.defaultName");
	let mustUpdate = false;
	if (value.length === 0 && settings.defaultName) {
		if (settings.autoclean.enable) {
			new Notice(
				i18next.t("error.autoClean", { what: translation }),
				plugin.settings.plugin.noticeLength
			);
		}
		settings.autoclean.enable = false;
		mustUpdate = true;
	}
	if (value.length === 0 && settings.behavior !== FolderSettings.Yaml) {
		if (settings.autoclean.enable) {
			new Notice(
				i18next.t("error.autoClean", { what: i18next.t("common.defaultName") }),
				plugin.settings.plugin.noticeLength
			);
		}
		settings.autoclean.enable = false;
		mustUpdate = true;
	}
	if (mustUpdate) {
		await plugin.saveSettings();
		update();
	}
}
