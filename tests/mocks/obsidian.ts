/**
 * Minimal stand-in for the "obsidian" package used by unit tests.
 * The real "obsidian" npm package only ships type declarations (no runtime
 * code) since the actual implementation lives inside the Obsidian app, so
 * anything that value-imports from "obsidian" needs a stub to load at all
 * outside of a running vault. Only what the tested modules actually touch
 * at import/runtime is implemented here - extend as more code gets covered.
 */

// Obsidian's own runtime polyfills String.prototype.contains (used throughout
// the plugin) when the app loads; replicate that here since nothing else will.
declare global {
	interface String {
		contains(substring: string): boolean;
	}
}
if (!String.prototype.contains) {
	String.prototype.contains = function (this: string, substring: string): boolean {
		return this.includes(substring);
	};
}

export function normalizePath(path: string): string {
	let result = path.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
	if (result.length > 1 && result.startsWith("/")) result = result.slice(1);
	if (result.length > 1 && result.endsWith("/")) result = result.slice(0, -1);
	return result || "/";
}

export class TAbstractFile {
	path = "";
	name = "";
}

export class TFile extends TAbstractFile {
	basename = "";
	extension = "";
	stat = { mtime: 0, ctime: 0, size: 0 };
}

export class TFolder extends TAbstractFile {
	children: TAbstractFile[] = [];
}

export class Notice {
	constructor(_message?: unknown, _timeout?: number) {
		// no-op: tests don't assert on the UI notice itself
	}
}

export const Platform = {
	isMobile: false,
	isMobileApp: false,
	isDesktop: true,
	isDesktopApp: true,
};
