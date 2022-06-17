import {Plugin, TFile } from "obsidian";
import {
	MkdocsSettingsTab,
} from "./settings";
import MkdocsPublish from "./githubInteraction/upload";
import { disablePublish } from "./utils/utils";
import {MkdocsPublicationSettings, DEFAULT_SETTINGS} from './settings/interface'
import { GetFiles } from "./githubInteraction/getFiles";
import {GithubBranch} from "./githubInteraction/branch";
import { Octokit } from "@octokit/core";
import {
	deleteUnsharedDeletedNotes,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote
} from "./utils/commands";


export default class MkdocsPublication extends Plugin {
	settings: MkdocsPublicationSettings;

	async onload() {
		console.log("Mkdocs Publication loaded");
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
		const shareFiles = new GetFiles(this.app.vault, this.app.metadataCache, this.settings, octokit);
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
			id: "obs2mk-one",
			name: "Share active file with Mkdocs Publisher",
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
			id: "Obs2MK-delete-clean",
			name: "Delete from repository",
			hotkeys: [],
			checkCallback: (checking) => {
				if (this.settings.autoCleanUp) {
					if (!checking) {
						deleteUnsharedDeletedNotes(githubBranch, this.settings, octokit, shareFiles, branchName);
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "obs2mk-publish-all",
			name: "Share all marked notes",
			callback: async () => {
				const statusBarElement = this.addStatusBarItem()
				const sharedFiles = shareFiles.getSharedFiles();
				await shareAllMarkedNotes(publish, this.settings, octokit, shareFiles, githubBranch, statusBarElement, branchName, sharedFiles);
			}
		});
		
		this.addCommand({
			id: "obs2mk-upload-new",
			name: "Share newly note",
			callback: async () => {
				await shareNewNote(githubBranch, publish, this.settings, octokit, shareFiles, branchName, this.app.vault);
			}
		});
		
		this.addCommand({
			id: "obs2mk-upload-edited",
			name: "Upload all new and edited note",
			callback: async () => {
				const statusBarElement = this.addStatusBarItem();
				await shareAllEditedNotes(statusBarElement, publish, this.settings, octokit, shareFiles, githubBranch, branchName, this.app.vault);
			}
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
