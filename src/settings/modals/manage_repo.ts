import { type EnveloppeSettings, GithubTiersVersion, type Repository } from "@interfaces";
import i18next from "i18next";
import {
	AbstractInputSuggest,
	type App,
	Modal,
	Notice,
	Setting,
	type TFile,
} from "obsidian";
import type Enveloppe from "src/main";
import { migrateToken } from "src/settings/migrate";
import {
	checkRepositoryValidity,
	verifyRateLimitAPI,
} from "src/utils/data_validation_test";

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
 * @description This class is used to add a new repo to the settings in the "otherRepo" in the github setting section
 * It will list all the repo in the settings and allow the user to add a new one, edit or delete an existing one
 * @extends Modal
 * @param {App} app - the Obsidian App
 * @param {EnveloppeSettings} settings - the plugin settings
 * @param {string} branchName - the branch name
 * @param {Enveloppe} plugin - the plugin
 * @param {Repository[]} repository - the list of repo in the settings
 * @param {(result: Repository[]) => void} onSubmit - the function to call when the modal is submitted
 */

export class ModalAddingNewRepository extends Modal {
	settings: EnveloppeSettings;
	plugin: Enveloppe;
	branchName: string;
	repository: Repository[];
	onSubmit: (result: Repository[]) => void;

	constructor(
		app: App,
		settings: EnveloppeSettings,
		branchName: string,
		plugin: Enveloppe,
		repository: Repository[],
		onSubmit: (result: Repository[]) => void
	) {
		super(app);
		this.settings = settings;
		this.repository = repository;
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		this.branchName = branchName;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "manage-repo", "add"]);
		contentEl.createEl("h2", {
			text: i18next.t("settings.github.smartRepo.modals.title"),
		});
		contentEl.createEl("p", { text: i18next.t("settings.github.smartRepo.modals.desc") });
		contentEl.createEl("p", {
			text: i18next.t("settings.github.smartRepo.modals.frontmatterInfo"),
		});
		contentEl.createEl("p", { text: i18next.t("settings.plugin.shareKey.otherRepo") });

		const defaultRepository: Repository = {
			smartKey: "smartkey",
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
				removePart: [],
				transform: {
					toUri: this.settings.plugin.copyLink.transform.toUri,
					slugify: this.settings.plugin.copyLink.transform.slugify,
					applyRegex: this.settings.plugin.copyLink.transform.applyRegex,
				},
			},
			set: null,
		};

		new Setting(contentEl)
			.setClass("max-width")
			.setClass("display-none")
			.addButton((button) => {
				button

					.setButtonText(
						i18next.t("common.add", {
							things: i18next.t("settings.github.smartRepo.modals.newRepo").toLowerCase(),
						})
					)
					.onClick(() => {
						this.repository.push(defaultRepository);
						this.onOpen();
					});
			});

		for (const repo of this.repository) {
			const sett = new Setting(contentEl)
				.setClass("max-width")
				.setClass("display-none")
				.addText((text) => {
					text
						.setPlaceholder("smartKey")
						.setValue(repo.smartKey)
						.onChange((value) => {
							repo.smartKey = value.toLowerCase();
							sett.controlEl.setAttribute("smartKey", value.toLowerCase());
						});
				})

				.addExtraButton((btn) => {
					btn.setIcon("trash").onClick(() => {
						this.repository.splice(this.repository.indexOf(repo), 1);
						this.onOpen();
					});
				})
				.addExtraButton((btn) => {
					btn.setIcon("pencil").onClick(() => {
						new ModalEditingRepository(
							this.app,
							repo,
							this.plugin,
							this.branchName,
							(result) => {
								this.repository[this.repository.indexOf(repo)] = result;
							}
						).open();
					});
				});
		}
		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText(i18next.t("common.save"))
				.setCta()
				.onClick(() => {
					const error = this.foundError();
					const input =
						error.repo.length > 0
							? this.containerEl.querySelector(`[smartkey="${error.repo}"] input`)
							: contentEl.querySelector('[placeholder="smartKey"] input');
					if (error.type === "None") {
						//remove error
						input?.classList?.remove("error");
						this.onSubmit(this.repository);
						this.close();
					}
					input?.classList?.add("error");
					if (error.type === "duplicate") {
						new Notice(i18next.t("settings.github.smartRepo.modals.duplicate"));
					} else if (error.type === "default") {
						new Notice(i18next.t("settings.github.smartRepo.modals.default"));
					} else if (error.type === "empty") {
						new Notice(i18next.t("settings.github.smartRepo.modals.empty"));
					}
				});
		});
	}

	foundError(): { repo: string; type: "duplicate" | "default" | "empty" | "None" } {
		for (const repo of this.repository) {
			if (
				this.plugin.settings.github.otherRepo.filter((r) => r.smartKey === repo.smartKey)
					.length > 1
			) {
				return { repo: repo.smartKey, type: "duplicate" };
			} else if (repo.smartKey === "default") {
				return { repo: repo.smartKey, type: "default" };
			} else if (repo.smartKey.length === 0) {
				return { repo: "", type: "empty" };
			}
		}
		return { repo: "", type: "None" };
	}

	onClose() {
		const { contentEl } = this;
		const error = this.foundError();
		if (error.type === "empty") {
			//rename the repo
			const repo = this.repository.filter((r) => r.smartKey === error.repo);
			for (let i = 0; i < repo.length; i++) {
				repo[i].smartKey = `smartkey-${i}`;
			}
			new Notice(
				`${i18next.t("settings.github.smartRepo.modals.empty")} ${i18next.t(
					"common.rename"
				)}`
			);
		} else if (error.type === "duplicate") {
			//rename the repo
			const repo = this.repository.filter((r) => r.smartKey === error.repo);
			for (let i = 0; i < repo.length; i++) {
				repo[i].smartKey = `${repo[i].smartKey}-${i}`;
			}
			new Notice(
				`${i18next.t("settings.github.smartRepo.modals.duplicate")} ${i18next.t(
					"common.rename"
				)}`
			);
		} else if (error.type === "default") {
			//rename the repo
			const repo = this.repository.filter((r) => r.smartKey === error.repo);
			for (const r of repo) {
				const randomKey = Math.random().toString(36).substring(2, 8);
				r.smartKey = `${r.smartKey}-${randomKey}`;
			}
			new Notice(
				`${i18next.t("settings.github.smartRepo.modals.default")} ${i18next.t(
					"common.rename"
				)}`
			);
		}
		this.onSubmit(this.repository);
		contentEl.empty();
	}
}

