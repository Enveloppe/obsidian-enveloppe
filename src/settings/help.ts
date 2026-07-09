import { type EnveloppeSettings, FolderSettings } from "@interfaces";
import { DOCUMENTATION_LINK } from "@interfaces/constant";
import { DISCORD_ICON, DISCUSSION_ICON, DOCUMENTATION, GITHUB_ICON, ISSUE, TRANSLATION_ICON } from "@interfaces/icons";
import dedent from "dedent";
import i18next from "i18next";
import { normalizePath } from "obsidian";

const FENCE = "```";

/**
 * Build the YAML example block (as Markdown) showing the frontmatter keys with the
 * values currently in effect, based on the settings.
 */
export function keyBasedOnSettingsMarkdown(settings: EnveloppeSettings): string {
	const lines: string[] = [`${settings.plugin.shareKey}: true`];
	if (settings.upload.behavior === FolderSettings.Yaml) {
		const defaultPath = settings.upload.defaultName.length > 0 ? settings.upload.defaultName : "/";
		const key = settings.upload.yamlFolderKey.length > 0 ? settings.upload.yamlFolderKey : "category";
		lines.push(`${key}: ${normalizePath(defaultPath)}`);
	}
	lines.push(
		"path: file.md # given as an example path",
		"links:",
		`  mdlinks: ${settings.conversion.links.wiki}`,
		"  convert: true",
		`  internals: ${settings.conversion.links.internal}`,
		`  nonShared: ${settings.conversion.links.unshared}`,
		`  unlink: ${settings.conversion.links.unlink}`,
		"embed:",
		`  send: ${settings.embed.notes}`,
		`  remove: ${settings.embed.convertEmbedToLinks}`,
		`  char: ${settings.embed.charConvert}`,
		"attachment:",
		`  send: ${settings.embed.attachments}`,
		`  folder: ${settings.embed.folder}`,
		`dataview: ${settings.conversion.dataview}`,
		`hardBreak: ${settings.conversion.hardbreak}`,
		`includeLinks: ${settings.embed.sendSimpleLinks}`
	);
	if (settings.github.otherRepo.length > 0) {
		const smartkey = settings.github.otherRepo[0].smartKey.length > 0 ? settings.github.otherRepo[0].smartKey : "smartkey";
		lines.push(`shortRepo: ${smartkey}`);
	}
	lines.push("repo:", `  owner: ${settings.github.user}`, `  repo: ${settings.github.repo}`, `  branch: ${settings.github.branch}`, `  autoclean: ${settings.upload.autoclean.enable}`, "copylink:");
	const base = settings.plugin.copyLink.links.length > 0 ? settings.plugin.copyLink.links : `https://${settings.github.repo}.github.io/${settings.github.repo}`;
	lines.push(`  base: ${base}`);
	const removePart = settings.plugin.copyLink.removePart.map((val) => `"${val}"`).join(", ");
	if (removePart.length > 0) {
		lines.push(`  remove: ${removePart}`);
	}
	return `${FENCE}yaml\n${lines.join("\n")}\n${FENCE}`;
}

/**
 * Markdown explanation of every frontmatter key the plugin reads.
 */
export function helpMarkdown(settings: EnveloppeSettings): string {
	return dedent(`
		- \`${settings.plugin.shareKey}\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.share.title")}\n\t${i18next.t("settings.help.frontmatter.share.other")}
		- \`path\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.path")}
		- \`links\`${i18next.t("common.points")}
		  - \`mdlinks\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.mdlinks")} \`[[markdown|alias]]\` ${i18next.t("common.in")} \`[alias](markdown)\`
		  - \`convert\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.convert.enableOrDisable")} \`[[link]]\` ${i18next.t("common.or")} \`[](link)\` ${i18next.t("settings.help.frontmatter.convert.syntax")}
		  - \`internals\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.internals")}
		  - \`nonShared\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.nonShared")}
		  - \`unlink\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.unlink")}
		- \`embed\`${i18next.t("common.points")}
		  - \`send\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.send")}
		  - \`remove\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.desc")}
		    - \`remove | true\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.remove")}
		    - \`keep | false\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.keep")}
		    - \`links\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.links")}
		    - \`bake\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.bake")}
		  - \`char\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.char")}
		- \`attachment\`${i18next.t("common.points")}
		  - \`send\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.attachment.send")}
		  - \`folder\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.attachment.folder")}
		- \`dataview\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.dataview")}
		- \`hardbreak\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.hardBreak")}
		- \`includeLinks\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.includeLinks")} \`[[markdown]]\` ${i18next.t("common.or")} \`[](markdown)\`
		- \`shortRepo\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.shortRepo")}
		- \`repo\`${i18next.t("common.points")}
		  - \`owner\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.repo.owner")}
		  - \`repo\`${i18next.t("common.points")}${i18next.t("settings.github.repoName.title")}
		  - \`branch\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.repo.branch")}
		  - \`autoclean\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.autoclean")}
		- \`${settings.upload.frontmatterTitle.key}\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.titleKey")}
		- \`baseLink\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.baselink.desc")} \`copylink:\`
		  - \`base\`${i18next.t("common.points")}${i18next.t("settings.plugin.copyLink.baselink.title")}
		  - \`remove\`${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.baselink.remove")}
	`);
}

/**
 * Markdown list of useful external links for the help page.
 */
export function usefulLinksMarkdown(): string {
	return dedent(`
		- [${DOCUMENTATION} ${i18next.t("settings.help.usefulLinks.documentation")}](${DOCUMENTATION_LINK})
		- [${GITHUB_ICON} ${i18next.t("common.repository")}](https://github.com/Enveloppe/obsidian-enveloppe)
		- [${ISSUE} ${i18next.t("settings.help.usefulLinks.issue")}](https://github.com/Enveloppe/obsidian-enveloppe/issues)
		- [${DISCUSSION_ICON} ${i18next.t("settings.help.usefulLinks.discussion")}](https://github.com/orgs/Enveloppe/discussions)
		- [${DISCORD_ICON} Discord](https://discord.gg/6DyY779Nbn)
		- [${TRANSLATION_ICON} ${i18next.t("settings.help.usefulLinks.translation")}](https://hosted.weblate.org/projects/enveloppe/locales/)
	`);
}

/**
 * Markdown explanation (with a YAML example) of the multi-repository frontmatter syntax.
 */
export function multipleRepoExplainedMarkdown(settings: EnveloppeSettings): string {
	const yaml = dedent(`
		${FENCE}yaml
		multipleRepo:
		  - owner: ${settings.github.user}
		    repo: ${settings.github.repo}
		    branch: ${settings.github.branch}
		    autoclean: false
		  - owner: sandboxingRepo
		    repo: my_second_blog
		    branch: master
		    autoclean: false
		${FENCE}
	`);
	const paragraph = dedent(`
		${i18next.t("settings.help.multiRepoHelp.desc")} \`multipleRepo\` ${i18next.t("settings.help.multiRepoHelp.desc2")}

		- \`owner\`
		- \`repo\`
		- \`branch\`
		- \`autoclean\`

		${i18next.t("settings.help.multiRepoHelp.exampleDesc")}
	`);
	return `${paragraph}\n\n${yaml}`;
}

/**
 * Ko-fi support link, kept as raw inline HTML since Markdown's image syntax
 * can't express the fixed pixel sizing.
 */
export function supportMeMarkdown(): string {
	return dedent(`
		<p style="text-align:center"><a href="https://ko-fi.com/lisandra_dev"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;"></a></p>
	`);
}
