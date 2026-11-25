import { buildExclusion, isValidExclusion, splitLegacyEntry } from "src/utils/exclusion";
import { describe, expect, it, vi } from "vitest";

const excluded = (path: string, ...entries: string[]) =>
	buildExclusion(entries, () => {
		throw new Error("unexpected invalid entry");
	})(path);

describe("buildExclusion", () => {
	it("excludes nothing with an empty list", () => {
		expect(excluded("docs/a.md")).toBe(false);
	});

	it("matches a file or a folder by its path", () => {
		expect(excluded("docs/assets/a.md", "docs/assets")).toBe(true);
		expect(excluded("docs/a.md", " docs/a.md ")).toBe(true);
		expect(excluded("docs/b.md", "docs/a.md")).toBe(false);
	});

	it("checks every entry", () => {
		expect(excluded("docs/b.md", "docs/a.md", "/b\\.md$/")).toBe(true);
	});

	it("matches a regex", () => {
		expect(excluded("docs/script.js", "/\\.js$/")).toBe(true);
		expect(excluded("docs/script.js.md", "/\\.js$/")).toBe(false);
	});

	it("honors the flags of a regex", () => {
		expect(excluded("docs/README.md", "/readme/i")).toBe(true);
		expect(excluded("docs/README.md", "/readme/")).toBe(false);
	});

	it("does not mistake the end of a path for flags", () => {
		for (const entry of ["/docs/img", "/docs/my"]) {
			const folder = entry.slice(1);
			expect(excluded(`${folder}/a.png`, entry)).toBe(true);
			expect(excluded(`content/${folder}/a.png`, entry)).toBe(true);
			expect(excluded("docs/a.md", entry)).toBe(false);
		}
		expect(excluded("docs/a.md", "/^DOCS/im")).toBe(true);
	});

	it("gives the same answer on each call with a global or sticky regex", () => {
		for (const entry of ["/readme/gi", "/^docs/y"]) {
			const check = buildExclusion([entry], vi.fn());
			expect([1, 2, 3].map(() => check("docs/README.md"))).toEqual([true, true, true]);
		}
	});

	it.each(["", "   "])("ignores a blank entry (%j)", (entry) => {
		expect(excluded("docs/a.md", entry)).toBe(false);
	});

	it.each(["/(/", "/[a/i"])("excludes everything when %s is invalid", (entry) => {
		const onInvalid = vi.fn();
		const check = buildExclusion(["docs", entry], onInvalid);
		expect(onInvalid).toHaveBeenCalledTimes(1);
		expect(check("other/a.md")).toBe(true);
	});
});

describe("isValidExclusion", () => {
	it.each(["", "docs/assets", "(docs", "/docs/", "/\\.js$/gi"])("accepts %j", (entry) => {
		expect(isValidExclusion(entry)).toBe(true);
	});

	it.each(["/(/", "/[a/i"])("rejects %j", (entry) => {
		expect(isValidExclusion(entry)).toBe(false);
	});
});

describe("splitLegacyEntry", () => {
	it.each([
		["docs/a", ["docs/a"]],
		["docs/a, docs/b", ["docs/a", "docs/b"]],
		["docs/a,, docs/b,", ["docs/a", "docs/b"]],
		["docs/a\ndocs/b", ["docs/a", "docs/b"]],
		["", []],
		// example of the documentation
		["/folder1/,/folder2/.*\\/subfolder/", ["/folder1/", "/folder2/.*\\/subfolder/"]],
		["docs/a, /\\.js$/i", ["docs/a", "/\\.js$/i"]],
		["/\\.js$/i, docs/a", ["/\\.js$/i", "docs/a"]],
		["/a{1,3}/, docs/a", ["/a{1,3}/", "docs/a"]],
		["docs/a, /(b,c)/", ["docs/a", "/(b,c)/"]],
		["/a{1,3}/", ["/a{1,3}/"]],
		["/a,b/i", ["/a,b/i"]],
		["/(a, docs/b", ["/(a, docs/b"]],
	])("splits %j", (entry, expected) => {
		expect(splitLegacyEntry(entry)).toEqual(expected);
	});
});
