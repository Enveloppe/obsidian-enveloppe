import { GitHubPublisherSettings } from "./interface";
import { subSettings } from "../i18n";

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
				text: `${settings.shareKey}:`,
				cls: "code-title",
			});
			span.createEl("span", {
				text: ` ${subSettings("help.frontmatter.share") as string}`,
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
						subSettings("help.frontmatter.mdlinks") as string
					}`,
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "convert" });
				p.createEl("span", null, (span) => {
					span.createEl("span", {
						text: `: ${
							subSettings(
								"help.frontmatter.convert.enableOrDisable"
							) as string
						} `,
					});
					span.createEl("code", { text: " [[link]] " });
					span.createEl("span", {
						text: subSettings(
							"help.frontmatter.convert.or"
						) as string,
					});
					span.createEl("code", { text: " [](link) " });
					span.createEl("span", {
						text: subSettings(
							"help.frontmatter.convert.syntax"
						) as string,
					});
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", {text: "internals"});
				p.createEl("span", {
					text: `: ${subSettings("help.frontmatter.internals") as string}`
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "nonShared" });
				p.createEl("span", { text: `: ${subSettings("help.frontmatter.nonShared") as string}` });
			});
		});
		span.createEl("li", { text: "embed:", cls: "code code-title" });
		span.createEl("ul", null, (l) => {
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "send" });
				p.createEl("span", {
					text: `: ${
						subSettings("help.frontmatter.embed.send") as string
					}`,
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "remove" });
				p.createEl("span", {
					text: `: ${
						subSettings("help.frontmatter.embed.remove") as string
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
						subSettings(
							"help.frontmatter.attachment.send"
						) as string
					}`,
				});
			});
			l.createEl("li", null, (p) => {
				p.createEl("code", { text: "folder" });
				p.createEl("span", {
					text: `: ${
						subSettings(
							"help.frontmatter.attachment.folder"
						) as string
					}`,
				});
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "dataview", cls: "code-title" });
			span.createEl("span", {
				text: `: ${subSettings("help.frontmatter.dataview") as string}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "hardbreak", cls: "code-title" });
			span.createEl("span", {
				text: `: ${
					subSettings("help.frontmatter.hardBreak") as string
				}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "repo", cls: "code-title" });
			span.createEl("span", {
				text: `: ${subSettings("help.frontmatter.repo.desc")}`,
			});
			span.createEl("ul", null, (ul) => {
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "owner" });
					li.createEl("span", {
						text: `: ${subSettings("help.frontmatter.repo.owner")}`,
					});
				});
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "repo" });
					li.createEl("span", {
						text: `: ${subSettings("help.frontmatter.repo.repo")}`,
					});
				});
				ul.createEl("li", null, (li) => {
					li.createEl("code", { text: "branch" });
					li.createEl("span", {
						text: `: ${subSettings(
							"help.frontmatter.repo.branch"
						)}`,
					});
				});
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", {
				text: `${settings.frontmatterTitleKey}`,
				cls: "code-title",
			});
			span.createEl("span", {
				text: `: ${subSettings("help.frontmatter.titleKey")}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "autoclean", cls: "code-title" });
			span.createEl("span", {
				text: `: ${subSettings("help.frontmatter.autoclean")}`,
			});
		});
		span.createEl("li", null, (span) => {
			span.createEl("code", { text: "baseLink:", cls: "code-title" });
			span.createEl("span", {
				text: `: ${subSettings("help.frontmatter.baselink")}`,
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
				text: subSettings("help.usefulLinks.documentation") as string,
				href: subSettings("help.usefulLinks.links") as string,
			});
		});
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: subSettings("help.usefulLinks.repository") as string,
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher",
			});
		});
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: subSettings("help.usefulLinks.issue") as string,
				href: "https://github.com/ObsidianPublisher/obsidian-github-publisher/issues",
			});
		});
		el.createEl("li", null, (el) => {
			el.createEl("a", {
				text: subSettings("help.usefulLinks.discussion") as string,
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
			text: subSettings("help.multiRepoHelp.desc") as string,
		});
		el.createEl("code", { text: "multipleRepo" });
		el.createEl("span", {
			text: ` ${subSettings("help.multiRepoHelp.desc2") as string}:`,
		});
		el.createEl("ul", null, (el) => {
			el.createEl("li", { text: "owner" }).addClass("code");
			el.createEl("li", { text: "repo" }).addClass("code");
			el.createEl("li", { text: "branch" }).addClass("code");
		});
		el.createEl("span", {
			text: subSettings("help.multiRepoHelp.exampleDesc") as string,
		});
	});
	multipleRepoExplained
		.createEl("pre", { cls: "language-yaml" })
		.createEl("code", {
			text: `multipleRepo:\n  - owner: ${settings.githubName}\n    repo: ${settings.githubRepo}\n    branch: ${settings.githubBranch}\n  - owner: ${settings.githubName}\n    repo: my_second_brain\n    branch: master\n    autoclean: false`,
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
