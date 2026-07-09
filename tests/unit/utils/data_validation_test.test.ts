import type { PropertiesConversion } from "@interfaces/main";
import {
	checkIfRepoIsInAnother,
	defaultRepo,
	isAttachment,
	isExcludedPath,
	isInDryRunFolder,
	isShared,
	noTextConversion,
} from "src/utils/data_validation_test";
import { describe, expect, it } from "vitest";
import { createFile, createPropertiesConversion, createSettings, fm } from "../fixtures";

describe("isAttachment", () => {
	it("recognizes common attachment extensions", () => {
		expect(isAttachment("image.png")).not.toBeNull();
		expect(isAttachment("clip.mp4")).not.toBeNull();
		expect(isAttachment("doc.pdf")).not.toBeNull();
	});

	it("returns null for a plain markdown note", () => {
		expect(isAttachment("note.md")).toBeNull();
	});

	it("always treats excalidraw notes as attachments", () => {
		expect(isAttachment("drawing.excalidraw.md")).not.toBeNull();
	});

	it("matches an external extension provided in settings", () => {
		expect(isAttachment("archive.zip", ["zip"])).not.toBeNull();
		expect(isAttachment("archive.tar", ["zip"])).toBeNull();
	});

	it("supports a /regex/ external attachment entry", () => {
		expect(isAttachment("readme.csv", ["/\\.csv$/"])).not.toBeNull();
	});

	// FIND_REGEX (src/interfaces/constant.ts) only has one capture group for the
	// pattern body, so the trailing flags in a "/pattern/flags" setting entry are
	// matched syntactically but never actually reach `new RegExp(...)`. This
	// documents the current behavior rather than the likely intent.
	it("does not honor the flags of a /regex/flags external attachment entry", () => {
		expect(isAttachment("readme.CSV", ["/\\.csv$/i"])).toBeNull();
	});
});

describe("checkIfRepoIsInAnother", () => {
	const repoA = { owner: "a", repo: "repo", branch: "main" };
	const repoB = { owner: "b", repo: "repo", branch: "main" };

	it("returns true when a single repo matches another single repo", () => {
		expect(checkIfRepoIsInAnother(repoA as never, { ...repoA } as never)).toBe(true);
	});

	it("returns false when repos differ on owner", () => {
		expect(checkIfRepoIsInAnother(repoA as never, repoB as never)).toBe(false);
	});

	it("returns true when any entry in either array matches", () => {
		expect(checkIfRepoIsInAnother([repoB, repoA] as never, [{ ...repoA }] as never)).toBe(
			true
		);
	});

	it("returns false when no entries match across both arrays", () => {
		expect(checkIfRepoIsInAnother([repoA] as never, [repoB] as never)).toBe(false);
	});
});

describe("noTextConversion", () => {
	it("is true when nothing needs converting", () => {
		const conv = createPropertiesConversion({
			convertWiki: false,
			links: true,
			attachment: true,
			embed: true,
			removeEmbed: undefined as unknown as PropertiesConversion["removeEmbed"],
		});
		expect(noTextConversion(conv)).toBe(true);
	});

	it("is false as soon as wikilinks need converting", () => {
		const conv = createPropertiesConversion({ convertWiki: true });
		expect(noTextConversion(conv)).toBe(false);
	});

	it("is false when links conversion is disabled", () => {
		const conv = createPropertiesConversion({ links: false });
		expect(noTextConversion(conv)).toBe(false);
	});
});

describe("defaultRepo", () => {
	it("builds a Repository from the global settings", () => {
		const settings = createSettings({
			github: {
				user: "octocat",
				repo: "hello-world",
				branch: "main",
			} as never,
		});
		const repo = defaultRepo(settings);
		expect(repo.smartKey).toBe("default");
		expect(repo.user).toBe("octocat");
		expect(repo.repo).toBe("hello-world");
		expect(repo.branch).toBe("main");
	});

	it("falls back to 'share' when the plugin shareKey is empty", () => {
		const settings = createSettings({ plugin: { shareKey: "" } as never });
		expect(defaultRepo(settings).shareKey).toBe("share");
	});

	it("keeps a configured shareKey", () => {
		const settings = createSettings({ plugin: { shareKey: "publish" } as never });
		expect(defaultRepo(settings).shareKey).toBe("publish");
	});
});

describe("isExcludedPath", () => {
	it("excludes a file inside a plain excluded folder", () => {
		const settings = createSettings({ plugin: { excludedFolder: ["private"] } as never });
		const file = createFile({ path: "private/secret.md" });
		expect(isExcludedPath(settings, file as never, null)).toBe(true);
	});

	it("does not exclude a file outside excluded folders", () => {
		const settings = createSettings({ plugin: { excludedFolder: ["private"] } as never });
		const file = createFile({ path: "public/note.md" });
		expect(isExcludedPath(settings, file as never, null)).toBe(false);
	});

	it("supports a /regex/ excluded folder entry", () => {
		const settings = createSettings({
			plugin: { excludedFolder: ["/^archive\\//"] } as never,
		});
		const file = createFile({ path: "archive/old.md" });
		expect(isExcludedPath(settings, file as never, null)).toBe(true);
	});
});

describe("isInDryRunFolder", () => {
	it("returns false when no dry-run folder is configured", () => {
		const settings = createSettings({
			github: { dryRun: { folderName: "" } } as never,
		});
		const file = createFile({ path: "anything.md" });
		expect(isInDryRunFolder(settings, null, file as never)).toBe(false);
	});

	it("matches a file inside the templated dry-run folder", () => {
		const settings = createSettings({
			github: {
				user: "octocat",
				repo: "hello-world",
				branch: "main",
				dryRun: { folderName: "{{owner}}/{{repo}}/{{branch}}" },
			} as never,
		});
		const file = createFile({ path: "octocat/hello-world/main/note.md" });
		expect(isInDryRunFolder(settings, null, file as never)).toBe(true);
	});

	it("does not match a file outside the dry-run folder", () => {
		const settings = createSettings({
			github: {
				user: "octocat",
				repo: "hello-world",
				branch: "main",
				dryRun: { folderName: "{{owner}}/{{repo}}/{{branch}}" },
			} as never,
		});
		const file = createFile({ path: "somewhere/else/note.md" });
		expect(isInDryRunFolder(settings, null, file as never)).toBe(false);
	});
});

describe("isShared", () => {
	it("is never shared for non-markdown files", () => {
		const settings = createSettings();
		const file = createFile({ path: "image.png" });
		expect(isShared(fm({}), settings, file as never, null)).toBe(false);
	});

	it("is never shared for excalidraw notes", () => {
		const settings = createSettings();
		const file = createFile({ path: "drawing.excalidraw.md" });
		expect(isShared(fm({}), settings, file as never, null)).toBe(false);
	});

	it("is shared when the frontmatter share key is truthy", () => {
		const settings = createSettings({ plugin: { shareKey: "share" } as never });
		const file = createFile({ path: "note.md" });
		expect(isShared(fm({ share: "true" }), settings, file as never, null)).toBe(true);
	});

	it("is not shared when the frontmatter share key is explicitly false", () => {
		const settings = createSettings({ plugin: { shareKey: "share" } as never });
		const file = createFile({ path: "note.md" });
		expect(isShared(fm({ share: "false" }), settings, file as never, null)).toBe(false);
	});

	it("is not shared when the frontmatter has no share key at all", () => {
		const settings = createSettings({ plugin: { shareKey: "share" } as never });
		const file = createFile({ path: "note.md" });
		expect(isShared(fm({}), settings, file as never, null)).toBe(false);
	});
});
