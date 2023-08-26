import i18next from "i18next";
import { Menu, MenuItem, TFile, TFolder} from "obsidian";

import GithubPublisher from "../main";
import {MonoRepoProperties, RepoFrontmatter, Repository} from "../settings/interface";
import {getRepoFrontmatter} from "../utils";
import {defaultRepo, getRepoSharedKey, isShared, multipleSharedKey} from "../utils/data_validation_test";
import {shareAllMarkedNotes, shareOneNote} from "./commands";
import {ChooseRepoToRun} from "./suggest_other_repo_commands_modal";

/**
 * Share the shared file of a folder to a repository
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {TFolder} folder - The folder to share
 * @param {string} branchName - The branch name for the repository
 * @param {Repository | null} repo - The data repository found in the file
 */
export async function shareFolderRepo(plugin: GithubPublisher, folder: TFolder, branchName: string, repo: Repository | null) {
	const publisher = await plugin.reloadOctokit();
	const statusBarItems = plugin.addStatusBarItem();
	const monoProperties: MonoRepoProperties = {
		frontmatter: getRepoFrontmatter(plugin.settings, repo, undefined) as RepoFrontmatter,
		repo,
	};
	await shareAllMarkedNotes(
		publisher,
		statusBarItems,
		branchName,
		monoProperties,
		publisher.getSharedFileOfFolder(folder, repo),
		true,
	);
}

/**
 * Create a submenu if multiple repository are set up
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {MenuItem} item - The item to add the submenu to
 * @param {TFolder} folder - The folder to share
 * @param {string} branchName - The branch name for the repository
 * @return {Menu} - The submenu created
 */
export function addSubMenuCommandsFolder(plugin: GithubPublisher, item: MenuItem, folder: TFolder, branchName: string): Menu {
	//@ts-ignore
	const subMenu = item.setSubmenu() as Menu;
	subMenu.addItem((subItem) => {
		subItem
			.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
				smartKey: i18next.t("common.default").toUpperCase(),
				doc: folder.name
			}))
			.setIcon("folder-up")
			.onClick(async () => {
				const repo = getRepoSharedKey(plugin.settings, undefined);
				await shareFolderRepo(plugin, folder, branchName, repo);
			});
	});
	const activatedRepoCommands = plugin.settings.github.otherRepo.filter((repo) => repo.createShortcuts);
	if (activatedRepoCommands.length > 0) {
		activatedRepoCommands.forEach((otherRepo) => {
			subMenu.addItem((item) => {
				item.setTitle(
					i18next.t("commands.shareViewFiles.multiple.on", {
						smartKey: otherRepo.smartKey.toUpperCase(),
						doc: folder.name
					}))
					.setIcon("folder-up")
					.onClick(async () => {
						await shareFolderRepo(plugin, folder, branchName, otherRepo);
					});
			});
		});
	}
	subMenu.addItem((subItem) => {
		subItem
			.setTitle(i18next.t("commands.shareViewFiles.multiple.other"))
			.setIcon("folder-symlink")
			.onClick(async () => {
				new ChooseRepoToRun(plugin.app, plugin, null, branchName, "folder", async (item: Repository) => {
					await shareFolderRepo(plugin, folder, branchName, item);
				}).open();

			});
	});
	return subMenu;
}

/**
 * Create a menu for a shared file
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {TFile} file - The file to share
 * @param {string} branchName - The branch name for the repository
 * @param {Menu} menu - The menu to add the item to
 */
export function addMenuFile(plugin: GithubPublisher, file: TFile, branchName: string, menu: Menu) {
	const frontmatter = file instanceof TFile ? plugin.app.metadataCache.getFileCache(file)!.frontmatter : undefined;
	const getSharedKey = getRepoSharedKey(plugin.settings, frontmatter);
	const allKeysFromFile = multipleSharedKey(frontmatter, plugin.settings);
	if (
		isShared(frontmatter, plugin.settings, file, getSharedKey) && 
		plugin.settings.plugin.fileMenu
	) {
		const repoFrontmatter = getRepoFrontmatter(plugin.settings, getSharedKey, frontmatter);
		menu.addItem((item) => {
			/**
			 * Create a submenu if multiple repo exists in the settings
			 */
			if (allKeysFromFile.length > 1 || (repoFrontmatter instanceof Array && repoFrontmatter.length > 1)) {
				item
					.setTitle("Github Publisher")
					.setIcon("upload-cloud");
				subMenuCommandsFile(
					plugin,
					item,
					file,
					branchName,
					getSharedKey
				);
				return;
			}
			const fileName = plugin.getTitleFieldForCommand(file, plugin.app.metadataCache.getFileCache(file)?.frontmatter).replace(".md", "");
			const repoName = repoFrontmatter instanceof Array ? repoFrontmatter : [repoFrontmatter];
			item
				.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
					doc: fileName,
					smartKey: repoName[0].repo || getSharedKey?.smartKey.toUpperCase() || i18next.t("common.default").toUpperCase()
				}))
				.setIcon("file-up")
				.onClick(async () => {
					await shareOneNote(
						branchName,
						await plugin.reloadOctokit(),
						file,
						getSharedKey,
						fileName
					);
				});
		});
	}
}

