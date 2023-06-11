import { Modal, App, Setting, normalizePath } from "obsidian";
import GithubPublisher from "src/main";
import i18next from "i18next";

export class TokenEditPath extends Modal {
	plugin: GithubPublisher;

	constructor(app: App, plugin: GithubPublisher) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		/**
		 * @todo
		 * You can edit the path of the token file. By default, it will be in the same folder of the plugin, based on your configuration directory.
		 * By default, the path is ".obsidian/plugins/obsidian-mkdocs-publisher/env"
		 * You can use the following variables:
		 * - %configDir%: the configuration directory of Obsidian
		 * - %pluginID%: the ID of the plugin
		 */

		new Setting(contentEl)
			.setName(i18next.t("settings.github.ghToken.button.name"))
			.addText((text) => {
				text.setPlaceholder(i18next.t("settings.github.ghToken.button.placeholder"))
					.setValue(this.plugin.settings.github.tokenPath)
					.onChange(async (value) => {
						if ()
						this.plugin.settings.github.tokenPath = normalizePath(value.trim());
						await this.plugin.saveSettings();
					});
			});

		new Setting(contentEl)
			.addButton((button) => {
				button.setButtonText(i18next.t("common.save"))
					.onClick(async () => {
						this.plugin.settings.github.tokenPath = "";
						await this.plugin.saveSettings();
					});
			});
	}

	onClose() {
		const {contentEl} = this;

		contentEl.empty();
	}

}