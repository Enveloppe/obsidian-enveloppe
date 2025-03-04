// noinspection SpellCheckingInspection

import type { Properties } from "@interfaces";
import i18next from "i18next";
import { type Notice, setIcon } from "obsidian";
import type { Logs } from "./logs";
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
	console: Logs;
	isMainFile?: boolean;

	/**
	 * @param {HTMLElement} statusBarItem
	 * @param {number} numberOfNotesToPublish
	 * @param {boolean} attachment true if there are attachment to the note
	 * @param console
	 * @param isMainFile
	 */

	constructor(
		statusBarItem: HTMLElement,
		numberOfNotesToPublish: number,
		attachment: boolean = false,
		console: Logs,
		isMainFile?: boolean
	) {
		this.statusBarItem = statusBarItem;
		this.counter = 0;
		this.numberOfNotesToPublish = numberOfNotesToPublish;
		this.attachment = attachment;
		this.console = console;
		this.isMainFile = isMainFile;
		const typeAttachment = this.attachment
			? i18next.t("common.attachments")
			: i18next.t("common.files");
		const msg = i18next.t("statusBar.markedForSharing", {
			nb: this.numberOfNotesToPublish,
			type: typeAttachment,
		});
		this.icon = this.statusBarItem.createEl("span", {
			cls: ["enveloppe", "icons"],
		});
		this.statusBarItem.addClass("found-attachments");
		setIcon(this.icon, "search-check");
		this.status = this.statusBarItem.createEl("span", { text: `${msg}` });
		this.status.addClass("found-attachments");
		this.noticeMobile = this.console.noticeMobile("wait", "search-check", msg);
	}

	/**
	 * increment the counter
	 */

	increment() {
		const typeAttachment = this.attachment
			? i18next.t("common.attachments")
			: i18next.t("common.files");
		const msg = i18next.t("statusBar.sharing", { type: typeAttachment.toLowerCase() });
		setIcon(this.icon, "hourglass");
		this.status.setText(
			i18next.t("statusBar.counter", {
				msg,
				counter: ++this.counter,
				nb: this.numberOfNotesToPublish,
			})
		);
		this.statusBarItem.addClass("sharing");
		this.statusBarItem.removeClass("found-attachments");

		if (!this.noticeMobile?.noticeEl?.children[0]?.classList?.contains("load")) {
			setTimeout(() => {
				this.noticeMobile?.hide();
			}, 4000);
			this.noticeMobile = this.console.noticeMobile("load", "hourglass", msg);
		}
	}

	/**
	 * finish the status bar
	 * @param {number} displayDurationMillisec
	 */

	finish(displayDurationMillisec: number) {
		if (
			// biome-ignore lint/correctness/noUndeclaredVariables: activeDocument is expected to be available in the runtime environment
			activeDocument.querySelector(
				".status-bar-item.plugin-obsidian-mkdocs-publisher.success"
			)
		)
			this.statusBarItem.remove();
		const msg = this.attachment
			? i18next.t("statusBar.success", {
					action: i18next.t("common.shared"),
					type: i18next.t("common.attachments"),
				})
			: i18next.t("statusBar.success", {
					action: i18next.t("common.published"),
					type: i18next.t("common.files"),
				});
		const iconProp = this.isMainFile ? "book-check" : "mail-check";
		setIcon(this.icon, iconProp);
		if (this.counter > 1)
			this.status.setText(
				i18next.t("statusBar.counter", {
					msg,
					counter: this.counter,
					nb: this.numberOfNotesToPublish,
				})
			);
		else this.status.setText(i18next.t("statusBar.main"));
		this.statusBarItem.addClass("success");
		if (this.isMainFile) this.statusBarItem.addClass("main-success");
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

	error(prop: Properties) {
		this.statusBarItem.addClass("error");
		this.statusBarItem.removeClass("sharing");
		this.statusBarItem.removeClass("found-attachments");
		setIcon(this.icon, "mail-warning");
		this.status.innerHTML = i18next.t("error.errorPublish", { repo: prop });
		this.noticeMobile?.hide();
		setTimeout(() => {
			this.statusBarItem.remove();
		}, 8000);
		setTimeout(() => {
			this.noticeMobile?.hide();
		}, 4000);
	}
}
