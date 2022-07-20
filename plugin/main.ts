import {Plugin, TFile, Menu} from "obsidian";
import {
	MkdocsSettingsTab,
} from "./settings";
import { disablePublish } from "./utils/utils";
import {MkdocsPublicationSettings, DEFAULT_SETTINGS} from './settings/interface'
import {GithubBranch} from "./githubInteraction/branch";
import { Octokit } from "@octokit/core";
import {
	deleteUnsharedDeletedNotes,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote, shareOnlyEdited
} from "./utils/commands";
import t, {StringFunc} from "./i18n"


export default class MkdocsPublication extends Plugin {
	settings: MkdocsPublicationSettings;

	async onload() {
		console.log("Github Publisher loaded");
		await this.loadSettings();
		this.addSettingTab(new MkdocsSettingsTab(this.app, this));
		const octokit = new Octokit({auth: this.settings.GhToken});
		
		const PublisherManager = new GithubBranch(this.settings, octokit, this.app.vault, this.app.metadataCache, this);
		const branchName = app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');


		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				if (
					disablePublish(this.app, this.settings, file) &&
					this.settings.fileMenu
				) {
					menu.addItem((item) => {
						item.setSection('action');
						item.setTitle(
							(t("shareViewFiles") as StringFunc)(file.basename)
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(branchName, PublisherManager, this.settings, file, this.app.metadataCache, this.app.vault);
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
						item.setSection('mkdocs-publisher');
						item.setTitle(
							(t("shareViewFiles") as StringFunc)(view.file.basename)
						)
							.setIcon("share")
							.onClick(async () => {
								
								await shareOneNote(branchName, PublisherManager, this.settings, view.file, this.app.metadataCache, this.app.vault);
							});
					});
				}
			})
		);

		this.addCommand({
			id: "publisher-one",
			name: t('shareActiveFile') as string,
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
						shareOneNote(branchName, PublisherManager, this.settings, this.app.workspace.getActiveFile(), this.app.metadataCache, this.app.vault);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-delete-clean",
			name: t('publisherDeleteClean') as string,
			hotkeys: [],
			checkCallback: (checking) => {
				if (this.settings.autoCleanUp) {
					if (!checking) {
						deleteUnsharedDeletedNotes(PublisherManager, this.settings, octokit, branchName);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-publish-all",
			name: t('uploadAllNotes') as string,
			callback: async () => {
				const sharedFiles = PublisherManager.getSharedFiles();
				const statusBarItems = this.addStatusBarItem();
				await shareAllMarkedNotes(PublisherManager, this.settings, octokit, statusBarItems, branchName, sharedFiles, true);
			}
		});
		
		this.addCommand({
			id: "publisher-upload-new",
			name: t('uploadNewNotes') as string,
			callback: async () => {
				await shareNewNote(PublisherManager, octokit, branchName, this.app.vault, this);
			}
		});
		
		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: t('uploadAllNewEditedNote') as string,
			callback: async () => {
				await shareAllEditedNotes(PublisherManager, octokit, branchName, this.app.vault, this);
			}
		});
		
		this.addCommand({
			id: 'publisher-upload-edited',
			name: t('uploadAllEditedNote') as string,
			callback: async () => {
				await shareOnlyEdited(PublisherManager, octokit, branchName, this.app.vault, this);
			}
		})
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
