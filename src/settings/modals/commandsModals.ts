import {App, FuzzySuggestModal } from "obsidian";
import {FolderSettings, Repository} from "../interface";
import GithubPublisherPlugin from "../../main";
import i18next from "i18next";

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
		new CommandsModals(app, this.plugin, this.branchName, item).open();
	}
}


export class CommandsModals extends FuzzySuggestModal<GithubPublisherCommands> {
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
				commands: "deleteUnsharedDeletedNotes",
				name: i18next.t("commands.publisherDeleteClean")
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
			this.plugin.uploadAllNotes(this.repo, this.branchName);
			break;
		case "deleteUnsharedDeletedNotes":
			this.plugin.deleteCommands(this.repo, this.branchName);
			break;
		case "shareNewNote":
			this.plugin.uploadNewNotes(this.branchName, this.repo);
			break;
		case "shareAllEditedNotes":
			this.plugin.uploadAllEditedNotes(this.branchName, this.repo);
			break;
		case "shareOnlyEdited":
			this.plugin.shareEditedOnly(this.branchName, this.repo);
			break;
		case "shareOneNote":
			this.plugin.shareActiveFile(this.repo, this.branchName);
			break;
		case "createLink":
			this.plugin.createLinkOnActiveFile(this.branchName, this.repo);
			break;
		case "checkRepositoryValidity":
			this.plugin.repositoryValidityActiveFile(this.branchName, this.repo);
			break;
		}
		console.log(`run command ${item.commands}`);
	}
}

