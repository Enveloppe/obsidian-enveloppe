import {
	FolderSettings,
	type RegexReplace,
	type TextCleaner,
	TypeOfEditRegex,
} from "@interfaces";
import dedent from "dedent";
import i18next from "i18next";
import {
	Notice,
	type SettingDefinitionItem,
	type SettingDefinitionPage,
	sanitizeHTMLToDom,
} from "obsidian";
import { type RenderContext, rawContent, widenInput } from "./index";

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
				cls: "enveloppe",
				type: "list",
				heading: i18next.t("settings.regexReplacing.modal.desc"),
				addItem: {
					name: i18next.t("common.add", { things: "regex" }),
					action: () => {
						void (async () => {
							const list = combined();
							list.push({ regex: "", replacement: "", type: TypeOfEditRegex.Title });
							await persist(list);
							ctx.update();
						})();
					},
				},
				onDelete: (index) => {
					void (async () => {
						const list = combined();
						list.splice(index, 1);
						await persist(list);
						ctx.update();
					})();
				},
				items: combined().map((item) => ({
					name: "",
					searchable: false,
					render: (setting) => {
						setting
							.setNoInfo()
							.addText((text) => {
								text
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
								text
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

	const explanation = dedent(`
		<p>${i18next.t("settings.regexReplacing.modal.desc")}</p>
		<h3>${i18next.t("settings.regexReplacing.modal.keywords")}</h3>
		<ul class="keywords">
			<li><code>{{all}}</code>${i18next.t("settings.embed.forcePush.all")}</li>
			<li><code>{{default}}</code>${i18next.t("settings.embed.forcePush.default")}</li>
			<li><code>{{name}}</code>${i18next.t("settings.regexReplacing.modal.name")}</li>
		</ul>
		<h3>${i18next.t("settings.regexReplacing.modal.force")}</h3>
		<p>${i18next.t("settings.embed.forcePush.info")}</p>
	`);

	return {
		type: "page",
		name: i18next.t("settings.embed.overrides.modal.title"),
		desc: i18next.t("settings.embed.overrides.desc"),
		items: [
			rawContent((el) => {
				el.appendChild(sanitizeHTMLToDom(explanation));
			}),
			{
				type: "list",
				heading: i18next.t("settings.embed.overrides.modal.title"),
				addItem: {
					name: i18next.t("common.add", { things: "override" }),
					action: () => {
						void (async () => {
							embed.overrideAttachments.push({
								path: "",
								destination: "",
								forcePush: false,
							});
							await ctx.plugin.saveSettings();
							ctx.update();
						})();
					},
				},
				onDelete: (index) => {
					void (async () => {
						embed.overrideAttachments.splice(index, 1);
						await ctx.plugin.saveSettings();
						ctx.update();
					})();
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
				cls: "enveloppe",
				type: "list",
				emptyState: i18next.t("settings.regexReplacing.empty"),
				addItem: {
					name: i18next.t("common.add", { things: "Regex" }),
					action: () => {
						void (async () => {
							const censorText: TextCleaner = {
								entry: "",
								replace: "",
								flags: "",
								after: false,
							};
							conversion.censorText.push(censorText);
							await ctx.plugin.saveSettings();
							ctx.update();
						})();
					},
				},
				onReorder: (oldIndex, newIndex) => {
					void (async () => {
						const [moved] = conversion.censorText.splice(oldIndex, 1);
						conversion.censorText.splice(newIndex, 0, moved);
						await ctx.plugin.saveSettings();
					})();
				},
				onDelete: (index) => {
					void (async () => {
						conversion.censorText.splice(index, 1);
						await ctx.plugin.saveSettings();
						ctx.update();
					})();
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
