import i18next from "i18next";
import {App, Modal, Notice, Setting} from "obsidian";

import GithubPublisherPlugin from "../../main";
import {checkRepositoryValidity, verifyRateLimitAPI} from "../../utils/data_validation_test";
import {GitHubPublisherSettings, GithubTiersVersion, Repository} from "../interface";

/**
 * @description This class is used to add a new repo to the settings in the "otherRepo" in the github setting section
 * It will list all the repo in the settings and allow the user to add a new one, edit or delete an existing one
 * @extends Modal
 * @param {App} app - the Obsidian App
 * @param {GitHubPublisherSettings} settings - the plugin settings
 * @param {string} branchName - the branch name
 * @param {GithubPublisherPlugin} plugin - the plugin
 * @param {Repository[]} repository - the list of repo in the settings
 * @param {(result: Repository[]) => void} onSubmit - the function to call when the modal is submitted
 */

export class ModalAddingNewRepository extends Modal {
	settings: GitHubPublisherSettings;
	plugin: GithubPublisherPlugin;
	branchName: string;
	repository: Repository[];
	onSubmit: (result: Repository[]) => void;

	constructor(
		app: App,
		settings: GitHubPublisherSettings,
		branchName: string,
		plugin: GithubPublisherPlugin,
		repository: Repository[],
		onSubmit: (result: Repository[]) => void) {
		super(app);
		this.settings = settings;
		this.repository = repository;
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		this.branchName = branchName;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClasses(["github-publisher", "modals", "manage-repo", "add"]);
		contentEl.createEl("h2", {text: i18next.t("settings.github.smartRepo.modals.title")});
		contentEl.createEl("p", {text: i18next.t("settings.github.smartRepo.modals.desc")});
		contentEl.createEl("p", {text: i18next.t("settings.github.smartRepo.modals.frontmatterInfo")});
		contentEl.createEl("p", {text: i18next.t("settings.plugin.shareKey.otherRepo")});


		const defaultRepository: Repository = {
			smartKey: "",
			user: this.settings.github.user,
			repo: this.settings.github.repo,
			branch: this.settings.github.branch,
			automaticallyMergePR: this.settings.github.automaticallyMergePR,
			api: {
				tiersForApi: this.settings.github.api.tiersForApi,
				hostname: this.settings.github.api.hostname,
			},
			workflow: {
				commitMessage: this.settings.github.workflow.commitMessage,
				name: "",
			},
			createShortcuts: false,
			shareKey: this.settings.plugin.shareKey,
			copyLink: {
				links: this.settings.plugin.copyLink.links,
				removePart: []
			}
		};

		new Setting(contentEl)
			.setClass("max-width")
			.setClass("display-none")
			.addButton((button) => {
				button

					.setButtonText(i18next.t("common.add", {things: i18next.t("settings.github.smartRepo.modals.newRepo").toLowerCase()}))
					.onClick(() => {
						this.repository.push(defaultRepository);
						this.onOpen();
					});
			});

		for (const repo of this.repository) {
			new Setting(contentEl)
				.setClass("max-width")
				.setClass("display-none")
				.addText((text) => {
					text
						.setPlaceholder("smartKey")
						.setValue(repo.smartKey)
						.onChange((value) => {
							repo.smartKey = value.toLowerCase();
							if (this.plugin.settings.github.otherRepo.filter((r) => r.smartKey === repo.smartKey).length > 1) {
								new Notice(i18next.t("settings.github.smartRepo.modals.duplicate"));
								text.inputEl.addClass("error");
								repo.smartKey = "";
							} else if (repo.smartKey === "default") {
								text.inputEl.addClass("error");
								repo.smartKey = "";
								new Notice(i18next.t("settings.github.smartRepo.modals.default") as string);
							} else {
								text.inputEl.removeClass("error");
							}
						});

				})

				.addExtraButton((btn) => {
					btn
						.setIcon("trash")
						.onClick(() => {
							this.repository.splice(this.repository.indexOf(repo), 1);
							this.onOpen();
						});
				})
				.addExtraButton((btn) => {
					btn
						.setIcon("pencil")
						.onClick(() => {
							new ModalEditingRepository(this.app, repo, this.plugin, this.branchName, (result) => {
								this.repository[this.repository.indexOf(repo)] = result;
							}).open();
						});
				});

		}
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText(i18next.t("common.save"))
					.onClick(() => {
						this.onSubmit(this.repository);
						this.close();
					});
			});
	}
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
		this.onSubmit(this.repository);
	}
}

