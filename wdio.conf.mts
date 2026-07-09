import * as path from "node:path";
import { env } from "node:process";
import { obsidianBetaAvailable, parseObsidianVersions } from "wdio-obsidian-service";

// wdio-obsidian-service will download Obsidian versions into this directory
const cacheDir = path.resolve(".obsidian-cache");

// Choose Obsidian versions to test. Ideally this would default to "earliest/earliest
// latest/latest" (oldest supported + newest), but manifest.json's minAppVersion
// (1.11.14) isn't an Obsidian version that was ever actually released, which makes
// "earliest" resolution fail outright. Default to "latest" only until minAppVersion is
// corrected; pass OBSIDIAN_VERSIONS=earliest/earliest to also test the floor version.
let defaultVersions = "latest/latest";
if (await obsidianBetaAvailable({ cacheDir })) {
	defaultVersions += " latest-beta/latest";
}
const desktopVersions = await parseObsidianVersions(
	env.OBSIDIAN_VERSIONS ?? defaultVersions,
	{ cacheDir }
);
if (env.CI) {
	// Print the resolved Obsidian versions to use as the workflow cache key
	console.log("obsidian-cache-key:", JSON.stringify(desktopVersions));
}

export const config: WebdriverIO.Config = {
	runner: "local",
	framework: "mocha",

	specs: ["./test/specs/**/*.e2e.ts"],

	// How many instances of Obsidian should be launched in parallel during testing.
	maxInstances: Number(env.WDIO_MAX_INSTANCES || 4),

	// Test the plugin on every supported Obsidian version (oldest + newest + beta).
	capabilities: desktopVersions.map<WebdriverIO.Capabilities>(
		([appVersion, installerVersion]) => ({
			browserName: "obsidian",
			"wdio:obsidianOptions": {
				appVersion,
				installerVersion,
				// The plugin is built to ./dist by `npm run build` before tests run.
				plugins: ["./dist"],
				vault: "test/vaults/simple",
			},
		})
	),

	services: ["obsidian"],
	// wdio-obsidian-reporter is a thin wrapper around spec-reporter that shows the
	// Obsidian version a test ran on instead of the underlying Chromium version.
	reporters: ["obsidian"],

	mochaOpts: {
		ui: "bdd",
		timeout: 60 * 1000,
	},
	waitforInterval: 250,
	waitforTimeout: 5 * 1000,
	logLevel: "warn",

	cacheDir,

	injectGlobals: false, // import describe/expect/etc explicitly
};
