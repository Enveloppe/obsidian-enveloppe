import type { MonoRepoProperties, Properties } from "@interfaces/main";
import { deleteFromGithub } from "src/GitHub/delete";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/utils/data_validation_test", () => ({
	isAttachment: vi.fn(),
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
		settings: { github: { rateLimit: 0 } },
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
