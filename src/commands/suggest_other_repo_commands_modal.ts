import {App, FuzzySuggestModal } from "obsidian";
import {FolderSettings, Repository} from "../settings/interface";
import GithubPublisherPlugin from "../main";
import i18next from "i18next";
import {
	createLinkOnActiveFile,
	deleteCommands, repositoryValidityActiveFile, shareActiveFile,
	shareEditedOnly,
	uploadAllEditedNotes,
	uploadAllNotes,
	uploadNewNotes
} from "./plugin_commands";

interface GithubPublisherCommands {
	commands: string;
	name: string;
}

export class ChooseWhichRepoToRun extends FuzzySuggestModal<Repository> {
	plugin: GithubPublisherPlugin;
	branchName: string;

	constructor(app: App, plugin: GithubPublisherPlugin, branchName: string) {
		super(app);
		this.plugin = plugin;
		this.branchName = branchName;
	}

	getItems(): Repository[] {
		return this.plugin.settings.github.otherRepo;
	}
	getItemText(item: Repository): string {
		return item.smartKey;
	}
	onChooseItem(item: Repository, evt: MouseEvent | KeyboardEvent): void {
		new SuggestOtherRepoCommandsModal(app, this.plugin, this.branchName, item).open();
	}
}


export class SuggestOtherRepoCommandsModal extends FuzzySuggestModal<GithubPublisherCommands> {
	plugin: GithubPublisherPlugin;
	branchName: string;
	repo: Repository;
	constructor(app: App, plugin: GithubPublisherPlugin, branchName: string, repo: Repository) {
		super(app);
		this.plugin = plugin;
		this.branchName = branchName;
		this.repo = repo;
	}
	getItems(): GithubPublisherCommands[] {
		const cmd =  [
			{
				commands: "shareAllMarkedNotes",
				name: i18next.t("commands.uploadAllNotes")
			},
			{
				commands: "shareOneNote",
				name: i18next.t("commands.shareActiveFile")
			},
			{
				commands: "shareNewNote",
				name: i18next.t("commands.uploadNewNotes")
			},
			{
				commands: "shareAllEditedNotes",
				name: i18next.t("commands.uploadAllNewEditedNote")
			},
			{
				commands: "shareOnlyEdited",
				name: i18next.t("commands.uploadAllEditedNote")
			},
			{
				commands: "checkRepositoryValidity",
				name: i18next.t("commands.checkValidity.title")
			},
		];
		if (this.plugin.settings.plugin.copyLink) {
			cmd.push({
				commands: "createLink",
				name: i18next.t("commands.copyLink"),
			});
		}
		if (this.plugin.settings.upload.autoclean.enable && this.plugin.settings.upload.behavior !== FolderSettings.fixed) {
			cmd.push({
				commands: "deleteUnsharedDeletedNotes",
				name: i18next.t("commands.publisherDeleteClean")
			});
		}
		return cmd;

	}
	getItemText(item: GithubPublisherCommands): string {
		return item.name;
	}
	onChooseItem(item: GithubPublisherCommands, evt: MouseEvent | KeyboardEvent): void {
		switch (item.commands) {
		case "shareAllMarkedNotes":
			uploadAllNotes(this.plugin, this.repo, this.branchName);
			break;
		case "deleteUnsharedDeletedNotes":
			deleteCommands(this.plugin, this.repo, this.branchName);
			break;
		case "shareNewNote":
			uploadNewNotes(this.plugin, this.branchName, this.repo);
			break;
		case "shareAllEditedNotes":
			uploadAllEditedNotes(this.plugin, this.branchName, this.repo);
			break;
		case "shareOnlyEdited":
			shareEditedOnly(this.branchName, this.repo, this.plugin);
			break;
		case "shareOneNote":
			shareActiveFile(this.plugin, this.repo, this.branchName);
			break;
		case "createLink":
			createLinkOnActiveFile(this.branchName, this.repo, this.plugin);
			break;
		case "checkRepositoryValidity":
			repositoryValidityActiveFile(this.plugin, this.branchName, this.repo);
			break;
		}
		console.log(`run command ${item.commands}`);
	}
}

