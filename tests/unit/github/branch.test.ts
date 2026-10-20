import type { Properties } from "@interfaces/main";
import { GithubBranch } from "src/GitHub/branch";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("src/GitHub/files", () => ({ FilesManagement: class {} }));
vi.mock("src/utils/data_validation_test", () => ({ verifyToken: vi.fn() }));
vi.mock("src/utils/logs", () => ({ EnveloppeErrors: class extends Error {} }));

const prop = { owner: "owner", repo: "repo", branch: "main" } as Properties;

function createBranch(request: ReturnType<typeof vi.fn>) {
	const branch = Object.create(GithubBranch.prototype) as GithubBranch;
	Object.assign(branch, {
		octokit: { request },
		branchName: "vault-date",
		console: { warn: vi.fn(), trace: vi.fn(), info: vi.fn(), error: vi.fn() },
	});
	return branch;
}

function mockRequest(listed: unknown[], createError = true) {
	return vi.fn(async (route: string) => {
		if (route.startsWith("POST") && createError) {
			throw Object.assign(new Error("Forbidden"), { status: 403 });
		}
		if (route.startsWith("POST")) return { status: 201, data: { number: 1 } };
		return { status: 200, data: listed };
	});
}

describe("pullRequestOnRepo", () => {
	let listed: unknown[];

	beforeEach(() => {
		listed = [];
	});

	it("returns 0 when only an unrelated PR is open", async () => {
		listed = [{ number: 123, head: { ref: "dependabot/example" }, base: { ref: "main" } }];
		const branch = createBranch(mockRequest(listed));
		expect(await branch.pullRequestOnRepo(prop)).toBe(0);
	});

	it("reuses the open PR matching head and base", async () => {
		listed = [
			{ number: 123, head: { ref: "dependabot/example" }, base: { ref: "main" } },
			{ number: 124, head: { ref: "vault-date" }, base: { ref: "main" } },
		];
		const branch = createBranch(mockRequest(listed));
		expect(await branch.pullRequestOnRepo(prop)).toBe(124);
	});

	it("ignores a PR with the same head but another base", async () => {
		listed = [{ number: 125, head: { ref: "vault-date" }, base: { ref: "develop" } }];
		const branch = createBranch(mockRequest(listed));
		expect(await branch.pullRequestOnRepo(prop)).toBe(0);
	});

	it("filters the lookup by head and base", async () => {
		const request = mockRequest(listed);
		await createBranch(request).pullRequestOnRepo(prop);
		expect(request).toHaveBeenCalledWith(
			"GET /repos/{owner}/{repo}/pulls",
			expect.objectContaining({ head: "owner:vault-date", base: "main", state: "open" })
		);
	});

	it("returns the new PR number when creation succeeds", async () => {
		const branch = createBranch(mockRequest(listed, false));
		expect(await branch.pullRequestOnRepo(prop)).toBe(1);
	});
});

describe("updateRepositoryOnOne", () => {
	it("never merges nor deletes the branch when no matching PR exists", async () => {
		const branch = createBranch(
			mockRequest([{ number: 123, head: { ref: "dependabot/x" }, base: { ref: "main" } }])
		);
		Object.assign(branch, { settings: { github: { dryRun: { enable: false } } } });
		const merge = vi.spyOn(branch, "mergePullRequestOnRepo");
		const del = vi.spyOn(branch, "deleteBranchOnRepo");
		const result = await branch.updateRepositoryOnOne({
			...prop,
			automaticallyMergePR: true,
		} as Properties);
		expect(result).toBe(false);
		expect(merge).not.toHaveBeenCalled();
		expect(del).not.toHaveBeenCalled();
	});
});
