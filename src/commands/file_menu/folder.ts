import type { MonoRepoProperties, Repository } from "@interfaces";
import i18next from "i18next";
import { type Menu, type MenuItem, Platform, type TFolder } from "obsidian";
import { shareAllMarkedNotes } from "src/commands";
import { ChooseRepoToRun } from "src/commands/suggest_other_repo_commands_modal";
import type Enveloppe from "src/main";
import {
	defaultRepo,
	getRepoSharedKey,
	isExcludedPath,
	isInDryRunFolder,
} from "src/utils/data_validation_test";
import {
	frontmatterSettingsRepository,
	getProperties,
} from "src/utils/parse_frontmatter";

/**
 * Share the shared file of a folder to a repository
 * @param {Enveloppe} plugin - The plugin instance
 * @param {TFolder} folder - The folder to share
 * @param {string} branchName - The branch name for the repository
 * @param {Repository | null} repo - The data repository found in the file
 */
async function shareFolderRepo(
	plugin: Enveloppe,
	folder: TFolder,
	branchName: string,
	repo: Repository | null
) {
	const publisher = await plugin.reloadOctokit(repo?.smartKey);
	const statusBarItems = plugin.addStatusBarItem();
	const prop = getProperties(plugin, repo, null, true);
	const monoProperties: MonoRepoProperties = {
		frontmatter: Array.isArray(prop) ? prop[0] : prop,
		repository: repo,
		convert: frontmatterSettingsRepository(plugin, repo),
	};
	await shareAllMarkedNotes(
		publisher,
		statusBarItems,
		branchName,
		monoProperties,
		publisher.getSharedFileOfFolder(folder, repo, true),
		true
	);
}

/**
 * Create a submenu if multiple repository are set up
 * If Platform is Desktop, create a submenu
 * If not, add the command to the original menu, in line
 * @param {Enveloppe} plugin - The plugin instance
 * @param {MenuItem} item - The item to add the submenu to
 * @param {TFolder} folder - The folder to share
 * @param {string} branchName - The branch name for the repository
 * @return {Menu} - The submenu created
 */
function addSubMenuCommandsFolder(
	plugin: Enveloppe,
	item: MenuItem,
	folder: TFolder,
	branchName: string,
	originalMenu: Menu
): Menu {
	const subMenu = Platform.isDesktop ? (item.setSubmenu() as Menu) : originalMenu;
	if (!isExcludedPath(plugin.settings, folder, defaultRepo(plugin.settings))) {
		subMenu.addItem((subItem) => {
			subItem
				.setTitle(
					i18next.t("commands.shareViewFiles.multiple.on", {
						smartKey: i18next.t("common.default").toUpperCase(),
						doc: folder.name,
					})
				)
				.setIcon("folder-up")
				.onClick(async () => {
					const repo = getRepoSharedKey(plugin, undefined);
					await shareFolderRepo(plugin, folder, branchName, repo);
				});
		});
	}
	const activatedRepoCommands = plugin.settings.github.otherRepo.filter(
		(repo) => repo.createShortcuts
	);
	if (activatedRepoCommands.length > 0) {
		activatedRepoCommands.forEach((otherRepo) => {
			if (isInDryRunFolder(plugin.settings, otherRepo, folder)) return;
			subMenu.addItem((item) => {
				item
					.setTitle(
						i18next.t("commands.shareViewFiles.multiple.on", {
							smartKey: otherRepo.smartKey.toUpperCase(),
							doc: folder.name,
						})
					)
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
				new ChooseRepoToRun(
					plugin.app,
					plugin,
					null,
					branchName,
					"folder",
					null,
					async (item: Repository) => {
						await shareFolderRepo(plugin, folder, branchName, item);
					}
				).open();
			});
	});
	return subMenu;
}

/**
 * Create a menu with submenu for a folder in the explorer view
 * @param menu {Menu} - The menu to add the item to
 * @param folder {TFolder} - The folder to share
 * @param branchName {string} - The branch name for the repository
 * @param plugin {Enveloppe} - The plugin instance
 */
export async function addMenuFolder(
	menu: Menu,
	folder: TFolder,
	branchName: string,
	plugin: Enveloppe
) {
	menu.addItem((item) => {
		/**
		 * Create a submenu if multiple repo exists in the settings
		 */
		const areTheyMultipleRepo = plugin.settings.github?.otherRepo?.length > 0;
		if (areTheyMultipleRepo) {
			if (Platform.isDesktop) {
				item.setTitle("Enveloppe");
				item.setIcon("mail-open");
			} else {
				//add the line to separate the commands
				menu.addSeparator();
				item.setIsLabel(true);
			}
			addSubMenuCommandsFolder(plugin, item, folder, branchName, menu);
			return;
		}
		item.setSection("action");
		item
			.setTitle(
				i18next.t("commands.shareViewFiles.multiple.on", {
					smartKey: i18next.t("common.default").toUpperCase(),
					doc: folder.name,
				})
			)
			.setIcon("folder-up")
			.onClick(async () => {
				const repo = getRepoSharedKey(plugin);
				await shareFolderRepo(plugin, folder, branchName, repo);
			});
	});
}
