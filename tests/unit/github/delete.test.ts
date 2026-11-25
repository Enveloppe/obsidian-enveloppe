import type { MonoRepoProperties, Properties } from "@interfaces/main";
import { Base64 } from "js-base64";
import { TFile, TFolder } from "obsidian";
import { deleteFromGithub } from "src/GitHub/delete";
import { describe, expect, it, vi } from "vitest";
import { createRepository, createSettings, fm } from "../fixtures";

vi.mock("src/utils/data_validation_test", () => ({
	getDryRunFolder: (folder: string) => folder,
	isAttachment: vi.fn((path: string) => path.endsWith(".png")),
	verifyRateLimitAPI: vi.fn(),
}));
vi.mock("src/utils/parse_frontmatter", () => ({
	frontmatterSettingsRepository: vi.fn(() => ({})),
}));

function createProp(autoclean: boolean): Properties {
	return {
		owner: "owner",
		repo: "repo",
		branch: "main",
		autoclean,
		dryRun: { autoclean: false, enable: false, folderName: "enveloppe" },
	} as unknown as Properties;
}

function createManagement() {
	return {
		plugin: {},
		octokit: {},
		noticeLength: 0,
		settings: createSettings(),
		console: { trace: vi.fn() },
		getAllFileFromRepo: vi.fn(async () => []),
	};
}

async function run(frontmatter: Properties | Properties[]) {
	const management = createManagement();
	const result = await deleteFromGithub(
		true,
		"vault-date",
		management as never,
		{ frontmatter, repository: null } as unknown as MonoRepoProperties
	);
	return { result, management };
}

describe("deleteFromGithub", () => {
	it.each([true, false])(
		"accepts a single-element frontmatter array (autoclean: %s)",
		async (autoclean) => {
			const { result, management } = await run([createProp(autoclean)]);
			expect(result.success).toBe(false);
			expect(management.getAllFileFromRepo).toHaveBeenCalledTimes(autoclean ? 1 : 0);
		}
	);

	it("accepts a single frontmatter object", async () => {
		const { management } = await run(createProp(true));
		expect(management.getAllFileFromRepo).toHaveBeenCalledTimes(1);
	});
});

interface CleanOptions {
	keepUnshared?: boolean;
	shareKey?: string;
	/** Share key of an extra repository */
	repoShareKey?: string;
	/** Remove the setting, as in settings imported from an older version */
	legacy?: boolean;
	excluded?: string[];
	indexName?: string;
	/** Called when the content of a file is requested */
	onRead?: () => void;
}

function cleanSettings({
	keepUnshared,
	shareKey = "share",
	legacy,
	excluded,
	indexName,
}: CleanOptions) {
	const settings = createSettings();
	if (indexName !== undefined) settings.upload.folderNote.rename = indexName;
	if (excluded) settings.upload.autoclean.excluded = excluded;
	settings.github.rateLimit = 5000;
	settings.upload.defaultName = "content";
	settings.plugin.shareKey = shareKey;
	if (keepUnshared !== undefined) settings.upload.autoclean.keepUnshared = keepUnshared;
	if (legacy)
		delete (settings.upload.autoclean as { keepUnshared?: boolean }).keepUnshared;
	return settings;
}

const repositoryOf = ({ repoShareKey }: CleanOptions) =>
	repoShareKey ? createRepository({ shareKey: repoShareKey }) : null;

/** Purge a repository holding a single file, absent from the vault */
async function purge(
	path: string,
	content: string,
	options: CleanOptions = {}
): Promise<string[]> {
	const request = vi.fn(async (route: string, _params: unknown) => {
		if (route.startsWith("GET")) options.onRead?.();
		return { status: 200, data: { content: Base64.encode(content) } };
	});
	const management = {
		plugin: {},
		octokit: { request },
		noticeLength: 0,
		settings: cleanSettings(options),
		console: { trace: vi.fn(), warn: vi.fn() },
		getAllFileFromRepo: vi.fn(async () => [{ file: path, sha: "sha" }]),
		getAllFileWithPath: vi.fn(() => []),
	};
	const result = await deleteFromGithub(
		true,
		"vault-date",
		management as never,
		{
			frontmatter: createProp(true),
			repository: repositoryOf(options),
		} as unknown as MonoRepoProperties
	);
	const requested = request.mock.calls
		.filter(([route]) => route.startsWith("DELETE"))
		.map(([, params]) => (params as { path: string }).path);
	expect(requested).toEqual(result.deleted);
	return result.deleted;
}

