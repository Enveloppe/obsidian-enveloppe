import i18next from "i18next";
import { Notice } from "obsidian";

import { RepoFrontmatter } from "../settings/interface";
import { noticeMobile } from ".";
import { ERROR_ICONS, FOUND_ATTACHMENTS, HOURGLASS_ICON, SUCCESS_ICON } from "./icons";

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
	icon: HTMLElement;
	noticeMobile: Notice | undefined;

	/**
	 * @param {HTMLElement} statusBarItem
	 * @param {number} numberOfNotesToPublish
	 * @param {boolean} attachment true if there are attachment to the note
	 */

	constructor(
		statusBarItem: HTMLElement,
		numberOfNotesToPublish: number,
		attachment: boolean = false
	) {
		this.statusBarItem = statusBarItem;
		this.counter = 0;
		this.numberOfNotesToPublish = numberOfNotesToPublish;
		this.attachment = attachment;

		const typeAttachment = this.attachment ? i18next.t("common.attachments") : i18next.t("common.files");
		const msg = i18next.t("statusBar.markedForSharing", { nb: this.numberOfNotesToPublish, type: typeAttachment });
		this.icon = this.statusBarItem.createEl("span", { cls: ["obsidian-publisher", "icons"]});
		this.statusBarItem.addClass("found-attachments");
		this.icon.innerHTML = FOUND_ATTACHMENTS;
		this.status = this.statusBarItem.createEl("span", { text: `${msg}` });
		this.status.addClass("found-attachments");
		this.noticeMobile = noticeMobile("wait", FOUND_ATTACHMENTS, msg);
	}

	/**
	 * increment the counter
	 */

	increment() {
		const typeAttachment = this.attachment ? i18next.t("common.attachments") : i18next.t("common.files");
		const msg = i18next.t("statusBar.sharing", { type: typeAttachment.toLowerCase() });
		this.icon.innerHTML = HOURGLASS_ICON;
		this.status.setText(
			i18next.t("statusBar.counter", { msg, counter: ++this.counter, nb: this.numberOfNotesToPublish })
		);
		this.statusBarItem.addClass("sharing");
		this.statusBarItem.removeClass("found-attachments");

		if (!this.noticeMobile?.noticeEl?.children[0]?.classList?.contains("load")) {
			setTimeout(() => {
				this.noticeMobile?.hide();
			}, 4000);
			this.noticeMobile = noticeMobile("load", HOURGLASS_ICON, msg);
		}

	}

	/**
	 * finish the status bar
	 * @param {number} displayDurationMillisec
	 */

	finish(displayDurationMillisec: number) {
		const msg = this.attachment ?
			i18next.t("statusBar.success",
				{
					action: i18next.t("common.shared"),
					type: i18next.t("common.attachments")
				})
			: i18next.t("statusBar.success", {
				action: i18next.t("common.published"),
				type: i18next.t("common.files")
			});
		this.icon.innerHTML = SUCCESS_ICON;
		this.status.setText(
			i18next.t("statusBar.counter", { msg, counter: this.counter, nb: this.numberOfNotesToPublish })
		);
		this.statusBarItem.addClass("success");
		this.statusBarItem.removeClass("sharing");
		this.noticeMobile?.hide();
		setTimeout(() => {
			this.statusBarItem.remove();
		}, displayDurationMillisec);
		setTimeout(() => {
			this.noticeMobile?.hide();
		}, displayDurationMillisec - 4000);

	}

	/**
	 * Remove the status bar if error occurs
	 */

	error(repoFrontmatter: RepoFrontmatter) {
		this.statusBarItem.addClass("error");
		this.statusBarItem.removeClass("sharing");
		this.statusBarItem.removeClass("found-attachments");
		this.icon.innerHTML = ERROR_ICONS;
		this.status.innerHTML = i18next.t("error.errorPublish", {repo: repoFrontmatter});
		this.noticeMobile?.hide();
		setTimeout(() => {
			this.statusBarItem.remove();
		}, 8000);
		setTimeout(() => {
			this.noticeMobile?.hide();
		}, 4000);
	}
}