import {Plugin, TFile} from "obsidian";
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


export default class MkdocsPublication extends Plugin {
	settings: MkdocsPublicationSettings;

	async onload() {
		console.log("Github Publisher loaded");
		await this.loadSettings();
		this.addSettingTab(new MkdocsSettingsTab(this.app, this));
		const octokit = new Octokit({auth: this.settings.GhToken});
		
		const PublisherManager = new GithubBranch(this.settings, octokit, this.app.vault, this.app.metadataCache);
		const branchName = app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');


		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file: TFile) => {
				if (
					disablePublish(this.app, this.settings, file) &&
					this.settings.fileMenu
				) {
					menu.addSeparator();
					menu.addItem((item) => {
						item.setTitle(
							'Share "' +
								file.basename +
								'" with Mkdocs Publisher'
						)
							.setIcon("share")
							.onClick(async () => {
								await shareOneNote(branchName, PublisherManager, this.settings, file);
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
						item.setTitle(
							'Share "' +
								view.file.basename +
								'" with Mkdocs Publisher'
						)
							.setIcon("share")
							.onClick(async () => {
								
								await shareOneNote(branchName, PublisherManager, this.settings, view.file);
							});
					});
				}
			})
		);

		this.addCommand({
			id: "publisher-one",
			name: "Share active file",
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
						shareOneNote(branchName, PublisherManager, this.settings, this.app.workspace.getActiveFile());
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "publisher-delete-clean",
			name: "Remove unshared and deleted file in repository",
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
			name: "Upload all shared notes",
			callback: async () => {
				const sharedFiles = PublisherManager.getSharedFiles();
				const statusBarItems = this.addStatusBarItem()
				await shareAllMarkedNotes(PublisherManager, this.settings, octokit, statusBarItems, branchName, sharedFiles, true);
			}
		});
		
		this.addCommand({
			id: "publisher-upload-new",
			name: "Upload new shared notes",
			callback: async () => {
				await shareNewNote(PublisherManager, octokit, branchName, this.app.vault, this);
			}
		});
		
		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: "Upload all new and edited note since last upload",
			callback: async () => {
				await shareAllEditedNotes(PublisherManager, octokit, branchName, this.app.vault, this);
			}
		});
		
		this.addCommand({
			id: 'publisher-upload-edited',
			name: 'Upload all edited note since last upload',
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
