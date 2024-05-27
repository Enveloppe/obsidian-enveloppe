import {
	FolderSettings,
	type EnveloppeSettings,
	type OverrideAttachments,
	type RegexReplace,
	type TextCleaner,
	TypeOfEditRegex,
} from "@interfaces";
import dedent from "dedent";
import i18next from "i18next";
import { type App, Modal, Notice, sanitizeHTMLToDom, Setting } from "obsidian";
import { escapeRegex } from "src/conversion/links";

function isRegexValid(regexString: string) {
	try {
		new RegExp(regexString);
		return {
			error: null,
			isValid: true,
		};
	} catch (e) {
		return {
			error: e,
			isValid: false,
		};
	}
}

export class OverrideAttachmentsModal extends Modal {
	settings: EnveloppeSettings;
	allOverrides: OverrideAttachments[];
	onSubmit: (result: OverrideAttachments[]) => void;
	constructor(
		app: App,
		settings: EnveloppeSettings,
		allOverrides: OverrideAttachments[],
		onSubmit: (result: OverrideAttachments[]) => void
	) {
		super(app);
		this.allOverrides = allOverrides;
		this.settings = settings;
		this.onSubmit = onSubmit;
	}

	forbiddenValue(value: string): { value: string; isForbidden: boolean } {
		if (!isRegexValid(value).isValid) {
			const error = isRegexValid(value).error;
			new Notice(i18next.t("settings.regexReplacing.invalidRegex", { e: error }));
			return {
				value: "",
				isForbidden: true,
			};
		} else if (value.match(/[\\><:"|?*]/) && !value.match(/^\/(.*)\/[gmisuvdy]*$/)) {
			new Notice(
				i18next.t("settings.regexReplacing.forbiddenValue", {
					what: i18next.t("common.path.folder"),
					forbiddenChar: value.match(/[\\><:"|?*]/)![0],
				})
			);
			return {
				value: "",
				isForbidden: true,
			};
		}
		return {
			value,
			isForbidden: false,
		};
	}
	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "regex", "file-path-name"]);
		new Setting(contentEl)
			.setHeading()
			.setName(i18next.t("settings.embed.overrides.modal.title"));
		const explanation = dedent(`
			<p>${i18next.t("settings.regexReplacing.modal.desc")}</p>
			<h3>${i18next.t("settings.regexReplacing.modal.keywords")}</h3>
			<ul class="keywords">
				<li><code>{{all}}</code>${i18next.t("settings.embed.forcePush.all")}</li>
				<li><code>{{default}}</code>${i18next.t("settings.embed.forcePush.default")}</li>
				<li><code>{{name}}</code>${i18next.t("settings.regexReplacing.modal.name")}</li>
			</ul>
			<h3>${i18next.t("settings.regexReplacing.modal.force")}</h3>
			<p>${i18next.t("settings.embed.forcePush.info")}</p>
		`);
		contentEl.appendChild(sanitizeHTMLToDom(explanation));

		if (!this.settings.embed.overrideAttachments) {
			this.settings.embed.overrideAttachments = [];
		}
		for (const override of this.allOverrides) {
			const sett = new Setting(contentEl)
				.setClass("entry")
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("settings.embed.overrides.modal.path"))
						.setValue(override.path)
						.onChange((value) => {
							override.path = value;
							sett.controlEl.setAttribute("value", value);
						});
				})
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("settings.embed.overrides.modal.dest"))
						.setValue(override.destination)
						.onChange((value) => {
							override.destination = value;
							sett.controlEl.setAttribute("replace", value);
						});
				})
				.addToggle((toggle) => {
					toggle
						.setTooltip(i18next.t("settings.embed.forcePush.title"))
						.setValue(override.forcePush)
						.onChange((value) => {
							override.forcePush = value;
						});
				});
			sett.controlEl.setAttribute("value", override.path);
			sett.controlEl.setAttribute("replace", override.destination);
			sett.addExtraButton((button) => {
				button.setIcon("trash").onClick(() => {
					this.allOverrides.splice(this.allOverrides.indexOf(override), 1);
					this.onOpen();
				});
			});
		}

		new Setting(contentEl)
			.addButton((button) => {
				button.setIcon("plus").onClick(() => {
					this.allOverrides.push({
						path: "",
						destination: "",
						forcePush: false,
					});
					this.onOpen();
				});
			})
			.addButton((button) => {
				button.setButtonText(i18next.t("common.save")).onClick(() => {
					const canBeValidated: boolean[] = [];
					this.allOverrides.forEach((override) => {
						const isForbiddenEntry = this.forbiddenValue(override.path);
						const isForbiddenReplace = this.forbiddenValue(override.destination);
						canBeValidated.push(isForbiddenEntry.isForbidden);
						canBeValidated.push(isForbiddenReplace.isForbidden);
						if (isForbiddenEntry.isForbidden || isForbiddenReplace.isForbidden) {
							override.path = isForbiddenEntry.value as string;
							override.destination = isForbiddenReplace.value as string;
							const faultyInputValue = contentEl.querySelector(
								`[value="${escapeRegex(override.path)}"] input`
							);
							const faultyInputReplace = contentEl.querySelector(
								`[replace="${escapeRegex(override.destination)}"] input`
							);
							faultyInputValue?.classList.add("error");
							faultyInputReplace?.classList.add("error");
						}
					});
					if (!canBeValidated.includes(true)) {
						//remove empty regex
						this.onSubmit(this.allOverrides);
						this.close();
					}
				});
			});
	}
	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ModalRegexFilePathName extends Modal {
	settings: EnveloppeSettings;
	allRegex: RegexReplace[];
	onSubmit: (result: RegexReplace[]) => void;
	constructor(
		app: App,
		settings: EnveloppeSettings,
		allRegex: RegexReplace[],
		onSubmit: (result: RegexReplace[]) => void
	) {
		super(app);
		this.allRegex = allRegex;
		this.settings = settings;
		this.onSubmit = onSubmit;
	}

	classValue(allRegex: RegexReplace[]) {
		this.settings.upload.replacePath = allRegex.filter((regex) => {
			return regex.type === TypeOfEditRegex.Path;
		});
		this.settings.upload.replaceTitle = allRegex.filter((regex) => {
			return regex.type === TypeOfEditRegex.Title;
		});
	}

	forbiddenValue(
		value: string,
		type: TypeOfEditRegex
	): { value: string; isForbidden: boolean } {
		const regexSpecialDontExclude = /\/(.*)(\\[dwstrnvfb0cxup])(.*)\//i;
		let onWhat =
			type === TypeOfEditRegex.Path
				? i18next.t("common.path.folder")
				: i18next.t("common.path.file");
		onWhat = onWhat.toLowerCase();
		let isForbidden = false;
		if (value == "/") {
			new Notice(
				i18next.t("settings.regexReplacing.forbiddenValue", {
					what: onWhat,
					forbiddenChar: value,
				})
			);
			value = "";
			isForbidden = true;
		} else if (!isRegexValid(value).isValid) {
			const error = isRegexValid(value).error;
			new Notice(i18next.t("settings.regexReplacing.invalidRegex", { e: error }));
			isForbidden = true;
		} else if (
			value.match(/[><:"|?*]|(\\\/)|(^\w+\/\w+)|(\\)/) &&
			type === TypeOfEditRegex.Title &&
			!value.match(regexSpecialDontExclude)
		) {
			new Notice(
				i18next.t("settings.regexReplacing.forbiddenValue", {
					what: onWhat,
					forbiddenChar: value.match(/[><:"|?*]|(\\\/)|(^\w+\/\w+)|(\\)/)![0],
				})
			);
			value = "";
			isForbidden = true;
		} else if (type === TypeOfEditRegex.Path) {
			if (value.match(/[\\><:"|?*]/) && !value.match(/^\/(.*)\/[gmisuvdy]*$/)) {
				new Notice(
					i18next.t("settings.regexReplacing.forbiddenValue", {
						what: onWhat,
						forbiddenChar: value.match(/[\\><:"|?*]/)![0],
					})
				);
				value = "";
				isForbidden = true;
			} else if (
				value.match(/(^\w+\/\w+)|(\\\/)/) &&
				!value.match(regexSpecialDontExclude)
			) {
				new Notice(i18next.t("settings.regexReplacing.warningPath"));
			}
		}
		return {
			value,
			isForbidden,
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "regex", "file-path-name"]);
		if (this.settings.upload.behavior === FolderSettings.Fixed) {
			contentEl.createEl("h2", {
				text: i18next.t("settings.regexReplacing.modal.title.only"),
			});
		} else {
			contentEl.createEl("h2", {
				text: i18next.t("settings.regexReplacing.modal.title.all"),
			});
		}
		if (!this.settings.upload.replacePath) {
			this.settings.upload.replacePath = [];
		} else if (!this.settings.upload.replaceTitle) {
			this.settings.upload.replaceTitle = [];
		}
		this.settings.upload.replacePath.forEach((title) => {
			if (!title.type) {
				title.type = TypeOfEditRegex.Path;
			}
		});
		this.settings.upload.replaceTitle.forEach((title) => {
			if (!title.type) {
				title.type = TypeOfEditRegex.Title;
			}
		});

		for (const title of this.allRegex) {
			const sett = new Setting(contentEl)
				.setClass("entry")
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("regex.entry"))
						.setValue(title.regex)
						.onChange((value) => {
							title.regex = value;
							sett.controlEl.setAttribute("value", value);
						});
				})
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("regex.replace"))
						.setValue(title.replacement)
						.onChange((value) => {
							title.replacement = value;
							sett.controlEl.setAttribute("replace", value);
						});
				});
			sett.controlEl.setAttribute("value", title.regex);
			sett.controlEl.setAttribute("replace", title.replacement);
			if (this.settings.upload.behavior !== FolderSettings.Fixed) {
				sett.addDropdown((dropdown) => {
					dropdown
						.addOption("path", i18next.t("common.path.folder"))
						.addOption("title", i18next.t("common.path.file"))
						.setValue(title.type)
						.onChange((value) => {
							title.type = value as TypeOfEditRegex;
						});
				});
			} else {
				sett.addButton((button) => {
					button.buttonEl.classList.add("disabled");
					button.setButtonText(i18next.t("common.path.file"));
				});
			}
			sett.addExtraButton((button) => {
				button.setIcon("trash").onClick(() => {
					this.allRegex.splice(this.allRegex.indexOf(title), 1);
					this.onOpen();
				});
			});
		}
		new Setting(contentEl)
			.addButton((button) => {
				button.setIcon("plus").onClick(() => {
					this.allRegex.push({
						regex: "",
						replacement: "",
						type: TypeOfEditRegex.Title,
					});
					this.onOpen();
				});
			})
			.addButton((button) => {
				button.setButtonText(i18next.t("common.save")).onClick(() => {
					const canBeValidated: boolean[] = [];
					this.allRegex.forEach((title) => {
						if (!title.regex) title.regex = "";
						if (!title.replacement) title.replacement = "";
						const isForbiddenEntry = this.forbiddenValue(title.regex, title.type);
						if (title.regex.length === 0) {
							new Notice(i18next.t("settings.regexReplacing.emptyRegex"));
							isForbiddenEntry.isForbidden = true;
							isForbiddenEntry.value = "";
						}

						const isForbiddenReplace = this.forbiddenValue(title.replacement, title.type);
						canBeValidated.push(isForbiddenEntry.isForbidden);
						canBeValidated.push(isForbiddenReplace.isForbidden);
						if (isForbiddenEntry.isForbidden || isForbiddenReplace.isForbidden) {
							title.regex = isForbiddenEntry.value as string;
							title.replacement = isForbiddenReplace.value as string;
							const faultyInputValue = contentEl.querySelector(
								`[value="${escapeRegex(title.regex)}"] input`
							);
							const faultyInputReplace = contentEl.querySelector(
								`[replace="${escapeRegex(title.replacement)}"] input`
							);
							faultyInputValue?.classList.add("error");
							faultyInputReplace?.classList.add("error");
						}
					});
					if (!canBeValidated.includes(true)) {
						//remove empty regex

						this.onSubmit(this.allRegex);
						this.close();
					}
				});
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ModalRegexOnContents extends Modal {
	settings: EnveloppeSettings;
	onSubmit: (settings: EnveloppeSettings) => void;
	constructor(
		app: App,
		settings: EnveloppeSettings,
		onSubmit: (settings: EnveloppeSettings) => void
	) {
		super(app);
		this.settings = settings;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["enveloppe", "modals", "regex", "on-contents"]);
		contentEl
			.createEl("p", {
				text: i18next.t("settings.regexReplacing.modal.title.text"),
			})
			.createEl("p", {
				text: i18next.t("settings.regexReplacing.modal.desc"),
			})
			.createEl("p", {
				text: i18next.t("settings.regexReplacing.empty"),
			});

		for (const censorText of this.settings.conversion.censorText) {
			const afterIcon = censorText.after
				? "arrow-up-wide-narrow"
				: "arrow-down-wide-narrow";
			const inCodeBlocks = censorText?.inCodeBlocks ? "code" : "scan";
			const moment = censorText.after
				? i18next.t("common.after").toLowerCase()
				: i18next.t("common.before").toLowerCase();
			const desc = i18next.t("settings.regexReplacing.momentReplaceRegex", { moment });
			const toolTipCode = censorText.inCodeBlocks
				? i18next.t("settings.regexReplacing.inCodeBlocks.runIn")
				: i18next.t("settings.regexReplacing.inCodeBlocks.runOut");
			const sett = new Setting(contentEl);
			const isLastInList =
				this.settings.conversion.censorText.indexOf(censorText) ===
				this.settings.conversion.censorText.length - 1;
			const isFirstInList = this.settings.conversion.censorText.indexOf(censorText) === 0;
			sett.addExtraButton((btn) => {
				btn
					.setDisabled(isFirstInList)
					.setIcon("arrow-up")
					.onClick(async () => {
						const index = this.settings.conversion.censorText.indexOf(censorText);
						const newIndex = index - 1;
						this.settings.conversion.censorText.splice(index, 1);
						this.settings.conversion.censorText.splice(newIndex, 0, censorText);
						this.onOpen();
					});
				btn.extraSettingsEl.classList.add("padding-0");
			});

			sett.addExtraButton((btn) => {
				btn
					.setDisabled(isLastInList)
					.setIcon("arrow-down")
					.onClick(async () => {
						const index = this.settings.conversion.censorText.indexOf(censorText);
						const newIndex = index + 1;
						this.settings.conversion.censorText.splice(index, 1);
						this.settings.conversion.censorText.splice(newIndex, 0, censorText);
						this.onOpen();
					});
				btn.extraSettingsEl.classList.add("padding-0");
			});

			sett
				.setClass("entry")
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("regex.entry"))
						.setValue(censorText.entry)
						.onChange(async (value) => {
							censorText.entry = value;
							sett.controlEl.setAttribute("value", value);
						});
				})
				.addText((text) => {
					text
						.setPlaceholder(i18next.t("regex.replace"))
						.setValue(censorText.replace)
						.onChange(async (value) => {
							censorText.replace = value;
						});
				})

				.addExtraButton((btn) => {
					btn
						.setIcon("trash")
						.setTooltip(i18next.t("common.delete", { things: "Regex" }))
						.onClick(async () => {
							this.settings.conversion.censorText.splice(
								this.settings.conversion.censorText.indexOf(censorText),
								1
							);
							this.onOpen();
						});
				})
				.addExtraButton((btn) => {
					btn
						.setTooltip(desc)
						.setIcon(afterIcon)
						.onClick(async () => {
							censorText.after = !censorText.after;
							this.onOpen();
						});
				})
				.addExtraButton((btn) => {
					btn
						.setTooltip(toolTipCode)
						.setIcon(inCodeBlocks)
						.onClick(async () => {
							censorText.inCodeBlocks = !censorText.inCodeBlocks;
							this.onOpen();
						});
				});
			sett.controlEl.setAttribute("value", censorText.entry);
			sett.controlEl.classList.add("regex");
		}
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setIcon("plus")
					.setTooltip(i18next.t("common.add", { things: "Regex" }))

					.onClick(async () => {
						const censorText: TextCleaner = {
							entry: "",
							replace: "",
							flags: "",
							after: false,
						};
						this.settings.conversion.censorText.push(censorText);
						this.onOpen();
					});
			})
			.addButton((button) => {
				button
					.setButtonText(i18next.t("common.save"))
					.setCta()
					.onClick(() => {
						const canBeValidated: boolean[] = [];
						for (const censor of this.settings.conversion.censorText) {
							if (!isRegexValid(censor.entry).isValid) {
								new Notice(
									i18next.t("settings.regexReplacing.invalidRegex", {
										e: isRegexValid(censor.entry).error,
									})
								);
								//add error class to faulty input
								const faultyInput = contentEl.querySelector(
									`[value="${escapeRegex(censor.entry)}"] input`
								);
								faultyInput?.classList.add("error");
								canBeValidated.push(false);
							}
						}
						if (!canBeValidated.includes(false)) {
							this.onSubmit(this.settings);
							this.close();
						}
					});
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
