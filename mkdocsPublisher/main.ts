import {Plugin, TFile} from "obsidian";
import {
	MkdocsSettingsTab,
} from "./settings";
import MkdocsPublish from "./githubInteraction/upload";
import { disablePublish } from "./utils/utils";
import {MkdocsPublicationSettings, DEFAULT_SETTINGS} from './settings/interface'
import { FilesManagement } from "./githubInteraction/filesManagement";
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
		const publish = new MkdocsPublish(
			this.app.vault,
			this.app.metadataCache,
			this.settings,
			octokit
		);
		const githubBranch = new GithubBranch(this.settings, octokit);
		const filesManagement = new FilesManagement(this.app.vault, this.app.metadataCache, this.settings, octokit);
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
								await shareOneNote(branchName, githubBranch, publish, this.settings, file);
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
								
								await shareOneNote(branchName, githubBranch, publish, this.settings, view.file);
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
						shareOneNote(branchName, githubBranch, publish, this.settings, this.app.workspace.getActiveFile());
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
						deleteUnsharedDeletedNotes(githubBranch, this.settings, octokit, filesManagement, branchName);
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
				const sharedFiles = filesManagement.getSharedFiles();
				const statusBarItems = this.addStatusBarItem()
				await shareAllMarkedNotes(publish, this.settings, octokit, filesManagement, githubBranch, statusBarItems, branchName, sharedFiles, true);
			}
		});
		
		this.addCommand({
			id: "publisher-upload-new",
			name: "Upload new shared notes",
			callback: async () => {
				await shareNewNote(githubBranch, publish, this.settings, octokit, filesManagement, branchName, this.app.vault, this);
			}
		});
		
		this.addCommand({
			id: "publisher-upload-all-edited-new",
			name: "Upload all new and edited note since last upload",
			callback: async () => {
				await shareAllEditedNotes(publish, this.settings, octokit, filesManagement, githubBranch, branchName, this.app.vault);
			}
		});
		
		this.addCommand({
			id: 'publisher-upload-edited',
			name: 'Upload all edited note since last upload',
			callback: async () => {
				await shareOnlyEdited(publish, this.settings, octokit, filesManagement, githubBranch, branchName, this.app.vault);
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
