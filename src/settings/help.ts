import i18next from "i18next";

import {FolderSettings, GitHubPublisherSettings} from "./interface";


/**
 * Export the YAML help to create an example of yaml with the value based on the Settings
 * @param {GitHubPublisherSettings} settings
 * @return {string}
 */

export function KeyBasedOnSettings(settings: GitHubPublisherSettings) {
	let category = "";
	if (settings.upload.behavior === FolderSettings.yaml) {
		category = `${settings.upload.yamlFolderKey}: ${settings.upload.defaultName}\n`;
	}
	const shortRepo = settings.github.otherRepo.length > 0 ? "shortRepo: " + settings.github.otherRepo[0].smartKey +"\n" : "";
	return `${settings.plugin.shareKey}: true\n` + category +
	"links:\n" +
	`  mdlinks: ${settings.conversion.links.wiki}\n` +
	"  convert: true\n" +
	`  internals: ${settings.conversion.links.internal}\n` +
	`  nonShared: ${settings.conversion.links.unshared}\n` +
	"embed:\n" +
	`  send: ${settings.embed.notes}\n` +
	"  remove: false\n" +
	"attachment:\n" +
	`  send: ${settings.embed.attachments}\n` +
	`  folder: ${settings.embed.folder}\n` +
	`dataview: ${settings.conversion.dataview}\n` +
	`hardBreak: ${settings.conversion.hardbreak}\n` +
	shortRepo +
	"repo:\n" +
	`  owner: ${settings.github.user}\n` +
	`  repo: ${settings.github.repo}\n` +
	`  branch: ${settings.github.branch}\n` +
	`  autoclean: ${settings.upload.autoclean.enable}\n` +
	"copylink:\n" +
	`  base: ${settings.plugin.copyLink.links}\n` +
	`  remove: [${settings.plugin.copyLink.removePart.map(val => `"${val}"`).join(", ")}]\n`;
}

/**
 * Create the contents of the help settings tab
 * @param {GitHubPublisherSettings} settings
 * @return {DocumentFragment}
 */
export function help(settings: GitHubPublisherSettings) {
	const explanation = document.createDocumentFragment();
	explanation.createEl("ul", null, (span) => {
		span.createEl("li", null, (span) => {
			span.createEl("code", {
				text: `${settings.plugin.shareKey}:`,
				cls: "code-title",
			});
			span.createEl("span", {
				text: `${i18next.t("settings.help.frontmatter.share.title")}`,
			});
			span.createEl("ul", null, (l) => {
				l.createEl("span", {text: i18next.t("settings.help.frontmatter.share.other")});
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", {
				text: "path:",
				cls: "code-title",
			});
			span.createEl("span", {
				text: ` ${i18next.t("settings.help.frontmatter.path")}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "links:", cls: "code-title" });
		});
		span.createEl("ul", null, (l) => {
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "mdlinks" });
				p.createEl("span", {
					text: `: ${
						i18next.t("settings.help.frontmatter.mdlinks")
					}`,
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "convert" });
				p.createEl("span", null, (span) => {
					span.createEl("span", {
						text: `: ${
							i18next.t(
								"settings.help.frontmatter.convert.enableOrDisable"
							) 
						} `,
					});
					span.createEl("code", { text: " [[link]] " });
					span.createEl("span", {
						text: i18next.t("common.or")
					});
					span.createEl("code", { text: " [](link) " });
					span.createEl("span", {
						text: i18next.t("settings.help.frontmatter.convert.syntax")
					});
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", {text: "internals"});
				p.createEl("span", {
					text: `: ${i18next.t("settings.help.frontmatter.internals")}`
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "nonShared" });
				p.createEl("span", { text: `: ${i18next.t("settings.help.frontmatter.nonShared")}` });
			});
		});
		span.createEl("li", { text: "embed:", cls: "code code-title" });
		span.createEl("ul", null, (l) => {
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "send" });
				p.createEl("span", {
					text: `: ${
						i18next.t("settings.help.frontmatter.embed.send")
					}`,
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "remove" });
				p.createEl("span", {
					text: `: ${
						i18next.t("settings.help.frontmatter.embed.remove")
					}`,
				});
			});
		});
		span.createEl("li", { text: "attachment:", cls: "code code-title" });
		span.createEl("ul", null, (l) => {
			l.createEl("li", null, (span) => {
				span.createEl("code", { text: "send" });
				span.createEl("span", {
					text: `: ${
						i18next.t(
							"settings.help.frontmatter.attachment.send"
						) 
					}`,
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "folder" });
				p.createEl("span", {
					text: `: ${
						i18next.t(
							"settings.help.frontmatter.attachment.folder"
						) 
					}`,
				});
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "dataview", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.dataview")}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "hardbreak", cls: "code-title" });
			span.createEl("span", {
				text: `: ${
					i18next.t("settings.help.frontmatter.hardBreak")
				}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "shortRepo", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.shortRepo")}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "repo", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.repo.desc")}`,
			});
			span.createEl("ul", null, (ul) => {
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "owner" });
					li.createEl("span", {
						text: `: ${i18next.t("settings.help.frontmatter.repo.owner")}`,
					});
				});
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "repo" });
					li.createEl("span", {
						text: `: ${i18next.t("settings.github.repoName.title")}`,
					});
				});
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "branch" });
					li.createEl("span", {
						text: `: ${i18next.t(
							"settings.help.frontmatter.repo.branch"
						)}`,
					});
				});
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "autoclean"});
					li.createEl("span", {
						text: `: ${i18next.t("settings.help.frontmatter.autoclean")}`,
					});
				});
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", {
				text: `${settings.upload.frontmatterTitle.key}`,
				cls: "code-title",
			});
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.titleKey")}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "baseLink", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.baselink.desc")}`,
			});
			span.createEl("code", {text: "copylink:", cls: "code-title"});
			span.createEl("ul", null, (ul) => {
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "base"});
					li.createEl("span", {
						text: `: ${i18next.t("settings.plugin.copyLink.baselink.title")}`,
					});
				});
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "remove"});
					li.createEl("span", {
						text: `: ${i18next.t("settings.help.frontmatter.baselink.remove")}`,
					});
				});
			});
		});
	});
	return explanation;
}

