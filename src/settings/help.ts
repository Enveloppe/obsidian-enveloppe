import { FolderSettings, type EnveloppeSettings } from "@interfaces";
import dedent from "dedent";
import i18next from "i18next";
import { normalizePath, sanitizeHTMLToDom } from "obsidian";
import { regexOnPath } from "src/conversion/file_path";
import { DISCORD_ICON, DISCUSSION_ICON, DOCUMENTATION, GITHUB_ICON, ISSUE, TRANSLATION_ICON } from "../interfaces/icons";

/**
 * Export the YAML help to create an example of yaml with the value based on the Settings
 * YAML:
 * ```yaml
 * share: true
 * path: file.md #given as an example path
 * links: 
 *   mdlinks: true
 *   convert: true
 *   internals: true
 *   nonShared: true
 * embed: 
 *   send: true
 *   remove: keep
 *   char: ->
 * attachment: 
 *   send: true
 *   folder: docs/images
 * dataview: true
 * hardBreak: false
 * includeLinks: true
 * shortRepo: test1
 * repo: 
 *   owner: sandboxingRepo
 *   repo: obsidian-sandbox
 *   branch: main
 *   autoclean: true
 * copylink: 
 *   base: https://obsidian-sandbox.github.io/obsidian-sandbox
```
*/

