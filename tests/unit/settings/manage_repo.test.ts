import type { Repository } from "@interfaces";
import type { SettingDefinitionPage } from "obsidian";
import type { RenderContext } from "src/settings/renders";
import {
	buildManageRepoPage,
	deleteRepository,
	renameRepository,
} from "src/settings/renders/manage_repo";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlugin, createRepository } from "../fixtures";

function context(...keys: string[]) {
	const plugin = createPlugin(
		{},
		{
			saveSettings: vi.fn(async () => undefined),
			reloadCommands: vi.fn(async () => undefined),
		}
	);
	plugin.settings.github.otherRepo = keys.map((smartKey) =>
		createRepository({ smartKey })
	);
	const closePage = vi.fn();
	const ctx = {
		app: { setting: { closePage } },
		plugin,
		settings: plugin.settings,
		update: vi.fn(),
		refresh: vi.fn(),
	} as unknown as RenderContext;
	return { ctx, plugin, closePage, repos: plugin.settings.github.otherRepo };
}

type PageList = { items: SettingDefinitionPage[]; addItem: { action: () => void } };

const list = (ctx: RenderContext) =>
	buildManageRepoPage(ctx).items?.find(
		(item) => "type" in item && item.type === "list"
	) as unknown as PageList;
const ids = (ctx: RenderContext) => list(ctx).items.map((page) => page.id);
const names = (ctx: RenderContext) => list(ctx).items.map((page) => page.name);

describe("repository pages", () => {
	beforeEach(() => {
		vi.stubGlobal("createFragment", () => ({ createSpan: () => undefined }));
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("gives a unique and stable id to each repository", () => {
		const { ctx } = context("a", "b", "c");
		expect(new Set(ids(ctx)).size).toBe(3);
		expect(ids(ctx)).toEqual(ids(ctx));
	});

	it("keeps the id when a repository is renamed", async () => {
		const { ctx, plugin, repos } = context("a", "b");
		const before = ids(ctx);
		await renameRepository(ctx, repos[0], "renamed");
		expect(ids(ctx)).toEqual(before);
		expect(names(ctx)).toEqual(["renamed", "b"]);
		expect(ctx.update).toHaveBeenCalledTimes(1);
		expect(plugin.reloadCommands).toHaveBeenCalledTimes(1);
	});

	it("keeps the frontmatter of the set file when a repository is renamed", async () => {
		const { ctx, plugin, repos } = context("a");
		plugin.repositoryFrontmatter.a = { tags: "x" } as never;
		await renameRepository(ctx, repos[0], "renamed");
		expect(plugin.repositoryFrontmatter).toEqual({ renamed: { tags: "x" } });
	});

	it("keeps the id of the other repositories after a deletion", async () => {
		const { ctx, repos, closePage } = context("a", "b", "c");
		const [first, , third] = ids(ctx);
		await deleteRepository(ctx, repos[1]);
		expect(ids(ctx)).toEqual([first, third]);
		expect(closePage).toHaveBeenCalledTimes(1);
	});

	it("does not delete another repository when the deletion runs twice", async () => {
		const { ctx, repos, closePage } = context("a", "b");
		const deleted: Repository = repos[0];
		await deleteRepository(ctx, deleted);
		await deleteRepository(ctx, deleted);
		expect(names(ctx)).toEqual(["b"]);
		expect(closePage).toHaveBeenCalledTimes(1);
	});

	it("never adds a repository with a key already used", async () => {
		const { ctx, repos } = context("smartkey-0", "smartkey-1");
		await deleteRepository(ctx, repos[0]);
		list(ctx).addItem.action();
		expect(names(ctx)).toEqual(["smartkey-1", "smartkey-2"]);
	});
});
