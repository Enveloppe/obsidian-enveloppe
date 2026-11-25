import { purgeForRepo } from "src/commands/purge";
import { deleteFromGithub } from "src/GitHub/delete";
import type Enveloppe from "src/main";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlugin, createProperties } from "../fixtures";

vi.mock("src/GitHub/delete", () => ({ deleteFromGithub: vi.fn() }));
vi.mock("src/settings/modals/list_changed", () => ({ ListChangedFiles: vi.fn() }));
vi.mock("src/utils/data_validation_test", () => ({
	checkRepositoryValidityWithProperties: vi.fn(async () => true),
}));
vi.mock("src/utils/parse_frontmatter", () => ({
	getProperties: vi.fn(() => createProperties({ autoclean: true })),
	frontmatterSettingsRepository: vi.fn(() => ({})),
}));

async function purge(deleted: string[], dryRun = false) {
	vi.mocked(deleteFromGithub).mockResolvedValue({
		deleted,
		undeleted: [],
		success: true,
	});
	const plugin = createPlugin();
	plugin.settings.github.dryRun.enable = dryRun;
	plugin.settings.plugin.displayModalRepoEditing = false;
	const publisher = {
		plugin,
		settings: plugin.settings,
		noticeLength: 0,
		newBranch: vi.fn(),
		updateRepository: vi.fn(),
	};
	(plugin as { reloadOctokit: unknown }).reloadOctokit = async () => publisher;
	await purgeForRepo(plugin as Enveloppe, null, "branch");
	return publisher;
}

describe("purgeForRepo", () => {
	beforeEach(() => {
		const element = { createSpan: () => ({ appendChild: () => undefined }) };
		vi.stubGlobal("createFragment", () => element);
	});

	it("opens the pull request when files were deleted", async () => {
		const { updateRepository } = await purge(["content/a.md"]);
		expect(updateRepository).toHaveBeenCalledTimes(1);
	});

	it("does not open a pull request when nothing was deleted", async () => {
		const { updateRepository } = await purge([]);
		expect(updateRepository).not.toHaveBeenCalled();
	});

	it("does not open a pull request in dry-run", async () => {
		const { updateRepository } = await purge(["content/a.md"], true);
		expect(updateRepository).not.toHaveBeenCalled();
	});
});
