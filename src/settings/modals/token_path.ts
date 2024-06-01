import { TOKEN_PATH } from "@interfaces";
import i18next from "i18next";
import { type App, Modal, Notice, Setting } from "obsidian";
import type Enveloppe from "src/main";
import { migrateToken } from "src/settings/migrate";
import { createTokenPath } from "src/utils";
import type { Logs } from "../../utils/logs";

export class TokenEditPath extends Modal {
	plugin: Enveloppe;
	token: string;
	tokenPath: string;
	console: Logs;

	constructor(app: App, plugin: Enveloppe, token: string) {
		super(app);
		this.plugin = plugin;
		this.token = token;
		this.tokenPath = "";
		this.console = plugin.console;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "token-path"]);

		const defaultPath = createTokenPath(this.plugin, TOKEN_PATH);
		const desc = contentEl.createEl("p", undefined, (p) => {
			p.appendText(i18next.t("settings.github.ghToken.button.description"));
			const div = p.createDiv({
				text: i18next.t("settings.github.ghToken.button.default"),
			});
			div.createEl("code", { text: ` ${defaultPath}` }, (code) => {
				code.classList.add("cm-inline-code");
				code.style.fontFamily = "var(--font-monospace)";
			});
		});
		desc.createEl("br");
		desc.createEl("p", { text: i18next.t("settings.github.ghToken.button.variables") });
		desc.createEl("ul", undefined, (span) => {
			span.createEl("li", undefined, (li) => {
				li.createEl("code", { text: "%configDir%" }, (code) => {
					code.classList.add("cm-inline-code");
					code.style.fontFamily = "var(--font-monospace)";
				});
				li.createEl("span", undefined, (e) => {
					e.appendText(`${i18next.t("settings.github.ghToken.button.configDir")} (`);
					e.createEl("code", { text: this.app.vault.configDir }, (code) => {
						code.classList.add("cm-inline-code");
						code.style.fontFamily = "var(--font-monospace)";
					});
					e.appendText(")");
				});
			});
			span.createEl("li", undefined, (li) => {
				li.createEl("code", { text: "%pluginID%" }, (code) => {
					code.classList.add("cm-inline-code");
					code.style.fontFamily = "var(--font-monospace)";
				});
				li.createEl("span", undefined, (e) => {
					e.appendText(`${i18next.t("settings.github.ghToken.button.pluginID")} (`);
					e.createEl("code", { text: this.plugin.manifest.id }, (code) => {
						code.classList.add("cm-inline-code");
						code.style.fontFamily = "var(--font-monospace)";
					});
					e.appendText(")");
				});
			});
		});

		const input = new Setting(contentEl)
			.setClass("display-none")
			.setClass("max-width")
			.addText((text) => {
				const path = this.plugin.settings.github.tokenPath ?? defaultPath;
				text
					.setPlaceholder(defaultPath)
					.setValue(path)
					.onChange(async (value) => {
						let path = value.trim();
						if (path.length === 0) {
							path = defaultPath;
						}
						this.plugin.settings.github.tokenPath = path;
						this.tokenPath = path;
					});
			});

		new Setting(contentEl).addButton((button) => {
			button.setButtonText(i18next.t("common.save")).onClick(async () => {
				try {
					await this.plugin.saveSettings();
					await migrateToken(this.plugin, this.token);
					this.close();
				} catch (e) {
					input.controlEl.querySelector("input")!.style.border = "1px solid red";
					new Notice(i18next.t("error.reading-token-file"));
					this.tokenPath = "error";
					this.console.logs({ e: true }, e);
				}
			});
		});
	}

	async onClose() {
		const { contentEl } = this;
		contentEl.empty();
		if (this.tokenPath === "error") {
			this.plugin.settings.github.tokenPath = TOKEN_PATH;
			await this.plugin.saveSettings();
			await migrateToken(this.plugin, this.token);
		}
	}
}
