import { FolderSettings, type EnveloppeSettings, type Repository } from "@interfaces";
import i18next from "i18next";
import { type App, FuzzySuggestModal } from "obsidian";
import {
	createLinkOnActiveFile,
	deleteCommands,
	repositoryValidityActiveFile,
	shareActiveFile,
	shareEditedOnly,
	uploadAllEditedNotes,
	uploadAllNotes,
	uploadNewNotes,
} from "src/commands";
import type Enveloppe from "src/main";
import { defaultRepo } from "src/utils/data_validation_test";

interface EnveloppeCommands {
	commands: string;
	name: string;
}

/**
 * @extends FuzzySuggestModal
 * @category Command
 * @category SuggestModal
 * @category Enveloppe
 * @description This class is used to choose which repo to run the command on
 */

export class ChooseWhichRepoToRun extends FuzzySuggestModal<Repository> {
	plugin: Enveloppe;
	branchName: string;
	settings: EnveloppeSettings;

	constructor(app: App, plugin: Enveloppe, branchName: string) {
		super(app);
		this.plugin = plugin;
		this.branchName = branchName;
		this.settings = plugin.settings;
	}

	getItems(): Repository[] {
		return this.settings.github.otherRepo;
	}
	getItemText(item: Repository): string {
		return item.smartKey;
	}
	onChooseItem(item: Repository, _evt: MouseEvent | KeyboardEvent): void {
		new SuggestOtherRepoCommandsModal(
			this.plugin.app,
			this.plugin,
			this.branchName,
			item
		).open();
	}
}

/**
 * Just return the repo data
 */
export class ChooseRepoToRun extends FuzzySuggestModal<Repository> {
	plugin: Enveloppe;
	branchName: string;
	keyToFind: string | null;
	type: "folder" | "file";
	settings: EnveloppeSettings;
	fileName: string | null;
	onSubmit: (item: Repository) => void;

	constructor(
		app: App,
		plugin: Enveloppe,
		keyToFind: null | string = null,
		branchName: string,
		type: "folder" | "file",
		fileName: string | null,
		onSubmit: (item: Repository) => void
	) {
		super(app);
		this.plugin = plugin;
		this.branchName = branchName;
		this.keyToFind = keyToFind;
		this.onSubmit = onSubmit;
		this.fileName = fileName;
		this.type = type;
		this.settings = plugin.settings;
	}

	getItems(): Repository[] {
		let repoFound: Repository[] = [];
		const defRepo = defaultRepo(this.settings);
		if (this.type === "file") {
			if (
				this.settings.plugin.shareAll?.enable &&
				!this.fileName?.startsWith(this.settings.plugin.shareAll?.excludedFileName)
			) {
				repoFound.push(defRepo);
			}
			if (this.keyToFind) {
				repoFound = repoFound.concat(
					this.settings.github.otherRepo.filter(
						(repo: Repository) => repo.shareKey == this.keyToFind
					)
				);
				if (this.keyToFind === defRepo.shareKey) {
					repoFound.push(defRepo);
				}
			}
		}
		repoFound = repoFound.concat(
			this.settings.github.otherRepo.filter(
				(repo: Repository) =>
					repo.shareAll?.enable &&
					!this.fileName?.startsWith(repo.shareAll?.excludedFileName)
			)
		);
		if (repoFound.length === 0) return [defRepo, ...this.settings.github.otherRepo];
		repoFound.push(defRepo);
		return [...new Set(repoFound)];
	}
	getItemText(item: Repository): string {
		return item.smartKey;
	}
	onChooseItem(item: Repository, _evt: MouseEvent | KeyboardEvent): void {
		this.onSubmit(item);
	}
}

/**
 * @description This class call the commands on the chosen repo
 * @extends FuzzySuggestModal
 */

export class SuggestOtherRepoCommandsModal extends FuzzySuggestModal<EnveloppeCommands> {
	plugin: Enveloppe;
	branchName: string;
	repo: Repository;
	settings: EnveloppeSettings;
	constructor(app: App, plugin: Enveloppe, branchName: string, repo: Repository) {
		super(app);
		this.plugin = plugin;
		this.branchName = branchName;
		this.repo = repo;
		this.settings = plugin.settings;
	}
	getItems(): EnveloppeCommands[] {
		const cmd = [
			{
				commands: "shareAllMarkedNotes",
				name: i18next.t("commands.uploadAllNotes"),
			},
			{
				commands: "shareOneNote",
				name: i18next.t("commands.shareActiveFile"),
			},
			{
				commands: "shareNewNote",
				name: i18next.t("commands.uploadNewNotes"),
			},
			{
				commands: "shareAllEditedNotes",
				name: i18next.t("commands.uploadAllNewEditedNote"),
			},
			{
				commands: "shareOnlyEdited",
				name: i18next.t("commands.uploadAllEditedNote"),
			},
			{
				commands: "checkRepositoryValidity",
				name: i18next.t("commands.checkValidity.title"),
			},
		];
		if (this.settings.plugin.copyLink) {
			cmd.push({
				commands: "createLink",
				name: i18next.t("commands.copyLink.title"),
			});
		}
		if (
			this.settings.upload.autoclean.enable &&
			this.settings.upload.behavior !== FolderSettings.Fixed
		) {
			cmd.push({
				commands: "deleteUnsharedDeletedNotes",
				name: i18next.t("commands.publisherDeleteClean"),
			});
		}
		return cmd;
	}
	getItemText(item: EnveloppeCommands): string {
		return item.name;
	}
	onChooseItem(item: EnveloppeCommands, _evt: MouseEvent | KeyboardEvent): void {
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
				repositoryValidityActiveFile(this.plugin, this.repo);
				break;
		}
	}
}
