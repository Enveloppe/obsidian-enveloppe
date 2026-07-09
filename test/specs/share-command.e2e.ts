import { browser, expect } from "@wdio/globals";
import { before, beforeEach, describe, it } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";

const PLUGIN_ID = "obsidian-mkdocs-publisher";
const COMMAND_ID = `${PLUGIN_ID}:share-one`;

async function isShareCommandAvailable(): Promise<boolean> {
	// checkCallback(true) only asks Obsidian whether the command *would* be shown -
	// it never runs the upload, so this is safe to call without any GitHub setup.
	return browser.executeObsidian(({ app }, commandId) => {
		return app.commands.findCommand(commandId)?.checkCallback?.(true) ?? false;
	}, COMMAND_ID);
}

describe("share-one command availability", function () {
	before(async function () {
		await browser.reloadObsidian({ vault: "test/vaults/simple" });
	});

	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
	});

	it("is unavailable on a note without a share flag in its frontmatter", async function () {
		await obsidianPage.openFile("Welcome.md");
		expect(await isShareCommandAvailable()).toBe(false);
	});

	it("becomes available once the active note is marked as shared", async function () {
		await obsidianPage.write("Shared.md", "---\nshare: true\n---\nHello world");
		await obsidianPage.openFile("Shared.md");

		// Metadata cache parses frontmatter asynchronously after the file is opened.
		await browser.waitUntil(async () => {
			return await browser.executeObsidian(({ app }) => {
				const file = app.workspace.getActiveFile();
				return (
					file != null &&
					app.metadataCache.getFileCache(file)?.frontmatter?.share === true
				);
			});
		});

		expect(await isShareCommandAvailable()).toBe(true);
	});

	it("stays unavailable when the share flag is explicitly false", async function () {
		await obsidianPage.write("NotShared.md", "---\nshare: false\n---\nHello world");
		await obsidianPage.openFile("NotShared.md");

		await browser.waitUntil(async () => {
			return await browser.executeObsidian(({ app }) => {
				const file = app.workspace.getActiveFile();
				return (
					file != null &&
					"share" in (app.metadataCache.getFileCache(file)?.frontmatter ?? {})
				);
			});
		});

		expect(await isShareCommandAvailable()).toBe(false);
	});
});