/**
 * @description Called by the ModalAddingNewRepository class, this class is used to edit an existing repo
 * @extends Modal
 * @param {App} app - The Obsidian App instance
 * @param {Repository} repository - The repository to edit
 * @param {GithubPublisherPlugin} GithubPublisherPlugin - The GithubPublisherPlugin instance
 * @param {string} brancheName - The name of the branch (for validation)
 * @param {function} onSubmit - The function to call when the modal is closed (to save the changes)
 */

class ModalEditingRepository extends Modal {
	repository: Repository;
	branchName: string;
	plugin: GithubPublisherPlugin;
	onSubmit: (result: Repository) => void;

	constructor(
		app: App,
		repository: Repository,
		GithubPublisherPlugin: GithubPublisherPlugin,
		brancheName: string,
		onSubmit: (result: Repository) => void) {
		super(app);
		this.repository = repository;
		this.onSubmit = onSubmit;
		this.branchName = brancheName;
		this.plugin = GithubPublisherPlugin;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClasses(["github-publisher", "modals", "manage-repo"]);
		contentEl.createEl("h2", {text: i18next.t("common.edit", {things: this.repository.smartKey})});

		new Setting(contentEl)
			.setName(i18next.t("settings.github.apiType.title"))
			.setDesc(i18next.t("settings.github.apiType.desc"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption(GithubTiersVersion.free, i18next.t("settings.github.apiType.dropdown.free"))
					.addOption(GithubTiersVersion.entreprise, i18next.t("settings.github.apiType.dropdown.enterprise"))
					.setValue(this.repository.api.tiersForApi)
					.onChange((value) => {
						this.repository.api.tiersForApi = value as GithubTiersVersion;
						this.onOpen();
					});
			});
		if (this.repository.api.tiersForApi === GithubTiersVersion.entreprise) {
			new Setting(contentEl)
				.setName(i18next.t("settings.github.apiType.hostname.title"))
				.setDesc(i18next.t("settings.github.apiType.hostname.desc"))
				.addText((text) =>
					text
						.setPlaceholder("https://github.mycompany.com")
						.setValue(this.repository.api.hostname)
						.onChange(async (value) => {
							this.repository.api.hostname = value.trim();
						})
				);
		}
		
		new Setting(contentEl)
			.setName(i18next.t("settings.github.username.title"))
			.setDesc(i18next.t("settings.github.username.desc"))
			.addText((text) =>
				text
					.setPlaceholder(
						i18next.t("settings.github.username.title")
					)
					.setValue(this.repository.user)
					.onChange(async (value) => {
						this.repository.user = value.trim();
					})
			);
		
		new Setting(contentEl)
			.setName(i18next.t("settings.github.repoName.title"))
			.setDesc(i18next.t("settings.github.repoName.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18next.t("settings.github.repoName.placeholder"))
					.setValue(this.repository.repo)
					.onChange(async (value) => {
						this.repository.repo = value.trim();
					})
			);
				
		new Setting(contentEl)
			.setName(i18next.t("settings.github.branch.title"))
			.setDesc(i18next.t("settings.github.branch.desc"))
			.addText((text) =>
				text
					.setPlaceholder("main")
					.setValue(this.repository.branch)
					.onChange(async (value) => {
						this.repository.branch = value.trim();
					})
			);
		new Setting(contentEl)
			.setName(i18next.t("settings.github.automaticallyMergePR"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.repository.automaticallyMergePR)
					.onChange(async (value) => {
						this.repository.automaticallyMergePR = value;
					})
			);
		new Setting(contentEl)
			.setClass("github-publisher-no-display")
			.addButton((button) =>
				button
					.setButtonText(i18next.t("settings.github.testConnection"))
					.setClass("connect")
					.onClick(async () => {
						const octokit = await this.plugin.reloadOctokit();
						this.repository.verifiedRepo = await checkRepositoryValidity(
							octokit,
							this.repository, 
							null);
						this.plugin.settings.github.rateLimit = await verifyRateLimitAPI(octokit.octokit, this.plugin.settings);
					})
			);
		new Setting(contentEl)
			.setName(i18next.t("settings.github.smartRepo.modals.shortcuts.title"))
			.setDesc(i18next.t("settings.github.smartRepo.modals.shortcuts.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.repository.createShortcuts)
					.onChange(async (value) => {
						this.repository.createShortcuts = value;
					})
			);

		contentEl.createEl("h3", { text: "GitHub Workflow" });
		new Setting(contentEl)
			.setName(i18next.t("settings.githubWorkflow.prRequest.title"))
			.setDesc(i18next.t("settings.githubWorkflow.prRequest.desc"))
			.addText((text) =>
				text
					.setPlaceholder("[PUBLISHER] MERGE")
					.setValue(this.repository.workflow.commitMessage)
					.onChange(async (value) => {
						if (value.trim().length === 0) {
							value = "[PUBLISHER] MERGE";
							new Notice(i18next.t("settings.githubWorkflow.prRequest.error"));
						}
						this.repository.workflow.commitMessage = value;
					})
			);
		new Setting(contentEl)
			.setName(i18next.t("settings.githubWorkflow.githubAction.title"))
			.setDesc(
				i18next.t("settings.githubWorkflow.githubAction.desc")
			)
			.addText((text) => {
				text.setPlaceholder("ci")
					.setValue(this.repository.workflow.name)
					.onChange(async (value) => {
						if (value.length > 0) {
							value = value.trim();
							const yamlEndings = [".yml", ".yaml"];
							if (! yamlEndings.some(ending => value.endsWith(ending))) {
								value += yamlEndings[0];
							}
						}
						this.repository.workflow.name = value;
					});
			});

		contentEl.createEl("h3", { text: i18next.t("settings.github.smartRepo.modals.otherConfig") });

		new Setting(contentEl)
			.setName(i18next.t("settings.plugin.shareKey.all.title"))
			.setDesc(i18next.t("settings.plugin.shareKey.all.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.repository.shareAll?.enable ?? false)
					.onChange(async (value) => {
						this.repository.shareAll = {
							enable: value,
							excludedFileName: this.plugin.settings.plugin.shareAll?.excludedFileName ?? "DRAFT"
						};
						this.onOpen();
					})
			);
		if (!this.repository.shareAll || !this.repository.shareAll.enable) {
			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.shareKey.title"))
				.setDesc(i18next.t("settings.plugin.shareKey.desc"))
				.addText((text) =>
					text
						.setPlaceholder("share")
						.setValue(this.repository.shareKey)
						.onChange(async (value) => {
							this.repository.shareKey = value.trim();
							await this.plugin.saveSettings();
						})
				);
		} else {
			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.shareKey.excludedFileName.title"))
				.addText((text) =>
					text
						.setPlaceholder("DRAFT")
						.setValue(this.repository.shareAll?.excludedFileName ?? this.plugin.settings.plugin.shareAll?.excludedFileName ?? "DRAFT")
						.onChange(async (value) => {
							this.repository.shareAll!.excludedFileName = value.trim();
						})
				);
		}

		if (this.plugin.settings.plugin.copyLink.enable) {
			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.copyLink.baselink.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.baselink.desc"))
				.addText((text) =>
					text
						.setPlaceholder(this.plugin.settings.plugin.copyLink.links)
						.setValue(this.repository.copyLink.links)
						.onChange(async (value) => {
							this.repository.copyLink.links = value.trim();
						})
				);

			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.copyLink.linkPathRemover.title"))
				.setDesc(
					i18next.t("settings.plugin.copyLink.linkPathRemover.desc")
				)
				.addText((text) => {
					text.setPlaceholder("docs")
						.setValue(this.repository.copyLink.removePart.join(", "))
						.onChange(async (value) => {
							this.repository.copyLink.removePart = value.split(/[,\n]\s*/).map((item) => item.trim()).filter((item) => item.length > 0);
							await this.plugin.saveSettings();
						});
				});
		}

		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText(i18next.t("common.save"))
					.onClick(async () => {
						this.onSubmit(this.repository);
						this.close();
					})
			);
	}
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
		this.onSubmit(this.repository);
	}
}
