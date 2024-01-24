import i18next from "i18next";
import {App, FuzzySuggestModal } from "obsidian";
import { defaultRepo } from "src/utils/data_validation_test";

import GithubPublisherPlugin from "../main";
import {FolderSettings, Repository} from "../settings/interface";
import {logs} from "../utils";
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

/**
	* @extends FuzzySuggestModal
	* @category Command
	* @category SuggestModal
	* @category GithubPublisherPlugin
	* @description This class is used to choose which repo to run the command on
	*/

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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onChooseItem(item: Repository, evt: MouseEvent | KeyboardEvent): void {
		new SuggestOtherRepoCommandsModal(this.plugin.app, this.plugin, this.branchName, item).open();
	}
}

/**
	* Just return the repo data
	*/
export class ChooseRepoToRun extends FuzzySuggestModal<Repository> {
	plugin: GithubPublisherPlugin;
	branchName: string;
	keyToFind: string | null;
	type: "folder" | "file";
	fileName: string | null;
	onSubmit: (item: Repository) => void;

	constructor(app: App, plugin: GithubPublisherPlugin, keyToFind: null|string = null, branchName: string, type:"folder"|"file", fileName: string | null, onSubmit: (item: Repository) => void) {
		super(app);
		this.plugin = plugin;
		this.branchName = branchName;
		this.keyToFind = keyToFind;
		this.onSubmit = onSubmit;
		this.fileName = fileName;
		this.type = type;
	}

	getItems(): Repository[] {
		let repoFound: Repository[] = [];
		const defRepo = defaultRepo(this.plugin.settings);
		if (this.type === "file") {
			if (this.plugin.settings.plugin.shareAll?.enable && !this.fileName?.startsWith(this.plugin.settings.plugin.shareAll?.excludedFileName)) {
				repoFound.push(defRepo);
			}
			if (this.keyToFind) {
				repoFound=repoFound.concat(this.plugin.settings.github.otherRepo.filter((repo: Repository) => repo.shareKey == this.keyToFind));
				if (this.keyToFind === defRepo.shareKey) {
					repoFound.push(defRepo);
				}
			}
		}
		repoFound=repoFound.concat(this.plugin.settings.github.otherRepo.filter((repo: Repository) => repo.shareAll?.enable && !this.fileName?.startsWith(repo.shareAll?.excludedFileName)));
		repoFound.push(defRepo);
		repoFound=[...new Set(repoFound)];
		if (repoFound.length === 0)
			return this.plugin.settings.github.otherRepo;
		return repoFound;
	}
	getItemText(item: Repository): string {
		return item.smartKey;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onChooseItem(item: Repository, evt: MouseEvent | KeyboardEvent): void {
		this.onSubmit(item);
	}
}

/**
	* @description This class call the commands on the chosen repo
	* @extends FuzzySuggestModal
	*/

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
				name: i18next.t("commands.copyLink.title"),
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
			shareActiveFile(this.plugin, this.repo);
			break;
		case "createLink":
			createLinkOnActiveFile(this.repo, this.plugin);
			break;
		case "checkRepositoryValidity":
			repositoryValidityActiveFile(this.plugin, this.branchName, this.repo);
			break;
		}
		logs({settings: this.plugin.settings}, `run command ${item.commands}`);
	}
}