/**
 * Create a subMenu if multiple repository are set up
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {MenuItem} item - The item to add the submenu to
 * @param {TFile} file - The file to share
 * @param {string} branchName - The branch name for the repository
 * @param {Repository} repo - The data repository found in the file
 * @return {Menu} - The submenu created
 */
export function subMenuCommandsFile(plugin: GithubPublisher, item: MenuItem, file: TFile, branchName: string, repo: Repository | null): Menu {
	const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
	const fileName = plugin.getTitleFieldForCommand(file, frontmatter).replace(".md", "");
	//@ts-ignore
	const subMenu = item.setSubmenu() as Menu;
	let repoFrontmatter = getRepoFrontmatter(plugin.settings, repo, frontmatter);
	repoFrontmatter = repoFrontmatter instanceof Array ? repoFrontmatter : [repoFrontmatter];
	/**
	 * default repo
	 */
	if ((repo?.shareKey === plugin.settings.plugin.shareKey || (frontmatter?.[plugin.settings.plugin.shareKey])) && (!frontmatter!.repo || !frontmatter!.multipleRepo)) {
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(
					(i18next.t("commands.shareViewFiles.multiple.on", {
						smartKey: i18next.t("common.default").toUpperCase(),
						doc: fileName,
					})))
				.setIcon("file-up")
				.onClick(async () => {
					await shareOneNote(
						branchName,
						await plugin.reloadOctokit(),
						file,
						defaultRepo(plugin.settings),
						fileName
					);
				});
		});
	}
	const activatedRepoCommands = plugin.settings.github.otherRepo.filter((repo) => repo.createShortcuts);

	if (activatedRepoCommands.length > 0) {
		activatedRepoCommands.forEach((otherRepo) => {
			if (otherRepo.shareKey === repo?.shareKey || (frontmatter?.[otherRepo.shareKey])) {
				subMenu.addItem((item) => {
					item
						.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
							smartKey: otherRepo.smartKey.toUpperCase(),
							doc: fileName
						}))
						.setIcon("file-up")
						.onClick(async () => {
							await shareOneNote(
								branchName,
								await plugin.reloadOctokit(),
								file,
								otherRepo,
								fileName
							);
						});
				});
			}
		});
	}
	if (repoFrontmatter.length > 1) {
		repoFrontmatter.forEach((repoFront) => {
			subMenu.addItem((item) => {
				item
					.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
						smartKey: repoFront.repo.toUpperCase(),
						doc: fileName
					}))
					.setIcon("file-up")
					.onClick(async () => {
						await shareOneNote(
							branchName,
							await plugin.reloadOctokit(),
							file,
							repo,
							fileName
						);
					});
			});
		});
	}

	subMenu.addItem((subItem) => {
		subItem
			.setTitle(i18next.t("commands.shareViewFiles.multiple.other"))
			.setIcon("file-input")
			.onClick(async () => {
				new ChooseRepoToRun(plugin.app, plugin, repo?.shareKey, branchName, "file", async (item: Repository) => {
					await shareOneNote(
						branchName,
						await plugin.reloadOctokit(),
						file,
						item,
						fileName
					);
				}).open();
			});
	});
	return subMenu;
}

/**
 * Create a menu with submenu for a folder in the explorer view
 * @param menu {Menu} - The menu to add the item to
 * @param folder {TFolder} - The folder to share
 * @param branchName {string} - The branch name for the repository
 * @param plugin {GithubPublisher} - The plugin instance
 */
export async function addMenuFolder(menu: Menu, folder: TFolder, branchName: string, plugin: GithubPublisher) {
	menu.addItem((item) => {
		/**
		 * Create a submenu if multiple repo exists in the settings
		*/
		const areTheyMultipleRepo = plugin.settings.github?.otherRepo?.length > 0;
		if (areTheyMultipleRepo) {
			item.setTitle("Github Publisher");
			item.setIcon("upload-cloud");
			addSubMenuCommandsFolder(
				plugin,
				item,
				folder,
				branchName
			);
			return;
		}
		item.setSection("action");
		item.setTitle(
			i18next.t("commands.shareViewFiles.multiple.on", {
				smartKey: i18next.t("common.default").toUpperCase(),
				doc: folder.name
			}))
			.setIcon("folder-up")
			.onClick(async () => {
				const repo = getRepoSharedKey(plugin.settings, undefined);
				await shareFolderRepo(plugin, folder, branchName, repo);
			});
	});
}
