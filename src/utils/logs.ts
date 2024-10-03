import {Notice, Platform, sanitizeHTMLToDom, setIcon, TFile} from "obsidian";
import type Enveloppe from "../main";
import type {EnveloppeSettings, Properties} from "@interfaces";
import i18next from "i18next";
import type Publisher from "../GitHub/upload";
import {Logger, type ILogObj} from "tslog";

export class Logs {
	plugin: Enveloppe;
	logger: Logger<ILogObj>;
	constructor(plugin: Enveloppe) {
		this.plugin = plugin;
		const minLevel = plugin.settings.plugin?.dev ? 0 : 2;
		this.logger = new Logger({name: "Enveloppe", minLevel});
		if (this.plugin.settings.plugin?.dev) {
			const logFile = `${this.plugin.manifest.dir}/logs.txt`;
			this.logger.attachTransport(async (logObj) => {
				await this.plugin.app.vault.adapter.append(logFile, JSON.stringify(logObj));
			});
		}
	}

	/**
	 * Create a notice message for the log
	 */
	private notif(...messages: unknown[]) {
		const settings = this.plugin.settings;
		if (settings.plugin?.noticeError) new Notice(messages.join(" "));
	}

	error(...messages: unknown[]) {
		this.logger.error(...messages);
		this.noticeError(messages.join(" "));
	}

	warn(...messages: unknown[]) {
		this.logger.warn(...messages);
		this.notif(messages);
	}

	info(...messages: unknown[]) {
		this.logger.info(...messages);
		this.notif(messages);
	}

	debug(...messages: unknown[]) {
		this.logger.debug(...messages);
		this.notif(messages);
	}
	
	trace(...messages: unknown[]) {
		this.logger.trace(...messages);
		this.notif(messages);
	}
	
	silly(...messages: unknown[]) {
		this.logger.silly(...messages);
		this.notif(messages);
	}
	
	fatal(...messages: unknown[]) {
		this.logger.fatal(...messages);
		this.noticeError(messages.join(" "));
	}

	/**
	 * Notify the user with a message in the console and a message in the notification
	 * Only for mobile
	 * @param cls {"error"|"load"|"success"|"wait"} To adjust css style in function of the type of message
	 * @param icon {string} The icon to display
	 * @param message {string} The message to display
	 * @returns {Notice | undefined}
	 */
	noticeMobile(
		cls: "error" | "load" | "success" | "wait",
		icon: string,
		message: string
	): Notice | undefined {
		if (!Platform.isMobile) {
			return;
		}
		const noticeFrag = document.createDocumentFragment();
		const span = noticeFrag.createEl("span", {
			text: message,
			cls: ["enveloppe", cls, "icons"],
		});
		setIcon(span, icon);
		noticeFrag.createEl("span", {
			cls: ["enveloppe", cls, "notification"],
		}).innerHTML = message;
		return new Notice(noticeFrag, 0);
	}
	
	noticeErrorUpload(properties: Properties | Properties[]) {
		const repo = Array.isArray(properties) ? properties : [properties];
		for (const repository of repo) {
			const notif = document.createDocumentFragment();
			const notifSpan = notif.createSpan({
				cls: ["error", "enveloppe", "icons", "notification"],
			});
			const html = sanitizeHTMLToDom(
				i18next.t("error.errorPublish", {repo: repository})
			);
			setIcon(notifSpan, "mail-warning");
			notif
				.createSpan({
					cls: ["error", "enveloppe", "notification"],
				})
				.appendChild(html);
			new Notice(notif);
		}
	}
	
	noticeSuccess(message: string) {
		const notif = document.createDocumentFragment();
		const notifSpan = notif.createSpan({
			cls: ["success", "enveloppe", "icons", "notification"],
		});
		const html = sanitizeHTMLToDom(message);
		setIcon(notifSpan, "mail-check");
		notif
			.createSpan({
				cls: ["success", "enveloppe", "notification"],
			})
			.appendChild(html);
		new Notice(notif);
	}
	
	noticeError(message: string) {
		const notif = document.createDocumentFragment();
		const notifSpan = notif.createSpan({
			cls: ["error", "enveloppe", "icons", "notification"],
		});
		const html = sanitizeHTMLToDom(message);
		setIcon(notifSpan, "mail-question");
		notif
			.createSpan({
				cls: ["error", "enveloppe", "notification"],
			})
			.appendChild(html);
		new Notice(notif);
	}

	async publisherNotificationOneRepo(
		PublisherManager: Publisher,
		file: TFile | string | undefined,
		settings: EnveloppeSettings,
		prop: Properties
	): Promise<void> {
		const noticeValue = file instanceof TFile ? `"${file.basename}"` : file;
		const docSuccess = document.createDocumentFragment();
		const successMsg =
			file instanceof String
				? i18next.t("informations.successfulPublish", {
						nbNotes: noticeValue,
						repo: prop,
					})
				: i18next.t("informations.successPublishOneNote", {
						file: noticeValue,
						repo: prop,
					});
		const span = docSuccess.createEl("span", {
			text: successMsg,
			cls: ["enveloppe", "success", "icons"],
		});
		setIcon(span, "mail-check");
		docSuccess.createEl("span", {
			cls: ["enveloppe", "success", "notification"],
		}).innerHTML = successMsg;
		if (settings.github.workflow.name.length === 0) {
			new Notice(docSuccess, 0);
			return;
		}
		const workflowSuccess = document.createDocumentFragment();
		const WorkflowSpan = workflowSuccess.createEl("span", {
			text: i18next.t("informations.successfulPublish", {
				nbNotes: noticeValue,
				repo: prop,
			}),
			cls: ["enveloppe", "wait", "icons"],
		});
		setIcon(WorkflowSpan, "hourglass");
		workflowSuccess.createEl("span", {
			cls: ["enveloppe", "wait", "notification"],
		}).innerHTML = `${i18next.t("informations.sendMessage", {
			nbNotes: noticeValue,
			repo: prop,
		})}.<br>${i18next.t("informations.waitingWorkflow")}`;
		new Notice(workflowSuccess);
		const successWorkflow = await PublisherManager.workflowGestion(prop);
		if (successWorkflow) {
			new Notice(docSuccess, 0);
		}
	}

	async publisherNotification(
		PublisherManager: Publisher,
		file: TFile | string | undefined,
		settings: EnveloppeSettings,
		prop: Properties | Properties[]
	) {
		prop = Array.isArray(prop) ? prop : [prop];
		for (const repository of prop) {
			await this.publisherNotificationOneRepo(
				PublisherManager,
				file,
				settings,
				repository
			);
		}
	}
}
