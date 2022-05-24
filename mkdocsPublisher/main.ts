import { Notice, Plugin, TFile } from "obsidian";
import {
	MkdocsSettingsTab,
	MkdocsPublicationSettings,
	DEFAULT_SETTINGS,
} from "./settings";
import { ShareStatusBar } from "./utils/status_bar";
import MkdocsPublish from "./utils/publication";
import { disablePublish, noticeMessage } from "./utils/utils";

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
										await noticeMessage(publish, file, this.settings)
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
										await noticeMessage(publish, view.file, this.settings)
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
								noticeMessage(publishFile, currentFile, this.settings);
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
			id: "Obs2MK-delete-clean",
			name: "Delete from repository",
			hotkeys: [],
			checkCallback: (checking) => {
				if (this.settings.autoCleanUp) {
					if (!checking) {
						try {
							const { vault, metadataCache } =
								this.app;
							const publish = new MkdocsPublish(
								vault,
								metadataCache,
								this.settings
							);
							new Notice(`Starting cleaning ${this.settings.githubRepo} `)
							publish.deleteFromGithub();
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
						const vaultPublisherJSON = this.settings.folderDefaultName.length>0? `${this.settings.folderDefaultName}/vault_published.json`:`vault_published.json`;
						await publish.uploadText(
							"vault_published.json",
							publishedFilesText,
							vaultPublisherJSON
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
						const noticeValue = `${publishedFiles.length - errorCount} notes`
						await noticeMessage(publish, noticeValue, this.settings)
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
