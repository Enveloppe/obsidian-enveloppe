import { Notice, Platform, setIcon, TFile } from "obsidian";
import type Enveloppe from "../main";
import type { EnveloppeSettings, Properties } from "@interfaces";
import i18next from "i18next";
import type Publisher from "../GitHub/upload";

type Arguments = {
	logs?: boolean;
	e?: boolean;
};

export class Logs {
	plugin: Enveloppe;

	constructor(plugin: Enveloppe) {
		this.plugin = plugin;
	}

	/**
	 * Create a notice message for the log
	 */
	notif(args: Arguments, ...messages: unknown[]) {
		const { logs, e } = args;
		const settings = this.plugin.settings;
		if (settings.plugin?.noticeError) {
			new Notice(messages.join(" "));
			return;
		}
		let stack: string = this.callFunction();
		if (stack.contains("logs")) {
			stack = this.callFunction(true);
		}
		const date = new Date().toISOString().slice(11, 23);
		const prefix = logs ? `DEV LOGS [${date}] ${stack}:\n` : `[Enveloppe](${stack}):\n`;
		if (e) console.error(prefix, ...messages);
		else console.log(prefix, ...messages);
		this.writeToLog(stack, e, ...messages);
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

	/**
	 * Detect the function that call the function
	 * @param type {boolean} if true, return the function that call the function that call the function
	 * @returns {string}
	 */
	callFunction(type?: boolean): string {
		const index = type ? 4 : 3;
		let callFunction = new Error().stack?.split("\n")[index].trim();
		callFunction = callFunction?.substring(
			callFunction.indexOf("at ") + 3,
			callFunction.lastIndexOf(" (")
		);
		callFunction = callFunction?.replace("Object.callback", "");
		callFunction = callFunction ? callFunction : "main";
		callFunction = callFunction === "eval" ? "main" : callFunction;
		return callFunction;
	}

	/**
	 * Add a new option in settings "dev"
	 * Will make appear ALL the logs in the console
	 * Not just the logs for normal process
	 * For advanced users only
	 */
	logs(args: Arguments, ...messages: unknown[]) {
		let { logs, e } = args;
		const settings = this.plugin.settings;
		logs = true;
		if (e) {
			this.notif({ logs, e }, ...messages);
			return;
		}
		if (settings.plugin?.dev) {
			this.notif({ logs }, ...messages);
		}
	}

	async writeToLog(stack: string, e?: boolean, ...messages: unknown[]) {
		const settings = this.plugin.settings;
		if (!settings.plugin?.dev) return;
		const logs: string[] = [];
		logs.push(`\n[${e ? "error" : "logs"} - ${stack}]`);
		for (const message of messages) {
			logs.push(String(message));
		}
		const logFile = `${this.plugin.manifest.dir}/logs.txt`;

		this.plugin.app.vault.adapter.append(logFile, logs.join(" "));
	}

	notifError(properties: Properties | Properties[]) {
		const repo = Array.isArray(properties) ? properties : [properties];
		for (const repository of repo) {
			const notif = document.createDocumentFragment();
			const notifSpan = notif.createSpan({
				cls: ["error", "enveloppe", "icons", "notification"],
			});
			setIcon(notifSpan, "mail-warning");
			notif.createSpan({
				cls: ["error", "enveloppe", "notification"],
			}).innerHTML = i18next.t("error.errorPublish", { repo: repository });
			new Notice(notif);
		}
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
		const Workflowspan = workflowSuccess.createEl("span", {
			text: i18next.t("informations.successfulPublish", {
				nbNotes: noticeValue,
				repo: prop,
			}),
			cls: ["enveloppe", "wait", "icons"],
		});
		setIcon(Workflowspan, "hourglass");
		const msg = `${i18next.t("informations.sendMessage", {
			nbNotes: noticeValue,
			repo: prop,
		})}.<br>${i18next.t("informations.waitingWorkflow")}`;
		workflowSuccess.createEl("span", {
			cls: ["enveloppe", "wait", "notification"],
		}).innerHTML = msg;
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