/**
 * @description Called by the ModalAddingNewRepository class, this class is used to edit an existing repo
 * @extends Modal
 * @param {App} app - The Obsidian App instance
 * @param {Repository} repository - The repository to edit
 * @param {Enveloppe} Enveloppe - The Enveloppe instance
 * @param {string} brancheName - The name of the branch (for validation)
 * @param {function} onSubmit - The function to call when the modal is closed (to save the changes)
 */

class ModalEditingRepository extends Modal {
	repository: Repository;
	branchName: string;
	plugin: Enveloppe;
	onSubmit: (result: Repository) => void;

	constructor(
		app: App,
		repository: Repository,
		Enveloppe: Enveloppe,
		brancheName: string,
		onSubmit: (result: Repository) => void
	) {
		super(app);
		this.repository = repository;
		this.onSubmit = onSubmit;
		this.branchName = brancheName;
		this.plugin = Enveloppe;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "manage-repo", "edit"]);
		new Setting(contentEl)
			.setClass("no-display")
			.addButton((button) =>
				button
					.setCta()
					.setButtonText(i18next.t("common.save"))
					.onClick(async () => {
						this.onSubmit(this.repository);
						this.close();
					})
			)
			.addButton((button) =>
				button
					.setWarning()
					.setButtonText(i18next.t("common.cancel"))
					.onClick(async () => {
						this.close();
					})
			);
		contentEl.createEl("h2", {
			text: i18next.t("common.edit", { things: this.repository.smartKey }),
		});

		new Setting(contentEl)
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
					.setValue(this.repository.api.tiersForApi)
					.onChange((value) => {
						this.repository.api.tiersForApi = value as GithubTiersVersion;
						this.onOpen();
					});
			});
		if (this.repository.api.tiersForApi === GithubTiersVersion.Entreprise) {
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
					.setPlaceholder(i18next.t("settings.github.username.title"))
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
		const descGhToken = document.createDocumentFragment();
		descGhToken.createEl("span", undefined, (span) => {
			span.innerText = i18next.t("settings.github.ghToken.desc");
			span.createEl("a", undefined, (link) => {
				link.innerText = `${i18next.t("common.here")}.`;
				link.href = "https://github.com/settings/tokens/new?scopes=repo,workflow";
			});
		});
		new Setting(contentEl)
			.setName(i18next.t("common.ghToken"))
			.setDesc(descGhToken)
			.addText(async (text) => {
				const decryptedToken: string = await this.plugin.loadToken(
					this.repository.smartKey
				);
				text
					.setPlaceholder("ghp_1234567890")
					.setValue(decryptedToken)
					.onChange(async (value) => {
						await migrateToken(this.plugin, value.trim(), this.repository.smartKey);
					});
			});
		new Setting(contentEl)
			.setName(i18next.t("settings.github.automaticallyMergePR"))
			.addToggle((toggle) =>
				toggle.setValue(this.repository.automaticallyMergePR).onChange(async (value) => {
					this.repository.automaticallyMergePR = value;
				})
			);
		new Setting(contentEl).setClass("no-display").addButton((button) =>
			button
				.setButtonText(i18next.t("settings.github.testConnection"))
				.setClass("connect")
				.onClick(async () => {
					const octokit = await this.plugin.reloadOctokit(this.repository.smartKey);
					this.repository.verifiedRepo = await checkRepositoryValidity(
						octokit,
						this.repository,
						null
					);
					this.plugin.settings.github.rateLimit = await verifyRateLimitAPI(
						octokit.octokit,
						this.plugin
					);
				})
		);
		new Setting(contentEl)
			.setName(i18next.t("settings.github.smartRepo.modals.shortcuts.title"))
			.setDesc(i18next.t("settings.github.smartRepo.modals.shortcuts.desc"))
			.addToggle((toggle) =>
				toggle.setValue(this.repository.createShortcuts).onChange(async (value) => {
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
			.setDesc(i18next.t("settings.githubWorkflow.githubAction.desc"))
			.addText((text) => {
				text
					.setPlaceholder("ci")
					.setValue(this.repository.workflow.name)
					.onChange(async (value) => {
						if (value.length > 0) {
							value = value.trim();
							const yamlEndings = [".yml", ".yaml"];
							if (!yamlEndings.some((ending) => value.endsWith(ending))) {
								value += yamlEndings[0];
							}
						}
						this.repository.workflow.name = value;
					});
			});

		contentEl.createEl("h3", {
			text: i18next.t("settings.github.smartRepo.modals.otherConfig"),
		});

		new Setting(contentEl)
			.setName(i18next.t("settings.plugin.setImport.title"))
			.setDesc(i18next.t("settings.plugin.setImport.desc"))
			.addSearch((search) => {
				search.setValue(this.repository.set ?? "").setPlaceholder("path/to/file.md");
				new SetClassSuggester(search.inputEl, this.plugin, (result) => {
					this.repository.set = result.path;
					const frontmatter =
						this.plugin.app.metadataCache.getFileCache(result)?.frontmatter;
					this.plugin.repositoryFrontmatter[this.repository.smartKey] = frontmatter;
				});
			});

		new Setting(contentEl)
			.setName(i18next.t("settings.plugin.shareKey.all.title"))
			.setDesc(i18next.t("settings.plugin.shareKey.all.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.repository.shareAll?.enable ?? false)
					.onChange(async (value) => {
						this.repository.shareAll = {
							enable: value,
							excludedFileName:
								this.plugin.settings.plugin.shareAll?.excludedFileName ?? "DRAFT",
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
						})
				);
		} else {
			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.shareKey.excludedFileName.title"))
				.addText((text) =>
					text
						.setPlaceholder("DRAFT")
						.setValue(
							this.repository.shareAll?.excludedFileName ??
								this.plugin.settings.plugin.shareAll?.excludedFileName ??
								"DRAFT"
						)
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
				.setDesc(i18next.t("settings.plugin.copyLink.linkPathRemover.desc"))
				.addText((text) => {
					text
						.setPlaceholder("docs")
						.setValue(this.repository.copyLink.removePart.join(", "))
						.onChange(async (value) => {
							this.repository.copyLink.removePart = value
								.split(/[,\n]\s*/)
								.map((item) => item.trim())
								.filter((item) => item.length > 0);
						});
				});

			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.copyLink.toUri.title"))
				.setDesc(i18next.t("settings.plugin.copyLink.toUri.desc"))
				.addToggle((toggle) =>
					toggle
						.setValue(this.repository.copyLink.transform.toUri)
						.onChange(async (value) => {
							this.repository.copyLink.transform.toUri = value;
						})
				);

			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.copyLink.slugify.title"))
				.addDropdown((dropdown) => {
					dropdown
						.addOptions({
							disable: i18next.t("settings.plugin.copyLink.slugify.disable"),
							strict: i18next.t("settings.plugin.copyLink.slugify.strict"),
							lower: i18next.t("settings.plugin.copyLink.slugify.lower"),
						})
						.setValue(
							this.repository.copyLink.transform.slugify as "disable" | "strict" | "lower"
						)
						.onChange(async (value) => {
							this.repository.copyLink.transform.slugify = value as
								| "disable"
								| "strict"
								| "lower";
						});
				});

			new Setting(contentEl)
				.setName(i18next.t("settings.plugin.copyLink.applyRegex.title"))
				.setHeading()
				.setDesc(i18next.t("settings.plugin.copyLink.applyRegex.desc"))
				.addExtraButton((button) => {
					button.setIcon("plus").onClick(async () => {
						this.repository.copyLink.transform.applyRegex.push({
							regex: "",
							replacement: "",
						});

						this.onOpen();
					});
				});

			for (const apply of this.repository.copyLink.transform.applyRegex) {
				const regex = apply.regex;
				const replacement = apply.replacement;

				new Setting(contentEl)
					.setClass("no-display")
					.addText((text) => {
						text
							.setPlaceholder("regex")
							.setValue(regex)
							.onChange(async (value) => {
								apply.regex = value;
							});
					})
					.setClass("max-width")
					.addText((text) => {
						text
							.setPlaceholder("replacement")
							.setValue(replacement)
							.onChange(async (value) => {
								apply.replacement = value;
							});
					})
					.setClass("max-width")
					.addExtraButton((button) => {
						button.setIcon("trash").onClick(async () => {
							this.repository.copyLink.transform.applyRegex =
								this.repository.copyLink.transform.applyRegex.filter(
									(item) => item !== apply
								);

							this.onOpen();
						});
					});
			}
		}
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
