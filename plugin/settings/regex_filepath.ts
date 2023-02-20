import {App, Notice, Modal, Setting} from "obsidian";
import { GitHubPublisherSettings, TextCleaner } from "./interface";
import { subSettings, StringFunc } from "plugin/i18n";

export class RegexOnFilePathAndName extends Modal {
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
        let {contentEl} = this;
        contentEl.empty();
        const onWhat = this.type === "path" ? "file path" : "file name";
        contentEl.createEl("h2", {text: "Regex on " + onWhat});
        let what = this.type === "path" ? this.settings.upload.replacePath : this.settings.upload.replaceTitle;

        for (const title of what) {
            new Setting(contentEl)
                .addText((text) => {
                    text.setPlaceholder("Regex")
                        .setValue(title.regex)
                        .onChange((value) => {
                            title.regex = value;
                        });
                })
                .addText((text) => {
                    text.setPlaceholder("Replacement")
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
                button.setButtonText("Add new regex")
                    .onClick(() => {
                        what.push({
                            regex: "",
                            replacement: "",
                        });
                    this.onOpen();
                    })
                })
            .addButton((button) => {
                button
                    .setButtonText("Save")
                    .onClick(() => {
                        this.onSubmit(this.settings);
                        this.close();
                    })
            })
    }

    onClose() {
        let {contentEl} = this;
        contentEl.empty();
    }
}

export class RegexOnContents extends Modal {
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
        let {contentEl} = this;
        contentEl.empty();
        contentEl.createEl("h2", {text: "Regex on contents"});
        new Notice("This feature is not implemented yet.");
        const censorTextDesc = document.createDocumentFragment();
        censorTextDesc
            .createEl("p", {
                text: subSettings("textConversion.censor.TextDesc") as string,
            })
            .createEl("p", {
                text: subSettings("textConversion.censor.TextEmpty") as string,
            });
        const toolTipRegex = ((((((((((((subSettings(
            "textConversion.censor.TextFlags"
        ) as string) +
            "\n" +
            subSettings("textConversion.censor.flags.insensitive")) as string) +
            "\n" +
            subSettings("textConversion.censor.flags.global")) as string) +
            "\n" +
            subSettings("textConversion.censor.flags.multiline")) as string) +
            "\n" +
            subSettings("textConversion.censor.flags.dotAll")) as string) +
            "\n" +
            subSettings("textConversion.censor.flags.unicode")) as string) +
            "\n" +
            subSettings("textConversion.censor.flags.sticky")) as string;
        contentEl.createEl("p", {
            text: subSettings("textConversion.censor.TextHeader") as string,
        });
        new Setting(contentEl)
            .setClass("github-publisher-censor-desc")
            .setDesc(censorTextDesc)
            .addButton((btn) => {
                btn
                .setIcon("plus")
                    .setTooltip(
                        subSettings(
                            "textConversion.censor.ToolTipAdd"
                        ) as string
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
            });

        for (const censorText of this.settings.conversion.censorText) {
            const afterIcon = censorText.after
                ? "double-down-arrow-glyph"
                : "double-up-arrow-glyph";
            const afterDesc = censorText.after
                ? (subSettings("textConversion.censor.After") as string)
                : (subSettings("textConversion.censor.Before") as string);
            new Setting(contentEl)
                .setClass("github-publisher-censor-entry")
                .addText((text) => {
                    text.setPlaceholder(
                        subSettings(
                            "textConversion.censor.PlaceHolder"
                        ) as string
                    )
                        .setValue(censorText.entry)
                        .onChange(async (value) => {
                            censorText.entry = value;
                        });
                })
                .addText((text) => {
                    text.inputEl.style.width="30px";
                    text.setPlaceholder(
                        subSettings(
                            "textConversion.censor.ValuePlaceHolder"
                        ) as string
                    )
                        .setValue(censorText.replace)
                        .onChange(async (value) => {
                            censorText.replace = value;
                        });
                
                })
                .addButton((btn) => {
                    btn.setTooltip(toolTipRegex)
                        .setIcon("tags")
                        .setClass("github-publisher-censor-flags");
                })
                .addText((text) => {
                    text
                        .setPlaceholder("flags")
                        .setValue(censorText.flags)
                        .onChange(async (value) => {
                            if (value.match(/^[gimsuy\s]+$/) || value === "") {
                                censorText.flags = value;
                            } else {
                                new Notice(
                                    (
                                        subSettings(
                                            "textConversion.censor.flags.error"
                                        ) as StringFunc
                                    )(value)
                                );
                            }
                        });
                })
                .addExtraButton((btn) => {
                    btn.setIcon("trash")
                        .setTooltip(
                            subSettings(
                                "textConversion.censor.ToolTipRemove"
                            ) as string
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
                    btn.setIcon(afterIcon)
                        .setTooltip(afterDesc)
                        .onClick(async () => {
                            censorText.after = !censorText.after;
                            this.onOpen();
                        });
                });
        }
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Save")
                    .onClick(() => {
                        this.onSubmit(this.settings);
                        this.close();
                    });
            });
    }

    onClose() {
        let {contentEl} = this;
        contentEl.empty();
    }
}