/**
 * Minimal stand-in for the "obsidian" package used by unit tests.
 * The real "obsidian" npm package only ships type declarations (no runtime
 * code) since the actual implementation lives inside the Obsidian app, so
 * anything that value-imports from "obsidian" needs a stub to load at all
 * outside of a running vault. Only what the tested modules actually touch
 * at import/runtime is implemented here - extend as more code gets covered.
 */
import * as Yaml from "yaml";

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

export interface FrontMatterInfo {
	exists: boolean;
	frontmatter: string;
	from: number;
	to: number;
	contentStart: number;
}

/**
 * Re-implementation of Obsidian's getFrontMatterInfo() (the real one isn't
 * public source). Behavior is inferred from its documented FrontMatterInfo
 * shape and from how src/conversion/index.ts consumes it: `frontmatter` is
 * the raw YAML body (no `---` delimiters, ready for parseYaml), while
 * `text.slice(from, contentStart)` must reproduce the YAML body *plus* the
 * closing `---` line, since callers re-add only the opening delimiter.
 */
export function getFrontMatterInfo(content: string): FrontMatterInfo {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) {
		return { exists: false, frontmatter: "", from: 0, to: 0, contentStart: 0 };
	}
	const from = match[0].indexOf("\n") + 1;
	const to = from + match[1].length;
	const contentStart = match[0].length;
	return { exists: true, frontmatter: match[1], from, to, contentStart };
}

/**
 * Obsidian's parseYaml/stringifyYaml wrap a YAML 1.2 parser; the "yaml"
 * package (already a transitive dependency of this project's tooling) is a
 * faithful enough stand-in for test purposes.
 */
export function parseYaml(yamlText: string): unknown {
	if (!yamlText || !yamlText.trim()) return {};
	return Yaml.parse(yamlText);
}

export function stringifyYaml(obj: unknown): string {
	return Yaml.stringify(obj);
}

/**
 * Re-implementation of Obsidian's parseFrontMatterTags(): reads the `tags`
 * (or singular `tag`) key, accepts either an array or a comma/newline
 * separated string, and normalizes every entry to a "#"-prefixed tag.
 */
export function parseFrontMatterTags(
	frontmatter: Record<string, unknown> | null | undefined
): string[] | null {
	if (!frontmatter) return null;
	const raw = frontmatter.tags ?? frontmatter.tag;
	if (!raw) return null;
	if (typeof raw !== "string" && !Array.isArray(raw)) return null;
	const list = Array.isArray(raw) ? raw : raw.split(/[,\n]/);
	const tags = list
		.map((t) => String(t).trim())
		.filter((t) => t.length > 0)
		.map((t) => (t.startsWith("#") ? t : `#${t}`));
	return tags.length > 0 ? tags : null;
}