export function KeyBasedOnSettings(settings: EnveloppeSettings): DocumentFragment {
	const defaultPath = settings.upload.defaultName.length > 0 ? `${settings.upload.defaultName}` : "/";
	let path = settings.upload.behavior === FolderSettings.Yaml ? `${settings.upload.rootFolder.length > 0 ? settings.upload.rootFolder : ""}/${defaultPath}/file.md` : `${defaultPath}/file.md`;
	path = normalizePath(regexOnPath(path, settings));
	const rules = "token key atrule";
	const comments = "token comment";
	const str = "token string";
	const boolean = "token boolean important";
	const category = () => {
		if (settings.upload.behavior === FolderSettings.Yaml) {
			const defaultPath = settings.upload.defaultName.length > 0 ? `${settings.upload.defaultName}` : "/";
			return dedent(`
			<br><span class="${rules}">${settings.upload.yamlFolderKey.length > 0 ? `${settings.upload.yamlFolderKey}: ` : "category: "}</span><span class="${str}">${normalizePath(defaultPath)}</span>
			`);
		}
		return "";
	};
	let html = dedent(`<code><span class="${rules}">${settings.plugin.shareKey}</span>: <span class="${boolean}">true</span>${category()}
		<span class="${rules}">path</span>: <span class="${str}"> file.md</span><span class="${comments}"> # given as an example path</span>
		<span class="${rules}">links</span>:
		<span class="${rules}">  mdlinks</span>: <span class="${boolean}">${settings.conversion.links.wiki}</span>
		<span class="${rules}">  convert</span>: <span class="${boolean}">true</span>
		<span class="${rules}">  internals</span>: <span class="${boolean}">${settings.conversion.links.internal}</span>
		<span class="${rules}">  nonShared</span>: <span class="${boolean}">${settings.conversion.links.unshared}</span>
		<span class="${rules}">embed</span>:
		<span class="${rules}">  send</span>: <span class="${boolean}">${settings.embed.notes}</span>
		<span class="${rules}">  remove</span>: <span class="${str}">${settings.embed.convertEmbedToLinks}</span>
		<span class="${rules}">  char</span>: <span class="${str}">${settings.embed.charConvert}</span>
		<span class="${rules}">attachment</span>:
		<span class="${rules}">  send</span>: <span class="${boolean}">${settings.embed.attachments}</span>
		<span class="${rules}">  folder</span>: <span class="${str}">${settings.embed.folder}</span>
		<span class="${rules}">dataview</span>: <span class="${boolean}">${settings.conversion.dataview}</span>
		<span class="${rules}">hardBreak</span>: <span class="${boolean}">${settings.conversion.hardbreak}</span>
		<span class="${rules}">includeLinks</span>: <span class="${boolean}">${settings.embed.sendSimpleLinks}</span>
	`);
	if (settings.github.otherRepo.length > 0) {
		const smartkey = settings.github.otherRepo[0].smartKey.length > 0 ? settings.github.otherRepo[0].smartKey : "smartkey";
		html += dedent(`<br><span class="${rules}">shortRepo</span>: <span class="${str}">${smartkey}</span>`);
	}
	html += dedent(`<br><span class="${rules}">repo</span>:
		<span class="${rules}">  owner</span>: <span class="${str}">${settings.github.user}</span>
		<span class="${rules}">  repo</span>: <span class="${str}">${settings.github.repo}</span>
		<span class="${rules}">  branch</span>: <span class="${str}">${settings.github.branch}</span>
		<span class="${rules}">  autoclean</span>: <span class="${boolean}">${settings.upload.autoclean.enable}</span>
		<span class="${rules}">copylink</span>:
		<span class="${rules}">  base</span>: <span class="${str}">${settings.plugin.copyLink.links.length > 0 ? settings.plugin.copyLink.links : `https://${settings.github.repo}.github.io/${settings.github.repo}`}</span>
	`);
	const removePart = settings.plugin.copyLink.removePart.map((val) => `"${val}"`).join(", ");
	if (removePart.length > 0) {
		html += dedent(`<span class="${rules}">  remove</span>: <span class="${str}">${removePart}</span>`);
	}
	html += "</code>";
	return sanitizeHTMLToDom(html);
}

/**
 * Create the contents of the help settings tab
 */
export function help(settings: EnveloppeSettings) {
	const els = dedent(`
		<ul>
			<li><code class="code-title">${settings.plugin.shareKey}</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.share.title")}
			<ol>${i18next.t("settings.help.frontmatter.share.other")}</ol>
			<li><code class="code-title">path</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.path")}</li>
			<li><code class="code-title">links</code>${i18next.t("common.points")}
				<ul>
					<li><code>mdlinks</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.mdlinks")} <code>[[markdown|alias]]</code>${i18next.t("common.in")} <code>[alias](markdown)</code></li>
					<li><code>convert</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.convert.enableOrDisable")} <code>[[link]]</code>${i18next.t("common.or")} <code>[](link)</code>${i18next.t("settings.help.frontmatter.convert.syntax")}</li>
					<li><code>internals</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.internals")}</li>
					<li><code>nonShared</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.nonShared")}</li>
				</ul>
			</li>
			<li><code class="code-title">embed</code>${i18next.t("common.points")}
				<ul>
					<li><code>send</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.send")}</li>
					<li><code>remove</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.desc")}
						<ul>
							<li><code>remove | true</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.remove")}</li>
							<li><code>keep | false</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.keep")}</li>
							<li><code>links</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.links")}</li>
							<li><code>bake</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.remove.bake")}</li>
						</ul>
					</li>
					<li><code>char</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.embed.char")}</li>
				</ul>
			</li>
			<li><code class="code-title">attachment</code>${i18next.t("common.points")}
				<ul>
					<li><code>send</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.attachment.send")}</li>
					<li><code>folder</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.attachment.folder")}</li>
				</ul>
			</li>
			<li><code class="code-title">dataview</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.dataview")}</li>
			<li><code class="code-title">hardbreak</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.hardBreak")}</li>
			<li><code class="code-title">includeLinks</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.includeLinks")} <code>[[markdown]]</code> ${i18next.t("common.or")} <code>[](markdown)</code></li>
			<li><code class="code-title">shortRepo</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.shortRepo")}</li>
			<li><code class="code-title">repo</code>${i18next.t("common.points")}
				<ul>
					<li><code>owner</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.repo.owner")}</li>
					<li><code>repo</code>${i18next.t("common.points")}${i18next.t("settings.github.repoName.title")}</li>
					<li><code>branch</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.repo.branch")}</li>
					<li><code>autoclean</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.autoclean")}</li>
				</ul>
			</li>
			<li><code class="code-title">${settings.upload.frontmatterTitle.key}</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.titleKey")}</li>
			<li><code class="code-title">baseLink</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.baselink.desc")}
				<code class="code-title">copylink:</code>
				<ul>
					<li><code>base</code>${i18next.t("common.points")}${i18next.t("settings.plugin.copyLink.baselink.title")}</li>
					<li><code>remove</code>${i18next.t("common.points")}${i18next.t("settings.help.frontmatter.baselink.remove")}</li>
				</ul>
			</li>
		</ul>
	`);
	return sanitizeHTMLToDom(els);
}

/**
 * Create the useful links section in the settings help tab
 * @return {DocumentFragment}
 */
export function usefulLinks(): DocumentFragment {
	const els = dedent(`
		<ul>
			<a href=${i18next.t("settings.help.usefulLinks.links")}>${DOCUMENTATION} ${i18next.t("settings.help.usefulLinks.documentation")}</a><br>
			<a href="https://github.com/Enveloppe/obsidian-enveloppe">${GITHUB_ICON} ${i18next.t("common.repository")}</a><br>
			<a href="https://github.com/Enveloppe/obsidian-enveloppe/issues">${ISSUE} ${i18next.t("settings.help.usefulLinks.issue")}</a><br>
			<a href="https://github.com/orgs/Enveloppe/discussions">${DISCUSSION_ICON} ${i18next.t("settings.help.usefulLinks.discussion")}</a><br>
			<a href="https://discord.gg/6DyY779Nbn">${DISCORD_ICON} Discord</a><br>
			<a href="https://hosted.weblate.org/projects/enveloppe/locales/">${TRANSLATION_ICON} ${i18next.t("settings.help.usefulLinks.translation")}</a><br>
		</ul>
	`);
	return sanitizeHTMLToDom(els);
}

/**
 * Create the explanation of multiple repo for the help tab
 * ```yaml
 * multipleRepo:
 * - owner: sandboxingRepo
 *    repo: obsidian-sandbox
 *    branch: main
 *    autoclean: false
 *  - owner: sandboxingRepo
 *    repo: my_second_blog
 *    branch: master
 *    autoclean: false
 * ```
 * @param {EnveloppeSettings} settings
 * @return {DocumentFragment}
 */
export function multipleRepoExplained(settings: EnveloppeSettings): DocumentFragment {
	const rules = "token key atrule";
	const comments = "token comment";
	const str = "token string";
	const yaml = dedent(`<pre class="language-yaml"><code class="language-yaml"><span class="${rules}">multipleRepo</span>:
	 <span class="${rules}">  - owner</span>: <span class="${str}">${settings.github.user}</span>
	 <span class="${rules}">    repo</span>: <span class="${str}">${settings.github.repo}</span>
	 <span class="${rules}">    branch</span>: <span class="${str}">${settings.github.branch}</span>
	 <span class="${rules}">    autoclean</span>: <span class="${comments}">false</span>
	 <span class="${rules}">  - owner</span>: <span class="${str}">sandboxingRepo</span>
	 <span class="${rules}">    repo</span>: <span class="${str}">my_second_blog</span>
	 <span class="${rules}">    branch</span>: <span class="${str}">master</span>
	 <span class="${rules}">    autoclean</span>: <span class="${comments}">false</span>
	</code></pre>`);
	const paragraph = dedent(`
		<span>${i18next.t("settings.help.multiRepoHelp.desc")} <code>multipleRepo</code> ${i18next.t("settings.help.multiRepoHelp.desc2")}<ul>
			<li><code>owner</code></li>
			<li><code>repo</code></li>
			<li><code>branch</code></li>
			<li><code>autoclean</code></li>
		</ul>${i18next.t("settings.help.multiRepoHelp.exampleDesc")}</span>
	`);
	return sanitizeHTMLToDom(paragraph + yaml);
}

/**
 * Add the link for kofi in the help tab
 * <a href="https://ko-fi.com/lisandra_dev"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;"></a>
 * @return {DocumentFragment}
 */

export function supportMe(): DocumentFragment {
	const supportMe = dedent(`<p style="text-align:center"><a href="https://ko-fi.com/lisandra_dev"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;"></a></p>
	`);
	return sanitizeHTMLToDom(supportMe);
}
