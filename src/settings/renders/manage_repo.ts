import { GithubTiersVersion, type Repository } from "@interfaces";
import { Placeholder } from "@interfaces/enum";
import i18next from "i18next";
import {
	AbstractInputSuggest,
	Notice,
	SecretComponent,
	type SettingDefinition,
	type SettingDefinitionItem,
	type SettingDefinitionPage,
	type TFile,
} from "obsidian";
import type Enveloppe from "src/main";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import { linkRegexList, type RenderContext, rawContent, stringListPage } from "./index";

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
	// the length alone gives a key already used once another repository was deleted
	let index = github.otherRepo.length;
	while (github.otherRepo.some((repo) => repo.smartKey === `smartkey-${index}`)) index++;
	const smartKey = `smartkey-${index}`;
	return {
		smartKey,
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

const pageIds = new WeakMap<Repository, string>();
let lastId = 0;

/** The smartKey can be renamed and the index changes on deletion: neither identifies a page */
function pageId(repo: Repository): string {
	let id = pageIds.get(repo);
	if (!id) {
		id = `repository-${lastId++}`;
		pageIds.set(repo, id);
	}
	return id;
}

/** Return the error preventing the repository from being renamed */
function renameError(ctx: RenderContext, repo: Repository, smartKey: string) {
	if (smartKey.length === 0) return "settings.github.smartRepo.modals.empty";
	if (smartKey === "default") return "settings.github.smartRepo.modals.default";
	const duplicate = ctx.settings.github.otherRepo.some(
		(other) => other !== repo && other.smartKey === smartKey
	);
	return duplicate ? "settings.github.smartRepo.modals.duplicate" : null;
}

export async function renameRepository(
	ctx: RenderContext,
	repo: Repository,
	smartKey: string
) {
	const frontmatters = ctx.plugin.repositoryFrontmatter;
	// the frontmatter of the "set" file is stored by smartKey
	if (repo.smartKey in frontmatters) {
		frontmatters[smartKey] = frontmatters[repo.smartKey];
		delete frontmatters[repo.smartKey];
	}
	repo.smartKey = smartKey;
	ctx.update();
	await ctx.plugin.saveSettings();
	await ctx.plugin.reloadCommands();
}

export async function deleteRepository(ctx: RenderContext, repo: Repository) {
	const { otherRepo } = ctx.settings.github;
	const index = otherRepo.indexOf(repo);
	if (index === -1) return;
	otherRepo.splice(index, 1);
	delete ctx.plugin.repositoryFrontmatter[repo.smartKey];
	// synchronous, so the closed page is always the one of the repository
	ctx.update();
	ctx.app.setting.closePage?.();
	await ctx.plugin.saveSettings();
	await ctx.plugin.reloadCommands();
}

function repositoryItems(ctx: RenderContext, repo: Repository): SettingDefinitionItem[] {
	const save = () => ctx.plugin.saveSettings();
	const copyLinkEnabled = () => ctx.settings.plugin.copyLink.enable;

	// not searchable: every repository would repeat the main settings
	const row = (
		name: string,
		desc: string | DocumentFragment | undefined,
		options: Pick<SettingDefinition, "visible"> & {
			render: NonNullable<SettingDefinition["render"]>;
		}
	): SettingDefinition => ({ name, desc, searchable: false, ...options });

	const text = (
		name: string,
		desc: string | undefined,
		placeholder: string,
		get: () => string,
		set: (value: string) => void,
		visible?: () => boolean
	) =>
		row(name, desc, {
			visible,
			render: (setting) => {
				setting.addText((component) =>
					component
						.setPlaceholder(placeholder)
						.setValue(get())
						.onChange(async (value) => {
							set(value);
							await save();
						})
				);
			},
		});

	const toggle = (
		name: string,
		desc: string | undefined,
		get: () => boolean,
		set: (value: boolean) => void,
		visible?: () => boolean
	) =>
		row(name, desc, {
			visible,
			render: (setting) => {
				setting.addToggle((component) =>
					component.setValue(get()).onChange(async (value) => {
						set(value);
						await save();
						ctx.refresh();
					})
				);
			},
		});

	const dropdown = (
		name: string,
		desc: string | undefined,
		options: Record<string, string>,
		get: () => string,
		set: (value: string) => void,
		visible?: () => boolean
	) =>
		row(name, desc, {
			visible,
			render: (setting) => {
				setting.addDropdown((component) =>
					component
						.addOptions(options)
						.setValue(get())
						.onChange(async (value) => {
							set(value);
							await save();
							ctx.refresh();
						})
				);
			},
		});

	const ghTokenDesc = createFragment();
	ghTokenDesc.createSpan(undefined, (span) => {
		span.innerText = i18next.t("settings.github.ghToken.desc");
		span.createEl("a", undefined, (link) => {
			link.innerText = `${i18next.t("common.here")}.`;
			link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
		});
	});

	const excludedFileName = () =>
		repo.shareAll?.excludedFileName ??
		ctx.settings.plugin.shareAll?.excludedFileName ??
		"DRAFT";

	return [
		{
			type: "group",
			cls: "enveloppe",
			items: [
				row("Smartkey", undefined, {
					render: (setting) => {
						setting.addText((component) => {
							let draft = repo.smartKey;
							component
								.setPlaceholder(Placeholder.Smartkey)
								.setValue(repo.smartKey)
								.onChange((value) => {
									draft = value.trim().toLowerCase();
								});
							// on blur: each letter typed would rename the commands
							component.inputEl.addEventListener("blur", () => {
								if (draft === repo.smartKey) return;
								const error = renameError(ctx, repo, draft);
								if (error) {
									new Notice(i18next.t(error), ctx.settings.plugin.noticeLength);
									draft = repo.smartKey;
									component.setValue(repo.smartKey);
									return;
								}
								void renameRepository(ctx, repo, draft);
							});
						});
					},
				}),
				dropdown(
					i18next.t("settings.github.apiType.title"),
					i18next.t("settings.github.apiType.desc"),
					{
						[GithubTiersVersion.Free]: i18next.t("settings.github.apiType.dropdown.free"),
						[GithubTiersVersion.Entreprise]: i18next.t(
							"settings.github.apiType.dropdown.enterprise"
						),
					},
					() => repo.api.tiersForApi,
					(value) => {
						repo.api.tiersForApi = value as GithubTiersVersion;
					}
				),
				text(
					i18next.t("settings.github.apiType.hostname.title"),
					i18next.t("settings.github.apiType.hostname.desc"),
					"https://github.mycompany.com",
					() => repo.api.hostname,
					(value) => {
						repo.api.hostname = value.trim();
					},
					() => repo.api.tiersForApi === GithubTiersVersion.Entreprise
				),
				text(
					i18next.t("settings.github.username.title"),
					i18next.t("settings.github.username.desc"),
					i18next.t("settings.github.username.title"),
					() => repo.user,
					(value) => {
						repo.user = value.trim();
					}
				),
				text(
					i18next.t("settings.github.repoName.title"),
					i18next.t("settings.github.repoName.desc"),
					i18next.t("settings.github.repoName.placeholder"),
					() => repo.repo,
					(value) => {
						repo.repo = value.trim();
					}
				),
				text(
					i18next.t("settings.github.branch.title"),
					i18next.t("settings.github.branch.desc"),
					Placeholder.Main,
					() => repo.branch,
					(value) => {
						repo.branch = value.trim();
					}
				),
				row(i18next.t("common.ghToken"), ghTokenDesc, {
					render: (setting) => {
						setting.addComponent((el) =>
							new SecretComponent(ctx.app, el)
								.setValue(repo.tokenSecret ?? ctx.settings.github.tokenSecret)
								.onChange(async (value) => {
									// Cleared secret: drop the override so the repo falls back to the default token.
									repo.tokenSecret = value ?? undefined;
									await save();
								})
						);
					},
				}),
				toggle(
					i18next.t("settings.github.automaticallyMergePR"),
					undefined,
					() => repo.automaticallyMergePR,
					(value) => {
						repo.automaticallyMergePR = value;
					}
				),
				row("", undefined, {
					render: (setting) => {
						setting.setClass("no-display").addButton((button) =>
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
					},
				}),
				toggle(
					i18next.t("settings.github.smartRepo.modals.shortcuts.title"),
					i18next.t("settings.github.smartRepo.modals.shortcuts.desc"),
					() => repo.createShortcuts,
					(value) => {
						repo.createShortcuts = value;
					}
				),
			],
		},
		{
			type: "group",
			cls: "enveloppe",
			heading: "GitHub workflow",
			items: [
				text(
					i18next.t("settings.githubWorkflow.prRequest.title"),
					i18next.t("settings.githubWorkflow.prRequest.desc"),
					Placeholder.Merge,
					() => repo.workflow.commitMessage,
					(value) => {
						if (value.trim().length === 0) {
							value = Placeholder.Merge;
							new Notice(
								i18next.t("settings.githubWorkflow.prRequest.error"),
								ctx.settings.plugin.noticeLength
							);
						}
						repo.workflow.commitMessage = value;
					}
				),
				text(
					i18next.t("settings.githubWorkflow.githubAction.title"),
					i18next.t("settings.githubWorkflow.githubAction.desc"),
					Placeholder.Ci,
					() => repo.workflow.name,
					(value) => {
						let name = value;
						if (name.length > 0) {
							name = name.trim();
							const yamlEndings = [".yml", ".yaml"];
							if (!yamlEndings.some((ending) => name.endsWith(ending)))
								name += yamlEndings[0];
						}
						repo.workflow.name = name;
					}
				),
			],
		},
		{
			type: "group",
			cls: "enveloppe",
			heading: i18next.t("settings.github.smartRepo.modals.otherConfig"),
			items: [
				row(
					i18next.t("settings.plugin.setImport.title"),
					i18next.t("settings.plugin.setImport.desc"),
					{
						render: (setting) => {
							setting.addSearch((search) => {
								search.setValue(repo.set ?? "").setPlaceholder("path/to/file.md");
								new SetClassSuggester(search.inputEl, ctx.plugin, (result) => {
									repo.set = result.path;
									ctx.plugin.repositoryFrontmatter[repo.smartKey] =
										ctx.plugin.app.metadataCache.getFileCache(result)?.frontmatter;
									void save();
								});
							});
						},
					}
				),
				toggle(
					i18next.t("settings.plugin.shareKey.all.title"),
					i18next.t("settings.plugin.shareKey.all.desc"),
					() => repo.shareAll?.enable ?? false,
					(value) => {
						repo.shareAll = { enable: value, excludedFileName: excludedFileName() };
					}
				),
				text(
					i18next.t("settings.plugin.shareKey.title"),
					i18next.t("settings.plugin.shareKey.desc"),
					Placeholder.Share,
					() => repo.shareKey,
					(value) => {
						repo.shareKey = value.trim();
					},
					() => !repo.shareAll?.enable
				),
				text(
					i18next.t("settings.plugin.shareKey.excludedFileName.title"),
					undefined,
					"DRAFT",
					excludedFileName,
					(value) => {
						repo.shareAll = { enable: true, excludedFileName: value.trim() };
					},
					() => !!repo.shareAll?.enable
				),
				text(
					i18next.t("settings.plugin.copyLink.baselink.title"),
					i18next.t("settings.plugin.copyLink.baselink.desc"),
					ctx.settings.plugin.copyLink.links,
					() => repo.copyLink.links,
					(value) => {
						repo.copyLink.links = value.trim();
					},
					copyLinkEnabled
				),
				stringListPage(ctx, {
					name: i18next.t("settings.plugin.copyLink.linkPathRemover.title"),
					desc: i18next.t("settings.plugin.copyLink.linkPathRemover.desc"),
					addItemName: i18next.t("common.add", { things: "part" }),
					placeholder: Placeholder.Docs,
					values: repo.copyLink.removePart,
					save,
					visible: copyLinkEnabled,
				}),
				toggle(
					i18next.t("settings.plugin.copyLink.toUri.title"),
					i18next.t("settings.plugin.copyLink.toUri.desc"),
					() => repo.copyLink.transform.toUri,
					(value) => {
						repo.copyLink.transform.toUri = value;
					},
					copyLinkEnabled
				),
				dropdown(
					i18next.t("settings.conversion.links.slugify.title"),
					undefined,
					{
						disable: i18next.t("settings.conversion.links.slugify.disable"),
						strict: i18next.t("settings.conversion.links.slugify.strict"),
						lower: i18next.t("settings.conversion.links.slugify.lower"),
					},
					() => repo.copyLink.transform.slugify,
					(value) => {
						repo.copyLink.transform.slugify = value as "disable" | "strict" | "lower";
					},
					copyLinkEnabled
				),
			],
		},
		linkRegexList(ctx, repo.copyLink.transform.applyRegex, copyLinkEnabled),
		{
			type: "group",
			cls: "enveloppe",
			items: [
				// Obsidian gives no delete button to the pages of a list
				row("", undefined, {
					render: (setting) => {
						setting.setClass("no-display").addButton((button) =>
							button
								.setButtonText(i18next.t("common.delete", { things: repo.smartKey }))
								.setDestructive()
								.setClass("max-width")
								.onClick(() => void deleteRepository(ctx, repo))
						);
					},
				}),
			],
		},
	];
}

function buildRepositoryPage(
	ctx: RenderContext,
	repo: Repository
): SettingDefinitionPage {
	return {
		type: "page",
		id: pageId(repo),
		name: repo.smartKey,
		displayValue: () => `${repo.user}/${repo.repo}`,
		items: repositoryItems(ctx, repo),
	};
}

export function buildManageRepoPage(ctx: RenderContext): SettingDefinitionPage {
	const github = ctx.settings.github;
	return {
		type: "page",
		id: "manage-repositories",
		name: i18next.t("settings.github.smartRepo.button"),
		desc: i18next.t("settings.github.smartRepo.modals.desc"),
		items: [
			rawContent((el) => {
				el.createEl("p", {
					text: i18next.t("settings.github.smartRepo.modals.frontmatterInfo"),
				});
				el.createEl("p", { text: i18next.t("settings.plugin.shareKey.otherRepo") });
			}),
			{
				type: "list",
				cls: "enveloppe",
				heading: i18next.t("settings.github.smartRepo.modals.title"),
				addItem: {
					name: i18next.t("settings.github.smartRepo.modals.newRepo"),
					action: () => {
						github.otherRepo.push(defaultRepository(ctx));
						ctx.update();
						void ctx.plugin.saveSettings();
					},
				},
				items: github.otherRepo.map((repo) => buildRepositoryPage(ctx, repo)),
			},
		],
	};
}
