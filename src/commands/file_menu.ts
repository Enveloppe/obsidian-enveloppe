import GithubPublisher from "../main";
import {Menu, MenuItem, TFile, TFolder} from "obsidian";
import {ChooseRepoToRun, ChooseWhichRepoToRun} from "./suggest_other_repo_commands_modal";
import {RepoFrontmatter, Repository} from "../settings/interface";
import {getRepoSharedKey, isShared} from "../utils/data_validation_test";
import {shareAllMarkedNotes, shareOneNote} from "./commands";
import {getRepoFrontmatter} from "../utils";
import i18next from "i18next";


export async function shareFolderRepo(plugin: GithubPublisher, folder: TFolder, branchName: string, repo: Repository) {
	const publisher = await plugin.reloadOctokit();
	const statusBarItems = plugin.addStatusBarItem();
	await shareAllMarkedNotes(
		publisher,
		plugin.settings,
		publisher.octokit,
		statusBarItems,
		branchName,
		getRepoFrontmatter(plugin.settings, repo) as RepoFrontmatter,
		publisher.getSharedFileOfFolder(folder, repo),
		true,
		plugin,
		repo
	);
}

export function addSubMenuCommandsFolder(plugin: GithubPublisher, item: MenuItem, folder: TFolder, branchName: string) {
	//@ts-ignore
	const subMenu = item.setSubmenu() as Menu;
	subMenu.addItem((subItem) => {
		subItem
			.setTitle(i18next.t("commands.shareFolder.default", {repo: plugin.settings.github.repo, user: plugin.settings.github.user, folderName: folder.name}))
			.setIcon("upload")
			.onClick(async () => {
				const repo = getRepoSharedKey(plugin.settings, null);
				await shareFolderRepo(plugin, folder, branchName, repo);
			});
	});
	const activatedRepoCommands = plugin.settings.github.otherRepo.filter((repo) => repo.createShortcuts);
	if (activatedRepoCommands.length > 0) {
		activatedRepoCommands.forEach((otherRepo) => {
			subMenu.addItem((item) => {
				item.setTitle(i18next.t("commands.shareFolder.default", {user: otherRepo.user, repo: otherRepo.repo, folderName: folder.name}))
					.setIcon("share")
					.onClick(async () => {
						await shareFolderRepo(plugin, folder, branchName, otherRepo);
					});
			});
		});
	}
	subMenu.addItem((subItem) => {
		subItem
			.setTitle(i18next.t("commands.shareFolder.other", {folderName: folder.name}))
			.setIcon("arrow-up-circle")
			.onClick(async () => {
				new ChooseRepoToRun(plugin.app, plugin, null, branchName, async (item: Repository) => {
					await shareFolderRepo(plugin, folder, branchName, item);
				}).open();

			});
	});
	return subMenu;
}

export function fileEditorMenu(plugin: GithubPublisher, file: TFile, branchName: string, menu: Menu) {
	const frontmatter = file instanceof TFile ? plugin.app.metadataCache.getFileCache(file).frontmatter : null;
	const getSharedKey = getRepoSharedKey(plugin.settings, frontmatter);
	if (
		isShared(frontmatter, plugin.settings, file, getSharedKey) &&
					plugin.settings.plugin.fileMenu
	) {
		menu.addSeparator();
		menu.addItem((item) => {
			/**
						 * Create a submenu if multiple repo exists in the settings
						 */
			const areTheyMultipleRepo = plugin.settings.github?.otherRepo?.length > 0;
			if (areTheyMultipleRepo) {
				item.setTitle("Obsidian Publisher");
				item.setSection("action");
				item.setIcon("upload-cloud");
				subMenuCommandsFile(
					plugin,
					item,
					file,
					branchName,
					getSharedKey
				);
			} else {
				const fileName = plugin.getTitleFieldForCommand(file, plugin.app.metadataCache.getFileCache(file).frontmatter).replace(".md", "");
				item.setSection("action");
				item.setTitle(i18next.t("commands.shareViewFiles.default", {viewFile: fileName}));
				item.setIcon("share");
				item.onClick(async () => {
					await shareOneNote(
						branchName,
						await plugin.reloadOctokit(),
						plugin.settings,
						file,
						getSharedKey,
						plugin.app.metadataCache,
						plugin.app.vault
					);
				});
			}
		});
		menu.addSeparator();
	}
}

export function subMenuCommandsFile(plugin: GithubPublisher, item: MenuItem, file: TFile, branchName: string, repo: Repository) {
	const fileName = plugin.getTitleFieldForCommand(file, plugin.app.metadataCache.getFileCache(file).frontmatter).replace(".md", "");
	//@ts-ignore
	const subMenu = item.setSubmenu() as Menu;
	if (repo.shareKey === plugin.settings.plugin.shareKey) {
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(
					(i18next.t("commands.shareViewFiles.multiple.on", {
						viewFile: fileName,
						repo: plugin.settings.github.repo,
						user: plugin.settings.github.user
					})))
				.setIcon("share")
				.onClick(async () => {
					await shareOneNote(
						branchName,
						await plugin.reloadOctokit(),
						plugin.settings,
						file,
						repo,
						plugin.app.metadataCache,
						plugin.app.vault
					);
				});
		});
	}
	const activatedRepoCommands = plugin.settings.github.otherRepo.filter((repo) => repo.createShortcuts);
	if (activatedRepoCommands.length > 0) {
		activatedRepoCommands.forEach((otherRepo) => {
			if (otherRepo.shareKey === repo.shareKey) {
				subMenu.addItem((item) => {
					item
						.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
							viewFile: fileName,
							user: otherRepo.user,
							repo: otherRepo.repo
						}))
						.setIcon("share")
						.onClick(async () => {
							await shareOneNote(
								branchName,
								await plugin.reloadOctokit(),
								plugin.settings,
								file,
								otherRepo,
								plugin.app.metadataCache,
								plugin.app.vault
							);
						});
				});
			}
		});
	}
	subMenu.addItem((subItem) => {
		subItem
			.setTitle(i18next.t("commands.shareViewFiles.multiple.other", {viewFile: fileName}))
			.setIcon("arrow-up-circle")
			.onClick(async () => {
				new ChooseRepoToRun(plugin.app, plugin, repo.shareKey, branchName, async (item: Repository) => {
					await shareOneNote(
						branchName,
						await plugin.reloadOctokit(),
						plugin.settings,
						file,
						item,
						plugin.app.metadataCache,
						plugin.app.vault
					);
				}).open();
			});
	});
	return subMenu;
}
