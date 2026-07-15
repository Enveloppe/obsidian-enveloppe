import { Placeholder } from "@interfaces/enum";
import dedent from "dedent";
import i18next from "i18next";
import { type SettingDefinitionItem, sanitizeHTMLToDom } from "obsidian";
import { type RenderContext, rawContent, stringListItems } from "./index";
import { buildOverrideAttachmentsPage } from "./pages";

export const buildEmbedItems = (ctx: RenderContext): SettingDefinitionItem[] => {
	const embedSettings = ctx.settings.embed;
	// lazily seed in memory; persisted on first edit
	if (!embedSettings.bake) {
		embedSettings.bake = { textBefore: "", textAfter: "" };
	}
	if (!embedSettings.unHandledObsidianExt) embedSettings.unHandledObsidianExt = [];
	if (!embedSettings.keySendFile) embedSettings.keySendFile = [];

	const bakeDesc = dedent(`
		<h5>${i18next.t("settings.embed.bake.title")}</h5>
		<p>${i18next.t("settings.embed.bake.text")}. <span class="bake">${i18next.t("settings.embed.bake.variable.desc")}</span>
		<ul>
			<li><code>{{title}}</code>${i18next.t("settings.embed.bake.variable.title")}</li>
			<li><code>{{url}}</code>${i18next.t("settings.embed.bake.variable.url")}</li>
		</ul></p>
		<p class="warning embed">! ${i18next.t("settings.embed.bake.warning")}</p>
	`);

	return [
		{
			name: i18next.t("settings.embed.sendSimpleLinks.title"),
			desc: i18next.t("settings.embed.sendSimpleLinks.desc"),
			control: { type: "toggle", key: "embed.sendSimpleLinks" },
		},
		{
			name: i18next.t("settings.embed.forcePush.title"),
			desc: i18next.t("settings.embed.forcePush.desc"),
			control: { type: "toggle", key: "embed.forcePush", defaultValue: true },
		},
		{
			type: "group",
			cls: "enveloppe",
			heading: i18next.t("settings.embed.attachment"),
			items: [
				{
					name: i18next.t("settings.embed.transferImage.title"),
					control: { type: "toggle", key: "embed.attachments" },
				},
				{
					name: i18next.t("settings.embed.imagePath.title"),
					desc: i18next.t("settings.embed.imagePath.desc"),
					visible: () => embedSettings.attachments,
					control: {
						type: "toggle",
						key: "embed.useObsidianFolder",
						defaultValue: false,
					},
				},
				{
					name: i18next.t("settings.embed.defaultImageFolder.title"),
					desc: i18next.t("settings.embed.defaultImageFolder.desc"),
					visible: () => embedSettings.attachments && !embedSettings.useObsidianFolder,
					render: (setting) => {
						setting.addText((text) => {
							text
								.setPlaceholder(Placeholder.FolderImage)
								.setValue(embedSettings.folder)
								.onChange(async (value) => {
									embedSettings.folder = value.replace(/\/$/, "");
									await ctx.plugin.saveSettings();
								});
						});
					},
				},
				{
					...buildOverrideAttachmentsPage(ctx),
					visible: () => embedSettings.attachments,
				},
				{
					...rawContent((el) => {
						el.createEl("p", {
							text: i18next.t("settings.embeds.unHandledObsidianExt.desc"),
						});
					}),
					visible: () => embedSettings.attachments,
				},
				{
					...stringListItems(ctx, {
						heading: i18next.t("settings.embeds.unHandledObsidianExt.title"),
						addItemName: i18next.t("common.add", { things: "extension" }),
						values: embedSettings.unHandledObsidianExt,
						save: () => ctx.plugin.saveSettings(),
					}),
					visible: () => embedSettings.attachments,
				},
			],
		},
		{
			name: i18next.t("settings.embed.transferMetaFile.title"),
			cls: "enveloppe",
			desc: i18next.t("settings.embed.transferMetaFile.desc"),
		},
		stringListItems(ctx, {
			heading: i18next.t("settings.embed.transferMetaFile.title"),
			addItemName: i18next.t("common.add", { things: "metadata field" }),
			placeholder: Placeholder.Banner,
			values: embedSettings.keySendFile,
			save: () => ctx.plugin.saveSettings(),
		}),
		{
			type: "group",
			cls: "enveloppe",
			heading: i18next.t("settings.embed.notes"),
			items: [
				{
					name: i18next.t("settings.embed.transferNotes.title"),
					desc: i18next.t("settings.embed.transferNotes.desc"),
					control: { type: "toggle", key: "embed.notes" },
				},
				{
					name: i18next.t("settings.embed.links.title"),
					desc: i18next.t("settings.embed.links.desc"),
					visible: () => embedSettings.notes,
					control: {
						type: "dropdown",
						key: "embed.convertEmbedToLinks",
						defaultValue: "keep",
						options: {
							keep: i18next.t("settings.embed.links.dp.keep"),
							remove: i18next.t("settings.embed.links.dp.remove"),
							links: i18next.t("settings.embed.links.dp.links"),
							bake: i18next.t("settings.embed.links.dp.bake"),
						},
					},
				},
				{
					name: i18next.t("settings.embed.char.title"),
					desc: i18next.t("settings.embed.char.desc"),
					visible: () =>
						embedSettings.notes && embedSettings.convertEmbedToLinks === "links",
					control: {
						type: "text",
						key: "embed.charConvert",
						placeholder: "->",
						defaultValue: "->",
					},
				},
				rawContent((el) => {
					if (embedSettings.notes && embedSettings.convertEmbedToLinks === "bake") {
						el.appendChild(sanitizeHTMLToDom(bakeDesc));
					}
				}),
				{
					name: i18next.t("settings.embed.bake.textBefore.title"),
					visible: () =>
						embedSettings.notes && embedSettings.convertEmbedToLinks === "bake",
					control: { type: "textarea", key: "embed.bake.textBefore" },
				},
				{
					name: i18next.t("settings.embed.bake.textAfter.title"),
					visible: () =>
						embedSettings.notes && embedSettings.convertEmbedToLinks === "bake",
					control: { type: "textarea", key: "embed.bake.textAfter" },
				},
			],
		},
	];
};
