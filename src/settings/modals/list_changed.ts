import type { Deleted, ListEditedFiles } from "@interfaces";
import i18next from "i18next";
import { type App, Modal } from "obsidian";

export class ListChangedFiles extends Modal {
	listChanged: ListEditedFiles | Deleted;
	constructor(app: App, listChanged: ListEditedFiles | Deleted) {
		super(app);
		this.listChanged = listChanged;
	}

	displayListOfFile(toDisplay: string[], contentEl: HTMLElement) {
		if (!toDisplay.length) return;
		const ul = contentEl.createEl("ul", { cls: "list" });
		toDisplay.forEach((file) => {
			let emoji = "❓";
			const ext = file.split(".").pop() ?? "";
			if (["md"].includes(ext)) {
				emoji = "🗒️";
			} else if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(`.${ext}`)) {
				emoji = "🖼️";
			} else if ([".mp3", ".wav", ".ogg", ".flac", ".aac"].includes(`.${ext}`)) {
				emoji = "🎵";
			} else if ([".mp4", ".avi", ".mov", ".mkv", ".webm"].includes(`.${ext}`)) {
				emoji = "🎥";
			} else if ([".pdf"].includes(`.${ext}`)) {
				emoji = "📄";
			}
			const li = ul.createEl("li");
			li.createSpan({ text: emoji, cls: "emoji" });
			li.createEl("code", { text: file, cls: "code-title" });
		});
	}

	onOpen() {
		/**
		 * a modal is open and the user can read what files was :
		 * - added
		 * - modified
		 * - deleted
		 * - Not uploaded
		 */
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "list-changed"]);
		contentEl.createEl("h2", {
			text: i18next.t("modals.listChangedFiles.title"),
			cls: "success",
		});
		if (Object.keys(this.listChanged).contains("edited")) {
			const listChanged = this.listChanged as ListEditedFiles;
			contentEl.createEl("h3", {
				text: `📤 ${i18next.t("modals.listChangedFiles.added")}`,
			});
			this.displayListOfFile(listChanged.added, contentEl);
			contentEl.createEl("h3", {
				text: `✒️ ${i18next.t("modals.listChangedFiles.edited")}`,
			});
			this.displayListOfFile(listChanged.edited, contentEl);
			contentEl.createEl("h3", {
				text: `🗑️ ${i18next.t("modals.listChangedFiles.deleted")}`,
			});
			this.displayListOfFile(listChanged.deleted, contentEl);

			const span = contentEl.createDiv({ cls: "error" });
			span.createEl("h2", {
				text: `❌ ${i18next.t("modals.listChangedFiles.error")}`,
			});
			span.createEl("h3", {
				text: `📤 ${i18next.t("modals.listChangedFiles.unpublished")}`,
			});
			this.displayListOfFile(listChanged.unpublished, span);
			span.createEl("h3", {
				text: `♻️ ${i18next.t("modals.listChangedFiles.notDeleted")}`,
			});
			this.displayListOfFile(listChanged.notDeleted, span);
		} else {
			const listChanged = this.listChanged as Deleted;
			contentEl.createEl("h3", {
				text: `🗑️ ${i18next.t("modals.listChangedFiles.deleted")}`,
			});
			this.displayListOfFile(listChanged.deleted, contentEl);
			const span = contentEl.createSpan({ cls: "error" });
			span.createEl("h3", {
				text: `❌ ${i18next.t("modals.listChangedFiles.error")}`,
			});
			span.createEl("h3", {
				text: `♻️ ${i18next.t("modals.listChangedFiles.notDeleted")}`,
			});
			this.displayListOfFile(listChanged.undeleted, span);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
