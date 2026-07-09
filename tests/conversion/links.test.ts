import type { LinkedNotes } from "@interfaces/main";
import { convertWikilinks, creatorAltLink, escapeRegex } from "src/conversion/links";
import { describe, expect, it } from "vitest";
import { createFile, createPlugin, createPropertiesConversion, fm } from "../fixtures";

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

function targetNoteLink(
	overrides: Partial<{ linkFrom: string; altText?: string }> = {}
): LinkedNotes {
	return {
		linked: createFile({
			path: "Target Note.md",
			basename: "Target Note",
			extension: "md",
		}) as never,
		linkFrom: "Target Note",
		type: "link",
		...overrides,
	};
}

describe("convertWikilinks", () => {
	it("leaves the text untouched when nothing needs converting (noTextConversion short-circuit)", () => {
		const conditionConvert = createPropertiesConversion({
			convertWiki: false,
			links: true,
			attachment: true,
			embed: true,
			removeEmbed: "" as never,
		});
		const text = "See [[Target Note]] for details.";
		const result = convertWikilinks(
			text,
			conditionConvert,
			[targetNoteLink()],
			createPlugin(),
			null
		);
		expect(result).toBe(text);
	});

	it("converts a matched wikilink to a markdown link when convertWiki is enabled", () => {
		const conditionConvert = createPropertiesConversion({ convertWiki: true });
		const text = "See [[Target Note]] for details.";
		const result = convertWikilinks(
			text,
			conditionConvert,
			[targetNoteLink()],
			createPlugin(),
			null
		);
		expect(result).toBe("See [Target Note](Target%20Note.md) for details.");
	});

	it("adds a self-referential alias to a matched wikilink when convertWiki is disabled", () => {
		const conditionConvert = createPropertiesConversion({ convertWiki: false });
		const text = "See [[Target Note]] for details.";
		const result = convertWikilinks(
			text,
			conditionConvert,
			[targetNoteLink()],
			createPlugin(),
			null
		);
		expect(result).toBe("See [[Target Note|Target Note]] for details.");
	});

	it("adds a self-referential alias to an unmatched wikilink via strictStringConversion", () => {
		const conditionConvert = createPropertiesConversion({ convertWiki: false });
		const text = "See [[Unknown Note]] for details.";
		const result = convertWikilinks(text, conditionConvert, [], createPlugin(), null);
		expect(result).toBe("See [[Unknown Note|Unknown Note]] for details.");
	});

	it("leaves an unmatched wikilink untouched when it is already referenced in the frontmatter", () => {
		const conditionConvert = createPropertiesConversion({ convertWiki: false });
		const text = "See [[Target Note]] for details.";
		const sourceFrontmatter = fm({ related: "[[Target Note]]" });
		const result = convertWikilinks(
			text,
			conditionConvert,
			[],
			createPlugin(),
			sourceFrontmatter
		);
		expect(result).toBe(text);
	});

	it("removes an embedded wikilink entirely when removeEmbed is set to remove", () => {
		const conditionConvert = createPropertiesConversion({
			convertWiki: true,
			removeEmbed: "remove",
		});
		const text = "See ![[Target Note]] here.";
		const result = convertWikilinks(
			text,
			conditionConvert,
			[targetNoteLink()],
			createPlugin(),
			null
		);
		expect(result).toBe("See  here.");
	});
});
