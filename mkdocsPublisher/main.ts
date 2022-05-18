import { Notice, Plugin, TFile } from "obsidian";
import {
	MkdocsSettingsTab,
	MkdocsPublicationSettings,
	DEFAULT_SETTINGS,
} from "./settings";
import { ShareStatusBar } from "./utils/status_bar";
import MkdocsPublish from "./utils/publication";
import { disablePublish } from "./utils/utils";

export default class MkdocsPublication extends Plugin {
	settings: MkdocsPublicationSettings;

	async onload() {
		console.log("Mkdocs Publication loaded");
		await this.loadSettings();
		this.addSettingTab(new MkdocsSettingsTab(this.app, this));

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
									const publish = new MkdocsPublish(
										this.app.vault,
										this.app.metadataCache,
										this.settings
									);
									const publishSuccess =
										await publish.publish(file, true);
									if (publishSuccess) {
										new Notice('Send "' + file.basename + '" to ' + this.settings.githubRepo + ".\nNow, waiting for the workflow to be completed...")
										await publish.workflowGestion();
										new Notice(
											"Successfully published " +
												file.basename +
												" to " + this.settings.githubRepo + "."
										);
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
									const publish = new MkdocsPublish(
										this.app.vault,
										this.app.metadataCache,
										this.settings
									);
									const publishSuccess =
										await publish.publish(view.file, true);
									if (publishSuccess) {
										new Notice('Send "' + view.file.basename + '" to ' + this.settings.githubRepo + ".\nNow, waiting for the workflow to be completed...")
										await publish.workflowGestion();
										new Notice(
											"Successfully published " +
												view.file.basename +
												" to " + this.settings.githubRepo + "."
										);
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
							const { vault, workspace, metadataCache } =
								this.app;
							const currentFile = workspace.getActiveFile();
							const publishFile = new MkdocsPublish(
								vault,
								metadataCache,
								this.settings
							);
							const publishSuccess = publishFile.publish(
								currentFile,
								true
							);
							if (publishSuccess) {
								new Notice('Send "' + currentFile.basename + '"to ' + this.settings.githubRepo + ".\nNow, waiting for the workflow to be completed...")
								publishFile.workflowGestion();
								new Notice(
									"Successfully published " +
										currentFile.basename +
										" to " + this.settings.githubRepo + "."
								);
							}
						} catch (e) {
							console.error(e);
							new Notice("Error publishing to mkdocs.");
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
					const { vault, metadataCache } = this.app;
					const publish = new MkdocsPublish(
						vault,
						metadataCache,
						this.settings
					);
					const sharedFiles = await publish.getSharedFiles();
					const statusBar = new ShareStatusBar(
						statusBarItems,
						sharedFiles.length
					);
					let errorCount = 0;
					if (sharedFiles.length > 0) {
						const publishedFiles = sharedFiles.map(
							(file) => file.name
						);
						// upload list of published files in Source
						const publishedFilesText = JSON.stringify(publishedFiles).toString();
						await publish.uploadText(
							"vault_published.json",
							publishedFilesText,
							"vault_published.json"
						);
						for (
							let files = 0;
							files < sharedFiles.length;
							files++
						) {
							try {
								const file = sharedFiles[files];
								statusBar.increment();
								await publish.publish(file);
							} catch {
								errorCount++;
								new Notice(
									`Unable to publish note ${sharedFiles[files].name}, skipping it`
								);
							}
						}
						statusBar.finish(8000);
						new Notice(
							`Send ${
								publishedFiles.length - errorCount
							} notes to ${this.settings.githubRepo}`
						);
						await publish.workflowGestion();
						new Notice(
							`Successfully published ${
								publishedFiles.length - errorCount
							} notes to ${this.settings.githubRepo}.\nNow, waiting for the workflow to be completed...`
						);
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
		this.addCommand({
			id: "obs2mk-update-settings",
			name: "Update settings workflow",
			callback: async () => {
				try {
					const { vault, metadataCache } = this.app;
					const publish = new MkdocsPublish(
						vault,
						metadataCache,
						this.settings
					);
					const successUpdate = await publish.updateSettings();
					if (successUpdate) {
						new Notice("Successfully updated " + this.settings.githubRepo + "settings.");
					}
				} catch (e) {
					console.error(e);
					new Notice(
						"Unable to update settings, something went wrong."
					);
				}
			},
		});
	}

	onunload() {
		console.log("Mkdocs Publication unloaded");
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
