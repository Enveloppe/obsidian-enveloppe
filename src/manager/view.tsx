import type { FileManagerLocation } from "@interfaces";
import { ItemView, Menu, type Workspace, type WorkspaceLeaf } from "obsidian";
import { render } from "preact";
import type Enveloppe from "src/main";
import { ManagerApp } from "./components/app";
import { t } from "./i18n";

export const VIEW_TYPE_FILE_MANAGER = "enveloppe-file-manager";

const LOCATIONS: { location: FileManagerLocation; icon: string }[] = [
	{ location: "tab", icon: "maximize-2" },
	{ location: "left", icon: "panel-left" },
	{ location: "right", icon: "panel-right" },
];

export function leafLocation(
	workspace: Workspace,
	leaf: WorkspaceLeaf
): FileManagerLocation {
	const root = leaf.getRoot();
	if (root === workspace.leftSplit) return "left";
	if (root === workspace.rightSplit) return "right";
	return "tab";
}

export class FileManagerView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private plugin: Enveloppe
	) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_FILE_MANAGER;
	}

	getDisplayText() {
		return t("title");
	}

	getIcon() {
		return "mail-open";
	}

	onPaneMenu(menu: Menu, source: string) {
		super.onPaneMenu(menu, source);
		this.addLocationItems(menu);
	}

	private addLocationItems(menu: Menu) {
		const current = leafLocation(this.app.workspace, this.leaf);
		for (const { location, icon } of LOCATIONS) {
			menu.addItem((item) =>
				item
					.setTitle(t(`location.menu.${location}`))
					.setIcon(icon)
					.setChecked(current === location)
					.onClick(() => void this.plugin.openFileManager(location, true))
			);
		}
	}

	private showLocationMenu = (event: MouseEvent) => {
		const menu = new Menu();
		this.addLocationItems(menu);
		menu.showAtMouseEvent(event);
	};

	async onOpen() {
		const { fileManager: manager, activity } = this.plugin;
		this.contentEl.empty();
		this.contentEl.addClass("enveloppe-manager");
		render(
			<ManagerApp
				app={this.app}
				manager={manager}
				activity={activity}
				onLocationMenu={this.showLocationMenu}
			/>,
			this.contentEl
		);

		const stale = () => manager.markStale();
		this.registerEvent(this.app.vault.on("create", stale));
		this.registerEvent(this.app.vault.on("delete", stale));
		this.registerEvent(this.app.vault.on("rename", stale));
		this.registerEvent(this.app.metadataCache.on("changed", stale));
		this.register(manager.attachView());

		const { scannedAt, stale: outdated, scanning } = manager.state;
		if ((!scannedAt || outdated) && !scanning) void manager.scan();
	}

	async onClose() {
		render(null, this.contentEl);
	}
}
