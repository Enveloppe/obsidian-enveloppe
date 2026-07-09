import * as path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			obsidian: path.resolve(__dirname, "tests/unit/mocks/obsidian.ts"),
			"obsidian-dataview": path.resolve(__dirname, "tests/unit/mocks/obsidian-dataview.ts"),
		},
	},
	test: {
		include: ["tests/unit/**/*.{test,spec}.ts"],
		environment: "node",
	},
});
