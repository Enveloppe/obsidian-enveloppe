import i18next from "i18next";
import { type Command, TFile } from "obsidian";
import type Enveloppe from "src/main";

export function refreshOpenedSet(plugin: Enveloppe) {
	const findRepo = (file: TFile | null) => {
		if (!file) return [];
		return plugin.settings.github.otherRepo.filter((repo) => repo.set === file.path);
	};

	return {
		id: "reload-opened-set",
		name: i18next.t("commands.refreshOpenedSet"),
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			const repos = findRepo(file);
			if (file && repos.length > 0) {
				if (!checking) {
					repos.forEach((repo) => {
						plugin.repositoryFrontmatter[repo.smartKey] =
							plugin.app.metadataCache.getFileCache(file)?.frontmatter;
					});
				}
				return true;
			}
			return false;
		},
	} as Command;
}

export function refreshAllSets(plugin: Enveloppe) {
	return {
		id: "reload-all-sets",
		name: i18next.t("commands.refreshAllSets"),
		checkCallback: (checking) => {
			const allSets = plugin.settings.github.otherRepo.filter(
				(repo) => repo.set !== "" || repo.set !== null
			);
			if (allSets.length > 0) {
				if (!checking) {
					allSets.forEach((repo) => {
						if (!repo.set) return;
						const file = plugin.app.vault.getAbstractFileByPath(repo.set);
						if (!file || !(file instanceof TFile)) return;
						plugin.repositoryFrontmatter[repo.smartKey] =
							plugin.app.metadataCache.getFileCache(file)?.frontmatter;
					});
				}
				return true;
			}
			return false;
		},
	} as Command;
}
