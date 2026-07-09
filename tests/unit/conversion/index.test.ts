import type { MultiProperties } from "@interfaces/properties";
import { addHardLineBreak, addToYaml, processYaml } from "src/conversion/index";
import { describe, expect, it } from "vitest";
import {
	createFile,
	createMultiProperties,
	createPlugin,
	createPropertiesConversion,
} from "../fixtures";

describe("addHardLineBreak", () => {
	it("does nothing when hardbreak is disabled and there is no trailing backslash", () => {
		const plugin = createPlugin();
		const text = "line one\nline two";
		expect(
			addHardLineBreak(text, plugin, createPropertiesConversion({ hardbreak: false }))
		).toBe(text);
	});

	it("converts a lone trailing backslash line into <br/> even when hardbreak is off", () => {
		const plugin = createPlugin();
		const text = "line one\n\\\nline two";
		expect(
			addHardLineBreak(text, plugin, createPropertiesConversion({ hardbreak: false }))
		).toBe("line one\n<br/>\nline two");
	});

	it("adds two trailing spaces to every line of the body when hardbreak is on", () => {
		const plugin = createPlugin();
		const text = "line one\nline two";
		const result = addHardLineBreak(
			text,
			plugin,
			createPropertiesConversion({ hardbreak: true })
		);
		expect(result).toBe("line one  \nline two");
	});

	it("only hard-breaks the body, leaving the frontmatter block untouched", () => {
		const plugin = createPlugin();
		const text = "---\nkey: value\n---\nline one\nline two";
		const result = addHardLineBreak(
			text,
			plugin,
			createPropertiesConversion({ hardbreak: true })
		);
		expect(result).toBe("---\nkey: value\n---\nline one  \nline two");
	});
});

describe("addToYaml", () => {
	function withProperties(overrides: Partial<MultiProperties> = {}) {
		return createMultiProperties(overrides);
	}

	it("returns the text unchanged when there are no properties to work from", () => {
		const text = "no frontmatter here";
		expect(
			addToYaml(text, ["tag1"], {
				properties: null,
				file: createFile({ path: "note.md" }) as never,
			})
		).toBe(text);
	});

	it("creates a new frontmatter block with the added tags when none exists", () => {
		const properties = withProperties();
		const file = createFile({ path: "note.md" });
		const result = addToYaml("Body text", ["tag1"], { properties, file: file as never });
		expect(result).toBe("---\ntags:\n  - tag1\n---\nBody text");
	});

	it("merges added tags into an existing tags array without duplicating", () => {
		const properties = withProperties();
		const file = createFile({ path: "note.md" });
		const text = "---\ntags:\n  - existing\n---\nBody text";
		const result = addToYaml(text, ["existing", "new"], {
			properties,
			file: file as never,
		});
		expect(result).toBe("---\ntags:\n  - existing\n  - new\n---\nBody text");
	});

	it("leaves the text unchanged when there is nothing to add and no title to set", () => {
		const properties = withProperties();
		const file = createFile({ path: "note.md" });
		const text = "---\nkey: value\n---\nBody text";
		expect(addToYaml(text, [], { properties, file: file as never })).toBe(text);
	});

	it("adds the folder note title when the file is a folder note index", () => {
		const properties = withProperties({
			plugin: createPlugin({
				upload: {
					folderNote: {
						enable: true,
						rename: "index.md",
						addTitle: { enable: true, key: "title" },
					},
				} as never,
			}),
			filepath: "Projects/index.md",
		});
		const file = createFile({ path: "Projects/index.md", basename: "Projects" });
		const result = addToYaml("Body text", [], { properties, file: file as never });
		expect(result).toBe("---\ntitle: Projects\n---\nBody text");
	});

	it("does not override an already-set folder note title", () => {
		const properties = withProperties({
			plugin: createPlugin({
				upload: {
					folderNote: {
						enable: true,
						rename: "index.md",
						addTitle: { enable: true, key: "title" },
					},
				} as never,
			}),
			filepath: "Projects/index.md",
		});
		const file = createFile({ path: "Projects/index.md", basename: "Projects" });
		const text = "---\ntitle: Custom Title\n---\nBody text";
		const result = addToYaml(text, [], { properties, file: file as never });
		expect(result).toBe(text);
	});

	it("throws on invalid frontmatter YAML instead of falling back gracefully", () => {
		// `parseYaml` is called before the function's try/catch block (see
		// src/conversion/index.ts), so a parse error propagates instead of being
		// swallowed - this documents that actual (likely unintended) behavior.
		const properties = withProperties();
		const file = createFile({ path: "note.md" });
		const text = "---\nkey: [unterminated\n---\nBody text";
		expect(() =>
			addToYaml(text, ["tag1"], { properties, file: file as never })
		).toThrow();
	});
});

describe("processYaml", () => {
	it("adds inline tags found in the metadata cache to the frontmatter", async () => {
		const file = createFile({ path: "note.md" });
		const plugin = createPlugin(
			{ conversion: { tags: { inline: true } } as never },
			{
				app: {
					metadataCache: {
						getFileCache: () => ({ tags: [{ tag: "#inline-tag" }] }),
					},
				},
			}
		);
		const properties = createMultiProperties({ plugin });
		const result = await processYaml(file as never, null, "Body text", properties);
		expect(result).toBe("---\ntags:\n  - inline-tag\n---\nBody text");
	});
});
