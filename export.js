/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const c = require("ansi-colors");
const dotenv = require("dotenv");

const env = dotenv.config();

const VAULT = env.parsed.VAULT;
if (!VAULT || VAULT.trim().length === 0) {
	console.error("Please set VAULT in .env.json");
	process.exit(1);
}

const pluginDir = path.join(VAULT, ".obsidian", "plugins", "copy-reading-in-markdown");

if (!fs.existsSync(pluginDir)) {
	console.log(c.yellow.underline("Creating plugin directory"));
	fs.mkdirSync(pluginDir);
}

console.log(c.blueBright(`Copying plugin in ${c.underline(pluginDir)}`));

fs.copyFileSync("./dist/main.js", path.join(pluginDir, "main.js"));
fs.copyFileSync("./dist/manifest.json", path.join(pluginDir, "manifest.json"));
if (fs.existsSync("./dist/styles.css")) {
	fs.copyFileSync("./dist/styles.css", path.join(pluginDir, "styles.css"));
}
console.log(c.green("✔️ Plugin copied to your main vault. Please reload the plugin to see changes."));
