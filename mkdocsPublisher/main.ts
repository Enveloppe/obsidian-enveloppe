import { Notice, Plugin, TFile } from "obsidian";
import {
	MkdocsSettingsTab,
} from "./settings";
import { ShareStatusBar } from "./utils/status_bar";
import MkdocsPublish from "./githubInteraction/upload";
import { disablePublish, noticeMessage } from "./utils/utils";
import {MkdocsPublicationSettings, DEFAULT_SETTINGS} from './settings/interface'
import { deleteFromGithub } from './githubInteraction/delete'
import { GetFiles } from "./githubInteraction/getFiles";
import {GithubBranch} from "./githubInteraction/branch";
import { Octokit } from "@octokit/core";


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
								try {
									const branchName = this.app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');
									await githubBranch.newBranch(branchName);
									const publishSuccess =
										await publish.publish(file, true, branchName);
									if (publishSuccess) {
										const update=await githubBranch.updateRepository(branchName);
										if (update) {
											await noticeMessage(publish, file, this.settings)
										}
									}

								} catch (e) {
									console.error(e);
									new Notice("Error publishing to " + this.settings.githubRepo + ".");
								}
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
								try {
									const branchName = this.app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');
									await githubBranch.newBranch(branchName);
									const publishSuccess =
										await publish.publish(view.file, true, branchName);
									if (publishSuccess) {
										const update = await githubBranch.updateRepository(branchName);
										if (update) {
											await noticeMessage(publish, view.file, this.settings);
										} else {
											new Notice("Error publishing to " + this.settings.githubRepo + ".");

										}
									}
								} catch (e) {
									console.error(e);
									new Notice("Error publishing to " + this.settings.githubRepo + ".");
								}
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
						try {
							const { workspace} =
								this.app;
							const currentFile = workspace.getActiveFile();
							const branchName = this.app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');
							const githubBranch = new GithubBranch(this.settings, octokit);
							githubBranch.newBranch(branchName);
							const publishSuccess = publish.publish(
								currentFile,
								true,
								branchName
							);
							if (publishSuccess) {
								const update = githubBranch.updateRepository(branchName);
								if (update) {
									noticeMessage(publish, currentFile, this.settings);
								} else {
									new Notice("Error publishing to " + this.settings.githubRepo + ".");
								}

							}
						} catch (e) {
							console.error(e);
							new Notice("Error publishing to github.");
						}
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
						try {
							new Notice(`Starting cleaning ${this.settings.githubRepo} `)
							const branchName = this.app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');
							githubBranch.newBranch(branchName);
							deleteFromGithub(false, this.settings,octokit, branchName, shareFiles);
							githubBranch.updateRepository(branchName);
						} catch (e) {
							console.error(e);
						}
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
				const statusBarItems = this.addStatusBarItem();
				try {
					const sharedFiles = shareFiles.getSharedFiles();
					const statusBar = new ShareStatusBar(
						statusBarItems,
						sharedFiles.length
					);
					let errorCount = 0;
					if (sharedFiles.length > 0) {
						const publishedFiles = sharedFiles.map(
							(file) => file.name
						);
						// octokit list of published files in Source
						const publishedFilesText = JSON.stringify(publishedFiles).toString();
						const githubBranch = new GithubBranch(this.settings, octokit);
						const branchName = this.app.vault.getName() + "-" + new Date().toLocaleDateString('en-US').replace(/\//g, '-');
						await githubBranch.newBranch(branchName);
						const vaultPublisherJSON = this.settings.folderDefaultName.length>0? `${this.settings.folderDefaultName}/vault_published.json`:`vault_published.json`;
						await publish.uploadText(
							"vault_published.json",
							publishedFilesText,
							vaultPublisherJSON,"", branchName
						);
						for (
							let files = 0;
							files < sharedFiles.length;
							files++
						) {
							try {
								const file = sharedFiles[files];
								statusBar.increment();
								await publish.publish(file, false, branchName);
							} catch {
								errorCount++;
								new Notice(
									`Unable to publish note ${sharedFiles[files].name}, skipping it`
								);
							}
						}
						statusBar.finish(8000);
						const noticeValue = `${publishedFiles.length - errorCount} notes`
						await deleteFromGithub(true, this.settings, octokit, branchName, shareFiles);
						const update=await githubBranch.updateRepository(branchName);
						if (update) {
							await noticeMessage(publish, noticeValue, this.settings)
						} else {
							new Notice("Error publishing to " + this.settings.githubRepo + ".");

						}
					}
				} catch (e) {
					// statusBarItems.remove();
					console.error(e);
					new Notice(
						"Unable to publish multiple notes, something went wrong."
					);
				}
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
