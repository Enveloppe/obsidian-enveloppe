import {App, PluginSettingTab, Setting} from 'obsidian'
import MkdocsPublication from './main'
import {
	hideSettings,
	showSettings,
	autoCleanCondition,
	folderHideShowSettings,
	autoCleanUpSettingsOnCondition
} from "./settings/stylesSettings";
import {folderSettings} from "./settings/interface";

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

		containerEl.createEl('h2', {text: 'Upload configuration'})

		containerEl.createEl('h3', {text: 'Folder reception settings'})
		new Setting(this.containerEl)
			.setName('Folder Reception settings')
			.setDesc('Choose between a fixed folder or the value of a frontmatter key.')
			.addDropdown((dropDown) => {
				dropDown
					.addOptions({
						fixed : 'Fixed Folder',
						yaml: 'YAML frontmatter',
						obsidian: 'Obsidian Path'
					})
					.setValue(this.plugin.settings.downloadedFolder)
					.onChange(async(value: string)=>{
						this.plugin.settings.downloadedFolder=value;
						
						await folderHideShowSettings(frontmatterKeySettings, rootFolderSettings, autoCleanSetting, value, this.plugin, subFolderSettings)
						if (value === folderSettings.fixed) {
							hideSettings(folderNoteSettings)
						} else {
							showSettings(folderNoteSettings)
							if (value === folderSettings.obsidian) {
								showSettings(subFolderSettings)
							}
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
						this.plugin.settings.folderDefaultName = value.replace(/\/$/, '');
						await autoCleanCondition(value, autoCleanSetting, this.plugin)
						await this.plugin.saveSettings();
					});
			});
		
		const subFolderSettings = new Setting(this.containerEl)
			.setName('Path removing')
			.setClass('mdkocs-settings-tab')
			.setDesc('Allow to publish only subfolder by removing the path before that :')
			.addText((text) => {
				text
					.setPlaceholder('GardenSketch')
					.setValue(this.plugin.settings.subFolder)
					.onChange(async (value) => {
						this.plugin.settings.subFolder = value.replace(/\/$/, '').trim();
						await this.plugin.saveSettings();
					});
			});

		const frontmatterKeySettings = new Setting(this.containerEl)
			.setName('Frontmatter key')
			.setClass('mdkocs-settings-tab')
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
			.setClass('mdkocs-settings-tab')
			.setDesc('Append this path to the folder set by the frontmatter key.')
			.addText((text)=>{
				text
					.setPlaceholder('docs')
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async(value)=>{
						this.plugin.settings.rootFolder =value.replace(/\/$/, '');
						await autoCleanCondition(value, autoCleanSetting, this.plugin);
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl('h3', {text: "Link's conversion"})

		const folderNoteSettings = new Setting(containerEl)
			.setName('Folder note')
			.setClass('mdkocs-settings-tab')
			.setDesc('Rename files with the same name as their parent folder (or category) "index.md"')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.folderNote)
					.onChange(async (value)=>{
						this.plugin.settings.folderNote=value;
						await this.plugin.saveSettings();
					})
			})
		new Setting(containerEl)
			.setName('Internals Links')
			.setDesc('Convert the internal link in shared file to match the' +
				' folder settings')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.convertForGithub)
					.onChange(async(value)=>{
						this.plugin.settings.convertForGithub = value;
						await this.plugin.saveSettings();
					})
			})

		new Setting(containerEl)
			.setName('Wikilinks')
			.setDesc('Convert Wikilinks to MDlinks, without changing the' +
				' contents')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.convertWikiLinks)
					.onChange(async (value)=>{
						this.plugin.settings.convertWikiLinks = value;
						await this.plugin.saveSettings();
					})
			})

		containerEl.createEl('h3', {text: 'Image'})
		new Setting(containerEl)
			.setName('Transfer image')
			.setDesc('Send image linked to a file in github')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.transferEmbedded)
					.onChange(async (value) => {
						this.plugin.settings.transferEmbedded = value;
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
					.onChange(async(value) => {
						this.plugin.settings.defaultImageFolder = value.replace(/\/$/, '');
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl('h3', {text: 'Github Workflow'})
		new Setting(containerEl)
			.setName('Github action name')
			.setDesc('If you want to activate a github action when the' +
				' plugin push the file, set the name of the file (in your' +
				'.github/worfklows folder).')
			.addText((text)=>{
				text
					.setPlaceholder('ci')
					.setValue(this.plugin.settings.workflowName)
					.onChange(async(value)=> {
						value = value.length>0? value.trim().replace('.yml', '') + '.yml' : value;
						this.plugin.settings.workflowName = value;
						await this.plugin.saveSettings();
					});
			});
		const condition = (this.plugin.settings.downloadedFolder === folderSettings.yaml &&
				(this.plugin.settings.rootFolder.length === 0) ||
				(this.plugin.settings.folderDefaultName.length === 0));

		const autoCleanSetting = new Setting(containerEl)
			.setName('Auto clean up')
			.setDesc('If the plugin must remove from github the removed' +
				' files (stop share or deleted)')
			.setDisabled(condition)
			.addToggle((toggle)=>{
				toggle
					.setValue(this.plugin.settings.autoCleanUp)
					.onChange(async(value)=>{
						this.plugin.settings.autoCleanUp = value;
						value ? showSettings(autoCleanExcludedSettings): hideSettings(autoCleanExcludedSettings)
						await this.plugin.saveSettings();
					});
			});

		const autoCleanExcludedSettings = new Setting(containerEl)
			.setName('Excluded files')
			.setDesc('If you want to exclude some folder from the auto clean' +
				' up, set their path.')
			.addTextArea((textArea)=>{
				textArea
					.setPlaceholder('docs/assets/js, docs/assets/logo')
					.setValue(this.plugin.settings.autoCleanUpExcluded)
					.onChange(async(value)=>{
						this.plugin.settings.autoCleanUpExcluded = value;
						await this.plugin.saveSettings();
					});
			});


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

		autoCleanUpSettingsOnCondition(condition, autoCleanSetting, this.plugin);
		this.plugin.settings.downloadedFolder === folderSettings.fixed ? hideSettings(folderNoteSettings):showSettings(folderNoteSettings)
		folderHideShowSettings(frontmatterKeySettings, rootFolderSettings, autoCleanSetting, this.plugin.settings.downloadedFolder, this.plugin, subFolderSettings).then();
		this.plugin.settings.transferEmbedded ? showSettings(settingsDefaultImage) : hideSettings(settingsDefaultImage);
		this.plugin.settings.autoCleanUp ? showSettings(autoCleanExcludedSettings):hideSettings(autoCleanExcludedSettings);
	}
}
