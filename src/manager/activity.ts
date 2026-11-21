export type TaskStatus = "queued" | "running" | "done" | "skipped" | "error";
export type OperationKind = "publish" | "delete" | "check";
export type EventAction = "push" | "delete";

export interface OperationItem {
	key: string;
	label: string;
	status: TaskStatus;
	message?: string;
}

export interface Operation {
	id: number;
	kind: OperationKind;
	/** owner/repo targeted by the operation */
	target: string;
	items: OperationItem[];
	status: "running" | "done" | "error";
	startedAt: number;
	endedAt?: number;
}

/** A single write on a repository (or in the dry-run folder), whatever the command */
export interface ActivityEvent {
	id: number;
	action: EventAction;
	path: string;
	target: string;
	status: "running" | "done" | "error";
	time: number;
	error?: string;
}

const MAX_EVENTS = 300;
const MAX_OPERATIONS = 20;

/**
 * Observable log of what Enveloppe is doing. Every mutation replaces the touched
 * arrays/objects so the view can compare snapshots by reference.
 */
export class ActivityLog {
	operations: Operation[] = [];
	events: ActivityEvent[] = [];
	private nextId = 1;
	private listeners = new Set<() => void>();

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private emit() {
		for (const listener of this.listeners) listener();
	}

	get running(): boolean {
		return (
			this.operations.some((op) => op.status === "running") ||
			this.events.some((event) => event.status === "running")
		);
	}

	startOperation(
		kind: OperationKind,
		target: string,
		items: { key: string; label: string }[]
	): number {
		const id = this.nextId++;
		const operation: Operation = {
			id,
			kind,
			target,
			items: items.map((item) => ({ ...item, status: "queued" })),
			status: "running",
			startedAt: Date.now(),
		};
		this.operations = [operation, ...this.operations].slice(0, MAX_OPERATIONS);
		this.emit();
		return id;
	}

	updateItem(id: number, key: string, status: TaskStatus, message?: string) {
		this.patchOperation(id, (op) => ({
			...op,
			items: op.items.map((item) =>
				item.key === key ? { ...item, status, message } : item
			),
		}));
	}

	endOperation(id: number, failed = false) {
		this.patchOperation(id, (op) => ({
			...op,
			// items never reached (validation failed, crash…) are not left "queued"
			items: op.items.map((item) =>
				item.status === "queued" || item.status === "running"
					? { ...item, status: failed ? "error" : "skipped" }
					: item
			),
			status: failed ? "error" : "done",
			endedAt: Date.now(),
		}));
	}

	private patchOperation(id: number, patch: (op: Operation) => Operation) {
		let found = false;
		this.operations = this.operations.map((op) => {
			if (op.id !== id) return op;
			found = true;
			return patch(op);
		});
		if (found) this.emit();
	}

	/** Record a write and return the callback closing it */
	startEvent(
		action: EventAction,
		path: string,
		target: string
	): (error?: unknown) => void {
		const id = this.nextId++;
		const event: ActivityEvent = {
			id,
			action,
			path,
			target,
			status: "running",
			time: Date.now(),
		};
		this.events = [event, ...this.events].slice(0, MAX_EVENTS);
		this.emit();
		return (error?: unknown) => {
			this.events = this.events.map((e) =>
				e.id === id
					? {
							...e,
							status: error ? "error" : "done",
							error: error ? errorMessage(error) : undefined,
						}
					: e
			);
			this.emit();
		};
	}

	async track<T>(
		action: EventAction,
		path: string,
		target: string,
		run: () => Promise<T>
	): Promise<T> {
		const end = this.startEvent(action, path, target);
		try {
			const result = await run();
			end();
			return result;
		} catch (e) {
			end(e);
			throw e;
		}
	}

	clear() {
		this.operations = this.operations.filter((op) => op.status === "running");
		this.events = this.events.filter((event) => event.status === "running");
		this.emit();
	}
}

export function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return typeof error === "string" ? error : JSON.stringify(error);
}
