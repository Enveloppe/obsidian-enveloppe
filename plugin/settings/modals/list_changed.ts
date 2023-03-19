import { Modal, App } from "obsidian";
import { Deleted, ListeEditedFiles } from "../interface";
import i18next from "i18next";


export class ListChangedFiles extends Modal {
	listChanged: ListeEditedFiles | Deleted;
	constructor(app: App, listChanged: ListeEditedFiles | Deleted) {
		super(app);
		this.listChanged = listChanged ;
	}

	displayListOfFile(toDisplay: string[], contentEl: HTMLElement) {
		if (toDisplay.length === 0) {
			return;
		}
		const ul = contentEl.createEl("ul");
		toDisplay.forEach((file) => {
			let emoji = "❓";
			if (file.endsWith(".md")) {
				emoji = "🗒️";
			} else if (file.match(/\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp/)) {
				emoji = "🖼️";
			} else if (file.match(/\.mp3|\.wav|\.ogg|\.flac|\.aac/)) {
				emoji = "🎵";
			} else if (file.match(/\.mp4|\.avi|\.mov|\.mkv|\.webm/)) {
				emoji = "🎥";
			} else if (file.match(/\.pdf/)) {
				emoji = "📄";
			} else {
				emoji = "❓";
			}
			//set file in code block
			const li = ul.createEl("li");
			li.createEl("span", { text: emoji, cls: "github-publisher emoji" });
			li.createEl("code", { text: file, cls: "code-title github-publisher list-changed"});
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
		console.log(this.listChanged);
		contentEl.createEl("h2", { text: i18next.t("modals.listChangedFiles.title"), cls: "github-publisher title"});
		if (Object.keys(this.listChanged).contains("edited")) {
			this.listChanged = this.listChanged as ListeEditedFiles;
			contentEl.createEl("h3", { text: `📤 ${i18next.t("modals.listChangedFiles.added")}`});
			this.displayListOfFile(this.listChanged.added, contentEl);
			contentEl.createEl("h3", { text: `✒️ ${i18next.t("modals.listChangedFiles.edited")}`});
			this.displayListOfFile(this.listChanged.edited, contentEl);
			contentEl.createEl("h3", { text: `🗑️ ${i18next.t("modals.listChangedFiles.deleted")}`});
			this.displayListOfFile(this.listChanged.deleted, contentEl);
			contentEl.createEl("h2", { text: `❌ ${i18next.t("modals.listChangedFiles.error")}`, cls: "github-publisher title error"});
			contentEl.createEl("h3", { text: `📤 ${i18next.t("modals.listChangedFiles.unpublished")}`});
			this.displayListOfFile(this.listChanged.unpublished, contentEl);
			contentEl.createEl("h3", { text: `♻️ ${i18next.t("modals.listChangedFiles.notDeleted")}`});
			this.displayListOfFile(this.listChanged.notDeleted, contentEl);
		} else {
			this.listChanged = this.listChanged as Deleted;
			contentEl.createEl("h3", { text: `🗑️ ${i18next.t("modals.listChangedFiles.deleted")}`});
			this.displayListOfFile(this.listChanged.deleted, contentEl);
			contentEl.createEl("h3", { text: `❌ ${i18next.t("modals.listChangedFiles.error")}`, cls: "github-publisher error"});
			contentEl.createEl("h3", { text: `♻️ ${i18next.t("modals.listChangedFiles.notDeleted")}`});
			this.displayListOfFile(this.listChanged.undeleted, contentEl);
		}
	}
	
	onClose() {
		/**
		 * a modal is closed and the user can go back to the normal workflow
		 */
		const { contentEl } = this;
		contentEl.empty();
	}

}