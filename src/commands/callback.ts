import {FolderSettings, RepoFrontmatter, Repository} from "../settings/interface";
import GithubPublisher from "../main";
import {checkRepositoryValidity, isShared} from "../src/data_validation_test";
import {createLink, getRepoFrontmatter} from "../src/utils";
import i18next from "i18next";
import {Command, Notice } from "obsidian";
import {deleteUnsharedDeletedNotes, shareOneNote} from "./commands";
import {shareEditedOnly, uploadAllEditedNotes, uploadAllNotes, uploadNewNotes} from "./plugin_commands";

export async function createLinkCommands(repo: Repository | null, branchName: string, plugin: GithubPublisher) {
	const id = repo ? `publisher-copy-link-${repo.smartKey}` : "publisher-copy-link";
	return {
		id: id,
		name: i18next.t("commands.copyLink"),
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = file ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
			if (
				file && frontmatter && isShared(frontmatter, plugin.settings, file)
			) {
				if (!checking) {
					createLink(
						file,
						getRepoFrontmatter(plugin.settings, repo, frontmatter),
						plugin.app.metadataCache,
						plugin.app.vault,
						plugin.settings
					);
					new Notice(i18next.t("settings.plugin.copyLink.command.onActivation"));
				}
				return true;
			}
			return false;
		},
	} as Command;
}

export async function deleteCommandsOnRepo(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const id = repo ? `publisher-delete-clean-${repo.smartKey}` : "publisher-delete-clean";
	return {
		id: id,
		name: i18next.t("commands.publisherDeleteClean") ,
		hotkeys: [],
		checkCallback: (checking) => {
			if (plugin.settings.upload.autoclean.enable && plugin.settings.upload.behavior !== FolderSettings.fixed) {
				if (!checking) {
					const publisher = plugin.reloadOctokit();
					deleteUnsharedDeletedNotes(
						publisher,
						plugin.settings,
						publisher.octokit,
						branchName,
						getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
					);
				}
				return true;
			}
			return false;
		},
	} as Command;
}

export async function publisherOneCall(repo: Repository|null, plugin: GithubPublisher, branchName: string) {
	const id = repo ? `publisher-one-${repo.smartKey}` : "publisher-one";
	return {
		id: id,
		name: i18next.t("commands.shareActiveFile") ,
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = file ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
			if (
				file && frontmatter && isShared(frontmatter, plugin.settings, file)
			) {
				if (!checking) {
					shareOneNote(
						branchName,
						plugin.reloadOctokit(),
						plugin.settings,
						file,
						repo,
						plugin.app.metadataCache,
						plugin.app.vault
					);
				}
				return true;
			}
			return false;
		},
	} as Command;
}

export async function publisherPublishAll(repo: Repository|null, branchName: string) {
	const id = repo ? `publisher-publish-all-${repo.smartKey}` : "publisher-publish-all";
	return {
		id: id,
		name: i18next.t("commands.uploadAllNotes") ,
		callback: async () => {
			await uploadAllNotes(this,repo, branchName);
		},
	} as Command;
}

export async function publisherUploadNew(repo: Repository | null, branchName: string) {
	const id = repo ? `publisher-upload-new-${repo.smartKey}` : "publisher-upload-new";
	return {
		id: id,
		name: i18next.t("commands.uploadNewNotes") ,
		callback: async () => {
			await uploadNewNotes(this,branchName, repo);
		},
	} as Command;
}

export async function publisherUploadAllEditedNew(repo: Repository|null, branchName: string) {
	const id = repo ? `publisher-upload-all-edited-new-${repo.smartKey}` : "publisher-upload-all-edited-new";
	return {
		id: id,
		name: i18next.t("commands.uploadAllNewEditedNote") ,
		callback: async () => {
			await uploadAllEditedNotes(this, branchName, repo);
		},
	} as Command;
}

export async function publisherUploadEdited(repo: Repository|null, branchName: string, plugin: GithubPublisher) {
	const id = repo ? `publisher-upload-edited-${repo.smartKey}` : "publisher-upload-edited";
	return {
		id: id,
		name: i18next.t("commands.uploadAllEditedNote") ,
		callback: async () => {
			await shareEditedOnly(branchName, repo, plugin);
		},
	} as Command;
}

export async function repositoryValidityCallback(plugin: GithubPublisher, repo: Repository, branchName: string) {
	const id = repo ? `check-plugin-repo-validy-${repo.smartKey}` : "check-plugin-repo-validy";
	return {
		id: id,
		name: i18next.t("commands.checkValidity.title") ,
		checkCallback: (checking) => {
			if (plugin.app.workspace.getActiveFile())
			{
				if (!checking) {
					checkRepositoryValidity(
						branchName,
						plugin.reloadOctokit(),
						plugin.settings,
						repo,
						plugin.app.workspace.getActiveFile(),
						plugin.app.metadataCache);
				}
				return true;
			}
			return false;
		},
	} as Command;
}


