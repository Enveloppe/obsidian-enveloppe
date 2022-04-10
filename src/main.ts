import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {
	mkdocsSettingsTab,
	mkdocsPublicationSettings,
	DEFAULT_SETTINGS,
} from "./settings";
import {ShareStatusBar} from "./status_bar";
import MkdocsPublish from "./publication";

export default class mkdocsPublication extends Plugin {
	settings: mkdocsPublicationSettings;


	async onload() {
		console.log('Mkdocs Publication loaded');
		await this.loadSettings();
		this.addSettingTab(new mkdocsSettingsTab(this.app, this));

		this.addCommand({
			id: 'obs2mk-all',
			name: 'Share one note',
			callback: async () => {
				try {
					const {vault, workspace, metadataCache} = this.app;
					const currentFile = workspace.getActiveFile();
					if (!currentFile) {
						new Notice("No file is open/active. Please open a file and try again.")
						return;
					}
					if (currentFile.extension !== 'md') {
						new Notice("The current file is not a markdown file. Please open a markdown file and try again.")
						return;
					}
					const publish = new MkdocsPublish(vault, metadataCache, this.settings);
					const publishSuccess = await publish.publish(currentFile);
					if (publishSuccess) {
						new Notice("Successfully published to mkdocs.")
					}
				} catch (e) {
					console.error(e);
					new Notice("Error publishing to mkdocs.")
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

