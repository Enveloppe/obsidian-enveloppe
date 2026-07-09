import { browser, expect } from "@wdio/globals";
import { afterEach, before, describe, it } from "mocha";

const PLUGIN_ID = "obsidian-mkdocs-publisher";

async function openPluginSettings() {
	await browser.executeObsidian(({ app }, pluginId) => {
		app.setting.open();
		app.setting.openTabById(pluginId);
	}, PLUGIN_ID);
}

describe("Enveloppe settings tab", function () {
	before(async function () {
		await browser.reloadObsidian({ vault: "test/vaults/simple" });
	});

	afterEach(async function () {
		// Close the settings modal so it doesn't leak into other tests.
		await browser.executeObsidian(({ app }) => app.setting.close());
	});

	it("renders every settings section in the tab bar", async function () {
		await openPluginSettings();

		const tabs = browser.$$(".enveloppe .settings-tab-bar .settings-tab");
		await expect(tabs).toBeElementsArrayOfSize(6);
	});

	it("opens on the GitHub configuration tab by default", async function () {
		await openPluginSettings();

		// src/settings.ts defaults to ESettingsTabId.Github and marks the matching
		// tab with the "settings-tab-active" class; "GitHub config" is its en.json label.
		const activeTab = browser.$(".enveloppe .settings-tab-bar .settings-tab-active");
		await expect(activeTab).toHaveText("GitHub config");
	});
});
