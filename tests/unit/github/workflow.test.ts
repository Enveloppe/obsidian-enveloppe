import type { Properties } from "@interfaces/main";
import Publisher from "src/GitHub/upload";
import { describe, expect, it, vi } from "vitest";

// files.ts extends Publisher: break the import cycle
vi.mock("src/GitHub/files", () => ({ FilesManagement: class {} }));

describe("workflowGestion", () => {
	it("returns false instead of throwing when the workflow can't be dispatched", async () => {
		const request = vi.fn(async () => {
			throw Object.assign(
				new Error("Workflow does not have 'workflow_dispatch' trigger"),
				{ status: 422 }
			);
		});
		const publisher = Object.create(Publisher.prototype) as Publisher;
		Object.assign(publisher, {
			octokit: { request },
			settings: { github: { dryRun: { enable: false } } },
			console: { warn: vi.fn() },
		});
		const prop = {
			owner: "owner",
			repo: "repo",
			branch: "main",
			workflowName: "ci.yml",
		} as Properties;
		await expect(publisher.workflowGestion(prop)).resolves.toBe(false);
		expect(publisher.console.warn).toHaveBeenCalled();
		expect(request).toHaveBeenCalledTimes(1);
	});
});
