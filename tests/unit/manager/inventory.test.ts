import type { ConvertedLink, GithubRepo, Properties } from "@interfaces/main";
import { TFile } from "obsidian";
import { mustBeDeleted } from "src/GitHub/delete";
import {
	buildInventory,
	countByStatus,
	filterEntries,
	type InventorySource,
	isModified,
	type PendingWrites,
	settlePending,
	withPending,
} from "src/manager/inventory";
import { describe, expect, it } from "vitest";

const target = { owner: "me", repo: "site", branch: "main" } as Properties;
const other = { owner: "me", repo: "other", branch: "main" } as Properties;

function file(path: string): TFile {
	const f = new TFile();
	f.path = path;
	f.name = path.split("/").pop()!;
	f.extension = f.name.split(".").pop()!;
	f.basename = f.name.replace(/\.[^.]+$/, "");
	return f;
}

const note = (
	path: string,
	converted: string,
	prop: Properties | Properties[] = target
): ConvertedLink => ({
	real: file(path),
	converted,
	prop,
});
const attachment = (
	path: string,
	converted: string,
	otherPaths?: string[]
): ConvertedLink => ({
	real: file(path),
	converted,
	otherPaths,
});
const remote = (...paths: string[]): GithubRepo[] =>
	paths.map((path) => ({ file: path, sha: `sha-${path}` }));

function inventory(source: Partial<InventorySource>) {
	return buildInventory({
		local: [],
		remote: [],
		managed: [],
		target,
		isTargeted: (prop) =>
			(Array.isArray(prop) ? prop : [prop]).some((p) => p.repo === target.repo),
		indexName: "index",
		...source,
	});
}

describe("buildInventory", () => {
	it("splits shared notes between published and not published", () => {
		const entries = inventory({
			local: [note("a.md", "docs/a.md"), note("b.md", "docs/b.md")],
			remote: remote("docs/a.md"),
		});
		expect(entries.map((e) => [e.id, e.status, e.sha])).toEqual([
			["docs/a.md", "published", "sha-docs/a.md"],
			["docs/b.md", "unpublished", undefined],
		]);
	});

	it("ignores notes sent to another repository and excalidraw drawings", () => {
		const entries = inventory({
			local: [note("a.md", "docs/a.md", other), note("d.excalidraw.md", "docs/d.md")],
		});
		expect(entries).toEqual([]);
	});

	it("lists attachments only once they are in the repository", () => {
		const entries = inventory({
			local: [
				attachment("img.png", "assets/img.png", ["other/img.png"]),
				attachment("unused.png", "assets/unused.png"),
			],
			remote: remote("other/img.png"),
		});
		expect(entries.map((e) => [e.id, e.kind, e.status])).toEqual([
			["other/img.png", "attachment", "published"],
		]);
	});

	it("flags managed files no shared note produces anymore as orphans", () => {
		const entries = inventory({
			// same rule as the autoclean: a note resolving several repositories, none of them this one
			local: [note("a.md", "docs/a.md"), note("b.md", "docs/b.md", [other])],
			remote: remote("docs/a.md", "docs/b.md", "docs/gone.md", "docs/folder/index.md"),
			managed: remote("docs/a.md", "docs/b.md", "docs/gone.md", "docs/folder/index.md"),
		});
		expect(entries.map((e) => [e.id, e.status, !!e.isIndex])).toEqual([
			["docs/a.md", "published", false],
			["docs/b.md", "orphan", false],
			["docs/folder/index.md", "orphan", true],
			["docs/gone.md", "orphan", false],
		]);
		expect(entries.find((e) => e.status === "orphan")?.file).toBeUndefined();
	});
});

describe("mustBeDeleted", () => {
	const shared = [
		{ converted: "docs/a.md", repo: target },
		{ converted: "docs/b.md", repo: [other] },
		{ converted: "assets/img.png", otherPath: ["x/img.png"] },
	];

	it.each([
		["docs/a.md", false],
		["docs/b.md", true],
		["docs/c.md", true],
		["assets/img.png", false],
		["x/img.png", false],
		["assets/old.png", true],
	])("%s -> %s", (path, expected) => {
		expect(mustBeDeleted(path, shared, target)).toBe(expected);
	});
});

describe("filters", () => {
	const entries = inventory({
		local: [note("Notes/Alpha.md", "docs/alpha.md"), note("Beta.md", "docs/beta.md")],
		remote: remote("docs/alpha.md", "docs/zombie.md"),
		managed: remote("docs/zombie.md"),
	});

	it("counts entries by status", () => {
		expect(countByStatus(entries)).toEqual({
			all: 3,
			published: 1,
			modified: 0,
			unpublished: 1,
			orphan: 1,
		});
	});

	it("filters by status and by every word of the query, on both paths", () => {
		expect(filterEntries(entries, "orphan", "").map((e) => e.id)).toEqual([
			"docs/zombie.md",
		]);
		expect(filterEntries(entries, "all", "notes alpha").map((e) => e.id)).toEqual([
			"docs/alpha.md",
		]);
		expect(filterEntries(entries, "published", "beta")).toEqual([]);
	});

	it("compares the vault date with the last commit", () => {
		expect(isModified(2000, new Date(1000))).toBe(true);
		expect(isModified(1000, new Date(2000))).toBe(false);
		expect(isModified(1000, null)).toBe(false);
	});
});

describe("pending writes", () => {
	const listing: GithubRepo[] = [
		{ file: "a.md", sha: "1" },
		{ file: "b.md", sha: "2" },
	];

	it("adds the pushed files and hides the deleted ones", () => {
		const pending: PendingWrites = new Map([
			["c.md", "push"],
			["a.md", "push"],
			["b.md", "delete"],
		]);
		expect(withPending(listing, pending)).toEqual([
			{ file: "a.md", sha: "1" },
			{ file: "c.md", sha: "" },
		]);
	});

	it("shows a pushed note as published before the listing has it", () => {
		const entries = inventory({
			local: [note("Notes/C.md", "c.md")],
			remote: withPending([], new Map([["c.md", "push"]])),
		});
		expect(entries[0].status).toBe("published");
	});

	it("forgets the writes the listing confirms", () => {
		const pending: PendingWrites = new Map([
			["a.md", "push"],
			["c.md", "push"],
			["b.md", "delete"],
			["d.md", "delete"],
		]);
		settlePending(listing, pending);
		expect([...pending]).toEqual([
			["c.md", "push"],
			["b.md", "delete"],
		]);
	});
});
