import i18next from "i18next";
import type { SettingDefinitionItem } from "obsidian";
import {
	type RenderContext,
	splitByCommaOrNewLineAndNonWord,
	splitByCommaOrNewLineAndSpaces,
	widenInput,
	widenTextarea,
} from "./index";

export const buildPluginItems = (ctx: RenderContext): SettingDefinitionItem[] => {
	const pluginSettings = ctx.settings.plugin;

	return [
		{
			type: "group",
			cls: "enveloppe",
			heading: i18next.t("settings.plugin.head.share"),
			items: [
				{
					name: i18next.t("settings.plugin.shareKey.all.title"),
					desc: i18next.t("settings.plugin.shareKey.all.desc"),
					render: (setting) => {
						setting.addToggle((toggle) =>
							toggle
								.setValue(pluginSettings.shareAll?.enable ?? false)
								.onChange(async (value) => {
									pluginSettings.shareAll = {
										enable: value,
										excludedFileName:
											pluginSettings.shareAll?.excludedFileName ?? "DRAFT",
									};
									if (value) ctx.settings.conversion.links.internal = true;
									await ctx.plugin.saveSettings();
									ctx.update();
								})
						);
					},
				},
				{
					name: i18next.t("settings.plugin.shareKey.title"),
					desc: i18next.t("settings.plugin.shareKey.desc"),
					visible: () => !pluginSettings.shareAll?.enable,
					control: { type: "text", key: "plugin.shareKey", placeholder: "share" },
				},
				{
					name: i18next.t("settings.plugin.shareKey.excludedFileName.title"),
					visible: () => !!pluginSettings.shareAll?.enable,
					control: {
						type: "text",
						key: "plugin.shareAll.excludedFileName",
						placeholder: "DRAFT",
						defaultValue: "DRAFT",
					},
				},
				{
					name: i18next.t("settings.plugin.excludedFolder.title"),
					desc: i18next.t("settings.plugin.excludedFolder.desc"),
					render: (setting) => {
						setting.addTextArea((textArea) =>
							widenTextarea(textArea)
								.setPlaceholder("_assets, Archive, /^_(.*)/gi")
								.setValue(pluginSettings.excludedFolder.join(", "))
								.onChange(async (value) => {
									pluginSettings.excludedFolder = splitByCommaOrNewLineAndNonWord(value);
									await ctx.plugin.saveSettings();
								})
						);
					},
				},
				{
					name: i18next.t("settings.plugin.set.title"),
					desc: i18next.t("settings.plugin.set.desc"),
					control: { type: "text", key: "plugin.setFrontmatterKey", placeholder: "Set" },
				},
			],
		},
		{
			type: "group",
			cls: "enveloppe",
			heading: i18next.t("settings.plugin.head.menu"),
			items: [
				{
					name: i18next.t("settings.plugin.fileMenu.title"),
					desc: i18next.t("settings.plugin.fileMenu.desc"),
					control: { type: "toggle", key: "plugin.fileMenu" },
				},
				{
					name: i18next.t("settings.plugin.editorMenu.title"),
					desc: i18next.t("settings.plugin.editorMenu.desc"),
					control: { type: "toggle", key: "plugin.editorMenu" },
				},
			],
		},
		{
			type: "group",
			cls: "enveloppe",

			heading: i18next.t("settings.plugin.head.copyLinks"),
			items: [
				{
					name: i18next.t("settings.plugin.copyLink.title"),
					desc: i18next.t("settings.plugin.copyLink.desc"),
					control: { type: "toggle", key: "plugin.copyLink.enable" },
				},
				{
					name: i18next.t("settings.plugin.copyLink.baselink.title"),
					desc: i18next.t("settings.plugin.copyLink.baselink.desc"),
					visible: () => pluginSettings.copyLink.enable,
					control: {
						type: "text",
						key: "plugin.copyLink.links",
						placeholder: "my_blog.com",
					},
				},
				{
					name: i18next.t("settings.plugin.copyLink.linkPathRemover.title"),
					desc: i18next.t("settings.plugin.copyLink.linkPathRemover.desc"),
					visible: () => pluginSettings.copyLink.enable,
					render: (setting) => {
						setting.addText((text) => {
							text
								.setPlaceholder("docs")
								.setValue(pluginSettings.copyLink.removePart.join(", "))
								.onChange(async (value) => {
									pluginSettings.copyLink.removePart =
										splitByCommaOrNewLineAndSpaces(value);
									await ctx.plugin.saveSettings();
								});
						});
					},
				},
				{
					name: i18next.t("settings.plugin.copyLink.toUri.title"),
					desc: i18next.t("settings.plugin.copyLink.toUri.desc"),
					visible: () => pluginSettings.copyLink.enable,
					control: { type: "toggle", key: "plugin.copyLink.transform.toUri" },
				},
				{
					name: i18next.t("settings.conversion.links.slugify.title"),
					visible: () => pluginSettings.copyLink.enable,
					control: {
						type: "dropdown",
						key: "plugin.copyLink.transform.slugify",
						options: {
							disable: i18next.t("settings.conversion.links.slugify.disable"),
							strict: i18next.t("settings.conversion.links.slugify.strict"),
							lower: i18next.t("settings.conversion.links.slugify.lower"),
						},
					},
				},
				{
					name: i18next.t("settings.plugin.copyLink.command.desc"),
					visible: () => pluginSettings.copyLink.enable,
					control: { type: "toggle", key: "plugin.copyLink.addCmd" },
				},
			],
		},
		{
			type: "list",
			heading: i18next.t("settings.plugin.copyLink.applyRegex.title"),
			visible: () => pluginSettings.copyLink.enable,
			emptyState: i18next.t("settings.plugin.copyLink.applyRegex.desc"),
			addItem: {
				name: i18next.t("settings.plugin.copyLink.applyRegex.title"),
				action: () => {
					void (async () => {
						pluginSettings.copyLink.transform.applyRegex.push({
							regex: "",
							replacement: "",
						});
						await ctx.plugin.saveSettings();
						ctx.update();
					})();
				},
			},
			onDelete: (index) => {
				void (async () => {
					pluginSettings.copyLink.transform.applyRegex.splice(index, 1);
					await ctx.plugin.saveSettings();
					ctx.update();
				})();
			},
			items: pluginSettings.copyLink.transform.applyRegex.map((apply) => ({
				name: "",
				searchable: false,
				render: (setting) => {
					setting
						.setClass("no-display")
						.addText((text) => {
							widenInput(text)
								.setPlaceholder("regex")
								.setValue(apply.regex)
								.onChange(async (value) => {
									apply.regex = value;
									await ctx.plugin.saveSettings();
								});
						})
						.addText((text) => {
							widenInput(text)
								.setPlaceholder("replacement")
								.setValue(apply.replacement)
								.onChange(async (value) => {
									apply.replacement = value;
									await ctx.plugin.saveSettings();
								});
						});
				},
			})),
		},
		{
			type: "group",
			cls: "enveloppe",

			heading: i18next.t("settings.plugin.head.other"),
			items: [
				{
					name: i18next.t("settings.plugin.embedEditRepo.title"),
					desc: i18next.t("settings.plugin.embedEditRepo.desc"),
					control: { type: "toggle", key: "plugin.displayModalRepoEditing" },
				},
			],
		},
		{
			type: "group",
			cls: "enveloppe",

			heading: i18next.t("settings.plugin.head.log"),
			items: [
				{
					name: i18next.t("settings.plugin.logNoticeHeader.title"),
					desc: i18next.t("settings.plugin.logNoticeHeader.desc"),
					control: { type: "toggle", key: "plugin.noticeError" },
				},
				{
					name: i18next.t("settings.plugin.dev.title"),
					desc: i18next.t("settings.plugin.dev.desc"),
					control: { type: "toggle", key: "plugin.dev", defaultValue: false },
				},
				{
					name: i18next.t("settings.plugin.noticeLength.title"),
					desc: i18next.t("settings.plugin.noticeLength.desc"),
					render: (setting) => {
						const length = pluginSettings.noticeLength ?? 0;
						setting.addText((text) =>
							text
								.setPlaceholder("0")
								.setValue(`${length / 1000}`)
								.onChange(async (value) => {
									let noticeLength = parseInt(value, 10) * 1000;
									if (noticeLength < 0) noticeLength = 0;
									if (Number.isNaN(noticeLength)) {
										noticeLength = 0;
										pluginSettings.noticeLength = noticeLength;
										ctx.refresh();
									}
									pluginSettings.noticeLength = noticeLength;
									await ctx.plugin.saveSettings();
								})
						);
					},
				},
			],
		},
	];
};
