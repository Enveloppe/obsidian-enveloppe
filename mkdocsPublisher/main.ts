import {Notice, Plugin, TFile} from 'obsidian';
import {
	mkdocsSettingsTab,
	mkdocsPublicationSettings,
	DEFAULT_SETTINGS,
} from "./settings";
import {ShareStatusBar} from "./utils/status_bar";
import MkdocsPublish from "./utils/publication";
import {disablePublish} from './utils/utils'


export default class mkdocsPublication extends Plugin {
	settings: mkdocsPublicationSettings;

	async onload() {
		console.log('Mkdocs Publication loaded');
		await this.loadSettings();
		this.addSettingTab(new mkdocsSettingsTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file:TFile) =>{
				if (!disablePublish(this.app, this.settings, file) || !this.settings.fileMenu){
					return false;
				}
					menu.addSeparator();
					menu.addItem((item)=>{
						item.setTitle("Share " + file.basename + " with Mkdocs Publication")
							.setIcon("share")
							.onClick(async()=>{
								try {
									const publish = new MkdocsPublish(this.app.vault, this.app.metadataCache, this.settings);
									const publishSuccess = await publish.publish(file, true);
									if (publishSuccess) {
										new Notice("Successfully published "+ file.basename +" to mkdocs.")
									}
								}catch (e) {
									console.error(e);
									new Notice("Error publishing to mkdocs.")
								}
							});
					})
					menu.addSeparator();
			})
		)

		this.addCommand({
			id: 'obs2mk-one',
			name: 'Share one note',
			hotkeys:[],
			checkCallback: (checking) => {
				if (disablePublish(this.app, this.settings, this.app.workspace.getActiveFile())) {
					if (!checking) {
						try {
							const {vault, workspace, metadataCache} = this.app;
							const currentFile = workspace.getActiveFile();
							const publishFile = new MkdocsPublish(vault, metadataCache, this.settings);
							const publishSuccess = publishFile.publish(currentFile, true);
							if (publishSuccess) {
								new Notice("Successfully published "+ currentFile.basename +" to mkdocs.")
							}
							publishFile.workflow_gestion();
						} catch (e) {
							console.error(e);
							new Notice("Error publishing to mkdocs.")
						}
					}
					return true;
				} return false;
			},
		});
		this.addCommand({
			id: 'obs2mk-publish-all',
			name: 'Share all marked notes',
			callback: async () => {
				const statusBarItems = this.addStatusBarItem();
				try {
					const {vault, metadataCache} = this.app;
					const publish = new MkdocsPublish(vault, metadataCache, this.settings);
					const sharedFiles = await publish.getSharedFiles();
					const statusBar = new ShareStatusBar(statusBarItems, sharedFiles.length);
					let errorCount = 0;
					if (sharedFiles.length > 0) {
						const publishedFiles = sharedFiles.map(file => file.name);
						// upload list of published files in Source
						const publishedFilesText = publishedFiles.toString();
						await publish.uploadText('vault_published.txt', publishedFilesText, 'vault_published.txt');
						for (let files = 0; files < sharedFiles.length; files++) {
							try {
								let file = sharedFiles[files]
								statusBar.increment();
								await publish.publish(file);
							} catch {
								errorCount++;
								new Notice(`Unable to publish note ${sharedFiles[files].name}, skipping it`)
							}
						}
						statusBar.finish(8000);
						new Notice(`Successfully published ${publishedFiles.length - errorCount} notes to mkdocs.`);
						await publish.workflow_gestion();
					}
				} catch (e) {
					//statusBarItems.remove();
					console.error(e)
					new Notice('Unable to publish multiple notes, something went wrong.')
				}
			},
		});
		this.addCommand({
			id: 'obs2mk-update-settings',
			name: 'Update settings workflow',
			callback: async () => {
				try {
					const {vault, metadataCache} = this.app;
					const publish = new MkdocsPublish(vault, metadataCache, this.settings);
					const successUpdate=await publish.updateSettings();
					if (successUpdate) {
						new Notice('Successfully updated settings.')
					}
				} catch (e) {
					console.error(e)
					new Notice('Unable to update settings, something went wrong.')
				}
			},
		});
	}
	onunload() {
		console.log('Mkdocs Publication unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

