import { ESettingsTabId } from "@interfaces";
import dedent from "dedent";
import i18next from "i18next";
import { Setting, sanitizeHTMLToDom } from "obsidian";
import { OverrideAttachmentsModal } from "src/settings/modals/regex_edition";
import { type RenderContext, splitByCommaOrNewLineAndNonWord } from "./index";

export const renderEmbedConfiguration = async (ctx: RenderContext) => {
	ctx.settingsPage.empty();
	const embedSettings = ctx.settings.embed;
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.embed.sendSimpleLinks.title"))
		.setDesc(i18next.t("settings.embed.sendSimpleLinks.desc"))
		.addToggle((toggle) => {
			toggle.setValue(embedSettings.sendSimpleLinks).onChange(async (value) => {
				embedSettings.sendSimpleLinks = value;
				await ctx.plugin.saveSettings();
				await renderEmbedConfiguration(ctx);
			});
		});

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.embed.forcePush.title"))
		.setDesc(i18next.t("settings.embed.forcePush.desc"))
		.addToggle((toggle) =>
			toggle.setValue(embedSettings.forcePush ?? true).onChange(async (value) => {
				embedSettings.forcePush = value;
				await ctx.plugin.saveSettings();
			})
		);

	ctx.settingsPage.createEl("h5", {
		text: i18next.t("settings.embed.attachment"),
		cls: "center",
	});

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.embed.transferImage.title"))
		.addToggle((toggle) => {
			toggle.setValue(embedSettings.attachments).onChange(async (value) => {
				embedSettings.attachments = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage(ESettingsTabId.Embed);
			});
		});

	if (embedSettings.attachments) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.embed.imagePath.title"))
			.setDesc(i18next.t("settings.embed.imagePath.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(embedSettings.useObsidianFolder ?? false)
					.onChange(async (value) => {
						embedSettings.useObsidianFolder = value;
						await ctx.plugin.saveSettings();
						await ctx.renderSettingsPage(ESettingsTabId.Embed);
					});
			});
		if (!embedSettings.useObsidianFolder) {
			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.embed.defaultImageFolder.title"))
				.setDesc(i18next.t("settings.embed.defaultImageFolder.desc"))
				.addText((text) => {
					text
						.setPlaceholder("docs/images")
						.setValue(embedSettings.folder)
						.onChange(async (value) => {
							embedSettings.folder = value.replace(/\/$/, "");
							await ctx.plugin.saveSettings();
						});
				});
		}

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.embed.overrides.modal.title"))
			.setDesc(i18next.t("settings.embed.overrides.desc"))
			.addButton((button) => {
				button.setIcon("pencil").onClick(async () => {
					new OverrideAttachmentsModal(
						ctx.app,
						ctx.settings,
						ctx.copy(embedSettings.overrideAttachments) as any,
						async (result) => {
							embedSettings.overrideAttachments = result;
							await ctx.plugin.saveSettings();
						}
					).open();
				});
			});

		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.embeds.unHandledObsidianExt.title"))
			.setDesc(i18next.t("settings.embeds.unHandledObsidianExt.desc"))
			.addTextArea((text) => {
				text
					.setPlaceholder("py, mdx")
					.setValue((embedSettings.unHandledObsidianExt || []).join(", "))
					.onChange(async (value) => {
						embedSettings.unHandledObsidianExt = splitByCommaOrNewLineAndNonWord(value);
						await ctx.plugin.saveSettings();
					});
			});
	}

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.embed.transferMetaFile.title"))
		.setDesc(i18next.t("settings.embed.transferMetaFile.desc"))
		.addTextArea((text) => {
			text
				.setPlaceholder("banner")
				.setValue((embedSettings.keySendFile || []).join(", "))
				.onChange(async (value) => {
					embedSettings.keySendFile = splitByCommaOrNewLineAndNonWord(value);
					await ctx.plugin.saveSettings();
				});
		});

	ctx.settingsPage.createEl("h5", {
		text: i18next.t("settings.embed.notes"),
		cls: "center",
	});

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.embed.transferNotes.title"))
		.setDesc(i18next.t("settings.embed.transferNotes.desc"))
		.addToggle((toggle) => {
			toggle.setValue(embedSettings.notes).onChange(async (value) => {
				embedSettings.notes = value;
				await ctx.plugin.saveSettings();
				await renderEmbedConfiguration(ctx);
			});
		});

	if (embedSettings.notes) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.embed.links.title"))
			.setDesc(i18next.t("settings.embed.links.desc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("keep", i18next.t("settings.embed.links.dp.keep"))
					.addOption("remove", i18next.t("settings.embed.links.dp.remove"))
					.addOption("links", i18next.t("settings.embed.links.dp.links"))
					.addOption("bake", i18next.t("settings.embed.links.dp.bake"))
					.setValue(embedSettings.convertEmbedToLinks ?? "keep")
					.onChange(async (value) => {
						embedSettings.convertEmbedToLinks = value as
							| "keep"
							| "remove"
							| "links"
							| "bake";
						await ctx.plugin.saveSettings();
						await renderEmbedConfiguration(ctx);
					});
			});

		if (embedSettings.convertEmbedToLinks === "links") {
			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.embed.char.title"))
				.setDesc(i18next.t("settings.embed.char.desc"))
				.addText((text) => {
					text
						.setPlaceholder("->")
						.setValue(embedSettings.charConvert ?? "->")
						.onChange(async (value) => {
							embedSettings.charConvert = value;
							await ctx.plugin.saveSettings();
						});
				});
		} else if (embedSettings.convertEmbedToLinks === "bake") {
			if (!embedSettings.bake) {
				embedSettings.bake = {
					textBefore: "",
					textAfter: "",
				};
				await ctx.plugin.saveSettings();
			}
			await ctx.plugin.saveSettings();

			const bakeEmbedDesc = dedent(`
				<h5>${i18next.t("settings.embed.bake.title")}</h5>
				<p>${i18next.t("settings.embed.bake.text")}. <span class="bake">${i18next.t("settings.embed.bake.variable.desc")}</span>
				<ul>
					<li><code>{{title}}</code>${i18next.t("settings.embed.bake.variable.title")}</li>
					<li><code>{{url}}</code>${i18next.t("settings.embed.bake.variable.url")}</li>
				</ul></p>
				<p class="warning embed">! ${i18next.t("settings.embed.bake.warning")}</p>
			`);

			ctx.settingsPage.appendChild(sanitizeHTMLToDom(bakeEmbedDesc));

			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.embed.bake.textBefore.title"))
				.addTextArea((text) => {
					text.setValue(embedSettings.bake?.textBefore ?? "").onChange(async (value) => {
						embedSettings.bake!.textBefore = value;
						await ctx.plugin.saveSettings();
					});
				});

			new Setting(ctx.settingsPage)
				.setName(i18next.t("settings.embed.bake.textAfter.title"))
				.addTextArea((text) => {
					text.setValue(embedSettings.bake?.textAfter ?? "").onChange(async (value) => {
						embedSettings.bake!.textAfter = value;
						await ctx.plugin.saveSettings();
					});
				});
		}
	}
};
