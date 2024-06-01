import { readFileSync, writeFile } from "fs";

import { Command } from "commander";
const program = new Command();

program.option("-b, --beta", "Pre-release version");

program.parse();
const opt = program.opts();

/**
 * Remove text from the file
 * @param {string} path
 */
function removeText(path) {
	const toRemove = [
		"# Changelog",
		"All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.",
	];
	let changelog = readFileSync(path, "utf8");
	for (const remove of toRemove) changelog = changelog.replace(remove, "").trim();
	changelog = changelog.replaceAll(/[\n\r]{3,}/gm, "\n\n").trim();
	changelog = changelog.replaceAll(/## (.*)[\n\r]{2}### /gm, "## $1\n### ").trim();
	writeFile(path, changelog.trim(), "utf8", (err) => {
		if (err) return console.error(err);
	});
}

if (!opt.beta) removeText("CHANGELOG.md");
else removeText("CHANGELOG-beta.md");
