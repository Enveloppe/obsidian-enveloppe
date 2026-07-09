import {
	FolderSettings,
	GithubTiersVersion,
	type RegexReplace,
	type Repository,
	type TextCleaner,
	TypeOfEditRegex,
} from "@interfaces";
import i18next from "i18next";
import {
	AbstractInputSuggest,
	Notice,
	SecretComponent,
	type SettingDefinitionItem,
	type SettingDefinitionPage,
	type TFile,
} from "obsidian";
import type Enveloppe from "src/main";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import { type RenderContext, splitByCommaOrNewLineAndSpaces, widenInput } from "./index";

function isRegexValid(value: string): { isValid: boolean; error: unknown } {
	try {
		new RegExp(value);
		return { isValid: true, error: null };
	} catch (e) {
		return { isValid: false, error: e };
	}
}

/**
 * Validates a title/path regex entry. Returns the value when acceptable, or `null`
 * (after showing a Notice) when it should be rejected.
 */
function validatePathTitleRegex(
	value: string,
	type: TypeOfEditRegex,
	noticeLength: number | undefined
): string | null {
	if (value.length === 0) return "";
	const regexSpecialDontExclude = /\/(.*)(\\[dwstrnvfb0cxup])(.*)\//i;
	const onWhat = (
		type === TypeOfEditRegex.Path
			? i18next.t("common.path.folder")
			: i18next.t("common.path.file")
	).toLowerCase();
	if (value === "/") {
		new Notice(
			i18next.t("settings.regexReplacing.forbiddenValue", {
				what: onWhat,
				forbiddenChar: value,
			}),
			noticeLength
		);
		return null;
	}
	const validity = isRegexValid(value);
	if (!validity.isValid) {
		new Notice(
			i18next.t("settings.regexReplacing.invalidRegex", { e: validity.error }),
			noticeLength
		);
		return null;
	}
	if (
		value.match(/[><:"|?*]|(\\\/)|(^\w+\/\w+)|(\\)/) &&
		type === TypeOfEditRegex.Title &&
		!value.match(regexSpecialDontExclude)
	) {
		new Notice(
			i18next.t("settings.regexReplacing.forbiddenValue", {
				what: onWhat,
				forbiddenChar: value.match(/[><:"|?*]|(\\\/)|(^\w+\/\w+)|(\\)/)![0],
			}),
			noticeLength
		);
		return null;
	}
	if (type === TypeOfEditRegex.Path) {
		if (value.match(/[\\><:"|?*]/) && !value.match(/^\/(.*)\/[gmisuvdy]*$/)) {
			new Notice(
				i18next.t("settings.regexReplacing.forbiddenValue", {
					what: onWhat,
					forbiddenChar: value.match(/[\\><:"|?*]/)![0],
				}),
				noticeLength
			);
			return null;
		}
		if (value.match(/(^\w+\/\w+)|(\\\/)/) && !value.match(regexSpecialDontExclude)) {
			new Notice(i18next.t("settings.regexReplacing.warningPath"), noticeLength);
		}
	}
	return value;
}

/**
 * Page replacing `ModalRegexFilePathName`: editing the regex list that renames titles
 * and (unless the folder behavior is "fixed") paths.
 */
export function buildRegexFilePathPage(ctx: RenderContext): SettingDefinitionPage {
	const upload = ctx.settings.upload;
	const combined = (): RegexReplace[] =>
		upload.behavior !== FolderSettings.Fixed
			? upload.replaceTitle.concat(upload.replacePath)
			: upload.replaceTitle;
	const persist = async (list: RegexReplace[]) => {
		upload.replacePath = list.filter((r) => r.type === TypeOfEditRegex.Path);
		upload.replaceTitle = list.filter((r) => r.type === TypeOfEditRegex.Title);
		await ctx.plugin.saveSettings();
	};

	return {
		type: "page",
		name:
			upload.behavior === FolderSettings.Fixed
				? i18next.t("settings.upload.regexFilePathTitle.title.titleOnly")
				: i18next.t("settings.upload.regexFilePathTitle.title.FolderPathTitle"),
		desc: i18next.t("settings.upload.regexFilePathTitle.desc"),
		items: [
			{
				type: "list",
				heading: i18next.t("settings.regexReplacing.modal.desc"),
				addItem: {
					name: i18next.t("common.add", { things: "regex" }),
					action: async () => {
						const list = combined();
						list.push({ regex: "", replacement: "", type: TypeOfEditRegex.Title });
						await persist(list);
						ctx.update();
					},
				},
				onDelete: async (index) => {
					const list = combined();
					list.splice(index, 1);
					await persist(list);
					ctx.update();
				},
				items: combined().map((item) => ({
					name: "",
					searchable: false,
					render: (setting) => {
						setting
							.setClass("no-display")
							.addText((text) => {
								widenInput(text)
									.setPlaceholder(i18next.t("regex.entry"))
									.setValue(item.regex)
									.onChange(async (value) => {
										const validated = validatePathTitleRegex(
											value,
											item.type,
											ctx.settings.plugin.noticeLength
										);
										text.inputEl.toggleClass("error", validated === null);
										if (validated === null) return;
										item.regex = validated;
										await ctx.plugin.saveSettings();
									});
							})
							.addText((text) => {
								widenInput(text)
									.setPlaceholder(i18next.t("regex.replace"))
									.setValue(item.replacement)
									.onChange(async (value) => {
										const validated = validatePathTitleRegex(
											value,
											item.type,
											ctx.settings.plugin.noticeLength
										);
										text.inputEl.toggleClass("error", validated === null);
										if (validated === null) return;
										item.replacement = validated;
										await ctx.plugin.saveSettings();
									});
							});
						if (upload.behavior !== FolderSettings.Fixed) {
							setting.addDropdown((dropdown) => {
								dropdown
									.addOption("path", i18next.t("common.path.folder"))
									.addOption("title", i18next.t("common.path.file"))
									.setValue(item.type)
									.onChange(async (value) => {
										item.type = value as TypeOfEditRegex;
										await persist(combined());
										ctx.update();
									});
							});
						} else {
							setting.addButton((button) => {
								button.buttonEl.addClass("disabled");
								button.setButtonText(i18next.t("common.path.file"));
							});
						}
					},
				})),
			},
		],
	};
}

function validateAttachmentValue(
	value: string,
	noticeLength: number | undefined
): string | null {
	if (value.length === 0) return "";
	const validity = isRegexValid(value);
	if (!validity.isValid) {
		new Notice(
			i18next.t("settings.regexReplacing.invalidRegex", { e: validity.error }),
			noticeLength
		);
		return null;
	}
	if (value.match(/[\\><:"|?*]/) && !value.match(/^\/(.*)\/[gmisuvdy]*$/)) {
		new Notice(
			i18next.t("settings.regexReplacing.forbiddenValue", {
				what: i18next.t("common.path.folder"),
				forbiddenChar: value.match(/[\\><:"|?*]/)![0],
			}),
			noticeLength
		);
		return null;
	}
	return value;
}

/**
 * Page replacing `OverrideAttachmentsModal`.
 */
export function buildOverrideAttachmentsPage(ctx: RenderContext): SettingDefinitionPage {
	const embed = ctx.settings.embed;
	if (!embed.overrideAttachments) embed.overrideAttachments = [];

	return {
		type: "page",
		name: i18next.t("settings.embed.overrides.modal.title"),
		desc: i18next.t("settings.embed.overrides.desc"),
		items: [
			{
				name: i18next.t("settings.regexReplacing.modal.keywords"),
				desc: i18next.t("settings.regexReplacing.modal.desc"),
			},
			{
				type: "list",
				heading: i18next.t("settings.embed.overrides.modal.title"),
				addItem: {
					name: i18next.t("common.add", { things: "override" }),
					action: async () => {
						embed.overrideAttachments.push({
							path: "",
							destination: "",
							forcePush: false,
						});
						await ctx.plugin.saveSettings();
						ctx.update();
					},
				},
				onDelete: async (index) => {
					embed.overrideAttachments.splice(index, 1);
					await ctx.plugin.saveSettings();
					ctx.update();
				},
				items: embed.overrideAttachments.map((override) => ({
					name: "",
					searchable: false,
					render: (setting) => {
						setting
							.setClass("entry")
							.addText((text) => {
								widenInput(text)
									.setPlaceholder(i18next.t("settings.embed.overrides.modal.path"))
									.setValue(override.path)
									.onChange(async (value) => {
										const validated = validateAttachmentValue(
											value,
											ctx.settings.plugin.noticeLength
										);
										text.inputEl.toggleClass("error", validated === null);
										if (validated === null) return;
										override.path = validated;
										await ctx.plugin.saveSettings();
									});
							})
							.addText((text) => {
								widenInput(text)
									.setPlaceholder(i18next.t("settings.embed.overrides.modal.dest"))
									.setValue(override.destination)
									.onChange(async (value) => {
										const validated = validateAttachmentValue(
											value,
											ctx.settings.plugin.noticeLength
										);
										text.inputEl.toggleClass("error", validated === null);
										if (validated === null) return;
										override.destination = validated;
										await ctx.plugin.saveSettings();
									});
							})
							.addToggle((toggle) => {
								toggle
									.setTooltip(i18next.t("settings.embed.forcePush.title"))
									.setValue(override.forcePush)
									.onChange(async (value) => {
										override.forcePush = value;
										await ctx.plugin.saveSettings();
									});
							});
					},
				})),
			},
		] satisfies SettingDefinitionItem[],
	};
}

/**
 * Page replacing `ModalRegexOnContents`: the censor-text list, now reorderable by
 * drag handle instead of up/down buttons.
 */
export function buildCensorTextPage(ctx: RenderContext): SettingDefinitionPage {
	const conversion = ctx.settings.conversion;

	return {
		type: "page",
		name: i18next.t("settings.regexReplacing.modal.title.text"),
		desc: i18next.t("settings.regexReplacing.modal.desc"),
		items: [
			{
				type: "list",
				heading: i18next.t("settings.regexReplacing.modal.title.text"),
				emptyState: i18next.t("settings.regexReplacing.empty"),
				addItem: {
					name: i18next.t("common.add", { things: "Regex" }),
					action: async () => {
						const censorText: TextCleaner = {
							entry: "",
							replace: "",
							flags: "",
							after: false,
						};
						conversion.censorText.push(censorText);
						await ctx.plugin.saveSettings();
						ctx.update();
					},
				},
				onReorder: async (oldIndex, newIndex) => {
					const [moved] = conversion.censorText.splice(oldIndex, 1);
					conversion.censorText.splice(newIndex, 0, moved);
					await ctx.plugin.saveSettings();
				},
				onDelete: async (index) => {
					conversion.censorText.splice(index, 1);
					await ctx.plugin.saveSettings();
					ctx.update();
				},
				items: conversion.censorText.map((censorText) => ({
					name: "",
					searchable: false,
					render: (setting) => {
						const afterIcon = censorText.after
							? "arrow-up-wide-narrow"
							: "arrow-down-wide-narrow";
						const inCodeBlocksIcon = censorText.inCodeBlocks ? "code" : "scan";
						const moment = censorText.after
							? i18next.t("common.after").toLowerCase()
							: i18next.t("common.before").toLowerCase();
						const desc = i18next.t("settings.regexReplacing.momentReplaceRegex", {
							moment,
						});
						const toolTipCode = censorText.inCodeBlocks
							? i18next.t("settings.regexReplacing.inCodeBlocks.runIn")
							: i18next.t("settings.regexReplacing.inCodeBlocks.runOut");
						setting
							.setClass("entry")
							.addText((text) => {
								widenInput(text)
									.setPlaceholder(i18next.t("regex.entry"))
									.setValue(censorText.entry)
									.onChange(async (value) => {
										if (value.length > 0 && !isRegexValid(value).isValid) {
											new Notice(
												i18next.t("settings.regexReplacing.invalidRegex", {
													e: isRegexValid(value).error,
												}),
												ctx.settings.plugin.noticeLength
											);
											text.inputEl.addClass("error");
											return;
										}
										text.inputEl.removeClass("error");
										censorText.entry = value;
										await ctx.plugin.saveSettings();
									});
							})
							.addText((text) => {
								widenInput(text)
									.setPlaceholder(i18next.t("regex.replace"))
									.setValue(censorText.replace)
									.onChange(async (value) => {
										censorText.replace = value;
										await ctx.plugin.saveSettings();
									});
							})
							.addExtraButton((btn) => {
								btn
									.setTooltip(desc)
									.setIcon(afterIcon)
									.onClick(async () => {
										censorText.after = !censorText.after;
										await ctx.plugin.saveSettings();
										ctx.update();
									});
							})
							.addExtraButton((btn) => {
								btn
									.setTooltip(toolTipCode)
									.setIcon(inCodeBlocksIcon)
									.onClick(async () => {
										censorText.inCodeBlocks = !censorText.inCodeBlocks;
										await ctx.plugin.saveSettings();
										ctx.update();
									});
							});
						setting.controlEl.addClass("regex");
					},
				})),
			},
		],
	};
}

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

/**
 * Nested page replacing `ModalEditingRepository`: the full per-repository settings form.
 */
function buildRepositoryEditItems(
	ctx: RenderContext,
	repo: Repository
): SettingDefinitionItem[] {
	const save = () => ctx.plugin.saveSettings();
	return [
		{
			name: "",
			searchable: false,
			render: (setting) => {
				setting.setClass("no-display").addButton((button) =>
					button
						.setButtonText(i18next.t("common.delete", { things: repo.smartKey }))
						.setWarning()
						.onClick(async () => {
							ctx.settings.github.otherRepo.splice(
								ctx.settings.github.otherRepo.indexOf(repo),
								1
							);
							await ctx.plugin.saveSettings();
							await ctx.plugin.reloadCommands();
							ctx.update();
						})
				);
			},
		},
		{
			name: "Smart key",
			desc: i18next.t("settings.github.smartRepo.modals.frontmatterInfo"),
			render: (setting) => {
				let draft = repo.smartKey;
				setting
					.addText((text) => {
						text
							.setPlaceholder("smartkey")
							.setValue(repo.smartKey)
							.onChange((value) => {
								draft = value.toLowerCase();
							});
					})
					.addButton((button) => {
						button.setButtonText("Rename").onClick(async () => {
							const duplicate = ctx.settings.github.otherRepo.some(
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
								return;
							}
							repo.smartKey = draft;
							// A deliberate click (not a per-keystroke handler) is safe to
							// rebuild the whole tab from, so the outer repo list's nav
							// entry picks up the new name.
							await save();
							ctx.update();
						});
					});
			},
		},
		{
			name: i18next.t("settings.github.apiType.title"),
			desc: i18next.t("settings.github.apiType.desc"),
			render: (setting) => {
				setting.addDropdown((dropdown) => {
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
							ctx.refresh();
						});
				});
			},
		},
		{
			name: i18next.t("settings.github.apiType.hostname.title"),
			desc: i18next.t("settings.github.apiType.hostname.desc"),
			visible: () => repo.api.tiersForApi === GithubTiersVersion.Entreprise,
			render: (setting) => {
				setting.addText((text) =>
					text
						.setPlaceholder("https://github.mycompany.com")
						.setValue(repo.api.hostname)
						.onChange(async (value) => {
							repo.api.hostname = value.trim();
							await save();
						})
				);
			},
		},
		{
			name: i18next.t("settings.github.username.title"),
			desc: i18next.t("settings.github.username.desc"),
			render: (setting) => {
				setting.addText((text) =>
					text
						.setPlaceholder(i18next.t("settings.github.username.title"))
						.setValue(repo.user)
						.onChange(async (value) => {
							repo.user = value.trim();
							await save();
						})
				);
			},
		},
		{
			name: i18next.t("settings.github.repoName.title"),
			desc: i18next.t("settings.github.repoName.desc"),
			render: (setting) => {
				setting.addText((text) =>
					text
						.setPlaceholder(i18next.t("settings.github.repoName.placeholder"))
						.setValue(repo.repo)
						.onChange(async (value) => {
							repo.repo = value.trim();
							await save();
						})
				);
			},
		},
		{
			name: i18next.t("settings.github.branch.title"),
			desc: i18next.t("settings.github.branch.desc"),
			render: (setting) => {
				setting.addText((text) =>
					text
						.setPlaceholder("main")
						.setValue(repo.branch)
						.onChange(async (value) => {
							repo.branch = value.trim();
							await save();
						})
				);
			},
		},
		{
			name: i18next.t("common.ghToken"),
			render: (setting) => {
				setting.addComponent((el) =>
					new SecretComponent(ctx.app, el)
						.setValue(repo.tokenSecret ?? ctx.settings.github.tokenSecret)
						.onChange(async (value) => {
							repo.tokenSecret = value;
							await save();
						})
				);
			},
		},
		{
			name: i18next.t("settings.github.automaticallyMergePR"),
			render: (setting) => {
				setting.addToggle((toggle) =>
					toggle.setValue(repo.automaticallyMergePR).onChange(async (value) => {
						repo.automaticallyMergePR = value;
						await save();
					})
				);
			},
		},
		{
			name: i18next.t("settings.github.smartRepo.modals.shortcuts.title"),
			desc: i18next.t("settings.github.smartRepo.modals.shortcuts.desc"),
			render: (setting) => {
				setting.addToggle((toggle) =>
					toggle.setValue(repo.createShortcuts).onChange(async (value) => {
						repo.createShortcuts = value;
						await save();
					})
				);
			},
		},
		{
			name: "",
			searchable: false,
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
		},
		{
			type: "group",
			heading: "GitHub Workflow",
			items: [
				{
					name: i18next.t("settings.githubWorkflow.prRequest.title"),
					desc: i18next.t("settings.githubWorkflow.prRequest.desc"),
					render: (setting) => {
						setting.addText((text) =>
							text
								.setPlaceholder("[PUBLISHER] MERGE")
								.setValue(repo.workflow.commitMessage)
								.onChange(async (value) => {
									if (value.trim().length === 0) {
										value = "[PUBLISHER] MERGE";
										new Notice(
											i18next.t("settings.githubWorkflow.prRequest.error"),
											ctx.settings.plugin.noticeLength
										);
									}
									repo.workflow.commitMessage = value;
									await save();
								})
						);
					},
				},
				{
					name: i18next.t("settings.githubWorkflow.githubAction.title"),
					desc: i18next.t("settings.githubWorkflow.githubAction.desc"),
					render: (setting) => {
						setting.addText((text) => {
							text
								.setPlaceholder("ci")
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
					},
				},
			],
		},
		{
			type: "group",
			heading: i18next.t("settings.github.smartRepo.modals.otherConfig"),
			items: [
				{
					name: i18next.t("settings.plugin.setImport.title"),
					desc: i18next.t("settings.plugin.setImport.desc"),
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
				},
				{
					name: i18next.t("settings.plugin.shareKey.all.title"),
					desc: i18next.t("settings.plugin.shareKey.all.desc"),
					render: (setting) => {
						setting.addToggle((toggle) =>
							toggle.setValue(repo.shareAll?.enable ?? false).onChange(async (value) => {
								repo.shareAll = {
									enable: value,
									excludedFileName:
										repo.shareAll?.excludedFileName ??
										ctx.settings.plugin.shareAll?.excludedFileName ??
										"DRAFT",
								};
								await save();
								ctx.refresh();
							})
						);
					},
				},
				{
					name: i18next.t("settings.plugin.shareKey.title"),
					desc: i18next.t("settings.plugin.shareKey.desc"),
					visible: () => !repo.shareAll?.enable,
					render: (setting) => {
						setting.addText((text) =>
							text
								.setPlaceholder("share")
								.setValue(repo.shareKey)
								.onChange(async (value) => {
									repo.shareKey = value.trim();
									await save();
								})
						);
					},
				},
				{
					name: i18next.t("settings.plugin.shareKey.excludedFileName.title"),
					visible: () => !!repo.shareAll?.enable,
					render: (setting) => {
						setting.addText((text) =>
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
					},
				},
				{
					name: i18next.t("settings.plugin.copyLink.baselink.title"),
					desc: i18next.t("settings.plugin.copyLink.baselink.desc"),
					visible: () => ctx.settings.plugin.copyLink.enable,
					render: (setting) => {
						setting.addText((text) =>
							text
								.setPlaceholder(ctx.settings.plugin.copyLink.links)
								.setValue(repo.copyLink.links)
								.onChange(async (value) => {
									repo.copyLink.links = value.trim();
									await save();
								})
						);
					},
				},
				{
					name: i18next.t("settings.plugin.copyLink.linkPathRemover.title"),
					desc: i18next.t("settings.plugin.copyLink.linkPathRemover.desc"),
					visible: () => ctx.settings.plugin.copyLink.enable,
					render: (setting) => {
						setting.addText((text) => {
							text
								.setPlaceholder("docs")
								.setValue(repo.copyLink.removePart.join(", "))
								.onChange(async (value) => {
									repo.copyLink.removePart = splitByCommaOrNewLineAndSpaces(value);
									await save();
								});
						});
					},
				},
				{
					name: i18next.t("settings.plugin.copyLink.toUri.title"),
					desc: i18next.t("settings.plugin.copyLink.toUri.desc"),
					visible: () => ctx.settings.plugin.copyLink.enable,
					render: (setting) => {
						setting.addToggle((toggle) =>
							toggle.setValue(repo.copyLink.transform.toUri).onChange(async (value) => {
								repo.copyLink.transform.toUri = value;
								await save();
							})
						);
					},
				},
				{
					name: i18next.t("settings.conversion.links.slugify.title"),
					visible: () => ctx.settings.plugin.copyLink.enable,
					render: (setting) => {
						setting.addDropdown((dropdown) => {
							dropdown
								.addOptions({
									disable: i18next.t("settings.conversion.links.slugify.disable"),
									strict: i18next.t("settings.conversion.links.slugify.strict"),
									lower: i18next.t("settings.conversion.links.slugify.lower"),
								})
								.setValue(repo.copyLink.transform.slugify)
								.onChange(async (value) => {
									repo.copyLink.transform.slugify = value as
										| "disable"
										| "strict"
										| "lower";
									await save();
								});
						});
					},
				},
			],
		},
		{
			type: "list",
			heading: i18next.t("settings.plugin.copyLink.applyRegex.title"),
			visible: () => ctx.settings.plugin.copyLink.enable,
			emptyState: i18next.t("settings.plugin.copyLink.applyRegex.desc"),
			addItem: {
				name: i18next.t("settings.plugin.copyLink.applyRegex.title"),
				action: async () => {
					repo.copyLink.transform.applyRegex.push({ regex: "", replacement: "" });
					await save();
					ctx.update();
				},
			},
			onDelete: async (index) => {
				repo.copyLink.transform.applyRegex.splice(index, 1);
				await save();
				ctx.update();
			},
			items: repo.copyLink.transform.applyRegex.map((apply) => ({
				name: "",
				searchable: false,
				render: (setting) => {
					setting
						.setClass("no-display")
						.addText((text) => {
							widenInput(text)
								.setPlaceholder("regex")
								.setValue(apply.regex)
								.onChange(async (value) => {
									apply.regex = value;
									await save();
								});
						})
						.addText((text) => {
							widenInput(text)
								.setPlaceholder("replacement")
								.setValue(apply.replacement)
								.onChange(async (value) => {
									apply.replacement = value;
									await save();
								});
						});
				},
			})),
		},
	];
}

/**
 * Page replacing `ModalAddingNewRepository` (+ nested `ModalEditingRepository`):
 * the multi-repository list, where each entry navigates to its own edit sub-page.
 */
export function buildManageRepoPage(ctx: RenderContext): SettingDefinitionPage {
	const github = ctx.settings.github;

	return {
		type: "page",
		name: i18next.t("settings.github.smartRepo.button"),
		desc: i18next.t("settings.github.smartRepo.modals.desc"),
		items: [
			{
				name: i18next.t("settings.github.smartRepo.modals.frontmatterInfo"),
				desc: i18next.t("settings.plugin.shareKey.otherRepo"),
			},
			{
				type: "list",
				heading: i18next.t("settings.github.smartRepo.modals.title"),
				addItem: {
					name: i18next.t("settings.github.smartRepo.modals.newRepo"),
					action: async () => {
						const defaultRepository: Repository = {
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
						github.otherRepo.push(defaultRepository);
						await ctx.plugin.saveSettings();
						ctx.update();
					},
				},
				onDelete: async (index) => {
					github.otherRepo.splice(index, 1);
					await ctx.plugin.saveSettings();
					await ctx.plugin.reloadCommands();
					ctx.update();
				},
				items: github.otherRepo.map((repo) => ({
					type: "page",
					name: repo.smartKey,
					items: buildRepositoryEditItems(ctx, repo),
				})),
			},
		],
	};
}
