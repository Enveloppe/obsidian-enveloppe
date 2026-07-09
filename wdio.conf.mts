import * as path from "path"
import { parseObsidianVersions, obsidianBetaAvailable } from "wdio-obsidian-service";
import { env } from "process";
const cacheDir = path.resolve(".obsidian-cache");
let defaultVersions = "earliest/earliest latest/latest";
if (await obsidianBetaAvailable({cacheDir})) {
    defaultVersions += " latest-beta/latest"
}
const desktopVersions = await parseObsidianVersions(
    env.OBSIDIAN_VERSIONS ?? defaultVersions,
    {cacheDir},
);
const mobileVersions = await parseObsidianVersions(
    env.OBSIDIAN_MOBILE_VERSIONS ?? env.OBSIDIAN_VERSIONS ?? defaultVersions,
    {cacheDir},
);
if (env.CI) {
    console.log("obsidian-cache-key:", JSON.stringify([desktopVersions, mobileVersions]));
}

export const config: WebdriverIO.Config = {
    runner: 'local',
    framework: 'mocha',

    specs: ['./tests/e2e/specs/**/*.e2e.ts'],
	maxInstances: Number(env.WDIO_MAX_INSTANCES || 4),
	capabilities: [
        ...desktopVersions.map<WebdriverIO.Capabilities>(([appVersion, installerVersion]) => ({
            browserName: 'obsidian',
            'wdio:obsidianOptions': {
                appVersion, installerVersion,
                plugins: ["./dist", { id: "dataview", version: "latest" }],
	            vault: process.env.VAULT_TEST,
            },
        })),
        ...mobileVersions.map<WebdriverIO.Capabilities>(([appVersion, installerVersion]) => ({
            browserName: 'obsidian',
            'wdio:obsidianOptions': {
                appVersion, installerVersion,
                emulateMobile: true,
				plugins: ["./dist", { id: "dataview", version: "latest" }],
	            vault: process.env.VAULT_TEST,
            },
            'goog:chromeOptions': {
                mobileEmulation: {
                    // can also set deviceName: "iPad" etc. instead of hard-coding size.
                    // If you have issues getting click events etc. to work properly, try
                    // setting `touch: false` here.
                    deviceMetrics: {width: 390, height: 844},
                },
            },
        })),
    ],

    services: ["obsidian"],
    reporters: ['obsidian'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60 * 1000,
    },
    waitforInterval: 250,
    waitforTimeout: 5 * 1000,
    logLevel: "warn",
    cacheDir: cacheDir,
    injectGlobals: false, // import describe/expect etc explicitly to make eslint happy
}
