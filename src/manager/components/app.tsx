import type { App as ObsidianApp } from "obsidian";
import { useState } from "preact/hooks";
import type { ActivityLog } from "../activity";
import { t } from "../i18n";
import type { FileManager } from "../service";
import { ActivityTab } from "./activity_tab";
import { Icon, IconButton, ManagerContext, useStore } from "./common";
import { FilesTab } from "./files_tab";

type Tab = "files" | "activity";

export function ManagerApp({
	app,
	manager,
	activity,
	onLocationMenu,
}: {
	app: ObsidianApp;
	manager: FileManager;
	activity: ActivityLog;
	onLocationMenu: (event: MouseEvent) => void;
}) {
	const [tab, setTab] = useState<Tab>("files");
	const state = useStore(manager, () => manager.state);
	const running = useStore(activity, () => activity.running);
	const repositories = manager.repositories();

	return (
		<ManagerContext.Provider value={{ manager, activity }}>
			<header class="enveloppe-manager-header">
				<div class="enveloppe-manager-toolbar">
					<select
						class="dropdown"
						value={state.repoKey}
						disabled={state.busy}
						aria-label={t("repository")}
						onChange={(event) =>
							manager.selectRepository((event.target as HTMLSelectElement).value)
						}
					>
						{repositories.map((repo) => (
							<option key={repo.key} value={repo.key}>
								{repo.label}
							</option>
						))}
					</select>
					{manager.dryRun && (
						<span class="enveloppe-manager-badge mod-dry-run">{t("dryRun")}</span>
					)}
					<IconButton
						icon="refresh-cw"
						label={t(manager.dryRun ? "actions.scan" : "actions.scanAndCheck")}
						spin={state.scanning || !!state.checking}
						disabled={state.scanning || !!state.checking || state.busy}
						onClick={() => void manager.scan(true)}
					/>
					<IconButton
						icon="layout-panel-left"
						label={t("location.move")}
						onClick={onLocationMenu}
					/>
				</div>
				<nav class="enveloppe-manager-tabs" role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={tab === "files"}
						class={tab === "files" ? "is-active" : ""}
						onClick={() => setTab("files")}
					>
						<Icon name="files" />
						{t("tabs.files")}
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === "activity"}
						class={tab === "activity" ? "is-active" : ""}
						onClick={() => setTab("activity")}
					>
						<Icon
							name={running ? "loader" : "activity"}
							className={running ? "is-spinning" : undefined}
						/>
						{t("tabs.activity")}
						{running && <span class="enveloppe-manager-pulse" />}
					</button>
				</nav>
			</header>
			<main class="enveloppe-manager-body">
				{tab === "files" ? <FilesTab app={app} state={state} /> : <ActivityTab />}
			</main>
		</ManagerContext.Provider>
	);
}
