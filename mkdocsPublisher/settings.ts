import {App, PluginSettingTab, Setting} from 'obsidian'
import MkdocsPublication from './main'

export interface MkdocsPublicationSettings {
	githubRepo: string;
	githubName: string;
	GhToken: string;
	shareKey: string;
	ExcludedFolder: string;
	fileMenu: boolean;
	editorMenu: boolean;
	downloadedFolder: string;
	folderDefaultName: string;
	yamlFolderKey: string;
	rootFolder: string;
	workflowName: string;
	transfertEmbeded: boolean;
	defaultImageFolder: string;
}

export const DEFAULT_SETTINGS: MkdocsPublicationSettings = {
	githubRepo: '',
	githubName: '',
	GhToken: '',
	shareKey: 'share',
	ExcludedFolder: '',
	fileMenu: false,
	editorMenu: false,
	downloadedFolder: 'fixedFolder',
	folderDefaultName: '',
	yamlFolderKey: '',
	rootFolder: '',
	workflowName: '',
	transfertEmbeded: true,
	defaultImageFolder: '',
}

function showSettings(containerEl: Setting) {
	containerEl.descEl.show();
	containerEl.nameEl.show();
	containerEl.controlEl.show();
}

function hideSettings(containerEl: Setting) {
	containerEl.descEl.hide();
	containerEl.nameEl.hide();
	containerEl.controlEl.hide();
}

export class MkdocsSettingsTab extends PluginSettingTab {
	plugin: MkdocsPublication;

