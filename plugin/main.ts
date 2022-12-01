import { Plugin, TFile, Menu } from "obsidian";
import { GithubPublisherSettings } from "./settings";
import { disablePublish, getRepoFrontmatter } from "./src/utils";
import {
	GitHubPublisherSettings,
	DEFAULT_SETTINGS, RepoFrontmatter,
} from "./settings/interface";
import { GithubBranch } from "./publishing/branch";
import { Octokit } from "@octokit/core";
import {
	deleteUnsharedDeletedNotes,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote,
	shareOnlyEdited,
} from "./commands";
import {StringFunc, commands} from "./i18n";

export default class GithubPublisher extends Plugin {
	settings: GitHubPublisherSettings;

	async onload() {
		console.log("Github Publisher loaded");
		await this.loadSettings();
		this.addSettingTab(new GithubPublisherSettings(this.app, this));
		const convertOldSettings = async () => {
			const oldExcludedSettings = this.settings.autoCleanUpExcluded as unknown as string;
			if (typeof oldExcludedSettings === "string") {
				this.settings.autoCleanUpExcluded = oldExcludedSettings === "" ? [] : oldExcludedSettings.split(/[,\n]\W*/)
				await this.saveSettings();
			}
			this.settings.autoCleanUpExcluded = this.settings.autoCleanUpExcluded.filter((e: string) => e !== "")
			await this.saveSettings();
		};
		convertOldSettings().then();
		const octokit = new Octokit({ auth: this.settings.GhToken });
		const PublisherManager = new GithubBranch(
			this.settings,
			octokit,
			this.app.vault,
			this.app.metadataCache,
			this
		);
		const branchName =
			app.vault.getName().replaceAll(" ", "-").replaceAll('.', '-') +
			"-" +
			new Date().toLocaleDateString("en-US").replace(/\//g, "-");
		const repo = getRepoFrontmatter(this.settings) as RepoFrontmatter;

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				if (
					disablePublish(this.app, this.settings, file) &&
					this.settings.fileMenu
				) {
					menu.addItem((item) => {
						item.setSection("action");
						item.setTitle(
							(commands("shareViewFiles") as StringFunc)(file.basename)
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(
									branchName,
									PublisherManager,
									this.settings,
									file,
									this.app.metadataCache,
									this.app.vault
								);
							});
					});
					menu.addSeparator();
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				if (
					disablePublish(this.app, this.settings, view.file) &&
					this.settings.editorMenu
				) {
					menu.addSeparator();
					menu.addItem((item) => {
						item.setSection("mkdocs-publisher");
						item.setTitle(
							(commands("shareViewFiles") as StringFunc)(
								view.file.basename
							)
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(
									branchName,
									PublisherManager,
									this.settings,
									view.file,
									this.app.metadataCache,
									this.app.vault
								);
							});
					});
				}
			})
		);
		if (this.settings.shareExternalModified) {
			this.registerEvent(
				this.app.vault.on("modify", async (file: TFile) => {
					if (file !== this.app.workspace.getActiveFile()) {
						const isShared = this.app.metadataCache.getFileCache(
							file
						).frontmatter
							? this.app.metadataCache.getFileCache(file).frontmatter[this.settings.shareKey]
							: false;
						if (isShared) {
							await shareOneNote(
								branchName,
								PublisherManager,
								this.settings,
								file,
								this.app.metadataCache,
								this.app.vault
							);
						}
					}
				})
			);
		}

		this.addCommand({
			id: "publisher-one",
			name: commands("shareActiveFile") as string,
			hotkeys: [],
			checkCallback: (checking) => {
				if (
					disablePublish(
						this.app,
						this.settings,
						this.app.workspace.getActiveFile()
					)
				) {
					if (!checking) {
						shareOneNote(
							branchName,
							PublisherManager,
							this.settings,
							this.app.workspace.getActiveFile(),
							this.app.metadataCache,
							this.app.vault
						);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-delete-clean",
			name: commands("publisherDeleteClean") as string,
			hotkeys: [],
			checkCallback: (checking) => {
				if (this.settings.autoCleanUp) {
					if (!checking) {
						deleteUnsharedDeletedNotes(
							PublisherManager,
							this.settings,
							octokit,
							branchName,
							repo
						);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-publish-all",
			name: commands("uploadAllNotes") as string,
			callback: async () => {
				const sharedFiles = PublisherManager.getSharedFiles();
				const statusBarItems = this.addStatusBarItem();
				await shareAllMarkedNotes(
					PublisherManager,
					this.settings,
					octokit,
					statusBarItems,
					branchName,
					repo,
					sharedFiles,
					true
				);
				
				
			},
		});

		this.addCommand({
			id: "publisher-upload-new",
			name: commands("uploadNewNotes") as string,
			callback: async () => {
				await shareNewNote(
					PublisherManager,
					octokit,
					branchName,
					this.app.vault,
					this,
					repo
				);
				
			},
		});

		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: commands("uploadAllNewEditedNote") as string,
			callback: async () => {
				await shareAllEditedNotes(
					PublisherManager,
					octokit,
					branchName,
					this.app.vault,
					this,
					repo
				);
			},
		});

		this.addCommand({
			id: "publisher-upload-edited",
			name: commands("uploadAllEditedNote") as string,
			callback: async () => {
				
				await shareOnlyEdited(
					PublisherManager,
					octokit,
					branchName,
					this.app.vault,
					this,
					repo
				);
			},
		});
	}

	onunload() {
		console.log("Github Publisher unloaded");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