/**
 * Create the useful links section in the settings help tab
 * @return {DocumentFragment}
 */
export function usefullLinks(): DocumentFragment {
	const usefullLinks = document.createDocumentFragment();
	usefullLinks.createEl("ul", null, (el) => {
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: i18next.t("settings.help.usefulLinks.documentation"),
				href: i18next.t("settings.help.usefulLinks.links"),
			});
		});
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: i18next.t("common.repository"),
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher",
			});
		});
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: i18next.t("settings.help.usefulLinks.issue"),
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher/issues",
			});
		});
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: i18next.t("settings.help.usefulLinks.discussion"),
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher/discussions",
			});
		});
	});
	return usefullLinks;
}

/**
 * Create the explanation of multiple repo for the help tab
 * @param {GitHubPublisherSettings} settings
 * @return {DocumentFragment}
 */
export function multipleRepoExplained(
	settings: GitHubPublisherSettings
): DocumentFragment {
	const multipleRepoExplained = document.createDocumentFragment();
	multipleRepoExplained.createEl("p", null, (el) => {
		el.createEl("span", {
			text: i18next.t("settings.help.multiRepoHelp.desc"),
		});
		el.createEl("code", { text: "multipleRepo" });
		el.createEl("span", {
			text: ` ${i18next.t("settings.help.multiRepoHelp.desc2")}:`,
		});
		el.createEl("ul", null, (el) => {
			el.createEl("li", { text: "owner" }).addClass("code");
			el.createEl("li", { text: "repo" }).addClass("code");
			el.createEl("li", { text: "branch" }).addClass("code");
			el.createEl("li", { text: "autoclean" }).addClass("code");
		});
		el.createEl("span", {
			text: i18next.t("settings.help.multiRepoHelp.exampleDesc"),
		});
	});
	multipleRepoExplained
		.createEl("pre", { cls: "language-yaml" })
		.createEl("code", {
			text: `multipleRepo:\n  - owner: ${settings.github.user}\n    repo: ${settings.github.repo}\n    branch: ${settings.github.branch}\n    autoclean: false\n  - owner: ${settings.github.user}\n    repo: my_second_brain\n    branch: master\n    autoclean: false`,
			cls: "language-yaml",
		});
	return multipleRepoExplained;
}

/**
 * Add the link for kofi in the help tab
 * @return {DocumentFragment}
 */

export function supportMe(): DocumentFragment {
	const supportMe = document.createDocumentFragment();
	supportMe.createEl("p", null, (el) => {
		el.createEl("a", null, (el) => {
			el.createEl("img", null, (img) => {
				img.setAttr(
					"src",
					"https://storage.ko-fi.com/cdn/kofi2.png?v=3"
				);
				img.setAttr("alt", "Buy Me A Coffee");
				img.setAttr(
					"style",
					"height: 60px !important;width: 217px !important;"
				);
			});
			el.setAttr("href", "https://ko-fi.com/lisandra_dev");
		});
		el.setAttr("style", "text-align: center;");
	});
	return supportMe;
}
