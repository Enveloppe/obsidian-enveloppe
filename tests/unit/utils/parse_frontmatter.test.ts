import type { EnveloppeSettings } from "@interfaces/main";
import type Enveloppe from "src/main";
import {
	frontmatterSettingsRepository,
	getCategory,
	getFrontmatterSettings,
	getProperties,
	parsePath,
} from "src/utils/parse_frontmatter";
import { describe, expect, it } from "vitest";
import { createProperties, createRepository, createSettings, fm } from "../fixtures";

function createPlugin(overrides: Partial<EnveloppeSettings> = {}) {
	return {
		settings: createSettings(overrides),
		repositoryFrontmatter: {},
	} as unknown as Enveloppe;
}

describe("getCategory", () => {
	it("falls back to the default folder name when there is no frontmatter", () => {
		const settings = createSettings({ upload: { defaultName: "posts" } as never });
		expect(getCategory(null, settings, undefined)).toBe("posts");
	});

	it("reads the category from the configured frontmatter key", () => {
		const settings = createSettings({ upload: { yamlFolderKey: "category" } as never });
		expect(getCategory(fm({ category: "blog" }), settings, undefined)).toBe("blog");
	});

	it("joins an array category value with a slash", () => {
		const settings = createSettings({ upload: { yamlFolderKey: "category" } as never });
		expect(getCategory(fm({ category: ["blog", "2024"] }), settings, undefined)).toBe(
			"blog/2024"
		);
	});

	it("prefers the path-specific category key over the global one", () => {
		const settings = createSettings({ upload: { yamlFolderKey: "category" } as never });
		const frontmatter = fm({ category: "wrong", folder: "right" });
		expect(
			getCategory(frontmatter, settings, { category: { key: "folder" } } as never)
		).toBe("right");
	});
});

describe("getFrontmatterSettings", () => {
	it("returns the global conversion settings when there is no frontmatter", () => {
		const settings = createSettings({
			conversion: { hardbreak: true, dataview: false } as never,
		});
		const conv = getFrontmatterSettings(null, settings, null);
		expect(conv.hardbreak).toBe(true);
		expect(conv.dataview).toBe(false);
	});

	it("lets a per-file frontmatter key override the global dataview setting", () => {
		const settings = createSettings({ conversion: { dataview: false } as never });
		const conv = getFrontmatterSettings(fm({ dataview: true }), settings, null);
		expect(conv.dataview).toBe(true);
	});

	it("enables unshared link conversion when shareAll is on", () => {
		const settings = createSettings({ plugin: { shareAll: { enable: true } } as never });
		const conv = getFrontmatterSettings(null, settings, null);
		expect(conv.unshared).toBe(true);
	});
});

describe("frontmatterSettingsRepository", () => {
	it("returns the default conversion settings when the repository has no override file set", () => {
		const plugin = createPlugin({ conversion: { hardbreak: true } as never });
		const repo = createRepository({ set: null });
		const conv = frontmatterSettingsRepository(plugin, repo);
		expect(conv.hardbreak).toBe(true);
	});

	it("returns the default conversion settings for a null repository", () => {
		const plugin = createPlugin();
		expect(frontmatterSettingsRepository(plugin, null)).toBeTruthy();
	});
});

describe("getProperties", () => {
	// getProperties() delegates to parsePath(), which always normalizes its
	// input to an array internally and returns that array - so even a
	// single-repo call comes back as a one-element array despite the
	// `Properties[] | Properties` return type suggesting otherwise.
	function single(prop: ReturnType<typeof getProperties>) {
		return Array.isArray(prop) ? prop[0] : prop;
	}

	it("builds Properties from the default github settings when there is no frontmatter", () => {
		const plugin = createPlugin({
			github: { user: "octocat", repo: "hello-world", branch: "main" } as never,
		});
		const prop = single(getProperties(plugin, null, null));
		expect(prop.owner).toBe("octocat");
		expect(prop.repo).toBe("hello-world");
		expect(prop.branch).toBe("main");
	});

	it("overrides owner/repo/branch from an object-form frontmatter.repo", () => {
		const plugin = createPlugin({
			github: { user: "octocat", repo: "hello-world", branch: "main" } as never,
		});
		const prop = single(
			getProperties(
				plugin,
				null,
				fm({ repo: { owner: "other", repo: "other-repo", branch: "dev" } })
			)
		);
		expect(prop.owner).toBe("other");
		expect(prop.repo).toBe("other-repo");
		expect(prop.branch).toBe("dev");
	});

	it("parses a slash-separated string form of frontmatter.repo (owner/repo/branch)", () => {
		const plugin = createPlugin();
		const prop = single(getProperties(plugin, null, fm({ repo: "owner/repo/branch" })));
		expect(prop.owner).toBe("owner");
		expect(prop.repo).toBe("repo");
		expect(prop.branch).toBe("branch");
	});

	it("parses the 4-segment string form including the autoclean flag", () => {
		const plugin = createPlugin();
		const prop = single(
			getProperties(plugin, null, fm({ repo: "owner/repo/branch/true" }))
		);
		expect(prop.autoclean).toBe(true);
	});

	it("expands frontmatter.multipleRepo into an array of Properties", () => {
		const plugin = createPlugin();
		const prop = getProperties(
			plugin,
			null,
			fm({
				multipleRepo: [
					{ repo: "repo1", owner: "owner1", branch: "b1" },
					{ repo: "repo2", owner: "owner2", branch: "b2" },
				],
			})
		);
		expect(Array.isArray(prop)).toBe(true);
		if (Array.isArray(prop)) {
			expect(prop).toHaveLength(2);
			expect(prop.map((p) => p.repo)).toEqual(["repo1", "repo2"]);
		}
	});

	it("forces autoclean off when the upload behavior is Fixed", () => {
		const plugin = createPlugin({ upload: { behavior: "fixed" } as never });
		const prop = single(getProperties(plugin, null, null));
		expect(prop.autoclean).toBe(false);
	});
});

describe("parsePath", () => {
	it("uses the plugin's default folder settings when there is no frontmatter override", () => {
		const plugin = createPlugin({
			upload: { defaultName: "posts", rootFolder: "content" } as never,
		});
		const properties = createProperties();
		const result = parsePath(plugin, null, properties, null);
		const single = Array.isArray(result) ? result[0] : result;
		expect(single.path?.defaultName).toBe("posts");
		expect(single.path?.rootFolder).toBe("content");
	});

	it("lets frontmatter.path fully override the destination path", () => {
		const plugin = createPlugin();
		const properties = createProperties();
		const result = parsePath(
			plugin,
			null,
			properties,
			fm({ path: "custom/exact/path.md" })
		);
		const single = Array.isArray(result) ? result[0] : result;
		expect(single.path?.override).toBe("custom/exact/path.md");
	});
});
