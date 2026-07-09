/**
 * Minimal stand-in for "obsidian-dataview" (aliased from
 * "@enveloppe/obsidian-dataview" via tsconfig paths). The real package's
 * runtime entrypoint calls `require("obsidian")` at import time, which has
 * no runtime implementation outside a running vault, so it can't load
 * as-is in tests. Nothing under test in this repo currently exercises an
 * actual dataview query, so a no-op API is enough to let the modules that
 * import it (dataview.ts, embeds.ts) load and run.
 */
export function getAPI(_app?: unknown): undefined {
	return undefined;
}

export class Link {
	path = "";
	subpath?: string;
	display?: string;
}
