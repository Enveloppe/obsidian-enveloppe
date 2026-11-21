import { ActivityLog } from "src/manager/activity";
import { describe, expect, it, vi } from "vitest";

describe("ActivityLog", () => {
	it("tracks an operation and closes the items never reached", () => {
		const log = new ActivityLog();
		const listener = vi.fn();
		log.subscribe(listener);
		const id = log.startOperation("publish", "me/site", [
			{ key: "a", label: "a.md" },
			{ key: "b", label: "b.md" },
		]);
		expect(log.running).toBe(true);
		log.updateItem(id, "a", "done");
		log.endOperation(id);
		const [op] = log.operations;
		expect(op.status).toBe("done");
		expect(op.items.map((item) => item.status)).toEqual(["done", "skipped"]);
		expect(log.running).toBe(false);
		expect(listener).toHaveBeenCalledTimes(3);
	});

	it("marks the unfinished items as errors when the operation fails", () => {
		const log = new ActivityLog();
		const id = log.startOperation("delete", "me/site", [{ key: "a", label: "a" }]);
		log.endOperation(id, true);
		expect(log.operations[0].items[0].status).toBe("error");
	});

	it("records writes and their failure", async () => {
		const log = new ActivityLog();
		await log.track("push", "docs/a.md", "me/site", async () => "ok");
		await expect(
			log.track("delete", "docs/b.md", "me/site", async () => {
				throw new Error("409");
			})
		).rejects.toThrow("409");
		expect(log.events.map((e) => [e.path, e.status, e.error])).toEqual([
			["docs/b.md", "error", "409"],
			["docs/a.md", "done", undefined],
		]);
	});

	it("clears only what is finished", () => {
		const log = new ActivityLog();
		log.startEvent("push", "running.md", "me/site");
		log.startEvent("push", "done.md", "me/site")();
		log.clear();
		expect(log.events.map((e) => e.path)).toEqual(["running.md"]);
	});
});
