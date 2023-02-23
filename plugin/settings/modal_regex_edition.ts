import {App, Notice, Modal, Setting} from "obsidian";
import { GitHubPublisherSettings, TextCleaner } from "./interface";
import i18next from "i18next";

export class ModalRegexFilePathName extends Modal {
	settings: GitHubPublisherSettings;
	type: string;
	onSubmit: (settings: GitHubPublisherSettings) => void;
	constructor(
		app: App, 
		settings: GitHubPublisherSettings, 
		type: string, 
		onSubmit: (settings: GitHubPublisherSettings) => void) {
		super(app);
		this.type = type;
		this.settings = settings;
		this.onSubmit = onSubmit;
	}

	forbiddenValue(value: string, onWhat: string): (string|boolean)[] {
		let isForbidden: boolean = false;
		if (value == '/') {
			new Notice(i18next.t("settings.conversion.censor.forbiddenValue", {what: onWhat, forbiddenChar: value}));
			value = "";
			isForbidden = true;
		}
		else if (
			(value.match(/[><:"|?*]|(\\\/)|(^\w+\/\w+)|(\\)/)) && (this.type === "file")
		) {
			new Notice(i18next.t("settings.conversion.censor.forbiddenValue", {what: onWhat, forbiddenChar: value.match(/[><:"|?*]|(\\\/)|(^\w+\/\w+)|(\\)/)[0]}));
			value = "";
			isForbidden = true;
		} else if (this.type === "path") {
			if (value.match(/[\\><:"|?*]/)){
				new Notice(i18next.t("settings.conversion.censor.forbiddenValue", { what: onWhat, forbiddenChar: value.match(/[\\><:"|?*]/)[0]}));
				value = "";
				isForbidden = true;
			} else if (value.match(/(^\w+\/\w+)|(\\\/)/)) {
				new Notice(i18next.t("settings.conversion.censor.warningPath"));
			}
		}
		return [value, isForbidden];
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		let onWhat = this.type === "path" ? i18next.t("common.path.folder") : i18next.t("common.path.file");
		onWhat = onWhat.toLowerCase();
		contentEl.createEl("h2", {text: i18next.t("settings.conversion.censor.title", {what: onWhat})});
		const what = this.type === "path" ? this.settings.upload.replacePath : this.settings.upload.replaceTitle;

		for (const title of what) {
			new Setting(contentEl)
				.addText((text) => {
					text.setPlaceholder(i18next.t("regex.entry"))
						.setValue(title.regex)
						.onChange((value) => {
							title.regex = value;
						});
				})
				.addText((text) => {
					text.setPlaceholder(i18next.t("regex.replace"))
						.setValue(title.replacement)
						.onChange((value) => {
							title.replacement = value;
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("trash")
						.onClick(() => {
							if (this.type === "path") {
								this.settings.upload.replacePath = this.settings.upload.replacePath.filter((t) => t !== title);
							} else {
								this.settings.upload.replaceTitle = this.settings.upload.replaceTitle.filter((t) => t !== title); 
							}
							this.onOpen();
						});
				});
		}
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setIcon("plus")
					.onClick(() => {
						what.push({
							regex: "",
							replacement: "",
						});
						this.onOpen();
					});
			})
			.addButton((button) => {
				button
					.setButtonText(i18next.t("common.save"))
					.onClick(() => {
						const canBeValidated: boolean[] = [];
						what.forEach((title) => {
							const isForbiddenEntry = this.forbiddenValue(title.regex, onWhat);
							const isForbiddenReplace = this.forbiddenValue(title.replacement, onWhat);
							canBeValidated.push(isForbiddenEntry[1] as boolean);
							canBeValidated.push(isForbiddenReplace[1] as boolean);
							if (isForbiddenEntry[1] || isForbiddenReplace[1]) {
								title.regex = isForbiddenEntry[0] as string;
								title.replacement = isForbiddenReplace[0] as string;
							}
						});
						if (!canBeValidated.includes(true)) {
							this.onSubmit(this.settings);
							this.close();
						}
					});
			});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

export class ModalRegexOnContents extends Modal {
	settings: GitHubPublisherSettings;
	onSubmit: (settings: GitHubPublisherSettings) => void;
	constructor(
		app: App, 
		settings: GitHubPublisherSettings, 
		onSubmit: (settings: GitHubPublisherSettings) => void) {
		super(app);
		this.settings = settings;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl
			.createEl("p", {
				text: i18next.t("settings.conversion.censor.modal.title") ,
			})
			.createEl("p", {
				text: i18next.t("settings.conversion.censor.modal.desc") ,
			})
			.createEl("p", {
				text: i18next.t("settings.conversion.censor.empty")});
		for (const censorText of this.settings.conversion.censorText) {
			new Setting(contentEl)
				.setClass("github-publisher-censor-entry")
				.addText((text) => {
					text.inputEl.style.width = "100%";
					text.setPlaceholder(i18next.t(
						"regex.entry") 
					)
						.setValue(censorText.entry)
						.onChange(async (value) => {
							censorText.entry = value;
						});
				})
				.addText((text) => {
					text.inputEl.style.width="100%";
					text.setPlaceholder(i18next.t("regex.replace"))
						.setValue(censorText.replace)
						.onChange(async (value) => {
							censorText.replace = value;
						});
                
				})
				
				.addExtraButton((btn) => {
					btn.setIcon("trash")
						.setTooltip(i18next.t("common.delete", {things: "Regex"}))
						.onClick(async () => {
							this.settings.conversion.censorText.splice(
								this.settings.conversion.censorText.indexOf(
									censorText
								),
								1
							);
							this.onOpen();
						});
				})
				.addExtraButton((btn) => {
					btn
						.setIcon("pencil")
						.setTooltip(i18next.t("settings.conversion.censor.edit"))
						.onClick(async () => {
							new ModalEditorRegex(this.app, censorText, (result => {
								censorText.flags = result.flags;
								censorText.after = result.after;
							})).open();
						});
				});
		}
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setIcon("plus")
					.setTooltip(i18next.t("common.add", {things: "Regex"}))
					
					.onClick(async () => {
						const censorText: TextCleaner = {
							entry: "",
							replace: "",
							after: false,
							flags: "gi",
						};
						this.settings.conversion.censorText.push(censorText);
						this.onOpen();
					});
			})
			.addButton((button) => {
				button
					.setButtonText(i18next.t("common.save"))
					.onClick(() => {
						this.onSubmit(this.settings);
						this.close();
					});
			});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ModalEditorRegex extends Modal {
	result: TextCleaner;
	onSubmit: (result: TextCleaner) => void;
	
	constructor(app: App, toEdit: TextCleaner, onSubmit: (result: TextCleaner) => void) {
		super(app);
		this.result = toEdit;
		this.onSubmit = onSubmit;
	}
	
	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: i18next.t("settings.conversion.censor.edit")});
		/*
		Parameters :
		- Flags ; 
		- After/Before other ; */
		const flagsDesc = document.createDocumentFragment();
		const flagsDescription = flagsDesc.createEl("p", {
			text: i18next.t("settings.conversion.censor.flags.title")
		});
		flagsDescription.createEl("li", {text: i18next.t("settings.conversion.censor.flags.insensitive")});
		flagsDescription.createEl("li", {text: i18next.t("settings.conversion.censor.flags.global")});
		flagsDescription.createEl("li", {text: i18next.t("settings.conversion.censor.flags.multiline")}); 
		flagsDescription.createEl("li", {text: i18next.t("settings.conversion.censor.flags.dotAll")});
		flagsDescription.createEl("li", {text: i18next.t("settings.conversion.censor.flags.unicode")}); 
		flagsDescription.createEl("li", {text: i18next.t("settings.conversion.censor.flags.sticky")});
		
		new Setting(contentEl)
			.setName("Flags")
			.setDesc(flagsDesc)
			.addText((text) => {
				text.setPlaceholder("gimsuy")
					.setValue(this.result.flags)
					.onChange(async (value) => {
						if (value.match(/^[gimsuy\s]+$/) || value === "") {
							this.result.flags = value;
						} else {
							new Notice(
								(i18next.t(
									"settings.conversion.censor.flags.error", {flags: value}))
							);
						}
					});
			});
		
		new Setting(contentEl)
			.setName(i18next.t("settings.conversion.censor.MomentReplaceRegex"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("before", i18next.t("common.before"))
					.addOption("after", i18next.t("common.after"))
					.setValue(this.result.after ? "after" : "before")
					.onChange(async (value) => {
						this.result.after = value === "after";
					});
			});
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText(i18next.t("common.save")) 
					.onClick(() => {
						this.onSubmit(this.result);
						this.close();
					});
			});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
