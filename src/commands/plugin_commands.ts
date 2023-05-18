import i18next from "i18next";
import {RepoFrontmatter, Repository} from "../settings/interface";
import {checkRepositoryValidity, isShared} from "../src/data_validation_test";
import {createLink, getRepoFrontmatter} from "../src/utils";
import GithubPublisher from "../main";
import {
	deleteUnsharedDeletedNotes,
	shareAllEditedNotes,
	shareAllMarkedNotes,
	shareNewNote,
	shareOneNote, shareOnlyEdited
} from "./commands";
import { Notice } from "obsidian";


export async function createLinkOnActiveFile(branchName: string, repo: Repository, plugin: GithubPublisher) {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = file ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
	if (
		file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)
	) {
		await createLink(
			file,
			getRepoFrontmatter(plugin.settings, repo, frontmatter),
			plugin.app.metadataCache,
			plugin.app.vault,
			plugin.settings
		);
		new Notice(i18next.t("settings.plugin.copyLink.command.onActivation"));
	}
}

export async function shareActiveFile(plugin: GithubPublisher, repo: Repository | null, branchName: string) {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = file ? plugin.app.metadataCache.getFileCache(file)?.frontmatter : null;
	if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
		await shareOneNote(
			branchName,
			plugin.reloadOctokit(),
			plugin.settings,
			file,
			repo,
			plugin.app.metadataCache,
			plugin.app.vault,
		);
	} else {
		new Notice("No file is active or the file is not shared");
	}
}

export async function deleteCommands(plugin : GithubPublisher, repo: Repository, branchName: string) {
	const repoFrontmatter = getRepoFrontmatter(plugin.settings, repo);
	const publisher = plugin.reloadOctokit();
	await deleteUnsharedDeletedNotes(
		publisher,
		plugin.settings,
		publisher.octokit,
		branchName,
		repoFrontmatter as RepoFrontmatter,
		repo
	);
}



export async function uploadAllNotes(plugin: GithubPublisher, repo: Repository, branchName: string) {
	const statusBarItems = plugin.addStatusBarItem();
	const publisher = plugin.reloadOctokit();
	const sharedFiles = publisher.getSharedFiles();
	await shareAllMarkedNotes(
		publisher,
		plugin.settings,
		publisher.octokit,
		statusBarItems,
		branchName,
			getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
			sharedFiles,
			true,
			plugin,
			repo
	);
}

export async function uploadNewNotes(plugin: GithubPublisher, branchName: string, repo: Repository|null) {
	const publisher = plugin.reloadOctokit();
	await shareNewNote(
		publisher,
		publisher.octokit,
		branchName,
		plugin.app.vault,
		plugin,
			getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
			repo
	);
}

export async function repositoryValidityActiveFile(plugin:GithubPublisher, branchName: string, repo: Repository) {
	const file = plugin.app.workspace.getActiveFile();
	if (file) {
		await checkRepositoryValidity(
			branchName,
			plugin.reloadOctokit(),
			plugin.settings,
			repo,
			file,
			plugin.app.metadataCache);
	} else {
		new Notice("No file is active");
	}
}

export async function uploadAllEditedNotes(plugin: GithubPublisher ,branchName: string, repo: Repository|null=null) {
	const publisher = plugin.reloadOctokit();
	await shareAllEditedNotes(
		publisher,
		publisher.octokit,
		branchName,
		plugin.app.vault,
		plugin,
		getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
		repo
	);
}

export async function shareEditedOnly(branchName: string, repo: Repository|null, plugin: GithubPublisher) {
	const publisher = this.reloadOctokit();
	await shareOnlyEdited(
		publisher,
		publisher.octokit,
		branchName,
		plugin.app.vault,
		plugin,
		getRepoFrontmatter(this.settings, repo) as RepoFrontmatter,
		repo
	);
}
