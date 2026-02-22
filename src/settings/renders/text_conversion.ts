import dedent from "dedent";
import i18next from "i18next";
import { Setting, sanitizeHTMLToDom } from "obsidian";
import { ModalRegexOnContents } from "src/settings/modals/regex_edition";
import { type RenderContext, splitByCommaOrNewLineAndNonWord } from "./index";

export const renderTextConversion = (ctx: RenderContext) => {
	const textSettings = ctx.settings.conversion;

	ctx.settingsPage.appendChild(
		sanitizeHTMLToDom(`<p>${i18next.t("settings.conversion.desc")}</p>`)
	);

	ctx.settingsPage.createEl("h5", {
		text: i18next.t("settings.conversion.links.title"),
	});
	ctx.settingsPage.append(sanitizeHTMLToDom(i18next.t("settings.conversion.links.desc")));

	const shareAll = ctx.settings.plugin.shareAll?.enable
		? ` ${i18next.t("settings.conversion.links.internals.shareAll")}`
		: "";

	const internalLinksDesc = sanitizeHTMLToDom(
		dedent(`
			<p class="no-margin">${i18next.t("settings.conversion.links.internals.desc")} ${shareAll}</p>
			<p class="no-margin">${i18next.t("settings.conversion.links.internals.dataview")}</p>
		`)
	);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.links.internals.title"))
		.setDesc(internalLinksDesc)
		.addToggle((toggle) => {
			toggle.setValue(textSettings.links.internal).onChange(async (value) => {
				textSettings.links.internal = value;
				if (ctx.settings.plugin.shareAll?.enable) {
					textSettings.links.unshared = true;
				}
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage("text-conversion");
			});
		});

	if (textSettings.links.internal) {
		if (!ctx.settings.plugin.shareAll?.enable) {
			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.conversion.links.nonShared.title"))
				.setDesc(i18next.t("settings.conversion.links.nonShared.desc"))
				.addToggle((toggle) => {
					toggle.setValue(textSettings.links.unshared).onChange(async (value) => {
						textSettings.links.unshared = value;
						await ctx.renderSettingsPage("text-conversion");
						await ctx.plugin.saveSettings();
					});
				});

			if (!textSettings.links.unshared) {
				new Setting(ctx.settingsPage)
					.setName(i18next.t("settings.conversion.links.unlink.title"))
					.setDesc(sanitizeHTMLToDom(i18next.t("settings.conversion.links.unlink.desc")))
					.addToggle((toggle) => {
						toggle.setValue(textSettings.links.unlink).onChange(async (value) => {
							textSettings.links.unlink = value;
							await ctx.plugin.saveSettings();
						});
					});
			}
		}

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.conversion.links.relativePath.title"))
			.setDesc(i18next.t("settings.conversion.links.relativePath.desc"))
			.addToggle((toggle) => {
				toggle.setValue(textSettings.links.relativePath).onChange(async (value) => {
					textSettings.links.relativePath = value;
					await ctx.plugin.saveSettings();
					await ctx.renderSettingsPage("text-conversion");
				});
			});

		if (!textSettings.links.relativePath) {
			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.conversion.links.textBefore.title"))
				.setDesc(
					sanitizeHTMLToDom(
						`<span>${i18next.t("settings.conversion.links.textBefore.desc", { slash: "<code>/</code>" })}</span>`
					)
				)
				.addText((cb) => {
					cb.setPlaceholder("/")
						.setValue(textSettings.links.textPrefix)
						.onChange(async (value) => {
							textSettings.links.textPrefix = value;
							await ctx.plugin.saveSettings();
						});
				});
		}
	}

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.links.wikilinks.title"))
		.setDesc(i18next.t("settings.conversion.links.wikilinks.desc"))
		.addToggle((toggle) => {
			toggle.setValue(textSettings.links.wiki).onChange(async (value) => {
				textSettings.links.wiki = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage("text-conversion");
			});
		});
	if (textSettings.links.wiki) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.conversion.links.wikiDisplayText.title"))
			.setDesc(i18next.t("settings.conversion.links.wikiDisplayText.desc"))
			.addToggle((toggle) => {
				toggle.setValue(textSettings.links.wikiDisplayText).onChange(async (value) => {
					textSettings.links.wikiDisplayText = value;
					await ctx.plugin.saveSettings();
					await ctx.renderSettingsPage("text-conversion");
				});
			});
	}
	const slugifySetting =
		typeof textSettings.links.slugify == "boolean"
			? textSettings.links.slugify
				? "strict"
				: "disable"
			: textSettings.links.slugify;

	const slugifyAnchorSettings =
		typeof textSettings.links.slugifyAnchor == "boolean"
			? textSettings.links.slugifyAnchor
				? "strict"
				: "disable"
			: textSettings.links.slugifyAnchor || "disable";

	if (textSettings.links.wiki || textSettings.links.internal) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.conversion.links.slugify.title"))
			.setDesc(i18next.t("settings.conversion.links.slugify.desc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						disable: i18next.t("settings.conversion.links.slugify.disable"),
						strict: i18next.t("settings.conversion.links.slugify.strict"),
						lower: i18next.t("settings.conversion.links.slugify.lower"),
					})
					.setValue(slugifySetting)
					.onChange(async (value) => {
						textSettings.links.slugify = ["disable", "strict", "lower"].includes(value)
							? (value as "disable" | "strict" | "lower")
							: "disable";
						await ctx.plugin.saveSettings();
					});
			});

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.conversion.links.anchor.title"))
			.setDesc(i18next.t("settings.conversion.links.anchor.desc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						disable: i18next.t("settings.conversion.links.slugify.disable"),
						strict: i18next.t("settings.conversion.links.slugify.strict"),
						lower: i18next.t("settings.conversion.links.slugify.lower"),
					})
					.setValue(slugifyAnchorSettings)
					.onChange(async (value) => {
						textSettings.links.slugifyAnchor = ["disable", "strict", "lower"].includes(
							value
						)
							? (value as "disable" | "strict" | "lower")
							: "disable";
						await ctx.plugin.saveSettings();
					});
			});
	}

	ctx.settingsPage.createEl("h5", {
		text: i18next.t("settings.conversion.sectionTitle"),
	});
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.hardBreak.title"))
		.setDesc(i18next.t("settings.conversion.hardBreak.desc"))
		.addToggle((toggle) => {
			toggle.setValue(textSettings.hardbreak).onChange(async (value) => {
				textSettings.hardbreak = value;
				await ctx.plugin.saveSettings();
			});
		});
	const isDataviewEnabled = (ctx.plugin.app as any).plugins.plugins.dataview;
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.dataview.title"))
		.setDesc(i18next.t("settings.conversion.dataview.desc"))
		.addToggle((toggle) => {
			toggle
				.setValue(
					textSettings.dataview && isDataviewEnabled && textSettings.links.internal
				)
				.setDisabled(!isDataviewEnabled || !textSettings.links.internal)
				.onChange(async (value) => {
					textSettings.dataview = value;
					await ctx.plugin.saveSettings();
				});
		});

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.regexReplacing.modal.title.text"))
		.setDesc(i18next.t("settings.regexReplacing.modal.desc"))
		.addButton((button) => {
			button.setIcon("pencil").onClick(async () => {
				new ModalRegexOnContents(
					ctx.app,
					ctx.copy(ctx.settings) as any,
					async (result) => {
						ctx.settings.conversion.censorText = result.conversion.censorText;
						await ctx.plugin.saveSettings();
					}
				).open();
			});
		});

	ctx.settingsPage.createEl("h5", { text: "Tags" });
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.tags.inlineTags.title"))
		.setDesc(i18next.t("settings.conversion.tags.inlineTags.desc"))
		.addToggle((toggle) => {
			toggle.setValue(textSettings.tags.inline).onChange(async (value) => {
				textSettings.tags.inline = value;
				await ctx.plugin.saveSettings();
			});
		});

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.tags.title"))
		.setDesc(i18next.t("settings.conversion.tags.desc"))
		.addTextArea((text) => {
			text.inputEl.addClass("mid-height");
			text
				.setPlaceholder("field_name")
				.setValue(textSettings.tags.fields.join(","))
				.onChange(async (value) => {
					textSettings.tags.fields = splitByCommaOrNewLineAndNonWord(value);
					await ctx.plugin.saveSettings();
				});
		});
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.conversion.tags.exclude.title"))
		.setDesc(i18next.t("settings.conversion.tags.exclude.desc"))
		.addTextArea((text) => {
			text
				.setPlaceholder(i18next.t("settings.conversion.tags.exclude.placeholder"))
				.setValue(textSettings.tags.exclude.join(","))
				.onChange(async (value) => {
					textSettings.tags.exclude = splitByCommaOrNewLineAndNonWord(value);
					await ctx.plugin.saveSettings();
				});
		});
};