	constructor(app: App, plugin: MkdocsPublication) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const {containerEl} = this
		containerEl.empty();
		containerEl.createEl('h1', {text: 'Github Configuration'})
		containerEl.createEl('h2', {text: 'Github settings'})
		new Setting(containerEl)
			.setName('Repo Name')
			.setDesc('The name of the repository where you store your blog.')
			.addText((text) =>
				text
					.setPlaceholder('mkdocs-template')
					.setValue(this.plugin.settings.githubRepo)
					.onChange(async (value) => {
						this.plugin.settings.githubRepo = value.trim()
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Github Username')
			.setDesc('Your github username.')
			.addText((text) =>
				text
					.setPlaceholder('Github-username')
					.setValue(this.plugin.settings.githubName)
					.onChange(async (value) => {
						this.plugin.settings.githubName = value.trim()
						await this.plugin.saveSettings()
					})
			)
		const desc_ghToken = document.createDocumentFragment()
		desc_ghToken.createEl('span', null, (span) => {
			span.innerText = 'A github token with repository permission. You can generate it '
			span.createEl('a', null, (link) => {
				link.innerText = 'here'
				link.href = 'https://github.com/settings/tokens/new?scopes=repo,workflow'
			})
		})
		new Setting(containerEl)
			.setName('Github Token')
			.setDesc(desc_ghToken)
			.addText((text) =>
				text
					.setPlaceholder('ghb-15457498545647987987112184')
					.setValue(this.plugin.settings.GhToken)
					.onChange(async (value) => {
						this.plugin.settings.GhToken = value.trim();
						await this.plugin.saveSettings();
					})
			)

		containerEl.createEl('h2', {text: 'Download configuration'})

		containerEl.createEl('h5', {text: 'Folder reception settings'})
		new Setting(this.containerEl)
			.setName('Folder Reception settings')
			.setDesc('Choose between a fixed folder or the value of a frontmatter key.')
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						fixedFolder : 'Fixed Folder',
						yamlFrontmatter: 'YAML frontmatter'
					})
					.setValue(this.plugin.settings.downloadedFolder)
					.onChange(async(value: string)=>{
						this.plugin.settings.downloadedFolder=value;
						if (value == 'yamlFrontmatter') {
							showSettings(frontmatterKeySettings);
							showSettings(rootFolderSettings);
						} else {
							hideSettings(frontmatterKeySettings);
							hideSettings(rootFolderSettings);
						}
						await this.plugin.saveSettings();
					});
			});


		new Setting(this.containerEl)
				.setName('Default Folder')
				.setDesc('Set the default reception folder')
				.addText((text) => {
					text
						.setPlaceholder('docs')
						.setValue(this.plugin.settings.folderDefaultName)
						.onChange(async (value) => {
							this.plugin.settings.folderDefaultName = value.replace('/', '');
							await this.plugin.saveSettings();
						});
				});

		const frontmatterKeySettings = new Setting(this.containerEl)
				.setName('Frontmatter key')
				.setDesc('Set the key where to get the value of the folder')
				.addText((text) => {
					text
						.setPlaceholder('category')
						.setValue(this.plugin.settings.yamlFolderKey)
						.onChange(async (value) => {
							this.plugin.settings.yamlFolderKey = value.trim();
							await this.plugin.saveSettings();
						});
				});
		const rootFolderSettings = new Setting(this.containerEl)
				.setName('Root folder')
				.setDesc('Append this path to the folder set by the frontmatter key.')
				.addText((text)=>{
					text
						.setPlaceholder('docs')
						.setValue(this.plugin.settings.rootFolder)
						.onChange(async(value)=>{
							this.plugin.settings.rootFolder =value.replace('/', '');
							await this.plugin.saveSettings();
					});
				});

		if (this.plugin.settings.downloadedFolder == 'yamlFrontmatter') {
			showSettings(frontmatterKeySettings);
			showSettings(rootFolderSettings);
		} else {
			hideSettings(frontmatterKeySettings);
			hideSettings(rootFolderSettings);
		}

		containerEl.createEl('h5', {text: 'Workflow dispatches'})
		new Setting(containerEl)
			.setName('Name')
			.setDesc('If you want to activate a github action when the plugin push the file, set the name.')
			.addText((text)=>{
				text
					.setPlaceholder('ci')
					.setValue(this.plugin.settings.workflowName)
					.onChange(async(value)=> {
						this.plugin.settings.workflowName = value.trim().replace('.yml', '') + '.yml'
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl('h5', {text: 'Embedded files'})
		new Setting(containerEl)
			.setName('Transfer image')
			.setDesc('Send image linked to a file in github')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.transfertEmbeded)
					.onChange(async (value) => {
						this.plugin.settings.transfertEmbeded = value;
						value ? showSettings(settingsDefaultImage) : hideSettings(settingsDefaultImage);
						await this.plugin.saveSettings();
					});
			});

		const settingsDefaultImage = new Setting(containerEl)
			.setName('Default image folder')
			.setDesc('To use a folder different from default')
			.addText((text)=>{
				text
					.setPlaceholder('docs/images')
					.setValue(this.plugin.settings.defaultImageFolder)
					.onChange(async(value)=>{
						this.plugin.settings.defaultImageFolder = value.replace('/', '');
						await this.plugin.saveSettings();
					});
			});

		this.plugin.settings.transfertEmbeded ? showSettings(settingsDefaultImage) : hideSettings(settingsDefaultImage);

		containerEl.createEl('h1', { text: 'Plugin Settings' })
		new Setting(containerEl)
			.setName('Share Key')
			.setDesc('The frontmatter key to publish your file on the website.')
			.addText((text) =>
				text
					.setPlaceholder('share')
					.setValue(this.plugin.settings.shareKey)
					.onChange(async (value) => {
						this.plugin.settings.shareKey = value.trim()
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Excluded Folder')
			.setDesc('Never publish file in these folder, regardless of the share key. Separate folder name by comma.')
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder('_assets, Archive')
					.setValue(this.plugin.settings.ExcludedFolder)
					.onChange(async (value) => {
						this.plugin.settings.ExcludedFolder = value
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('File Menu')
			.setDesc('Add an sharing commands in the file menu')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.fileMenu)
					.onChange(async (value) => {
						this.plugin.settings.fileMenu = value
						await this.plugin.saveSettings()
					})
			)
		new Setting(containerEl)
			.setName('Editor Menu')
			.setDesc('Add a sharing commands in the right-click menu')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.editorMenu)
					.onChange(async (value) => {
						this.plugin.settings.editorMenu = value
						await this.plugin.saveSettings()
					})
			)
	}
}