const note = (...frontmatter: string[]) =>
	["---", ...frontmatter, "---", "text"].join("\n");
const INDEX = "content/folder/index.md";

describe("files kept by the autoclean", () => {
	it.each([
		["no frontmatter", "text"],
		["no share key", note("title: a")],
		["share: false", note("share: false")],
	])("decides for an index with %s", async (_name, content) => {
		expect(await purge(INDEX, content)).toEqual([]);
		expect(await purge(INDEX, content, { keepUnshared: true })).toEqual([]);
		expect(await purge(INDEX, content, { keepUnshared: false })).toEqual([INDEX]);
	});

	it("keeps unshared index files when the setting is missing", async () => {
		expect(await purge(INDEX, note("title: a"), { legacy: true })).toEqual([]);
	});

	it.each(["index: true", 'index: "true"', "delete: false", 'delete: "false"'])(
		"never deletes an index with %s",
		async (mark) => {
			for (const keepUnshared of [true, false])
				expect(await purge(INDEX, note("share: true", mark), { keepUnshared })).toEqual(
					[]
				);
		}
	);

	it.each([true, false])("deletes a shared index (%s)", async (keepUnshared) => {
		expect(await purge(INDEX, note("share: true"), { keepUnshared })).toEqual([INDEX]);
	});

	it("reads the configured share key", async () => {
		const options = { shareKey: "publish" };
		expect(await purge(INDEX, note("publish: true"), options)).toEqual([INDEX]);
		expect(await purge(INDEX, note("publish: false"), options)).toEqual([]);
		expect(await purge(INDEX, note("share: true"), options)).toEqual([]);
	});

	it("reads the share key of an extra repository", async () => {
		const options = { shareKey: "share", repoShareKey: "blog" };
		expect(await purge(INDEX, note("blog: true"), options)).toEqual([INDEX]);
		expect(await purge(INDEX, note("share: true"), options)).toEqual([]);
	});

	it("does not apply to other notes", async () => {
		for (const keepUnshared of [true, false])
			expect(await purge("content/a.md", note("share: false"), { keepUnshared })).toEqual(
				["content/a.md"]
			);
	});

	it.each(["delete: false", 'delete: "false"'])(
		"keeps any note with %s",
		async (mark) => {
			for (const keepUnshared of [true, false])
				expect(
					await purge("content/a.md", note("share: true", mark), { keepUnshared })
				).toEqual([]);
		}
	);

	it.each(["index: true", "delete: true", "title: a"])(
		"deletes a regular note with %s",
		async (mark) => {
			expect(await purge("content/a.md", note("share: true", mark))).toEqual([
				"content/a.md",
			]);
		}
	);

	it("does not read the content of attachments", async () => {
		const onRead = vi.fn();
		expect(await purge("content/a.png", "", { onRead })).toEqual(["content/a.png"]);
		expect(onRead).not.toHaveBeenCalled();
	});

	it("does not delete a note that could not be checked", async () => {
		const onRead = () => {
			throw new Error("rate limit");
		};
		expect(await purge("content/a.md", note("share: true"), { onRead })).toEqual([]);
		expect(await purge(INDEX, note("share: true"), { onRead })).toEqual([]);
	});

	it("never reads an excluded file", async () => {
		for (const path of ["content/a.md", INDEX]) {
			const onRead = vi.fn();
			const excluded = ["/^CONTENT\\//i"];
			expect(await purge(path, note("share: true"), { excluded, onRead })).toEqual([]);
			expect(onRead).not.toHaveBeenCalled();
		}
	});

	it("deletes nothing when an exclusion is invalid", async () => {
		const excluded = ["/(/"];
		expect(await purge("content/a.md", note("share: true"), { excluded })).toEqual([]);
	});

	it.each([
		["empty", "---\n---\ntext"],
		["only comments", note("# comment")],
		["null", note("~")],
	])("deletes a regular note with a frontmatter that is %s", async (_name, content) => {
		expect(await purge("content/a.md", content)).toEqual(["content/a.md"]);
	});

	it.each([
		["invalid YAML", note("delete: false", "title: a: b: [")],
		["a text", note("only text")],
	])("keeps a note with a frontmatter that is %s", async (_name, content) => {
		expect(await purge("content/a.md", content)).toEqual([]);
		expect(await purge(INDEX, content, { keepUnshared: false })).toEqual([]);
	});

	it("deletes a note without content", async () => {
		expect(await purge("content/a.md", "")).toEqual(["content/a.md"]);
	});

	it("treats every file as a regular one without folder note name", async () => {
		for (const path of ["content/a.md", "content/a.png"])
			expect(await purge(path, note("title: a"), { indexName: "" })).toEqual([path]);
	});

	it("only treats the exact folder note name as an index", async () => {
		const content = note("title: a");
		for (const path of ["content/myindex.md", "content/index.md/a.md"])
			expect(await purge(path, content)).toEqual([path]);
		expect(await purge(INDEX, content)).toEqual([]);
		expect(await purge(INDEX, content, { indexName: "index" })).toEqual([]);
	});

	describe("in dry-run", () => {
		it("follows the exclusion list", async () => {
			expect(await purgeDryRun({}, { excluded: ["/^CONTENT\\//i"] })).toBe(false);
			expect(await purgeDryRun({}, { excluded: ["/(/"] })).toBe(false);
			expect(await purgeDryRun({}, { excluded: ["other"] })).toBe(true);
		});

		async function purgeDryRun(
			frontmatter: Record<string, unknown>,
			options: CleanOptions = {},
			path = INDEX
		) {
			const file = Object.assign(new TFile(), {
				path: `enveloppe/${path}`,
				extension: "md",
			});
			const folder = Object.assign(new TFolder(), {
				path: "enveloppe",
				children: [file],
			});
			const management = {
				plugin: {
					app: {
						metadataCache: { getFileCache: () => ({ frontmatter: fm(frontmatter) }) },
						fileManager: { trashFile: vi.fn(async () => undefined) },
					},
				},
				vault: { getFolderByPath: () => folder },
				noticeLength: 0,
				settings: cleanSettings(options),
				console: { trace: vi.fn() },
				getAllFileWithPath: vi.fn(() => []),
			};
			const prop = createProp(true);
			prop.dryRun.autoclean = true;
			const result = await deleteFromGithub(
				true,
				"",
				management as never,
				{
					frontmatter: prop,
					repository: repositoryOf(options),
				} as unknown as MonoRepoProperties
			);
			return result.deleted.length === 1;
		}

		it("follows the setting", async () => {
			expect(await purgeDryRun({ share: false })).toBe(false);
			expect(await purgeDryRun({ share: false }, { keepUnshared: false })).toBe(true);
		});

		it("reads the configured share key", async () => {
			expect(await purgeDryRun({ publish: false }, { shareKey: "publish" })).toBe(false);
			expect(await purgeDryRun({ blog: false }, { repoShareKey: "blog" })).toBe(false);
		});

		it.each([
			[{ delete: false }, false],
			[{ delete: "false" }, false],
			[{ index: true }, true],
			[{ share: false }, true],
		])("handles a regular note with %o (deleted: %s)", async (frontmatter, deleted) => {
			expect(await purgeDryRun(frontmatter, {}, "content/a.md")).toBe(deleted);
		});

		it.each([{ index: true }, { delete: false }])("always keeps %o", async (mark) => {
			expect(await purgeDryRun({ share: false, ...mark }, { keepUnshared: false })).toBe(
				false
			);
		});
	});
});
