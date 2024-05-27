import type { EnveloppeSettings } from "@interfaces/main";
import i18next from "i18next";
import { type App, Modal, Setting } from "obsidian";

export class AutoCleanPopup extends Modal {
	settings: EnveloppeSettings;
	onSubmit: (enable: boolean) => void;
	constructor(
		app: App,
		settings: EnveloppeSettings,
		onSubmit: (enable: boolean) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.settings = settings;
	}

	whatIsEmpty() {
		if (
			this.settings.upload.behavior === "yaml" &&
			this.settings.upload.defaultName.length === 0
		) {
			return i18next.t("common.defaultName");
		} else if (this.settings.upload.rootFolder.length === 0) {
			return i18next.t("common.rootFolder");
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "popup"]);
		contentEl.createEl("h2", {
			text: i18next.t("settings.githubWorkflow.autoCleanUp.popup.title"),
		});
		contentEl.createEl("p", {
			text: i18next.t("settings.githubWorkflow.autoCleanUp.popup.desc", {
				what: this.whatIsEmpty(),
			}),
		});
		contentEl.createEl("p", {
			text: i18next.t("settings.githubWorkflow.autoCleanUp.popup.exclude"),
		});
		contentEl.createEl("p", {
			text: i18next.t("settings.githubWorkflow.autoCleanUp.popup.sure"),
		});

		new Setting(contentEl)
			.setClass("no-display")
			.addButton((button) => {
				button
					.setButtonText(i18next.t("common.yes"))
					.setWarning()
					.onClick(() => {
						this.onSubmit(true);
						this.close();
					});
			})
			.addButton((button) => {
				button.setButtonText(i18next.t("common.no")).onClick(() => {
					this.onSubmit(false);
					this.close();
				});
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
