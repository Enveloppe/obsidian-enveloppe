import { GithubTiersVersion, type Repository } from "@interfaces";
import { Placeholder } from "@interfaces/enum";
import i18next from "i18next";
import {
	AbstractInputSuggest,
	Notice,
	SecretComponent,
	Setting,
	type SettingDefinitionPage,
	SettingGroup,
	SettingPage,
	type TFile,
} from "obsidian";
import type Enveloppe from "src/main";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import type { RenderContext } from "./index";

class SetClassSuggester extends AbstractInputSuggest<TFile> {
	plugin: Enveloppe;
	constructor(
		private inputEl: HTMLInputElement,
		plugin: Enveloppe,
		private onSubmit: (value: TFile) => void
	) {
		super(plugin.app, inputEl);
		this.plugin = plugin;
	}

	renderSuggestion(value: TFile, el: HTMLElement): void {
		el.setText(value.path);
	}

	getSuggestions(query: string): TFile[] {
		return this.plugin.app.vault.getFiles().filter((file) => {
			if (
				file.extension === "md" &&
				file.path.toLowerCase().contains(query.toLowerCase())
			) {
				const frontmatter = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
				if (frontmatter) return true;
			}
			return false;
		});
	}

	selectSuggestion(value: TFile, _evt: MouseEvent | KeyboardEvent): void {
		this.onSubmit(value);
		this.inputEl.value = value.path;
		this.inputEl.focus();
		this.inputEl.trigger("input");
		this.close();
	}
}

function defaultRepository(ctx: RenderContext): Repository {
	const github = ctx.settings.github;
	return {
		smartKey: `smartkey-${github.otherRepo.length}`,
		user: github.user,
		repo: github.repo,
		branch: github.branch,
		automaticallyMergePR: github.automaticallyMergePR,
		api: {
			tiersForApi: github.api.tiersForApi,
			hostname: github.api.hostname,
		},
		workflow: {
			commitMessage: github.workflow.commitMessage,
			name: "",
		},
		createShortcuts: false,
		shareKey: ctx.settings.plugin.shareKey,
		copyLink: {
			links: ctx.settings.plugin.copyLink.links,
			removePart: [],
			transform: {
				toUri: ctx.settings.plugin.copyLink.transform.toUri,
				slugify: ctx.settings.plugin.copyLink.transform.slugify,
				applyRegex: ctx.settings.plugin.copyLink.transform.applyRegex,
			},
		},
		set: null,
	};
}

/**
 * Single imperative page for the whole "manage other repositories" feature: add,
 * rename, delete, and — expanded inline rather than through navigation — a
 * repository's full settings form. An imperative page can't open another page (no
 * `addPage`/`setNavigable` exists for imperative code), so "view details" is done by
 * expanding a row in place and re-rendering this same page, instead of navigating
 * anywhere. Since every mutation (including delete/rename) only ever calls
 * `this.display()` on this one already-constructed instance, none of it depends on the
 * framework re-resolving a page by name against a rebuilt tree — the failure mode that
 * broke navigation when this used to be declarative.
 */
class ManageRepoPage extends SettingPage {
	private expanded: Repository | null = null;

	constructor(private ctx: RenderContext) {
		super();
	}

