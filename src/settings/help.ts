import i18next from "i18next";
import { normalizePath } from "obsidian";

import {regexOnPath} from "../conversion/file_path";
import {FolderSettings, GitHubPublisherSettings} from "./interface";

function spanAtRule(text: string, code: DocumentFragment, br: boolean = true): HTMLElement {
	if (br) code.createEl("br");
	return code.createEl("span", {text, cls: ["token", "key", "atrule"]});
}

function spanBoolean(text: boolean, code: DocumentFragment): HTMLElement {
	const textToString = text ? "true" : "false" ;
	return code.createEl("span", { text:textToString, cls: ["token", "boolean", "important"]});
}

function spanComment(text: string, code: DocumentFragment): HTMLElement {
	return code.createEl("span", {text, cls: ["token", "comment"]});
}

function spanString(text: string, code: DocumentFragment): HTMLElement {
	return code.createEl("span", {text, cls: ["token", "string"]});
}

function spanCategory(settings: GitHubPublisherSettings, code: DocumentFragment) {
	if (settings.upload.behavior === FolderSettings.yaml) {
		const defaultPath = settings.upload.defaultName.length > 0 ? `${settings.upload.defaultName}` : "/";
		return {
			rule: spanAtRule(settings.upload.yamlFolderKey.length > 0 ? `${settings.upload.yamlFolderKey}: ` : "category: ", code),
			token: spanString(normalizePath(defaultPath), code),
		};
	}
}

/**
 * Export the YAML help to create an example of yaml with the value based on the Settings
 * @param {GitHubPublisherSettings} settings
 * @return {string}
 */

export function KeyBasedOnSettings(settings: GitHubPublisherSettings): DocumentFragment {
	const code = document.createDocumentFragment();
	const defaultPath = settings.upload.defaultName.length > 0 ? `${settings.upload.defaultName}` : "/";
	let path = `${defaultPath}/file.md`;
	if (settings.upload.behavior === FolderSettings.yaml) {
		path = `${settings.upload.rootFolder.length > 0 ? settings.upload.rootFolder: ""}/${defaultPath}/file.md`;
	}
	path = normalizePath(regexOnPath(path, settings));

	spanAtRule(`${settings.plugin.shareKey}: `, code, false);
	spanBoolean(true, code);
	spanCategory(settings, code);
	spanAtRule("path: ", code);
	spanString(path, code);
	spanComment(" #given as an example path", code);
	spanAtRule("links: ", code);
	spanAtRule("  mdlinks: ", code);
	spanBoolean(settings.conversion.links.wiki, code);
	spanAtRule("  convert: ", code);
	spanBoolean(true, code);
	spanAtRule("  internals: ", code);
	spanBoolean(settings.conversion.links.internal, code);
	spanAtRule("  nonShared: ", code);
	spanBoolean(settings.conversion.links.unshared, code);
	spanAtRule("embed: ", code);
	spanAtRule("  send: ", code);
	spanBoolean(settings.embed.notes, code);
	spanAtRule("  remove: ", code);
	spanString(settings.embed.convertEmbedToLinks, code);
	spanAtRule("  char: ", code);
	spanString(settings.embed.charConvert, code);
	spanAtRule("attachment: ", code);
	spanAtRule("  send: ", code);
	spanBoolean(settings.embed.attachments, code);
	spanAtRule("  folder: ", code);
	spanString(settings.embed.folder, code);
	spanAtRule("dataview: ", code);
	spanBoolean(settings.conversion.dataview, code);
	spanAtRule("hardBreak: ", code);
	spanBoolean(settings.conversion.hardbreak, code);
	if (settings.github.otherRepo.length > 0) {
		spanAtRule("shortRepo: ", code);
		spanString(settings.github.otherRepo[0].smartKey.length > 0 ? settings.github.otherRepo[0].smartKey : "smartkey", code);
	}
	spanAtRule("repo: ", code);
	spanAtRule("  owner: ", code);
	spanString(settings.github.user, code);
	spanAtRule("  repo: ", code);
	spanString(settings.github.repo, code);
	spanAtRule("  branch: ", code);
	spanString(settings.github.branch, code);
	spanAtRule("  autoclean: ", code);
	spanBoolean(settings.upload.autoclean.enable, code);
	spanAtRule("copylink: ", code);
	spanAtRule("  base: ", code);
	spanString(settings.plugin.copyLink.links.length > 0 ? settings.plugin.copyLink.links : `https://${settings.github.repo}.github.io/${settings.github.repo}` , code);
	const removePart = settings.plugin.copyLink.removePart.map(val => `"${val}"`).join(", ");
	if (removePart.length > 0) {
		spanAtRule("  remove: ", code);
		spanString(removePart, code);
	}
	return code;
}

