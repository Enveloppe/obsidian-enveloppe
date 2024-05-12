import { Repository } from "@interfaces";
import i18next from "i18next";
import { Menu, MenuItem,Platform, TFile } from "obsidian";

import GithubPublisher from "../../main";
import { defaultRepo,getRepoSharedKey, isShared, multipleSharedKey } from "../../utils/data_validation_test";
import { frontmatterFromFile, getProperties } from "../../utils/parse_frontmatter";
import { shareOneNote } from "../share/unique_note";
import { ChooseRepoToRun } from "../suggest_other_repo_commands_modal";

/**
 * Create a menu for a shared file
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {TFile} file - The file to share
 * @param {string} branchName - The branch name for the repository
 * @param {Menu} menu - The menu to add the item to
 */
export function addMenuFile(plugin: GithubPublisher, file: TFile, branchName: string, menu: Menu) {
	const frontmatterSharedKey = frontmatterFromFile(file, plugin, null);
	let getSharedKey = getRepoSharedKey(plugin, frontmatterSharedKey, file);
	const frontmatter = frontmatterFromFile(file, plugin, getSharedKey);
	const allKeysFromFile = multipleSharedKey(frontmatter, file, plugin);
	if (
		!(isShared(frontmatter, plugin.settings, file, getSharedKey) &&
		plugin.settings.plugin.fileMenu)
	) return;

	const prop = getProperties(plugin, getSharedKey, frontmatter, true);

	menu.addItem((item) => {
		/**
			* Create a submenu if multiple repo exists in the settings & platform is desktop
			*/

		if (allKeysFromFile.length > 1 || (prop instanceof Array && prop.length > 1)) {
			if (Platform.isDesktop) {
				item
					.setTitle("Github Publisher")
					.setIcon("upload-cloud");
			} else {
				//add the line to separate the commands
				menu.addSeparator();
				item.setIsLabel(true);
			}
			subMenuCommandsFile(
				plugin,
				item,
				file,
				branchName,
				getSharedKey,
				menu
			);
			return;
		}
		const fileName = plugin.getTitleFieldForCommand(file, plugin.app.metadataCache.getFileCache(file)?.frontmatter).replace(".md", "");
		if (!frontmatter || !frontmatter[plugin.settings.plugin.shareKey]) {
			const otherRepo = plugin.settings.github.otherRepo.find((repo) => repo.shareAll?.enable);
			if (otherRepo) getSharedKey = otherRepo;
			else if (plugin.settings.plugin.shareAll?.enable) getSharedKey = defaultRepo(plugin.settings);
		} else if (frontmatter[plugin.settings.plugin.shareKey]) {
			getSharedKey = defaultRepo(plugin.settings);
		}
		item
			.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
				doc: fileName,
				smartKey: getSharedKey?.smartKey?.toUpperCase() || i18next.t("common.default").toUpperCase()
			}))
			.setIcon("file-up")
			.onClick(async () => {
				await shareOneNote(
					await plugin.reloadOctokit(getSharedKey?.smartKey),
					file,
					getSharedKey,
					frontmatter,
					fileName
				);
			});
	});
}

/**
 * Create a subMenu if multiple repository are set up
 * If Platform is Desktop, create a submenu
 * If not, add the command to the original menu, in line
 * @param {GithubPublisher} plugin - The plugin instance
 * @param {MenuItem} item - The item to add the submenu to
 * @param {TFile} file - The file to share
 * @param {string} branchName - The branch name for the repository
 * @param {Repository} repo - The data repository found in the file
 * @return {Menu} - The submenu created
 */
function subMenuCommandsFile(plugin: GithubPublisher, item: MenuItem, file: TFile, branchName: string, repo: Repository | null, originalMenu: Menu): Menu {
	const frontmatter = frontmatterFromFile(file, plugin, repo);
	const fileName = plugin.getTitleFieldForCommand(file, frontmatter).replace(".md", "");
	const subMenu = Platform.isDesktop ? item.setSubmenu() as Menu : originalMenu;
	let prop = getProperties(plugin, repo, frontmatter, true);
	prop = prop instanceof Array ? prop : [prop];
	/**
	 * default repo
	 */
	if ((repo?.shareKey === plugin.settings.plugin.shareKey || (frontmatter?.[plugin.settings.plugin.shareKey])) && (!frontmatter?.repo || !frontmatter?.multipleRepo)) {
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
						await plugin.reloadOctokit(),
						file,
						defaultRepo(plugin.settings),
						null,
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
								await plugin.reloadOctokit(otherRepo?.smartKey),
								file,
								otherRepo,
								frontmatter,
								fileName
							);
						});
				});
			}
		});
	}
	if (prop.length > 1) {
		prop.forEach((repoFront) => {
			subMenu.addItem((item) => {
				item
					.setTitle(i18next.t("commands.shareViewFiles.multiple.on", {
						smartKey: repoFront.repo.toUpperCase(),
						doc: fileName
					}))
					.setIcon("file-up")
					.onClick(async () => {
						await shareOneNote(
							await plugin.reloadOctokit(),
							file,
							repo,
							frontmatter,
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
				new ChooseRepoToRun(plugin.app, plugin, repo?.shareKey, branchName, "file", file.basename, async (item: Repository) => {
					const sourceFrontmatter = frontmatterFromFile(file, plugin, item);
					await shareOneNote(
						await plugin.reloadOctokit(item.smartKey),
						file,
						item,
						sourceFrontmatter,
						fileName
					);
				}).open();
			});
	});
	return subMenu;
}