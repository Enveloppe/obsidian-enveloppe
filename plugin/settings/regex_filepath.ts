import { SERVFAIL } from "dns";
import {App, Notice, Modal, Setting} from "obsidian";
import { GitHubPublisherSettings, RegexReplace } from "./interface";

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
        contentEl.createEl("h2", {text: "Regex on file path and name"});
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Add new regex")
                    .onClick(() => {
                        this.settings.upload.replaceTitle.push({
                            regex: "",
                            replacement: "",
                        });
                        this.onOpen();
                    });
        const what = this.type === "path" ? this.settings.upload.replacePath : this.settings.upload.replaceTitle;
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
                            this.settings.upload.replaceTitle = this.settings.upload.replaceTitle.filter((t) => t !== title);
                            this.onOpen();
                        });
                })
            }
        });
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Save")
                    .onClick(() => {
                        this.onSubmit(this.settings);
                        this.close();
                    })
            });
    }

    onClose() {
        let {contentEl} = this;
        contentEl.empty();
    }
}