/**
 * Create the contents of the help settings tab
 * @param {GitHubPublisherSettings} settings
 * @return {DocumentFragment}
 */
export function help(settings: GitHubPublisherSettings) {
	const explanation = document.createDocumentFragment();
	explanation.createEl("ul", undefined, (span) => {
		span.createEl("li", undefined, (span) => {
			span.createEl("code", {
				text: `${settings.plugin.shareKey}:`,
				cls: "code-title",
			});
			span.createEl("span", {
				text: `${i18next.t("settings.help.frontmatter.share.title")}`,
			});
			span.createEl("ul", undefined, (l) => {
				l.createEl("span", {text: i18next.t("settings.help.frontmatter.share.other")});
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", {
				text: "path:",
				cls: "code-title",
			});
			span.createEl("span", {
				text: ` ${i18next.t("settings.help.frontmatter.path")}`,
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", { text: "links:", cls: "code-title" });
		});
		span.createEl("ul", undefined, (l) => {
			l.createEl("li", undefined, (p) => {
				p.createEl("code", { text: "mdlinks" });
				p.createEl("span", {
					text: `: ${
						i18next.t("settings.help.frontmatter.mdlinks")
					}`,
				});
			});
			l.createEl("li", undefined, (p) => {
				p.createEl("code", { text: "convert" });
				p.createEl("span", undefined, (span) => {
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
			l.createEl("li", undefined, (p) => {
				p.createEl("code", {text: "internals"});
				p.createEl("span", {
					text: `: ${i18next.t("settings.help.frontmatter.internals")}`
				});
			});
			l.createEl("li", undefined, (p) => {
				p.createEl("code", { text: "nonShared" });
				p.createEl("span", { text: `: ${i18next.t("settings.help.frontmatter.nonShared")}` });
			});
		});
		span.createEl("li", { text: "embed:", cls: "code code-title" });
		span.createEl("ul", undefined, (l) => {
			l.createEl("li", undefined, (p) => {
				p.createEl("code", { text: "send" });
				p.createEl("span", {
					text: `: ${
						i18next.t("settings.help.frontmatter.embed.send")
					}`,
				});
			});
			l.createEl("li", undefined, (p) => {
				p.createEl("code", { text: "remove" });
				p.createEl("span", {
					text: `: ${
						i18next.t("settings.help.frontmatter.embed.remove.desc")
					}`,
				});
				p.createEl("ul", undefined, (ul) => {
					ul.createEl("li", undefined, (li) => {
						li.createEl("code", {text: "remove | true"});
						li.createEl("span", {
							text: `: ${i18next.t("settings.help.frontmatter.embed.remove.remove")}`
						},
						);
					});
					ul.createEl("li", undefined, (li) => {
						li.createEl("code", {text: "keep | false"});
						li.createEl("span", {
							text: `: ${i18next.t("settings.help.frontmatter.embed.remove.keep")}`
						},
						);
					});
					ul.createEl("li", undefined, (li) => {
						li.createEl("code", {text: "links"});
						li.createEl("span", {
							text: `: ${i18next.t("settings.help.frontmatter.embed.remove.links")}`
						},
						);
					});
					ul.createEl("li", undefined, (li) => {
						li.createEl("code", {text: "bake"});
						li.createEl("span", {
							text: `: ${i18next.t("settings.help.frontmatter.embed.remove.bake")}`
						},
						);
					});
				});
			});
			l.createEl("li", undefined, (p) => {
				p.createEl("code", { text: "char" });
				p.createEl("span", {
					text: `: ${i18next.t("settings.help.frontmatter.embed.char")}`,
				});
			});
		});
		span.createEl("li", { text: "attachment:", cls: "code code-title" });
		span.createEl("ul", undefined, (l) => {
			l.createEl("li", undefined, (span) => {
				span.createEl("code", { text: "send" });
				span.createEl("span", {
					text: `: ${
						i18next.t(
							"settings.help.frontmatter.attachment.send"
						)
					}`,
				});
			});
			l.createEl("li", undefined, (p) => {
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
		span.createEl("li", undefined, (span) => {
			span.createEl("code", { text: "dataview", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.dataview")}`,
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", { text: "hardbreak", cls: "code-title" });
			span.createEl("span", {
				text: `: ${
					i18next.t("settings.help.frontmatter.hardBreak")
				}`,
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", { text: "shortRepo", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.shortRepo")}`,
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", { text: "repo", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.repo.desc")}`,
			});
			span.createEl("ul", undefined, (ul) => {
				ul.createEl("li", undefined, (li) => {
					li.createEl("code", { text: "owner" });
					li.createEl("span", {
						text: `: ${i18next.t("settings.help.frontmatter.repo.owner")}`,
					});
				});
				ul.createEl("li", undefined, (li) => {
					li.createEl("code", { text: "repo" });
					li.createEl("span", {
						text: `: ${i18next.t("settings.github.repoName.title")}`,
					});
				});
				ul.createEl("li", undefined, (li) => {
					li.createEl("code", { text: "branch" });
					li.createEl("span", {
						text: `: ${i18next.t(
							"settings.help.frontmatter.repo.branch"
						)}`,
					});
				});
				ul.createEl("li", undefined, (li) => {
					li.createEl("code", { text: "autoclean"});
					li.createEl("span", {
						text: `: ${i18next.t("settings.help.frontmatter.autoclean")}`,
					});
				});
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", {
				text: `${settings.upload.frontmatterTitle.key}`,
				cls: "code-title",
			});
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.titleKey")}`,
			});
		});
		span.createEl("li", undefined, (span) => {
			span.createEl("code", { text: "baseLink", cls: "code-title" });
			span.createEl("span", {
				text: `: ${i18next.t("settings.help.frontmatter.baselink.desc")}`,
			});
			span.createEl("code", {text: "copylink:", cls: "code-title"});
			span.createEl("ul", undefined, (ul) => {
				ul.createEl("li", undefined, (li) => {
					li.createEl("code", { text: "base"});
					li.createEl("span", {
						text: `: ${i18next.t("settings.plugin.copyLink.baselink.title")}`,
					});
				});
				ul.createEl("li", undefined, (li) => {
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
export function usefulLinks(): DocumentFragment {
	const usefulLinks = document.createDocumentFragment();
	usefulLinks.createEl("ul", undefined, (el) => {
		el.createEl("li", undefined, (el) => {
			el.createEl("a", {
				text: i18next.t("settings.help.usefulLinks.documentation"),
				href: i18next.t("settings.help.usefulLinks.links"),
			});
		});
		el.createEl("li", undefined, (el) => {
			el.createEl("a", {
				text: i18next.t("common.repository"),
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher",
			});
		});
		el.createEl("li", undefined, (el) => {
			el.createEl("a", {
				text: i18next.t("settings.help.usefulLinks.issue"),
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher/issues",
			});
		});
		el.createEl("li", undefined, (el) => {
			el.createEl("a", {
				text: i18next.t("settings.help.usefulLinks.discussion"),
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher/discussions",
			});
		});
	});
	return usefulLinks;
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
	multipleRepoExplained.createEl("p", undefined, (el) => {
		el.createEl("span", {
			text: i18next.t("settings.help.multiRepoHelp.desc"),
		});
		el.createEl("code", { text: "multipleRepo" });
		el.createEl("span", {
			text: ` ${i18next.t("settings.help.multiRepoHelp.desc2")}:`,
		});
		el.createEl("ul", undefined, (el) => {
			el.createEl("li", { text: "owner" }).addClass("code");
			el.createEl("li", { text: "repo" }).addClass("code");
			el.createEl("li", { text: "branch" }).addClass("code");
			el.createEl("li", { text: "autoclean" }).addClass("code");
		});
		el.createEl("span", {
			text: i18next.t("settings.help.multiRepoHelp.exampleDesc"),
		});
	});
	const code = document.createDocumentFragment();
	spanAtRule("multipleRepo: ", code, false);
	spanAtRule("  - owner: ", code);
	spanString(settings.github.user, code);
	spanAtRule("    repo: ", code);
	spanString(settings.github.repo, code);
	spanAtRule("    branch: ", code);
	spanString(settings.github.branch, code);
	spanAtRule("    autoclean: ", code);
	spanBoolean(false, code);
	spanAtRule("  - owner: ", code);
	spanString(settings.github.user, code);
	spanAtRule("    repo: ", code);
	spanString("my_second_blog", code);
	spanAtRule("    branch: ", code);
	spanString("master", code);
	spanAtRule("    autoclean: ", code);
	spanBoolean(false, code);
	multipleRepoExplained
		.createEl("pre", { cls: "language-yaml" })
		.createEl("code", { text: code, cls: "language-yaml" });

	return multipleRepoExplained;
}

/**
 * Add the link for kofi in the help tab
 * @return {DocumentFragment}
 */

export function supportMe(): DocumentFragment {
	const supportMe = document.createDocumentFragment();
	supportMe.createEl("p", undefined, (el) => {
		el.createEl("a", undefined, (el) => {
			el.createEl("img", undefined, (img) => {
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
