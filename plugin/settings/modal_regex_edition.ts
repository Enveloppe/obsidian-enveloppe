import {App, Notice, Modal, Setting} from "obsidian";
import { GitHubPublisherSettings, TextCleaner } from "./interface";
import { subSettings, StringFunc } from "plugin/i18n";

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

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		const onWhat = this.type === "path" ? "file path" : "file name";
		contentEl.createEl("h2", {text: subSettings("textConversion.censor.header") + onWhat});
		const what = this.type === "path" ? this.settings.upload.replacePath : this.settings.upload.replaceTitle;

		for (const title of what) {
			new Setting(contentEl)
				.addText((text) => {
					text.setPlaceholder(subSettings("textConversion.censor.replace") as string)
						.setValue(title.regex)
						.onChange((value) => {
							title.regex = value;
						});
				})
				.addText((text) => {
					text.setPlaceholder(subSettings("textConversion.censor.value") as string)
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
					.setButtonText(subSettings("textConversion.censor.save") as string)
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
				text: subSettings("textConversion.censor.TextDesc") as string,
			})
			.createEl("p", {
				text: subSettings("textConversion.censor.TextEmpty") as string,
			});
		for (const censorText of this.settings.conversion.censorText) {
			new Setting(contentEl)
				.setClass("github-publisher-censor-entry")
				.addText((text) => {
					text.inputEl.style.width = "100%";
					text.setPlaceholder(subSettings(
						"textConversion.censor.PlaceHolder") as string
					)
						.setValue(censorText.entry)
						.onChange(async (value) => {
							censorText.entry = value;
						});
				})
				.addText((text) => {
					text.inputEl.style.width="100%";
					text.setPlaceholder(subSettings("textConversion.censor.ValuePlaceHolder") as string
					)
						.setValue(censorText.replace)
						.onChange(async (value) => {
							censorText.replace = value;
						});
                
				})
				
				.addExtraButton((btn) => {
					btn.setIcon("trash")
						.setTooltip(subSettings("textConversion.censor.ToolTipRemove") as string
						)
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
						.setTooltip(subSettings("textConversion.censor.edit") as string)
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
					.setTooltip(subSettings("textConversion.censor.ToolTipAdd") as string
					)
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
					.setButtonText(subSettings("textConversion.censor.save") as string)
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
		contentEl.createEl('h2', {text: subSettings("textConversion.censor.edit") as string});
		/*
		Parameters :
		- Flags ; 
		- After/Before other ; */
		const flagsDesc = document.createDocumentFragment();
		const flagsDescription = flagsDesc.createEl("p", {
			text: subSettings("textConversion.censor.TextFlags") as string
		});
		flagsDescription.createEl("li", {text: subSettings("textConversion.censor.flags.insensitive") as string});
		flagsDescription.createEl("li", {text: subSettings("textConversion.censor.flags.global") as string});
		flagsDescription.createEl("li", {text: subSettings("textConversion.censor.flags.multiline") as string}); 
		flagsDescription.createEl("li", {text: subSettings("textConversion.censor.flags.dotAll") as string});
		flagsDescription.createEl("li", {text: subSettings("textConversion.censor.flags.unicode") as string}); 
		flagsDescription.createEl("li", {text: subSettings("textConversion.censor.flags.sticky") as string});
		
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
								(subSettings(
									"textConversion.censor.flags.error"
								) as StringFunc
								)(value)
							);
						}
					});
			});
		
		new Setting(contentEl)
			.setName(subSettings("textConversion.censor.MomentReplaceRegex.desc") as string)
			.addDropdown((dropdown) => {
				dropdown
					.addOption("before", subSettings("textConversion.censor.MomentReplaceRegex.before") as string)
					.addOption("after", subSettings("textConversion.censor.MomentReplaceRegex.after") as string)
					.setValue(this.result.after ? "after" : "before")
					.onChange(async (value) => {
						this.result.after = value === "after";
					});
			});
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText(subSettings("textConversion.censor.save") as string) 
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
