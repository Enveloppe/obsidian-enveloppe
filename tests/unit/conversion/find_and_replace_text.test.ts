import type { EnveloppeSettings } from "@interfaces/main";
import findAndReplaceText, {
	createRegexFromText,
	replaceText,
} from "src/conversion/find_and_replace_text";
import type Enveloppe from "src/main";
import { describe, expect, it } from "vitest";
import { createSettings } from "../fixtures";

function createPlugin(overrides: Partial<EnveloppeSettings> = {}) {
	return {
		settings: createSettings(overrides),
		// replaceText() only calls console.debug() on a JSON.parse failure path
		console: { debug: () => undefined },
	} as unknown as Enveloppe;
}

describe("createRegexFromText", () => {
	it("extracts the pattern and flags from a /pattern/flags string", () => {
		const regex = createRegexFromText("/foo+/gi");
		expect(regex.source).toBe("foo+");
		expect(regex.flags).toBe("gi");
	});

	it("dedupes repeated flag characters", () => {
		const regex = createRegexFromText("/foo/gg");
		expect(regex.flags).toBe("g");
	});

	it("uses no flags when the string has none", () => {
		const regex = createRegexFromText("/bar/");
		expect(regex.source).toBe("bar");
		expect(regex.flags).toBe("");
	});

	it("honors an explicit flags argument over the trailing slash", () => {
		const regex = createRegexFromText("/baz/", "i");
		expect(regex.flags).toBe("i");
	});
});

describe("replaceText", () => {
	it("replaces a plain string pattern outside of code blocks", () => {
		const plugin = createPlugin();
		expect(replaceText("hello world", "world", "there", plugin)).toBe("hello there");
	});

	it("does not replace inside inline code spans", () => {
		const plugin = createPlugin();
		expect(replaceText("say `world` not world", "world", "there", plugin)).toBe(
			"say `world` not there"
		);
	});

	it("does not replace inside fenced code blocks", () => {
		const plugin = createPlugin();
		const text = "before world\n```\nworld\n```\nafter world";
		const result = replaceText(text, "world", "there", plugin);
		expect(result).toBe("before there\n```\nworld\n```\nafter there");
	});

	it("replaces using a provided RegExp pattern", () => {
		const plugin = createPlugin();
		expect(replaceText("foo1 foo2", /foo\d/g, "bar", plugin)).toBe("bar bar");
	});

	it("skips a match escaped with a backslash when links is true", () => {
		const plugin = createPlugin();
		expect(replaceText("\\world and world", "world", "there", plugin, true)).toBe(
			"\\world and there"
		);
	});
});

describe("findAndReplaceText (default export)", () => {
	it("returns the text unchanged when there is nothing to censor", () => {
		const plugin = createPlugin({ conversion: { censorText: [] } as never });
		expect(findAndReplaceText("hello world", plugin)).toBe("hello world");
	});

	it("applies a plain-text censor entry", () => {
		const plugin = createPlugin({
			conversion: {
				censorText: [
					{ entry: "secret", replace: "REDACTED", after: false, inCodeBlocks: false },
				],
			} as never,
		});
		expect(findAndReplaceText("this is a secret message", plugin)).toBe(
			"this is a REDACTED message"
		);
	});

	it("applies a /regex/ censor entry", () => {
		const plugin = createPlugin({
			conversion: {
				censorText: [
					{
						entry: "/\\d+/g",
						replace: "#",
						after: false,
						inCodeBlocks: false,
					},
				],
			} as never,
		});
		expect(findAndReplaceText("room 42 and 7", plugin)).toBe("room # and #");
	});

	it("only applies entries flagged for the requested pass (before/after)", () => {
		const plugin = createPlugin({
			conversion: {
				censorText: [
					{ entry: "foo", replace: "FIRST", after: false, inCodeBlocks: false },
					{ entry: "bar", replace: "SECOND", after: true, inCodeBlocks: false },
				],
			} as never,
		});
		expect(findAndReplaceText("foo bar", plugin, false)).toBe("FIRST bar");
		expect(findAndReplaceText("foo bar", plugin, true)).toBe("foo SECOND");
	});
});
