import { ESettingsTabId } from "@interfaces";
import i18next from "i18next";
import { Setting } from "obsidian";
import {
	type RenderContext,
	splitByCommaOrNewLineAndNonWord,
	splitByCommaOrNewLineAndSpaces,
} from "./index";

export const renderPluginSettings = (ctx: RenderContext) => {
	const pluginSettings = ctx.settings.plugin;

	ctx.settingsPage.createEl("h3", { text: i18next.t("settings.plugin.head.share") });
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.shareKey.all.title"))
		.setDesc(i18next.t("settings.plugin.shareKey.all.desc"))
		.addToggle((toggle) =>
			toggle
				.setValue(pluginSettings.shareAll?.enable ?? false)
				.onChange(async (value) => {
					pluginSettings.shareAll = {
						enable: value,
						excludedFileName: pluginSettings.shareAll?.excludedFileName ?? "DRAFT",
					};
					if (value) ctx.settings.conversion.links.internal = true;
					await ctx.plugin.saveSettings();
					await ctx.renderSettingsPage(ESettingsTabId.Plugin);
				})
		);
	if (!pluginSettings.shareAll || !pluginSettings.shareAll.enable) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.shareKey.title"))
			.setDesc(i18next.t("settings.plugin.shareKey.desc"))
			.addText((text) =>
				text
					.setPlaceholder("share")
					.setValue(pluginSettings.shareKey)
					.onChange(async (value) => {
						pluginSettings.shareKey = value.trim();
						await ctx.plugin.saveSettings();
					})
			);
	} else {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.shareKey.excludedFileName.title"))
			.addText((text) =>
				text
					.setPlaceholder("DRAFT")
					.setValue(pluginSettings.shareAll?.excludedFileName ?? "DRAFT")
					.onChange(async (value) => {
						pluginSettings.shareAll!.excludedFileName = value.trim();
						await ctx.plugin.saveSettings();
					})
			);
	}

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.excludedFolder.title"))
		.setDesc(i18next.t("settings.plugin.excludedFolder.desc"))
		.addTextArea((textArea) =>
			textArea
				.setPlaceholder("_assets, Archive, /^_(.*)/gi")
				.setValue(pluginSettings.excludedFolder.join(", "))
				.onChange(async (value) => {
					pluginSettings.excludedFolder = splitByCommaOrNewLineAndNonWord(value);
					await ctx.plugin.saveSettings();
				})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.set.title"))
		.setDesc(i18next.t("settings.plugin.set.desc"))
		.addText((text) =>
			text
				.setPlaceholder("Set")
				.setValue(pluginSettings.setFrontmatterKey)
				.onChange(async (value) => {
					pluginSettings.setFrontmatterKey = value.trim();
					await ctx.plugin.saveSettings();
				})
		);

	ctx.settingsPage.createEl("h3", { text: i18next.t("settings.plugin.head.menu") });

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.fileMenu.title"))
		.setDesc(i18next.t("settings.plugin.fileMenu.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.fileMenu).onChange(async (value) => {
				pluginSettings.fileMenu = value;
				await ctx.plugin.saveSettings();
			})
		);
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.editorMenu.title"))
		.setDesc(i18next.t("settings.plugin.editorMenu.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.editorMenu).onChange(async (value) => {
				pluginSettings.editorMenu = value;
				await ctx.plugin.saveSettings();
			})
		);
	ctx.settingsPage.createEl("h3", {
		text: i18next.t("settings.plugin.head.copyLinks"),
	});

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.copyLink.title"))
		.setDesc(i18next.t("settings.plugin.copyLink.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.copyLink.enable).onChange(async (value) => {
				pluginSettings.copyLink.enable = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage(ESettingsTabId.Plugin);
			})
		);

	if (pluginSettings.copyLink.enable) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.baselink.title"))
			.setDesc(i18next.t("settings.plugin.copyLink.baselink.desc"))
			.addText((text) => {
				text
					.setPlaceholder("my_blog.com")
					.setValue(pluginSettings.copyLink.links)
					.onChange(async (value) => {
						pluginSettings.copyLink.links = value;
						await ctx.plugin.saveSettings();
					});
			});
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.linkPathRemover.title"))
			.setDesc(i18next.t("settings.plugin.copyLink.linkPathRemover.desc"))
			.addText((text) => {
				text
					.setPlaceholder("docs")
					.setValue(pluginSettings.copyLink.removePart.join(", "))
					.onChange(async (value) => {
						pluginSettings.copyLink.removePart = splitByCommaOrNewLineAndSpaces(value);
						await ctx.plugin.saveSettings();
					});
			});

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.toUri.title"))
			.setDesc(i18next.t("settings.plugin.copyLink.toUri.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(pluginSettings.copyLink.transform.toUri)
					.onChange(async (value) => {
						pluginSettings.copyLink.transform.toUri = value;
						await ctx.plugin.saveSettings();
					})
			);

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.conversion.links.slugify.title"))
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						disable: i18next.t("settings.conversion.links.slugify.disable"),
						strict: i18next.t("settings.conversion.links.slugify.strict"),
						lower: i18next.t("settings.conversion.links.slugify.lower"),
					})
					.setValue(
						pluginSettings.copyLink.transform.slugify as "disable" | "strict" | "lower"
					)
					.onChange(async (value) => {
						pluginSettings.copyLink.transform.slugify = value as
							| "disable"
							| "strict"
							| "lower";
						await ctx.plugin.saveSettings();
					});
			});

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.applyRegex.title"))
			.setHeading()
			.setDesc(i18next.t("settings.plugin.copyLink.applyRegex.desc"))
			.addExtraButton((button) => {
				button.setIcon("plus").onClick(async () => {
					pluginSettings.copyLink.transform.applyRegex.push({
						regex: "",
						replacement: "",
					});
					await ctx.plugin.saveSettings();
					await ctx.renderSettingsPage(ESettingsTabId.Plugin);
				});
			});

		for (const apply of pluginSettings.copyLink.transform.applyRegex) {
			const regex = apply.regex;
			const replacement = apply.replacement;

			new Setting(ctx.settingsPage)
				.setClass("no-display")
				.addText((text) => {
					text
						.setPlaceholder("regex")
						.setValue(regex)
						.onChange(async (value) => {
							apply.regex = value;
							await ctx.plugin.saveSettings();
						});
				})
				.setClass("max-width")
				.addText((text) => {
					text
						.setPlaceholder("replacement")
						.setValue(replacement)
						.onChange(async (value) => {
							apply.replacement = value;
							await ctx.plugin.saveSettings();
						});
				})
				.setClass("max-width")
				.addExtraButton((button) => {
					button.setIcon("trash").onClick(async () => {
						pluginSettings.copyLink.transform.applyRegex =
							pluginSettings.copyLink.transform.applyRegex.filter(
								(item) => item !== apply
							);
						await ctx.plugin.saveSettings();
						await ctx.renderSettingsPage(ESettingsTabId.Plugin);
					});
				});
		}

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.plugin.copyLink.command.desc"))
			.addToggle((toggle) =>
				toggle.setValue(pluginSettings.copyLink.addCmd).onChange(async (value) => {
					pluginSettings.copyLink.addCmd = value;
					await ctx.plugin.saveSettings();
				})
			);
	}

	ctx.settingsPage.createEl("h3", { text: i18next.t("settings.plugin.head.other") });

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.embedEditRepo.title"))
		.setDesc(i18next.t("settings.plugin.embedEditRepo.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.displayModalRepoEditing).onChange(async (value) => {
				pluginSettings.displayModalRepoEditing = value;
				await ctx.plugin.saveSettings();
			})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.saveTab.title"))
		.setDesc(i18next.t("settings.plugin.saveTab.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.saveTabId ?? true).onChange(async (value) => {
				pluginSettings.saveTabId = value;
				ctx.settings.tabsId = value ? ESettingsTabId.Plugin : ESettingsTabId.Github;
				await ctx.plugin.saveSettings();
			})
		);

	ctx.settingsPage.createEl("h4", { text: i18next.t("settings.plugin.head.log") });

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.logNoticeHeader.title"))
		.setDesc(i18next.t("settings.plugin.logNoticeHeader.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.noticeError).onChange(async (value) => {
				pluginSettings.noticeError = value;
				await ctx.plugin.saveSettings();
			})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.dev.title"))
		.setDesc(i18next.t("settings.plugin.dev.desc"))
		.addToggle((toggle) =>
			toggle.setValue(pluginSettings.dev ?? false).onChange(async (value) => {
				pluginSettings.dev = value;

				await ctx.plugin.saveSettings();
			})
		);

	const length = pluginSettings.noticeLength ?? 0;
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.plugin.noticeLength.title"))
		.setDesc(i18next.t("settings.plugin.noticeLength.desc"))
		.addText((text) =>
			text
				.setPlaceholder("0")
				.setValue(`${length / 1000}`)
				.onChange(async (value) => {
					pluginSettings.noticeLength = parseInt(value, 10) * 1000;
					if (pluginSettings.noticeLength < 0) pluginSettings.noticeLength = 0;
					if (isNaN(pluginSettings.noticeLength)) {
						pluginSettings.noticeLength = 0;
						await ctx.renderSettingsPage(ESettingsTabId.Plugin);
					}
					await ctx.plugin.saveSettings();
				})
		);
};
