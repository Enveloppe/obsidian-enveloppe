import type { MultiRepoProperties, Repository } from "@interfaces";
import i18next from "i18next";
import { type Command, Notice } from "obsidian";
import type Enveloppe from "src/main";
import { createLink } from "src/utils";
import { isShared } from "src/utils/data_validation_test";
import { frontmatterFromFile, getProperties } from "src/utils/parse_frontmatter";

/**
 * Create the command to create a link to the note in the repo
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {Enveloppe} plugin
 * @return {Promise<Command>}
 */
export async function createLinkCallback(
	repo: Repository | null,
	plugin: Enveloppe
): Promise<Command> {
	const id = repo ? `copy-link-K${repo.smartKey}` : "copy-link";
	const common = i18next.t("common.repository");
	let name = i18next.t("commands.copyLink.title");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	return {
		id,
		name,
		hotkeys: [],
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const frontmatter = frontmatterFromFile(file, plugin, repo);
			if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
				if (!checking) {
					const multiRepo: MultiRepoProperties = {
						frontmatter: getProperties(plugin, repo, frontmatter, true),
						repository: repo,
					};
					createLink(file, multiRepo, plugin);
					new Notice(i18next.t("commands.copyLink.onActivation"));
				}
				return true;
			}
			return false;
		},
	} as Command;
}

/**
 * Create the command to create a link to the note in the repo if a file is active ; else do nothing
 * @call createLink
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @param {Enveloppe} plugin - The plugin instance
 * @return {Promise<void>}
 */
export async function createLinkOnActiveFile(
	repo: Repository | null,
	plugin: Enveloppe
): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	const frontmatter = frontmatterFromFile(file, plugin, repo);

	if (file && frontmatter && isShared(frontmatter, plugin.settings, file, repo)) {
		const multiRepo: MultiRepoProperties = {
			frontmatter: getProperties(plugin, repo, frontmatter),
			repository: repo,
		};
		await createLink(file, multiRepo, plugin);
		new Notice(i18next.t("commands.copyLink.onActivation"));
		return;
	}
	new Notice(i18next.t("commands.runOtherRepo.noFile"));
}
