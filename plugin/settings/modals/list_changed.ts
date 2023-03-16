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
		const ul = contentEl.createEl("ul");
		toDisplay.forEach((file) => {
			ul.createEl("li", { text: file });
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
		contentEl.createEl("h2", { text: i18next.t("modals.listChangedFiles.title") });
		if (Object.keys(this.listChanged).contains("edited")) {
			this.listChanged = this.listChanged as ListeEditedFiles;
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.added") });
			this.displayListOfFile(this.listChanged.added, contentEl);
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.edited") });
			this.displayListOfFile(this.listChanged.edited, contentEl);
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.deleted") });
			this.displayListOfFile(this.listChanged.deleted, contentEl);
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.unpublished") });
			this.displayListOfFile(this.listChanged.unpublished, contentEl);
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.notDeleted") });
			this.displayListOfFile(this.listChanged.notDeleted, contentEl);
		} else {
			this.listChanged = this.listChanged as Deleted;
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.deleted")});
			this.displayListOfFile(this.listChanged.deleted, contentEl);
			contentEl.createEl("h3", { text: i18next.t("modals.listChangedFiles.notDeleted")});
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