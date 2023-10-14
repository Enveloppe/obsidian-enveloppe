
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
const fs = require("fs");
const c = require("ansi-colors");
const { execSync } = require("child_process");

const path = require("path");

let vaultDev = process.env.VAULT_DEV || "";
//get args "--prod" or "--dev"
const args = process.argv.slice(2);

c.theme({
	danger: c.red,
	dark: c.dim.gray,
	disabled: c.gray,
	em: c.italic,
	heading: c.bold.underline,
	info: c.cyan,
	muted: c.dim,
	primary: c.blue,
	strong: c.bold,
	success: c.green.bold,
	underline: c.underline,
	warning: c.yellow.underline
});

if (args.length > 0 && args[0] === "--prod") {
	vaultDev = process.env.VAULT || "";
}

if (vaultDev.trim().length > 0) {
	const filePath = path.join(vaultDev, ".obsidian", "plugins", "obsidian-mkdocs-publisher", ".hotreload");
	if (!fs.existsSync(filePath)) {
		console.log(`${c.danger.bold("❌")} ${c.danger(".hotreload file not found. Creating it...")}`);
		fs.writeFile(filePath, "", (err) => {
			if (err) {
				console.error(err);
			}
		});
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		setTimeout(function () {}, 1000);
		console.log(`✔️ ${c.success(".hotreload file created.")}`);
		console.log();
	}
}

let msg = vaultDev.trim().length > 0 ? `-v ${c.underline.bold.blue(vaultDev)}` : "";
const cmd = vaultDev.trim().length > 0 ? `-v ${vaultDev}` : "";

const command = `obsidian-plugin dev --with-stylesheet src/styles.css src/main.ts ${cmd}`;
console.log(c.info.italic(`${c.bold(">")} obsidian-plugin dev ${c.dark.underline("--with-stylesheet src/styles.css")} src/main.ts ${msg}`));
execSync(command, { stdio: "inherit" });

