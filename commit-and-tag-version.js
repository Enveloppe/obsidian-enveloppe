/* eslint-disable @typescript-eslint/no-var-requires */
const { Command, Option } = require("commander");
const { readFileSync, writeFileSync } = require("fs");
const commitAndTagVersion = require("standard-version");
const dedent = require("dedent");
const c = require("ansi-colors");
const program = new Command();

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
	warning: c.yellow.underline,
});

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

const betaMsg = opt.beta ? c.em("- Pre-release\n\t") : "";
const dryRunMsg = opt.dryRun ? c.em("- Dry run\n\t") : "";
const releaseAsMsg = opt.releaseAs
	? c.em(`- Release as ${c.underline(opt.releaseAs)}`)
	: "";

const msg = dedent(`
${c.heading("Options :")}
	${betaMsg}${dryRunMsg}${releaseAsMsg}  
`);

console.log(msg);
console.log();

if (opt.beta) {
	console.log(`${c.bold.green(">")} ${c.info.underline("Bumping beta version...")}`);
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
		bumpFiles: bumpFiles,
		prerelease: "",
		dryRun: opt.dryRun,
		tagPrefix: "",
	})
		.then(() => {
			console.log("Done");
		})
		.catch((err) => {
			console.error(err);
		});
} else {
	const versionBumped = opt.releaseAs
		? c.info("Release as " + c.underline(opt.releaseAs))
		: c.info("Release");
	console.log(`${c.bold.green(">")} ${c.underline(versionBumped)}`);
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
		bumpFiles: bumpFiles,
		dryRun: opt.dryRun,
		tagPrefix: "",
	})
		.then(() => {
			console.log("Done");
		})
		.catch((err) => {
			console.error(err);
		});
}
