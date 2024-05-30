import { Command, Option } from "commander";
import commitAndTagVersion from "commit-and-tag-version";
import dedent from "dedent";
import pkg from "ansi-colors";
const { red, dim, gray, italic, bold, cyan, blue, green, underline, yellow, theme } = pkg;

import { readFileSync, writeFile } from "fs";

/**
 * Remove text from the file
 * @param {string} path 
 */
function removeText(path) {
	const toRemove = ["# Changelog", "All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines."]
	let changelog = readFileSync(path, "utf8");
	for (const remove of toRemove) changelog = changelog.replace(remove, "").trim();
	changelog = changelog.replaceAll(/[\n\r]{3,}/gm, "\n\n").trim();
	changelog = changelog.replaceAll(/## (.*)[\n\r]{2}### /gm, "## $1\n### ").trim();
	writeFile(path, changelog.trim(), "utf8", (err) => {
		if (err) return console.error(err);
	});
}

const program = new Command();

theme({
	danger: red,
	dark: dim.gray,
	disabled: gray,
	em: italic,
	heading: bold.underline,
	info: cyan,
	muted: dim,
	primary: blue,
	strong: bold,
	success: green.bold,
	warning: yellow.underline,
});

const info = (msg) => pkg.info(msg);
const heading = (msg) => pkg.heading(msg);
const em = (msg) => pkg.em(msg);

program
	.description("Bump version and create a new tag")
	.option("-b, --beta", "Pre-release version")
	.option("--dry-run", "Dry run")
	.addOption(
		new Option("-r, --release-as <size>", "release type version").choices([
			"major",
			"minor",
			"patch",
		])
	);

program.parse();
const opt = program.opts();

const betaMsg = opt.beta ? em("- Pre-release\n\t") : "";
const dryRunMsg = opt.dryRun ? em("- Dry run\n\t") : "";
const releaseAsMsg = opt.releaseAs
	? em(`- Release as ${underline(opt.releaseAs)}`)
	: "";

const msg = dedent(`
${heading("Options :")}
	${betaMsg}${dryRunMsg}${releaseAsMsg}  
`);

console.log(msg);
console.log();

if (opt.beta) {
	console.log(`${bold.green(">")} ${info.underline("Bumping beta version...")}`);
	console.log();
	const bumpFiles = [
		{
			filename: "manifest-beta.json",
			type: "json",
		},
		{
			filename: "package.json",
			type: "json",
		},
		{
			filename: "package-lock.json",
			type: "json",
		},
	];
	commitAndTagVersion({
		infile: "CHANGELOG-beta.md",
		bumpFiles,
		prerelease: "",
		dryRun: opt.dryRun,
		tagPrefix: "",
	})
		.then(() => {
			if (!opt.dryRun)
				removeText("CHANGELOG-beta.md");
			console.log("Done");
		})
		.catch((err) => {
			console.error(err);
		});
	removeText("CHANGELOG-beta.md");
} else {
	const versionBumped = opt.releaseAs
		? info(`Release as ${underline(opt.releaseAs)}`)
		: info("Release");
	console.log(`${bold.green(">")} ${underline(versionBumped)}`);
	console.log();

	const bumpFiles = [
		{
			filename: "manifest-beta.json",
			type: "json",
		},
		{
			filename: "package.json",
			type: "json",
		},
		{
			filename: "package-lock.json",
			type: "json",
		},
		{
			filename: "manifest.json",
			type: "json",
		}
	];


	commitAndTagVersion({
		infile: "CHANGELOG.md",
		bumpFiles,
		dryRun: opt.dryRun,
		tagPrefix: "",
		releaseAs: opt.releaseAs,
	})
		.then(() => {
			if (!opt.dryRun)
				removeText("CHANGELOG.md");
			console.log("Done");
		})
		.catch((err) => {
			console.error(err);
		});
}
