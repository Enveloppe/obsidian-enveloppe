import { type App, Modal, Setting } from "obsidian";
import { t } from "./i18n";

const MAX_LISTED = 12;

export interface ConfirmOptions {
	title: string;
	description: string[];
	warning?: string;
	paths: string[];
	confirmLabel: string;
	destructive?: boolean;
}

class ConfirmModal extends Modal {
	private confirmed = false;

	constructor(
		app: App,
		private options: ConfirmOptions,
		private resolve: (confirmed: boolean) => void
	) {
		super(app);
	}

	onOpen() {
		const { contentEl, options } = this;
		this.setTitle(options.title);
		contentEl.addClass("enveloppe-manager-confirm");
		for (const line of options.description) contentEl.createEl("p", { text: line });
		if (options.warning)
			contentEl.createDiv({
				cls: "enveloppe-manager-confirm-warning",
				text: options.warning,
			});
		const list = contentEl.createEl("ul", { cls: "enveloppe-manager-confirm-list" });
		for (const path of options.paths.slice(0, MAX_LISTED))
			list.createEl("li", { text: path });
		if (options.paths.length > MAX_LISTED)
			list.createEl("li", {
				cls: "is-more",
				text: t("confirm.more", { count: options.paths.length - MAX_LISTED }),
			});
		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText(t("confirm.cancel")).onClick(() => this.close())
			)
			.addButton((button) => {
				button.setButtonText(options.confirmLabel).onClick(() => {
					this.confirmed = true;
					this.close();
				});
				if (options.destructive) button.setDestructive().setCta();
				else button.setCta();
			});
	}

	onClose() {
		this.contentEl.empty();
		this.resolve(this.confirmed);
	}
}

export function confirm(app: App, options: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => new ConfirmModal(app, options, resolve).open());
}
