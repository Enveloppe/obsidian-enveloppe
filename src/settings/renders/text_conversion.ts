import dedent from "dedent";
import i18next from "i18next";
import { type SettingDefinitionItem, sanitizeHTMLToDom } from "obsidian";
import {
	type RenderContext,
	rawContent,
	splitByCommaOrNewLineAndNonWord,
	widenTextarea,
} from "./index";
import { buildCensorTextPage } from "./pages";

export const buildTextConversionItems = (ctx: RenderContext): SettingDefinitionItem[] => {
	const textSettings = ctx.settings.conversion;

	const shareAll = ctx.settings.plugin.shareAll?.enable
		? ` ${i18next.t("settings.conversion.links.internals.shareAll")}`
		: "";
	const internalLinksDesc = sanitizeHTMLToDom(
		dedent(`
			<p class="no-margin">${i18next.t("settings.conversion.links.internals.desc")} ${shareAll}</p>
			<p class="no-margin">${i18next.t("settings.conversion.links.internals.dataview")}</p>
		`)
	);

	const slugifySetting =
		typeof textSettings.links.slugify == "boolean"
			? textSettings.links.slugify
				? "strict"
				: "disable"
			: textSettings.links.slugify;
	const slugifyAnchorSettings =
		typeof textSettings.links.slugifyAnchor == "boolean"
			? textSettings.links.slugifyAnchor
				? "strict"
				: "disable"
			: textSettings.links.slugifyAnchor || "disable";

	const isDataviewEnabled = !!ctx.plugin.app.plugins.plugins.dataview;

	return [
		rawContent((el) => {
			el.appendChild(
				sanitizeHTMLToDom(`<p>${i18next.t("settings.conversion.desc")}</p>`)
			);
		}),
		{
			type: "group",
			heading: i18next.t("settings.conversion.links.title"),
			items: [
				rawContent((el) => {
					el.append(sanitizeHTMLToDom(i18next.t("settings.conversion.links.desc")));
				}),
				{
					name: i18next.t("settings.conversion.links.internals.title"),
					desc: internalLinksDesc,
					render: (setting) => {
						setting.addToggle((toggle) => {
							toggle.setValue(textSettings.links.internal).onChange(async (value) => {
								textSettings.links.internal = value;
								if (ctx.settings.plugin.shareAll?.enable) {
									textSettings.links.unshared = true;
								}
								await ctx.plugin.saveSettings();
								ctx.refresh();
							});
						});
					},
				},
				{
					name: i18next.t("settings.conversion.links.nonShared.title"),
					desc: i18next.t("settings.conversion.links.nonShared.desc"),
					visible: () =>
						textSettings.links.internal && !ctx.settings.plugin.shareAll?.enable,
					control: { type: "toggle", key: "conversion.links.unshared" },
				},
				{
					name: i18next.t("settings.conversion.links.unlink.title"),
					desc: sanitizeHTMLToDom(i18next.t("settings.conversion.links.unlink.desc")),
					visible: () =>
						textSettings.links.internal &&
						!ctx.settings.plugin.shareAll?.enable &&
						!textSettings.links.unshared,
					control: { type: "toggle", key: "conversion.links.unlink" },
				},
				{
					name: i18next.t("settings.conversion.links.relativePath.title"),
					desc: i18next.t("settings.conversion.links.relativePath.desc"),
					visible: () => textSettings.links.internal,
					control: { type: "toggle", key: "conversion.links.relativePath" },
				},
				{
					name: i18next.t("settings.conversion.links.textBefore.title"),
					desc: sanitizeHTMLToDom(
						`<span>${i18next.t("settings.conversion.links.textBefore.desc", { slash: "<code>/</code>" })}</span>`
					),
					visible: () => textSettings.links.internal && !textSettings.links.relativePath,
					control: {
						type: "text",
						key: "conversion.links.textPrefix",
						placeholder: "/",
					},
				},
				{
					name: i18next.t("settings.conversion.links.wikilinks.title"),
					desc: i18next.t("settings.conversion.links.wikilinks.desc"),
					control: { type: "toggle", key: "conversion.links.wiki" },
				},
				{
					name: i18next.t("settings.conversion.links.wikiDisplayText.title"),
					desc: i18next.t("settings.conversion.links.wikiDisplayText.desc"),
					visible: () => textSettings.links.wiki,
					control: { type: "toggle", key: "conversion.links.wikiDisplayText" },
				},
				{
					name: i18next.t("settings.conversion.links.slugify.title"),
					desc: i18next.t("settings.conversion.links.slugify.desc"),
					visible: () => textSettings.links.wiki || textSettings.links.internal,
					render: (setting) => {
						setting.addDropdown((dropdown) => {
							dropdown
								.addOptions({
									disable: i18next.t("settings.conversion.links.slugify.disable"),
									strict: i18next.t("settings.conversion.links.slugify.strict"),
									lower: i18next.t("settings.conversion.links.slugify.lower"),
								})
								.setValue(slugifySetting)
								.onChange(async (value) => {
									textSettings.links.slugify = ["disable", "strict", "lower"].includes(
										value
									)
										? (value as "disable" | "strict" | "lower")
										: "disable";
									await ctx.plugin.saveSettings();
								});
						});
					},
				},
				{
					name: i18next.t("settings.conversion.links.anchor.title"),
					desc: i18next.t("settings.conversion.links.anchor.desc"),
					visible: () => textSettings.links.wiki || textSettings.links.internal,
					render: (setting) => {
						setting.addDropdown((dropdown) => {
							dropdown
								.addOptions({
									disable: i18next.t("settings.conversion.links.slugify.disable"),
									strict: i18next.t("settings.conversion.links.slugify.strict"),
									lower: i18next.t("settings.conversion.links.slugify.lower"),
								})
								.setValue(slugifyAnchorSettings)
								.onChange(async (value) => {
									textSettings.links.slugifyAnchor = [
										"disable",
										"strict",
										"lower",
									].includes(value)
										? (value as "disable" | "strict" | "lower")
										: "disable";
									await ctx.plugin.saveSettings();
								});
						});
					},
				},
			],
		},
		{
			type: "group",
			heading: i18next.t("settings.conversion.sectionTitle"),
			items: [
				{
					name: i18next.t("settings.conversion.hardBreak.title"),
					desc: i18next.t("settings.conversion.hardBreak.desc"),
					control: { type: "toggle", key: "conversion.hardbreak" },
				},
				{
					name: i18next.t("settings.conversion.dataview.title"),
					desc: i18next.t("settings.conversion.dataview.desc"),
					control: {
						type: "toggle",
						key: "conversion.dataview",
						disabled: () => !isDataviewEnabled || !textSettings.links.internal,
					},
				},
				buildCensorTextPage(ctx),
			],
		},
		{
			type: "group",
			heading: "Tags",
			items: [
				{
					name: i18next.t("settings.conversion.tags.inlineTags.title"),
					desc: i18next.t("settings.conversion.tags.inlineTags.desc"),
					control: { type: "toggle", key: "conversion.tags.inline" },
				},
				{
					name: i18next.t("settings.conversion.tags.title"),
					desc: i18next.t("settings.conversion.tags.desc"),
					render: (setting) => {
						setting.addTextArea((text) => {
							widenTextarea(text, "220px")
								.setPlaceholder("field_name")
								.setValue(textSettings.tags.fields.join(","))
								.onChange(async (value) => {
									textSettings.tags.fields = splitByCommaOrNewLineAndNonWord(value);
									await ctx.plugin.saveSettings();
								});
						});
					},
				},
				{
					name: i18next.t("settings.conversion.tags.exclude.title"),
					desc: i18next.t("settings.conversion.tags.exclude.desc"),
					render: (setting) => {
						setting.addTextArea((text) => {
							widenTextarea(text)
								.setPlaceholder(i18next.t("settings.conversion.tags.exclude.placeholder"))
								.setValue(textSettings.tags.exclude.join(","))
								.onChange(async (value) => {
									textSettings.tags.exclude = splitByCommaOrNewLineAndNonWord(value);
									await ctx.plugin.saveSettings();
								});
						});
					},
				},
			],
		},
	];
};
