import * as path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			obsidian: path.resolve(__dirname, "tests/mocks/obsidian.ts"),
		},
	},
	test: {
		include: ["tests/**/*.{test,spec}.ts"],
		environment: "node",
	},
});
