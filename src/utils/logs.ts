import type { EnveloppeSettings, Properties } from "@interfaces";
import i18next from "i18next";
import {
	type App,
	Notice,
	Platform,
	TFile,
	normalizePath,
	sanitizeHTMLToDom,
	setIcon,
} from "obsidian";
import type Publisher from "../GitHub/upload";
import type Enveloppe from "../main";

export class Logs {
	plugin: Enveloppe;
	app: App;
	noticeLength?: number;
	constructor(plugin: Enveloppe) {
		this.plugin = plugin;
		this.app = plugin.app;
		this.noticeLength = plugin.settings.plugin.noticeLength;
	}

	async createLogFile() {
		const path = normalizePath(`${this.plugin.manifest.dir}/logs.txt`);
		if (await this.app.vault.adapter.exists(path)) {
			await this.app.vault.adapter.remove(
				normalizePath(`${this.plugin.manifest.dir}/logs.txt`)
			);
		}
	}

	private errorToMessage(error: unknown) {
		if (error instanceof Object) {
			if (error instanceof Error && error.message) {
				return error.message;
			}
			const parsedError = JSON.parse(JSON.stringify(error));
			if (Array.isArray(parsedError)) {
				return parsedError.join(", ");
			}
			return JSON.stringify(parsedError);
		}
		if (typeof error === "string") {
			return error;
		}
		return JSON.stringify(error);
	}

	writeToLog(
		error: unknown,
		type: "silly" | "debug" | "info" | "warn" | "error" | "fatal"
	) {
		if (this.plugin.settings.plugin?.dev) {
			const logFile = normalizePath(`${this.plugin.manifest.dir}/logs.txt`);
			const err = error as Error;
			const errMessage = this.errorToMessage(error);
			const stack = err.stack
				? `\t\t${err.stack.replace(errMessage, "").trim().replaceAll("Error: \n", "").trim().replaceAll("\n", "\n\t")}\n\n`
				: "\n";
			const header = `${new Date().toLocaleString()} [${type}]: \n\t${errMessage.replaceAll("\n", "\n\t")}\n${stack}`;
			this.app.vault.adapter
				.exists(logFile)
				.then((e) => {
					if (!e)
						this.app.vault.adapter.write(logFile, header).catch((e) => console.error(e));
					else
						this.app.vault.adapter.append(logFile, header).catch((e) => console.error(e));
				})
				.catch((e) => console.error(e));
		}
	}

	/**
	 * Create a notice message for the log
	 */
	private notif(...messages: unknown[]) {
		const settings = this.plugin.settings;
		if (settings.plugin?.noticeError)
			new Notice(messages.join(" "), settings.plugin.noticeLength);
	}

	error(error: Error) {
		console.error(error);
		this.noticeError(error.message);
		this.writeToLog(error, "error");
	}

	warn(...messages: unknown[]) {
		console.warn(...messages);
		this.notif(messages);
		this.writeToLog(messages, "warn");
	}

	info(...messages: unknown[]) {
		console.info(...messages);
		this.notif(messages);
		this.writeToLog(messages, "info");
	}

	debug(...messages: unknown[]) {
		if (this.plugin.settings.plugin?.dev) {
			console.debug(...messages);
			this.notif(messages);
			this.writeToLog(messages, "debug");
		}
	}

	trace(...messages: unknown[]) {
		if (this.plugin.settings.plugin?.dev) {
			console.trace(...messages);
			this.notif(messages);
			this.writeToLog(messages, "debug");
		}
	}

	silly(...messages: unknown[]) {
		if (this.plugin.settings.plugin?.dev) {
			console.log(...messages);
			this.notif(messages);
			this.writeToLog(messages, "silly");
		}
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
		return new Notice(noticeFrag, this.noticeLength);
	}

	noticeErrorUpload(properties: Properties | Properties[]) {
		const repo = Array.isArray(properties) ? properties : [properties];
		for (const repository of repo) {
			const notif = document.createDocumentFragment();
			const notifSpan = notif.createSpan({
				cls: ["error", "enveloppe", "icons", "notification"],
			});
			const html = sanitizeHTMLToDom(
				i18next.t("error.errorPublish", { repo: repository })
			);
			setIcon(notifSpan, "mail-warning");
			notif
				.createSpan({
					cls: ["error", "enveloppe", "notification"],
				})
				.appendChild(html);
			new Notice(notif, this.noticeLength);
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
		new Notice(notif, this.noticeLength);
	}

	noticeError(message: string) {
		const notif = document.createDocumentFragment();
		const notifSpan = notif.createSpan({
			cls: ["error", "enveloppe", "icons", "notification"],
		});
		const html = sanitizeHTMLToDom(message);
		setIcon(notifSpan, "alert-triangle");
		notif
			.createSpan({
				cls: ["error", "enveloppe", "notification"],
			})
			.appendChild(html);
		new Notice(notif, this.plugin.settings.plugin.noticeLength);
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
			new Notice(docSuccess, settings.plugin.noticeLength);
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
		new Notice(workflowSuccess, PublisherManager.settings.plugin.noticeLength);
		const successWorkflow = await PublisherManager.workflowGestion(prop);
		if (successWorkflow) {
			new Notice(docSuccess, settings.plugin.noticeLength);
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

export class EnveloppeErrors extends Error {
	constructor(
		message: string,
		options?: { name?: string; cause?: unknown; stack?: string }
	) {
		super();
		this.message = message;
		const { name, cause, stack } = options || {};
		if (name) this.name = name;
		if (cause) this.cause = cause;
		if (stack) this.stack = stack;
	}
}
