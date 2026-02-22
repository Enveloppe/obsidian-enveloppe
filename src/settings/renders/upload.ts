import { ESettingsTabId, FolderSettings } from "@interfaces";
import i18next from "i18next";
import { Setting } from "obsidian";
import type { EnveloppeSettingsTab } from "src/settings";
import { AutoCleanPopup } from "src/settings/modals/popup";
import { ModalRegexFilePathName } from "src/settings/modals/regex_edition";
import {
	autoCleanCondition,
	folderHideShowSettings,
	showHideBasedOnFolder,
} from "src/settings/style";
import { type RenderContext, splitByCommaOrNewLine } from "./index";

export const renderUploadConfiguration = (ctx: RenderContext) => {
	const uploadSettings = ctx.settings.upload;
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.upload.folderBehavior.title"))
		.setDesc(i18next.t("settings.upload.folderBehavior.desc"))
		.addDropdown((dropDown) => {
			dropDown
				.addOptions({
					fixed: i18next.t("settings.upload.folderBehavior.fixedFolder"),
					yaml: i18next.t("settings.upload.folderBehavior.yaml"),
					obsidian: i18next.t("settings.upload.folderBehavior.obsidianPath"),
				})
				.setValue(uploadSettings.behavior)
				.onChange(async (value: string) => {
					uploadSettings.behavior = value as FolderSettings;
					await folderHideShowSettings(
						frontmatterKeySettings,
						rootFolderSettings,
						autoCleanSetting,
						value,
						ctx.plugin
					);
					await ctx.plugin.saveSettings();
					await ctx.renderSettingsPage(ESettingsTabId.Upload);
				});
		});

	const defaultFolder =
		uploadSettings.behavior === FolderSettings.Yaml
			? {
					desc: i18next.t("settings.upload.defaultFolder.desc"),
					title: i18next.t("settings.upload.defaultFolder.title"),
				}
			: {
					desc: i18next.t("settings.upload.rootFolder.other"),
					title: i18next.t("settings.upload.rootFolder.title"),
				};

	new Setting(ctx.settingsPage)
		.setName(defaultFolder.title)
		.setDesc(defaultFolder.desc)
		.addText((text) => {
			text
				.setPlaceholder(i18next.t("settings.upload.defaultFolder.placeholder"))
				.setValue(uploadSettings.defaultName)
				.onChange(async (value) => {
					uploadSettings.defaultName = value.replace(/\/$/, "");
					await autoCleanCondition(
						value,
						autoCleanSetting,
						ctx.plugin,
						"defaultName",
						ctx as unknown as EnveloppeSettingsTab
					);
					await ctx.plugin.saveSettings();
				});
		});

	const frontmatterKeySettings = new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.upload.frontmatterKey.title"))
		.setDesc(i18next.t("settings.upload.frontmatterKey.desc"))
		.addText((text) => {
			text
				.setPlaceholder(i18next.t("settings.upload.frontmatterKey.placeholder"))
				.setValue(uploadSettings.yamlFolderKey)
				.onChange(async (value) => {
					uploadSettings.yamlFolderKey = value.trim();
					await ctx.plugin.saveSettings();
				});
		});
	const rootFolderSettings = new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.upload.rootFolder.title"))
		.setDesc(i18next.t("settings.upload.rootFolder.desc"))
		.addText((text) => {
			text
				.setPlaceholder("docs")
				.setValue(uploadSettings.rootFolder)
				.onChange(async (value) => {
					uploadSettings.rootFolder = value.replace(/\/$/, "");
					await autoCleanCondition(
						value,
						autoCleanSetting,
						ctx.plugin,
						"rootFolder",
						ctx as unknown as EnveloppeSettingsTab
					);
					await ctx.plugin.saveSettings();
				});
		});
	const frontmatterTitleSet = new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.upload.useFrontmatterTitle.title"))
		.setDesc(i18next.t("settings.upload.useFrontmatterTitle.desc"))
		.setClass("title")
		.addToggle((toggle) => {
			toggle.setValue(uploadSettings.frontmatterTitle.enable).onChange(async (value) => {
				uploadSettings.frontmatterTitle.enable = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage(ESettingsTabId.Upload);
			});
		});
	if (uploadSettings.frontmatterTitle.enable) {
		frontmatterTitleSet.addText((text) => {
			text
				.setPlaceholder("title")
				.setValue(uploadSettings.frontmatterTitle.key)
				.onChange(async (value) => {
					uploadSettings.frontmatterTitle.key = value.trim();
					await ctx.plugin.saveSettings();
				});
		});
	}

	const desc =
		uploadSettings.behavior === FolderSettings.Fixed
			? i18next.t("settings.upload.regexFilePathTitle.title.titleOnly")
			: i18next.t("settings.upload.regexFilePathTitle.title.FolderPathTitle");

	new Setting(ctx.settingsPage)
		.setName(desc)
		.setDesc(i18next.t("settings.upload.regexFilePathTitle.desc"))
		.addButton((button) => {
			button.setIcon("pencil").onClick(async () => {
				let allRegex = uploadSettings.replaceTitle;
				if (uploadSettings.behavior !== FolderSettings.Fixed) {
					allRegex = allRegex.concat(uploadSettings.replacePath);
				}
				new ModalRegexFilePathName(
					ctx.app,
					ctx.settings,
					ctx.copy(allRegex) as any,
					async (result) => {
						uploadSettings.replacePath = result.filter((title) => {
							return title.type === "path";
						});
						uploadSettings.replaceTitle = result.filter((title) => {
							return title.type === "title";
						});
						await ctx.plugin.saveSettings();
					}
				).open();
			});
		});

	const folderNoteSettings = new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.links.folderNote.title"))
		.setDesc(i18next.t("settings.conversion.links.folderNote.desc"))
		.addToggle((toggle) => {
			toggle.setValue(uploadSettings.folderNote.enable).onChange(async (value) => {
				uploadSettings.folderNote.enable = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage(ESettingsTabId.Upload);
			});
		});

	if (uploadSettings.folderNote.enable) {
		folderNoteSettings.addText((text) => {
			text
				.setPlaceholder("folderNote")
				.setValue(uploadSettings.folderNote.rename)
				.onChange(async (value) => {
					uploadSettings.folderNote.rename = value;
					await ctx.plugin.saveSettings();
				});
		});
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.upload.folderNote.addTitle.title"))
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.folderNote.addTitle.enable)
					.onChange(async (value) => {
						uploadSettings.folderNote.addTitle.enable = value;
						await ctx.plugin.saveSettings();
						await ctx.renderSettingsPage(ESettingsTabId.Upload);
					});
			});
		if (uploadSettings.folderNote.addTitle.enable) {
			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.upload.folderNote.addTitle.key"))
				.addText((text) => {
					text
						.setPlaceholder("title")
						.setValue(uploadSettings.folderNote.addTitle.key)
						.onChange(async (value) => {
							uploadSettings.folderNote.addTitle.key = value;
							await ctx.plugin.saveSettings();
						});
				});
		}
	}

	showHideBasedOnFolder(
		ctx.settings,
		frontmatterKeySettings,
		rootFolderSettings,
		folderNoteSettings
	);

	if ((ctx.plugin.app as any).plugins.getPlugin("metadata-extractor")) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.useMetadataExtractor.title"))
			.setDesc(i18next.t("settings.githubWorkflow.useMetadataExtractor.desc"))
			.addText((text) => {
				text
					.setPlaceholder("docs/_assets/metadata")
					.setValue(uploadSettings.metadataExtractorPath)
					.onChange(async (value) => {
						uploadSettings.metadataExtractorPath = value.trim();
						await ctx.plugin.saveSettings();
					});
			});
	}

	const autoCleanSetting = new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.githubWorkflow.autoCleanUp.title"))
		.setDesc(i18next.t("settings.githubWorkflow.autoCleanUp.desc"))
		.addToggle((toggle) => {
			toggle.setValue(uploadSettings.autoclean.enable).onChange(async (value) => {
				if (
					value &&
					((ctx.settings.upload.behavior === "yaml" &&
						ctx.settings.upload.defaultName.length === 0) ||
						ctx.settings.upload.rootFolder.length === 0)
				)
					new AutoCleanPopup(ctx.app, ctx.settings, (result) => {
						uploadSettings.autoclean.enable = result;
						ctx.renderSettingsPage(ESettingsTabId.Upload);
					}).open();
				else uploadSettings.autoclean.enable = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage(ESettingsTabId.Upload);
				await ctx.plugin.reloadCommands(true, value);
			});
		});
	if (uploadSettings.autoclean.enable) {
		// noinspection SuspiciousTypeOfGuard
		const excluded: string[] =
			//in some condition, it can be a string
			typeof uploadSettings.autoclean.excluded === "string"
				? [uploadSettings.autoclean.excluded]
				: uploadSettings.autoclean.excluded;
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.excludedFiles.title"))
			.setDesc(i18next.t("settings.githubWorkflow.excludedFiles.desc"))
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("docs/assets/js, docs/assets/logo, /\\.js$/")
					.setValue(excluded.join(", "))
					.onChange(async (value) => {
						uploadSettings.autoclean.excluded = splitByCommaOrNewLine(value);
						await ctx.plugin.saveSettings();
					});
			});

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.githubWorkflow.includeAttachments.title"))
			.setDesc(i18next.t("settings.githubWorkflow.includeAttachments.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(uploadSettings.autoclean.includeAttachments)
					.onChange(async (value) => {
						uploadSettings.autoclean.includeAttachments = value;
						await ctx.plugin.saveSettings();
					});
			});
	}

	folderHideShowSettings(
		frontmatterKeySettings,
		rootFolderSettings,
		autoCleanSetting,
		uploadSettings.behavior,
		ctx.plugin
	);
};
