import type { Deleted, UploadedFiles } from "@interfaces/list_edited_files";
import type Enveloppe from "src/main";
import { createListEdited, createTokenPath, trimObject } from "src/utils/index";
import { describe, expect, it } from "vitest";

describe("createListEdited", () => {
	it("splits uploaded files into added vs edited", () => {
		const uploaded: UploadedFiles[] = [
			{ isUpdated: false, file: "new.md" },
			{ isUpdated: true, file: "changed.md" },
		];
		const deleted: Deleted = { success: true, deleted: [], undeleted: [] };
		const result = createListEdited(uploaded, deleted, []);
		expect(result.added).toEqual(["new.md"]);
		expect(result.edited).toEqual(["changed.md"]);
	});

	it("carries over deleted/undeleted and unpublished file lists", () => {
		const deleted: Deleted = {
			success: false,
			deleted: ["gone.md"],
			undeleted: ["stuck.md"],
		};
		const result = createListEdited([], deleted, ["broken.md"]);
		expect(result.deleted).toEqual(["gone.md"]);
		expect(result.notDeleted).toEqual(["stuck.md"]);
		expect(result.unpublished).toEqual(["broken.md"]);
	});
});

describe("trimObject", () => {
	it("trims and lowercases string values", () => {
		expect(trimObject({ a: "  Hello World  " })).toEqual({ a: "hello world" });
	});

	it("leaves non-string values untouched", () => {
		expect(trimObject({ n: 42, b: true, nested: { x: 1 } })).toEqual({
			n: 42,
			b: true,
			nested: { x: 1 },
		});
	});

	it("recurses into arrays and nested objects", () => {
		expect(trimObject({ list: ["  A  ", "  B  "], nested: { s: "  C  " } })).toEqual({
			list: ["a", "b"],
			nested: { s: "c" },
		});
	});
});

describe("createTokenPath", () => {
	it("substitutes %configDir% and %pluginID% in the default token path", () => {
		const plugin = {
			app: { vault: { configDir: "config-dir" } },
			manifest: { id: "enveloppe" },
		} as unknown as Enveloppe;
		expect(createTokenPath(plugin)).toBe("config-dir/plugins/enveloppe/env");
	});

	it("substitutes the variables in a custom token path", () => {
		const plugin = {
			app: { vault: { configDir: "config-dir" } },
			manifest: { id: "enveloppe" },
		} as unknown as Enveloppe;
		expect(createTokenPath(plugin, "%configDir%/plugins/%pluginID%/token.json")).toBe(
			"config-dir/plugins/enveloppe/token.json"
		);
	});
});
