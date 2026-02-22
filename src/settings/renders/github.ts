import { ESettingsTabId, GithubTiersVersion, type Repository } from "@interfaces";
import i18next from "i18next";
import { Notice, SecretComponent, Setting } from "obsidian";
import { migrateToken } from "src/settings/migrate";
import { ModalAddingNewRepository } from "src/settings/modals/manage_repo";
import { TokenEditPath } from "src/settings/modals/token_path";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import type { RenderContext } from "./index";

export const renderGithubConfiguration = (ctx: RenderContext) => {
	const githubSettings = ctx.settings.github;
	new Setting(ctx.settingsPage)
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
				.setValue(githubSettings.api.tiersForApi)
				.onChange(async (value) => {
					githubSettings.api.tiersForApi = value as GithubTiersVersion;
					await ctx.plugin.saveSettings();
					await ctx.renderSettingsPage(ESettingsTabId.Github);
				});
		});
	if (githubSettings.api.tiersForApi === GithubTiersVersion.Entreprise) {
		new Setting(ctx.settingsPage)
			.setName(i18next.t("settings.github.apiType.hostname.title"))
			.setDesc(i18next.t("settings.github.apiType.hostname.desc"))
			.addText((text) =>
				text
					.setPlaceholder("https://github.mycompany.com")
					.setValue(githubSettings.api.hostname)
					.onChange(async (value) => {
						githubSettings.api.hostname = value.trim();
						await ctx.plugin.saveSettings();
					})
			);
	}

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.github.username.title"))
		.setDesc(i18next.t("settings.github.username.desc"))
		.addText((text) =>
			text
				.setPlaceholder(i18next.t("settings.github.username.title"))
				.setValue(githubSettings.user)
				.onChange(async (value) => {
					githubSettings.user = value.trim();
					await ctx.plugin.saveSettings();
				})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.github.repoName.title"))
		.setDesc(i18next.t("settings.github.repoName.desc"))
		.addText((text) =>
			text
				.setPlaceholder(i18next.t("settings.github.repoName.placeholder"))
				.setValue(githubSettings.repo)
				.onChange(async (value) => {
					githubSettings.repo = value.trim();
					await ctx.plugin.saveSettings();
				})
		);

	const descGhToken = document.createDocumentFragment();
	descGhToken.createEl("span", undefined, (span) => {
		span.innerText = i18next.t("settings.github.ghToken.desc");
		span.createEl("a", undefined, (link) => {
			link.innerText = `${i18next.t("common.here")}.`;
			link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
		});
	});
	/**
	 * @deprecated
	const tokenSettings = new Setting(ctx.settingsPage)
		.setName(i18next.t("common.ghToken"))
		.setDesc(descGhToken)
		.addText(async (text) => {
			const decryptedToken: string = await ctx.plugin.loadToken();
			text
				.setPlaceholder("ghp_15457498545647987987112184")
				.setValue(decryptedToken)
				.onChange(async (value) => {
					if (value.trim().length === 0) {
						tokenSettings.controlEl.addClass("error");
						new Notice(
							i18next.t("settings.github.ghToken.error"),
							ctx.settings.plugin.noticeLength
						);
					} else {
						tokenSettings.controlEl.removeClass("error");
						await migrateToken(ctx.plugin, value.trim());
					}
					await ctx.plugin.saveSettings();
				});
		})
		.addExtraButton((button) => {
			button
				.setIcon("edit")
				.setTooltip(i18next.t("settings.github.ghToken.button.tooltip"))
				.onClick(async () => {
					const token = await ctx.plugin.loadToken();
					new TokenEditPath(ctx.app, ctx.plugin, token).open();
					await ctx.plugin.saveSettings();
				});
		});
		*/

	new Setting(ctx.settingsPage)
		.setName(i18next.t("common.ghToken"))
		.setDesc(descGhToken)
		.addComponent((el) =>
			new SecretComponent(ctx.app, el)
				.setValue(githubSettings.tokenSecret)
				.onChange(async (value) => {
					githubSettings.tokenSecret = value;
					await ctx.plugin.saveSettings();
				})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.github.branch.title"))
		.setDesc(i18next.t("settings.github.branch.desc"))
		.addText((text) =>
			text
				.setPlaceholder("main")
				.setValue(githubSettings.branch)
				.onChange(async (value) => {
					githubSettings.branch = value.trim();
					await ctx.plugin.saveSettings();
				})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.github.automaticallyMergePR"))
		.addToggle((toggle) =>
			toggle.setValue(githubSettings.automaticallyMergePR).onChange(async (value) => {
				githubSettings.automaticallyMergePR = value;
				await ctx.plugin.saveSettings();
			})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.github.dryRun.enable.title"))
		.setDesc(i18next.t("settings.github.dryRun.enable.desc"))
		.addToggle((toggle) =>
			toggle.setValue(githubSettings.dryRun.enable).onChange(async (value) => {
				githubSettings.dryRun.enable = value;
				await ctx.plugin.saveSettings();
				await ctx.renderSettingsPage(ESettingsTabId.Github);
			})
		);

	const defaultFolderName =
		githubSettings.dryRun.folderName.trim().length > 0
			? githubSettings.dryRun.folderName
			: "enveloppe";

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.github.dryRun.folder.title"))
		.setDesc(i18next.t("settings.github.dryRun.folder.desc"))
		.addText((text) =>
			text
				.setPlaceholder("enveloppe")
				.setValue(defaultFolderName)
				.onChange(async (value) => {
					githubSettings.dryRun.folderName = value.trim();
					if (value.trim().length === 0) {
						new Notice(
							i18next.t("settings.github.dryRun.folder.error"),
							ctx.settings.plugin.noticeLength
						);
						text.inputEl.addClass("error");
					} else {
						text.inputEl.removeClass("error");
						await ctx.plugin.saveSettings();
					}
				})
		);

	new Setting(ctx.settingsPage)
		.setClass("no-display")
		.addButton((button) =>
			button
				.setButtonText(i18next.t("settings.github.testConnection"))
				.setClass("connect-button")
				.onClick(async () => {
					const octokit = await ctx.plugin.reloadOctokit();
					ctx.settings.github.verifiedRepo = await checkRepositoryValidity(
						octokit,
						null,
						null
					);
					ctx.settings.github.rateLimit = await verifyRateLimitAPI(
						octokit.octokit,
						ctx.plugin
					);
					await ctx.plugin.saveSettings();
				})
		)
		.addButton((button) =>
			button
				.setButtonText(i18next.t("settings.github.smartRepo.button"))
				.onClick(async () => {
					const repository: Repository[] =
						ctx.copy(ctx.settings.github?.otherRepo ?? []) ?? [];
					new ModalAddingNewRepository(
						ctx.app,
						ctx.settings,
						ctx.branchName,
						ctx.plugin,
						repository,
						async (result) => {
							ctx.settings.github.otherRepo = result;
							await ctx.plugin.saveSettings();
							await ctx.plugin.reloadCommands();
						}
					).open();
				})
		);
	ctx.settingsPage.createEl("h3", { text: "GitHub Workflow" });
	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.githubWorkflow.prRequest.title"))
		.setDesc(i18next.t("settings.githubWorkflow.prRequest.desc"))
		.addText((text) =>
			text
				.setPlaceholder("[PUBLISHER] MERGE")
				.setValue(githubSettings.workflow.commitMessage)
				.onChange(async (value) => {
					if (value.trim().length === 0) {
						value = "[PUBLISHER] MERGE";
						new Notice(
							i18next.t("settings.githubWorkflow.prRequest.error"),
							ctx.settings.plugin.noticeLength
						);
					}
					githubSettings.workflow.commitMessage = value;
					await ctx.plugin.saveSettings();
				})
		);

	new Setting(ctx.settingsPage)
		.setName(i18next.t("settings.githubWorkflow.githubAction.title"))
		.setDesc(i18next.t("settings.githubWorkflow.githubAction.desc"))
		.addText((text) => {
			text
				.setPlaceholder("ci")
				.setValue(githubSettings.workflow.name)
				.onChange(async (value) => {
					if (value.length > 0) {
						value = value.trim();
						const yamlEndings = [".yml", ".yaml"];
						if (!yamlEndings.some((ending) => value.endsWith(ending))) {
							value += yamlEndings[0];
						}
					}
					githubSettings.workflow.name = value;
					await ctx.plugin.saveSettings();
				});
		});
};
