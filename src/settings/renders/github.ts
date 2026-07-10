import { GithubTiersVersion } from "@interfaces";
import i18next from "i18next";
import { SecretComponent, type SettingDefinitionItem } from "obsidian";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";
import type { RenderContext } from "./index";
import { buildManageRepoPage } from "./manage_repo";

export const buildGithubItems = (ctx: RenderContext): SettingDefinitionItem[] => {
	const githubSettings = ctx.settings.github;

	const ghTokenDesc = createFragment();
	ghTokenDesc.createSpan(undefined, (span) => {
		span.innerText = i18next.t("settings.github.ghToken.desc");
		span.createEl("a", undefined, (link) => {
			link.innerText = `${i18next.t("common.here")}.`;
			link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
		});
	});

	return [
		{
			name: i18next.t("settings.github.apiType.title"),
			desc: i18next.t("settings.github.apiType.desc"),
			control: {
				type: "dropdown",
				key: "github.api.tiersForApi",
				options: {
					[GithubTiersVersion.Free]: i18next.t("settings.github.apiType.dropdown.free"),
					[GithubTiersVersion.Entreprise]: i18next.t(
						"settings.github.apiType.dropdown.enterprise"
					),
				},
			},
		},
		{
			name: i18next.t("settings.github.apiType.hostname.title"),
			desc: i18next.t("settings.github.apiType.hostname.desc"),
			visible: () => githubSettings.api.tiersForApi === GithubTiersVersion.Entreprise,
			control: {
				type: "text",
				key: "github.api.hostname",
				placeholder: "https://github.mycompany.com",
			},
		},
		{
			name: i18next.t("settings.github.username.title"),
			desc: i18next.t("settings.github.username.desc"),
			control: {
				type: "text",
				key: "github.user",
				placeholder: i18next.t("settings.github.username.title"),
			},
		},
		{
			name: i18next.t("settings.github.repoName.title"),
			desc: i18next.t("settings.github.repoName.desc"),
			control: {
				type: "text",
				key: "github.repo",
				placeholder: i18next.t("settings.github.repoName.placeholder"),
			},
		},
		{
			name: i18next.t("common.ghToken"),
			desc: ghTokenDesc,
			render: (setting) => {
				setting.addComponent((el) =>
					new SecretComponent(ctx.app, el)
						.setValue(githubSettings.tokenSecret)
						.onChange(async (value) => {
							githubSettings.tokenSecret = value;
							await ctx.plugin.saveSettings();
						})
				);
			},
		},
		{
			name: i18next.t("settings.github.branch.title"),
			desc: i18next.t("settings.github.branch.desc"),
			control: { type: "text", key: "github.branch", placeholder: "main" },
		},
		{
			name: i18next.t("settings.github.automaticallyMergePR"),
			control: { type: "toggle", key: "github.automaticallyMergePR" },
		},
		{
			name: i18next.t("settings.github.dryRun.enable.title"),
			desc: i18next.t("settings.github.dryRun.enable.desc"),
			control: { type: "toggle", key: "github.dryRun.enable" },
		},
		{
			name: i18next.t("settings.github.dryRun.folder.title"),
			desc: i18next.t("settings.github.dryRun.folder.desc"),
			visible: () => githubSettings.dryRun.enable,
			control: {
				type: "text",
				key: "github.dryRun.folderName",
				placeholder: "enveloppe",
				defaultValue: "enveloppe",
				validate: (value) =>
					value.trim().length === 0
						? i18next.t("settings.github.dryRun.folder.error")
						: undefined,
			},
		},
		buildManageRepoPage(ctx),
		{
			name: "",
			searchable: false,
			render: (setting) => {
				setting.setNoInfo().addButton((button) =>
					button
						.setCta()
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
				);
			},
		},
		{
			type: "group",
			cls: "enveloppe",
			heading: "GitHub Workflow",
			items: [
				{
					name: i18next.t("settings.githubWorkflow.prRequest.title"),
					desc: i18next.t("settings.githubWorkflow.prRequest.desc"),
					control: {
						type: "text",
						key: "github.workflow.commitMessage",
						placeholder: "[PUBLISHER] MERGE",
						defaultValue: "[PUBLISHER] MERGE",
						validate: (value) =>
							value.trim().length === 0
								? i18next.t("settings.githubWorkflow.prRequest.error")
								: undefined,
					},
				},
				{
					name: i18next.t("settings.githubWorkflow.githubAction.title"),
					desc: i18next.t("settings.githubWorkflow.githubAction.desc"),
					render: (setting) => {
						setting.addText((text) => {
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
					},
				},
			],
		},
	];
};
