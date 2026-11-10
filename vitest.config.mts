import * as path from "node:path";
import { defineConfig } from "vitest/config";

const fromRoot = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
	resolve: {
		// tests/ is excluded from tsconfig.json, so its `paths` are not applied there
		alias: [
			{ find: "obsidian", replacement: fromRoot("tests/unit/mocks/obsidian.ts") },
			{
				find: "obsidian-dataview",
				replacement: fromRoot("tests/unit/mocks/obsidian-dataview.ts"),
			},
			{ find: /^@interfaces$/, replacement: fromRoot("src/interfaces/index.ts") },
			{ find: /^@interfaces\/(.*)$/, replacement: `${fromRoot("src/interfaces")}/$1` },
			{ find: /^src\/(.*)$/, replacement: `${fromRoot("src")}/$1` },
		],
	},
	test: {
		include: ["tests/unit/**/*.{test,spec}.ts"],
		environment: "node",
	},
});
