import i18next from "i18next";
import type { SettingDefinitionItem } from "obsidian";
import {
	helpMarkdown,
	keyBasedOnSettingsMarkdown,
	multipleRepoExplainedMarkdown,
	supportMeMarkdown,
	usefulLinksMarkdown,
} from "src/settings/help";
import { markdownContent, type RenderContext } from "./index";

export const buildHelpItems = (ctx: RenderContext): SettingDefinitionItem[] => {
	return [
		{
			type: "group",
			heading: i18next.t("settings.help.usefulLinks.title"),
			items: [markdownContent(ctx, usefulLinksMarkdown())],
		},
		{
			type: "group",
			heading: i18next.t("settings.help.frontmatter.title"),
			items: [
				markdownContent(
					ctx,
					[
						i18next.t("settings.help.frontmatter.desc"),
						`${i18next.t("settings.help.frontmatter.nestedKey")} \`key.subkey: value\`.`,
						keyBasedOnSettingsMarkdown(ctx.settings),
						helpMarkdown(ctx.settings),
					].join("\n\n")
				),
			],
		},
		{
			type: "group",
			heading: i18next.t("settings.help.multiRepoHelp.title"),
			items: [
				markdownContent(
					ctx,
					[multipleRepoExplainedMarkdown(ctx.settings), supportMeMarkdown()].join("\n\n")
				),
			],
		},
	];
};
