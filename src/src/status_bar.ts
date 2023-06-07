import i18next from "i18next";

// Credit : https://github.com/oleeskild/obsidian-digital-garden/ @oleeskild

/**
 * This class adds a status bar to the bottom of the screen.
 * Only work for the desktop app.
 * @class StatusBar
 */

export class ShareStatusBar {
	statusBarItem: HTMLElement;
	counter: number;
	numberOfNotesToPublish: number;
	attachment = false;
	status: HTMLElement;

	/**
	 * @param {HTMLElement} statusBarItem
	 * @param {number} numberOfNotesToPublish
	 * @param {boolean} attachment true if there are attachment to the note
	 */

	constructor(
		statusBarItem: HTMLElement,
		numberOfNotesToPublish: number,
		attachment = false
	) {
		this.statusBarItem = statusBarItem;
		this.counter = 0;
		this.numberOfNotesToPublish = numberOfNotesToPublish;
		this.attachment = attachment;

		this.statusBarItem.createEl("span", { text: "" });
		let typeAttachment = i18next.t("common.files");
		if (this.attachment) {
			typeAttachment = i18next.t("common.attachments");
		}
		const msg = i18next.t("statusBar.markedForSharing", { nb : this.numberOfNotesToPublish, type: typeAttachment });
		this.status = this.statusBarItem.createEl("span", { text: `${msg}` });
	}

	/**
	 * increment the counter
	 */

	increment() {
		let typeAttachment = i18next.t("common.files");
		if (this.attachment) {
			typeAttachment = i18next.t("common.attachments");
		}
		const msg = i18next.t("statusBar.sharing", { type: typeAttachment});
		this.status.setText(
			i18next.t("statusBar.counter", {msg : msg, counter: ++this.counter, nb: this.numberOfNotesToPublish})
		);
	}

	/**
	 * finish the status bar
	 * @param {number} displayDurationMillisec
	 */

	finish(displayDurationMillisec: number) {
		let msg = i18next.t("statusBar.success", { action: i18next.t("common.published"), type: i18next.t("common.files")});
		if (this.attachment) {
			msg = i18next.t("statusBar.success", { action: i18next.t("common.shared"), type: i18next.t("common.attachments")});
		}
		this.status.setText(
			i18next.t("statusBar.counter", {msg : msg, counter: this.counter, nb: this.numberOfNotesToPublish})
		);
		setTimeout(() => {
			this.statusBarItem.remove();
		}, displayDurationMillisec);
	}

	/**
	 * Remove the status bar if error occurs
	 */

	error() {
		this.statusBarItem.remove();
	}
}
