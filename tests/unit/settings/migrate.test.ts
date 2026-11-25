import { migrateExcluded, migrateSettings } from "src/settings/migrate";
import { describe, expect, it, vi } from "vitest";
import { createPlugin } from "../fixtures";

function pluginWith(excluded: unknown) {
	const saveSettings = vi.fn(async () => undefined);
	const plugin = createPlugin({}, { saveSettings });
	plugin.settings.upload.autoclean.excluded = excluded as string[];
	plugin.settings.plugin.migrated = true;
	return { plugin, saveSettings, autoclean: plugin.settings.upload.autoclean };
}

describe("migrateExcluded", () => {
	it("splits the comma-separated entries", async () => {
		const { plugin, autoclean } = pluginWith(["docs/a, docs/b", "/a{1,3}/", ""]);
		await migrateExcluded(plugin);
		expect(autoclean.excluded).toEqual(["docs/a", "docs/b", "/a{1,3}/"]);
	});

	it.each([
		["docs/a, docs/b", ["docs/a", "docs/b"]],
		["", []],
		[undefined, []],
	])("accepts the old text format (%j)", async (excluded, expected) => {
		const { plugin, autoclean } = pluginWith(excluded);
		await migrateExcluded(plugin);
		expect(autoclean.excluded).toEqual(expected);
	});

	it("runs once: a comma typed later is kept", async () => {
		const { plugin, saveSettings, autoclean } = pluginWith([]);
		await migrateExcluded(plugin);
		autoclean.excluded.push("docs/Hello, world.md");
		await migrateExcluded(plugin);
		expect(autoclean.excluded).toEqual(["docs/Hello, world.md"]);
		expect(saveSettings).toHaveBeenCalledTimes(1);
	});

	it("runs on settings already migrated by an older version", async () => {
		const { plugin, autoclean } = pluginWith(["docs/a, docs/b"]);
		await migrateSettings(plugin.settings as never, plugin);
		expect(autoclean.excluded).toEqual(["docs/a", "docs/b"]);
	});
});