	display(): void {
		const { ctx } = this;
		const github = ctx.settings.github;
		this.containerEl.empty();
		this.containerEl.addClass("enveloppe");

		this.containerEl.createEl("p", {
			text: i18next.t("settings.github.smartRepo.modals.frontmatterInfo"),
		});
		this.containerEl.createEl("p", {
			text: i18next.t("settings.plugin.shareKey.otherRepo"),
		});

		const group = new SettingGroup(this.containerEl)
			.setHeading(i18next.t("settings.github.smartRepo.modals.newRepo"))
			.addExtraButton((button) => {
				button.setIcon("plus").onClick(() => {
					void (async () => {
						const repo = defaultRepository(ctx);
						github.otherRepo.push(repo);
						await ctx.plugin.saveSettings();
						this.expanded = null;
						this.display();
					})();
				});
			});

		for (const repo of github.otherRepo) {
			if (this.expanded && this.expanded !== repo) continue;
			group.addSetting((setting) => {
				let draft = repo.smartKey;
				setting
					.setNoInfo()
					.addText((text) => {
						text
							.setPlaceholder(Placeholder.Smartkey)
							.setValue(repo.smartKey)
							.onChange((value) => {
								draft = value.toLowerCase();
							});
						text.inputEl.addEventListener("blur", () => {
							void (async () => {
								if (draft === repo.smartKey) return;
								const duplicate = github.otherRepo.some(
									(r) => r !== repo && r.smartKey === draft
								);
								if (draft.length === 0 || draft === "default" || duplicate) {
									new Notice(
										i18next.t(
											duplicate
												? "settings.github.smartRepo.modals.duplicate"
												: draft === "default"
													? "settings.github.smartRepo.modals.default"
													: "settings.github.smartRepo.modals.empty"
										),
										ctx.settings.plugin.noticeLength
									);
									text.setValue(repo.smartKey);
									return;
								}
								repo.smartKey = draft;
								await ctx.plugin.saveSettings();
								this.display();
							})();
						});
					})
					.addExtraButton((button) => {
						button
							.setIcon(this.expanded === repo ? "chevron-down" : "chevron-right")
							.setTooltip(i18next.t("common.edit", { things: repo.smartKey }))
							.onClick(() => {
								this.expanded = this.expanded === repo ? null : repo;
								this.display();
							});
					})
					.addExtraButton((button) => {
						button
							.setIcon("trash")
							.setTooltip(i18next.t("common.delete", { things: repo.smartKey }))
							.onClick(() => {
								void (async () => {
									github.otherRepo.splice(github.otherRepo.indexOf(repo), 1);
									if (this.expanded === repo) this.expanded = null;
									await ctx.plugin.saveSettings();
									await ctx.plugin.reloadCommands();
									this.display();
								})();
							});
					});
			});

			if (this.expanded === repo) {
				const details = this.containerEl.createDiv({ cls: "enveloppe-repo-details" });
				this.renderRepositoryDetails(details, repo);
			}
		}
	}

	private renderRepositoryDetails(containerEl: HTMLElement, repo: Repository): void {
		const { ctx } = this;
		const save = () => ctx.plugin.saveSettings();

		new Setting(containerEl)
			.setName(i18next.t("settings.github.apiType.title"))
			.setDesc(i18next.t("settings.github.apiType.desc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption(
						GithubTiersVersion.Free,
						i18next.t("settings.github.apiType.dropdown.free")
					)
					.addOption(
						GithubTiersVersion.Entreprise,
						i18next.t("settings.github.apiType.dropdown.enterprise")
					)
					.setValue(repo.api.tiersForApi)
					.onChange(async (value) => {
						repo.api.tiersForApi = value as GithubTiersVersion;
						await save();
						this.display();
					});
			});

		if (repo.api.tiersForApi === GithubTiersVersion.Entreprise) {
			new Setting(containerEl)
				.setName(i18next.t("settings.github.apiType.hostname.title"))
				.setDesc(i18next.t("settings.github.apiType.hostname.desc"))
				.addText((text) =>
					text
						.setPlaceholder("https://github.mycompany.com")
						.setValue(repo.api.hostname)
						.onChange(async (value) => {
							repo.api.hostname = value.trim();
							await save();
						})
				);
		}

