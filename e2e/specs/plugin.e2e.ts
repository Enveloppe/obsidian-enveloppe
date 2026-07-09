import { browser, expect } from "@wdio/globals";
import { before, describe, it } from "mocha";

const PLUGIN_ID = "obsidian-mkdocs-publisher";

// Commands that are always registered on load, regardless of repository configuration
// (see Enveloppe#chargeAllCommands / Enveloppe#onload in src/main.ts).
const BASE_COMMAND_IDS = [
	"share-one",
	"publish-all",
	"upload-new",
	"upload-all-edited-new",
	"upload-edited",
	"check-plugin-repo-validity",
	"check-rate-limit",
	"reload-opened-set",
	"reload-all-sets",
];

describe("Enveloppe plugin bootstrap", function () {
	before(async function () {
		await browser.reloadObsidian({ vault: "e2e/vaults/simple" });
	});

	it("loads and is enabled", async function () {
		// executeObsidian serializes the callback to run inside Obsidian, so outer
		// variables like PLUGIN_ID must be passed in as arguments, not captured.
		const enabled = await browser.executeObsidian(({ app }, pluginId) => {
			return (
				app.plugins.enabledPlugins.has(pluginId) && Boolean(app.plugins.plugins[pluginId])
			);
		}, PLUGIN_ID);
		expect(enabled).toBe(true);
	});

	it("registers its base commands with no repository configured", async function () {
		const commandIds = await browser.executeObsidian(({ app }) => {
			return app.commands.listCommands().map((command) => command.id);
		});

		for (const id of BASE_COMMAND_IDS) {
			expect(commandIds).toContain(`${PLUGIN_ID}:${id}`);
		}
	});

	it("does not register the copy-link command, since it is disabled by default", async function () {
		const commandIds = await browser.executeObsidian(({ app }) => {
			return app.commands.listCommands().map((command) => command.id);
		});
		expect(commandIds).not.toContain(`${PLUGIN_ID}:copy-link`);
	});
});
