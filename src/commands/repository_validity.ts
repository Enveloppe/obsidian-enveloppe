import type { Repository } from "@interfaces";
import i18next from "i18next";
import { type Command, Notice } from "obsidian";
import type Enveloppe from "src/main";
import { checkRepositoryValidity } from "src/utils/data_validation_test";

/**
 * Command to check the validity of the repository
 * @call checkRepositoryValidity
 * @param {Enveloppe} plugin
 * @param {Repository | null} repo - Other repo if the command is called from the suggest_other_repo_command.ts
 * @return {Promise<void>}
 */
export async function repositoryValidityActiveFile(
	plugin: Enveloppe,
	repo: Repository | null
): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (file) {
		await checkRepositoryValidity(await plugin.reloadOctokit(repo?.smartKey), repo, file);
	} else {
		new Notice("No file is active");
	}
}

/**
 * Check if the repository is valid
 * @param {Enveloppe} plugin
 * @param {Repository} repo
 * @return {Promise<Command>}
 */

export async function checkRepositoryValidityCallback(
	plugin: Enveloppe,
	repo: Repository | null
): Promise<Command> {
	const id = repo
		? `check-plugin-repo-validy-K${repo.smartKey}`
		: "check-plugin-repo-validy";
	let name = i18next.t("commands.checkValidity.title");
	const common = i18next.t("common.repository");
	name = repo ? `${name} (${common} : ${repo.smartKey})` : name;
	const octokit = await plugin.reloadOctokit(repo?.smartKey);
	return {
		id,
		name,
		checkCallback: (checking) => {
			if (plugin.app.workspace.getActiveFile()) {
				if (!checking) {
					checkRepositoryValidity(octokit, repo, plugin.app.workspace.getActiveFile());
				}
				return true;
			}
			return false;
		},
	} as Command;
}