		new Setting(containerEl)
			.setName(i18next.t("settings.github.username.title"))
			.setDesc(i18next.t("settings.github.username.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18next.t("settings.github.username.title"))
					.setValue(repo.user)
					.onChange(async (value) => {
						repo.user = value.trim();
						await save();
					})
			);

		new Setting(containerEl)
			.setName(i18next.t("settings.github.repoName.title"))
			.setDesc(i18next.t("settings.github.repoName.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18next.t("settings.github.repoName.placeholder"))
					.setValue(repo.repo)
					.onChange(async (value) => {
						repo.repo = value.trim();
						await save();
					})
			);

		new Setting(containerEl)
			.setName(i18next.t("settings.github.branch.title"))
			.setDesc(i18next.t("settings.github.branch.desc"))
			.addText((text) =>
				text
					.setPlaceholder(Placeholder.Main)
					.setValue(repo.branch)
					.onChange(async (value) => {
						repo.branch = value.trim();
						await save();
					})
			);

		const descGhToken = createFragment();
		descGhToken.createSpan(undefined, (span) => {
			span.innerText = i18next.t("settings.github.ghToken.desc");
			span.createEl("a", undefined, (link) => {
				link.innerText = `${i18next.t("common.here")}.`;
				link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		});
		new Setting(containerEl)
			.setName(i18next.t("common.ghToken"))
			.setDesc(descGhToken)
			.addComponent((el) =>
				new SecretComponent(ctx.app, el)
					.setValue(repo.tokenSecret ?? ctx.settings.github.tokenSecret)
					.onChange(async (value) => {
						repo.tokenSecret = value;
						await save();
					})
			);

		new Setting(containerEl)
			.setName(i18next.t("settings.github.automaticallyMergePR"))
			.addToggle((toggle) =>
				toggle.setValue(repo.automaticallyMergePR).onChange(async (value) => {
					repo.automaticallyMergePR = value;
					await save();
				})
			);

		new Setting(containerEl).setClass("no-display").addButton((button) =>
			button
				.setButtonText(i18next.t("settings.github.testConnection"))
				.setClass("connect-button")
				.onClick(async () => {
					const octokit = await ctx.plugin.reloadOctokit(repo.smartKey);
					repo.verifiedRepo = await checkRepositoryValidity(octokit, repo, null);
					ctx.settings.github.rateLimit = await verifyRateLimitAPI(
						octokit.octokit,
						ctx.plugin
					);
					await save();
				})
		);

		new Setting(containerEl)
			.setName(i18next.t("settings.github.smartRepo.modals.shortcuts.title"))
			.setDesc(i18next.t("settings.github.smartRepo.modals.shortcuts.desc"))
			.addToggle((toggle) =>
				toggle.setValue(repo.createShortcuts).onChange(async (value) => {
					repo.createShortcuts = value;
					await save();
				})
			);

		containerEl.createEl("h3", { text: "GitHub workflow" });

		new Setting(containerEl)
			.setName(i18next.t("settings.githubWorkflow.prRequest.title"))
			.setDesc(i18next.t("settings.githubWorkflow.prRequest.desc"))
			.addText((text) =>
				text
					.setPlaceholder(Placeholder.Merge)
					.setValue(repo.workflow.commitMessage)
					.onChange(async (value) => {
						if (value.trim().length === 0) {
							value = Placeholder.Merge;
							new Notice(
								i18next.t("settings.githubWorkflow.prRequest.error"),
								ctx.settings.plugin.noticeLength
							);
						}
						repo.workflow.commitMessage = value;
						await save();
					})
			);

		new Setting(containerEl)
			.setName(i18next.t("settings.githubWorkflow.githubAction.title"))
			.setDesc(i18next.t("settings.githubWorkflow.githubAction.desc"))
			.addText((text) => {
				text
					.setPlaceholder(Placeholder.Ci)
					.setValue(repo.workflow.name)
					.onChange(async (value) => {
						if (value.length > 0) {
							value = value.trim();
							const yamlEndings = [".yml", ".yaml"];
							if (!yamlEndings.some((ending) => value.endsWith(ending))) {
								value += yamlEndings[0];
							}
						}
						repo.workflow.name = value;
						await save();
					});
			});

		containerEl.createEl("h3", {
			text: i18next.t("settings.github.smartRepo.modals.otherConfig"),
		});

		new Setting(containerEl)
			.setName(i18next.t("settings.plugin.setImport.title"))
			.setDesc(i18next.t("settings.plugin.setImport.desc"))
			.addSearch((search) => {
				search.setValue(repo.set ?? "").setPlaceholder("path/to/file.md");
				new SetClassSuggester(search.inputEl, ctx.plugin, (result) => {
					repo.set = result.path;
					ctx.plugin.repositoryFrontmatter[repo.smartKey] =
						ctx.plugin.app.metadataCache.getFileCache(result)?.frontmatter;
					void save();
				});
			});

		new Setting(containerEl)
			.setName(i18next.t("settings.plugin.shareKey.all.title"))
			.setDesc(i18next.t("settings.plugin.shareKey.all.desc"))
			.addToggle((toggle) =>
				toggle.setValue(repo.shareAll?.enable ?? false).onChange(async (value) => {
					repo.shareAll = {
						enable: value,
						excludedFileName:
							repo.shareAll?.excludedFileName ??
							ctx.settings.plugin.shareAll?.excludedFileName ??
							"DRAFT",
					};
					await save();
					this.display();
				})
			);

		if (!repo.shareAll?.enable) {
			new Setting(containerEl)
				.setName(i18next.t("settings.plugin.shareKey.title"))
				.setDesc(i18next.t("settings.plugin.shareKey.desc"))
				.addText((text) =>
					text
						.setPlaceholder(Placeholder.Share)
						.setValue(repo.shareKey)
						.onChange(async (value) => {
							repo.shareKey = value.trim();
							await save();
						})
				);
		} else {
			new Setting(containerEl)
				.setName(i18next.t("settings.plugin.shareKey.excludedFileName.title"))
				.addText((text) =>
					text
						.setPlaceholder("DRAFT")
						.setValue(
							repo.shareAll?.excludedFileName ??
								ctx.settings.plugin.shareAll?.excludedFileName ??
								"DRAFT"
						)
						.onChange(async (value) => {
							repo.shareAll!.excludedFileName = value.trim();
							await save();
						})
				);
		}

		if (ctx.settings.plugin.copyLink.enable) {
			new Setting(containerEl)
				.setName(i18next.t("settings.plugin.copyLink.baselink.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.baselink.desc"))
				.addText((text) =>
					text
						.setPlaceholder(ctx.settings.plugin.copyLink.links)
						.setValue(repo.copyLink.links)
						.onChange(async (value) => {
							repo.copyLink.links = value.trim();
							await save();
						})
				);

			const removePartGroup = new SettingGroup(containerEl)
				.setHeading(i18next.t("settings.plugin.copyLink.linkPathRemover.title"))
				.addExtraButton((button) => {
					button.setIcon("plus").onClick(() => {
						void (async () => {
							repo.copyLink.removePart.push("");
							await save();
							this.display();
						})();
					});
				});
			for (let index = 0; index < repo.copyLink.removePart.length; index++) {
				removePartGroup.addSetting((setting) => {
					setting
						.setClass("no-display")
						.addText((text) => {
							text
								.setPlaceholder(Placeholder.Docs)
								.setValue(repo.copyLink.removePart[index])
								.onChange(async (value) => {
									repo.copyLink.removePart[index] = value;
									await save();
								});
						})
						.addExtraButton((button) => {
							button.setIcon("trash").onClick(() => {
								void (async () => {
									repo.copyLink.removePart.splice(index, 1);
									await save();
									this.display();
								})();
							});
						});
				});
			}

			new Setting(containerEl)
				.setName(i18next.t("settings.plugin.copyLink.toUri.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.toUri.desc"))
				.addToggle((toggle) =>
					toggle.setValue(repo.copyLink.transform.toUri).onChange(async (value) => {
						repo.copyLink.transform.toUri = value;
						await save();
					})
				);

			new Setting(containerEl)
				.setName(i18next.t("settings.conversion.links.slugify.title"))
				.addDropdown((dropdown) => {
					dropdown
						.addOptions({
							disable: i18next.t("settings.conversion.links.slugify.disable"),
							strict: i18next.t("settings.conversion.links.slugify.strict"),
							lower: i18next.t("settings.conversion.links.slugify.lower"),
						})
						.setValue(repo.copyLink.transform.slugify)
						.onChange(async (value) => {
							repo.copyLink.transform.slugify = value as "disable" | "strict" | "lower";
							await save();
						});
				});

			new SettingGroup(containerEl)
				.setHeading(i18next.t("settings.plugin.copyLink.applyRegex.title"))
				.addExtraButton((button) => {
					button.setIcon("plus").onClick(() => {
						void (async () => {
							repo.copyLink.transform.applyRegex.push({ regex: "", replacement: "" });
							await save();
							this.display();
						})();
					});
				});

			if (repo.copyLink.transform.applyRegex.length === 0) {
				containerEl.createEl("p", {
					text: i18next.t("settings.plugin.copyLink.applyRegex.desc"),
					cls: "setting-item-description",
				});
			}

			for (const apply of repo.copyLink.transform.applyRegex) {
				new Setting(containerEl)
					.setClass("no-display")
					.addText((text) => {
						text
							.setPlaceholder(Placeholder.Docs)
							.setValue(apply.regex)
							.onChange(async (value) => {
								apply.regex = value;
								await save();
							});
					})
					.addText((text) => {
						text
							.setPlaceholder(i18next.t("regex.replace"))
							.setValue(apply.replacement)
							.onChange(async (value) => {
								apply.replacement = value;
								await save();
							});
					})
					.addExtraButton((button) => {
						button.setIcon("trash").onClick(() => {
							void (async () => {
								repo.copyLink.transform.applyRegex =
									repo.copyLink.transform.applyRegex.filter((item) => item !== apply);
								await save();
								this.display();
							})();
						});
					});
			}
		}
	}
}

export function buildManageRepoPage(ctx: RenderContext): SettingDefinitionPage {
	return {
		type: "page",
		name: i18next.t("settings.github.smartRepo.button"),
		desc: i18next.t("settings.github.smartRepo.modals.desc"),
		page: () => new ManageRepoPage(ctx),
	};
}
