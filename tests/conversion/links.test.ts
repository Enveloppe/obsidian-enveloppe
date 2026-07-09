import { creatorAltLink, escapeRegex } from "src/conversion/links";
import { describe, expect, it } from "vitest";

describe("escapeRegex", () => {
	it("escapes regex special characters", () => {
		expect(escapeRegex("a.b*c?d")).toBe("a\\.b\\*c\\?d");
	});

	it("escapes path separators and brackets", () => {
		expect(escapeRegex("folder/file[1].md")).toBe("folder\\/file\\[1\\]\\.md");
	});

	it("leaves plain text untouched", () => {
		expect(escapeRegex("hello world")).toBe("hello world");
	});

	it("escapes every special character in one pass", () => {
		const special = "/-\\^$*+?.()|[]{}";
		const escaped = escapeRegex(special);
		// every character in the input should now be prefixed with a backslash
		expect(escaped).toBe(special.replace(/./g, (c) => `\\${c}`));
	});
});

describe("creatorAltLink", () => {
	it("prefers the alt text captured by the wikilink match when present", () => {
		const altMatch = "[[file|My Alt Text]]".match(/\|(.*)\]\]/) as RegExpMatchArray;
		const result = creatorAltLink(altMatch, ["file"], "md", "[[file|My Alt Text]]");
		expect(result).toBe("My Alt Text");
	});

	it("falls back to the last path segment for markdown files with multiple segments", () => {
		const result = creatorAltLink(
			null as unknown as RegExpMatchArray,
			["folder", "note"],
			"md",
			"[[folder/note]]"
		);
		expect(result).toBe("note");
	});

	it("falls back to the single segment for markdown files with no nesting", () => {
		const result = creatorAltLink(
			null as unknown as RegExpMatchArray,
			["note"],
			"md",
			"[[note]]"
		);
		expect(result).toBe("note");
	});

	it("uses the last path segment of the raw match for non-markdown files", () => {
		const result = creatorAltLink(
			null as unknown as RegExpMatchArray,
			["image"],
			"png",
			"folder/subfolder/image.png"
		);
		expect(result).toBe("image.png");
	});
});
