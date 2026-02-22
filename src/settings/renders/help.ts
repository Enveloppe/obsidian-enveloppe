import i18next from "i18next";
import { Setting, sanitizeHTMLToDom } from "obsidian";
import {
	help,
	KeyBasedOnSettings,
	multipleRepoExplained,
	supportMe,
	usefulLinks,
} from "src/settings/help";
import type { RenderContext } from "./index";

export const renderHelp = (ctx: RenderContext) => {
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.help.usefulLinks.title"))
		.setHeading();
	ctx.settingsPage.appendChild(usefulLinks());
	ctx.settingsPage.createEl("hr");
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.help.frontmatter.title"))
		.setHeading();
	const dom = sanitizeHTMLToDom(`
			<p>${i18next.t("settings.help.frontmatter.desc")}</p>
			<p>${i18next.t(
				"settings.help.frontmatter.nestedKey"
			)} <code>key.subkey: value</code>.</p>`);
	ctx.settingsPage.appendChild(dom);
	ctx.settingsPage.createEl("pre", { cls: "language-yaml" }).createEl("code", {
		text: KeyBasedOnSettings(ctx.settings),
		cls: "language-yaml",
	});
	ctx.settingsPage.appendChild(help(ctx.settings));

	ctx.settingsPage.createEl("hr");
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.help.multiRepoHelp.title"))
		.setHeading();
	ctx.settingsPage.appendChild(multipleRepoExplained(ctx.settings));
	ctx.settingsPage.appendChild(supportMe());
};
