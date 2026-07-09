import * as path from "node:path";
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

const rootDir = path.resolve("./");

export default defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.js", "manifest.json", "eslint.config.mts"],
				},
				tsconfigRootDir: rootDir,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"*.json",
		"eslint.config.mts",
		"wdio.conf.mts",
		"commit-and-tag-version.mjs",
		"hooks/*.mjs",
	]),
]);
