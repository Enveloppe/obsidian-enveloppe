import { FolderSettings } from "@interfaces";
import i18next from "i18next";
import type { SettingDefinitionItem } from "obsidian";
import { AutoCleanPopup } from "src/settings/modals/popup";
import { autoCleanCondition } from "src/settings/style";
import { type RenderContext, splitByCommaOrNewLine, widenTextarea } from "./index";
import { buildRegexFilePathPage } from "./pages";

export const buildUploadItems = (ctx: RenderContext): SettingDefinitionItem[] => {
	const uploadSettings = ctx.settings.upload;

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

	return [
		{
			name: i18next.t("settings.upload.folderBehavior.title"),
			desc: i18next.t("settings.upload.folderBehavior.desc"),
			render: (setting) => {
				setting.addDropdown((dropDown) => {
					dropDown
						.addOptions({
							fixed: i18next.t("settings.upload.folderBehavior.fixedFolder"),
							yaml: i18next.t("settings.upload.folderBehavior.yaml"),
							obsidian: i18next.t("settings.upload.folderBehavior.obsidianPath"),
						})
						.setValue(uploadSettings.behavior)
						.onChange(async (value: string) => {
							uploadSettings.behavior = value as FolderSettings;
							await ctx.plugin.saveSettings();
							ctx.update();
						});
				});
			},
		},
		{
			name: defaultFolder.title,
			desc: defaultFolder.desc,
			render: (setting) => {
				setting.addText((text) => {
					text
						.setPlaceholder(i18next.t("settings.upload.defaultFolder.placeholder"))
						.setValue(uploadSettings.defaultName)
						.onChange(async (value) => {
							uploadSettings.defaultName = value.replace(/\/$/, "");
							await ctx.plugin.saveSettings();
							await autoCleanCondition(value, ctx.plugin, "defaultName", ctx.update);
						});
				});
			},
		},
		{
			name: i18next.t("settings.upload.frontmatterKey.title"),
			desc: i18next.t("settings.upload.frontmatterKey.desc"),
			visible: () => uploadSettings.behavior === FolderSettings.Yaml,
			control: {
				type: "text",
				key: "upload.yamlFolderKey",
				placeholder: i18next.t("settings.upload.frontmatterKey.placeholder"),
			},
		},
		{
			name: i18next.t("settings.upload.rootFolder.title"),
			desc: i18next.t("settings.upload.rootFolder.desc"),
			visible: () => uploadSettings.behavior === FolderSettings.Yaml,
			render: (setting) => {
				setting.addText((text) => {
					text
						.setPlaceholder("docs")
						.setValue(uploadSettings.rootFolder)
						.onChange(async (value) => {
							uploadSettings.rootFolder = value.replace(/\/$/, "");
							await ctx.plugin.saveSettings();
							await autoCleanCondition(value, ctx.plugin, "rootFolder", ctx.update);
						});
				});
			},
		},
		{
			name: i18next.t("settings.upload.useFrontmatterTitle.title"),
			desc: i18next.t("settings.upload.useFrontmatterTitle.desc"),
			control: { type: "toggle", key: "upload.frontmatterTitle.enable" },
		},
		{
			name: "Frontmatter title key",
			visible: () => uploadSettings.frontmatterTitle.enable,
			control: {
				type: "text",
				key: "upload.frontmatterTitle.key",
				placeholder: "title",
			},
		},
		buildRegexFilePathPage(ctx),
		{
			name: i18next.t("settings.conversion.links.folderNote.title"),
			desc: i18next.t("settings.conversion.links.folderNote.desc"),
			visible: () => uploadSettings.behavior !== FolderSettings.Fixed,
			control: { type: "toggle", key: "upload.folderNote.enable" },
		},
		{
			name: "Folder note name",
			visible: () =>
				uploadSettings.behavior !== FolderSettings.Fixed &&
				uploadSettings.folderNote.enable,
			control: {
				type: "text",
				key: "upload.folderNote.rename",
				placeholder: "folderNote",
			},
		},
		{
			name: i18next.t("settings.upload.folderNote.addTitle.title"),
			visible: () =>
				uploadSettings.behavior !== FolderSettings.Fixed &&
				uploadSettings.folderNote.enable,
			control: { type: "toggle", key: "upload.folderNote.addTitle.enable" },
		},
		{
			name: i18next.t("settings.upload.folderNote.addTitle.key"),
			visible: () =>
				uploadSettings.behavior !== FolderSettings.Fixed &&
				uploadSettings.folderNote.enable &&
				uploadSettings.folderNote.addTitle.enable,
			control: {
				type: "text",
				key: "upload.folderNote.addTitle.key",
				placeholder: "title",
			},
		},
		{
			name: i18next.t("settings.githubWorkflow.useMetadataExtractor.title"),
			desc: i18next.t("settings.githubWorkflow.useMetadataExtractor.desc"),
			visible: () => !!ctx.plugin.app.plugins.getPlugin("metadata-extractor"),
			control: {
				type: "text",
				key: "upload.metadataExtractorPath",
				placeholder: "docs/_assets/metadata",
			},
		},
		{
			name: i18next.t("settings.githubWorkflow.autoCleanUp.title"),
			desc: i18next.t("settings.githubWorkflow.autoCleanUp.desc"),
			render: (setting) => {
				setting.addToggle((toggle) => {
					toggle.setValue(uploadSettings.autoclean.enable).onChange(async (value) => {
						if (
							value &&
							((ctx.settings.upload.behavior === FolderSettings.Yaml &&
								ctx.settings.upload.defaultName.length === 0) ||
								ctx.settings.upload.rootFolder.length === 0)
						) {
							new AutoCleanPopup(ctx.app, ctx.settings, async (result) => {
								uploadSettings.autoclean.enable = result;
								await ctx.plugin.saveSettings();
								await ctx.plugin.reloadCommands(true, result);
								ctx.update();
							}).open();
							return;
						}
						uploadSettings.autoclean.enable = value;
						await ctx.plugin.saveSettings();
						await ctx.plugin.reloadCommands(true, value);
						ctx.update();
					});
				});
			},
		},
		{
			name: i18next.t("settings.githubWorkflow.excludedFiles.title"),
			desc: i18next.t("settings.githubWorkflow.excludedFiles.desc"),
			visible: () => uploadSettings.autoclean.enable,
			render: (setting) => {
				// in some legacy settings files, this can be a plain string instead of an array
				const excluded: string[] =
					typeof uploadSettings.autoclean.excluded === "string"
						? [uploadSettings.autoclean.excluded]
						: uploadSettings.autoclean.excluded;
				setting.addTextArea((textArea) => {
					widenTextarea(textArea)
						.setPlaceholder("docs/assets/js, docs/assets/logo, /\\.js$/")
						.setValue(excluded.join(", "))
						.onChange(async (value) => {
							uploadSettings.autoclean.excluded = splitByCommaOrNewLine(value);
							await ctx.plugin.saveSettings();
						});
				});
			},
		},
		{
			name: i18next.t("settings.githubWorkflow.includeAttachments.title"),
			desc: i18next.t("settings.githubWorkflow.includeAttachments.desc"),
			visible: () => uploadSettings.autoclean.enable,
			control: { type: "toggle", key: "upload.autoclean.includeAttachments" },
		},
	];
};
