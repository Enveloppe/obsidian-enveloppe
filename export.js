/* eslint-disable @typescript-eslint/no-var-requires */
const { Command } = require("commander");
const path = require("path");
const fs = require("fs");
const c = require("ansi-colors");
const dotenv = require("dotenv");
const manifest = require("./manifest.json");
const env = dotenv.config();
const VAULT = env.parsed.VAULT;
if (!VAULT || VAULT.trim().length === 0) {
	console.error("Please set VAULT in .env.json");
	process.exit(1);
}
const program = new Command();

program
	.description("Export plugin to your main vault")
	.option("-b, --beta", "Use manifest-beta.json");

program.parse();
const opt = program.opts();

const pluginDir = path.join(VAULT, ".obsidian", "plugins", manifest["id"]);

if (!fs.existsSync(pluginDir)) {
	console.log(c.yellow.underline("Creating plugin directory"));
	fs.mkdirSync(pluginDir);
}

console.log(c.blueBright(`Copying plugin in ${c.underline(pluginDir)} with: ${c.underline(opt.beta ? "manifest-beta.json" : "manifest.json")}`));

fs.copyFileSync("./dist/main.js", path.join(pluginDir, "main.js"));
if (opt.beta && fs.existsSync("./manifest-beta.json")) {
	fs.copyFileSync("./manifest-beta.json", path.join(pluginDir, "manifest.json"));
} else {
	fs.copyFileSync("./dist/manifest.json", path.join(pluginDir, "manifest.json"));
}
if (fs.existsSync("./dist/styles.css")) {
	fs.copyFileSync("./dist/styles.css", path.join(pluginDir, "styles.css"));
}
console.log(c.green("✔️ Plugin copied to your main vault. Please reload the plugin to see changes."));
