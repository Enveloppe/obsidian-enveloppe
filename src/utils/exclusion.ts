import { FIND_REGEX } from "@interfaces/constant";

/**
 * Compile a `/regex/flags` entry. Returns null for a plain path, throws if invalid.
 * Test it with `search` or `match`: `test` is stateful with the "g" and "y" flags.
 */
export function parseRegexEntry(entry: string): RegExp | null {
	const match = entry.trim().match(FIND_REGEX);
	if (!match?.[1]) return null;
	// "/docs/img" is a path: these flags are useless without any special character
	if (/[msuy]/.test(match[2]) && !/[\\^$.*+?()[\]{}|]/.test(match[1])) return null;
	return new RegExp(match[1], [...new Set(match[2])].join(""));
}

/** A path may be written with a leading slash */
export const includesPath = (path: string, part: string) =>
	path.includes(part) || `/${path}`.includes(part);

export function isValidExclusion(entry: string): boolean {
	try {
		parseRegexEntry(entry);
		return true;
	} catch {
		return false;
	}
}

/**
 * Build the check telling if a path is protected by the exclusion list.
 * If an entry is invalid, what it protects is unknown: every path is excluded.
 */
export function buildExclusion(
	entries: string[],
	onInvalid: (error: unknown) => void
): (path: string) => boolean {
	const rules: ((path: string) => boolean)[] = [];
	for (const entry of entries) {
		const literal = entry.trim();
		if (literal.length === 0) continue;
		try {
			const regex = parseRegexEntry(literal);
			rules.push(
				(path) => (!!regex && path.search(regex) >= 0) || includesPath(path, literal)
			);
		} catch (e) {
			onInvalid(e);
			return () => true;
		}
	}
	return (path) => rules.some((rule) => rule(path.trim()));
}

const openBrackets = (text: string) => {
	const unescaped = text.replace(/\\./g, "");
	const count = (chars: RegExp) => unescaped.match(chars)?.length ?? 0;
	return count(/[[({]/g) - count(/[\])}]/g);
};

/**
 * Split an entry of the old comma-separated format.
 * The commas of a regex (`/a{1,3}/`, `/a,b/`) are kept.
 */
export function splitLegacyEntry(entry: string): string[] {
	const isSingleRegex =
		FIND_REGEX.test(entry.trim()) &&
		!/(^|[^\\])\/[igmsuy]*\s*,/.test(entry.trim().slice(1));
	if (isSingleRegex) return [entry.trim()];
	const parts: string[] = [];
	let pending: string | null = null;
	for (const part of entry.split(/[,\n]/)) {
		const current: string = pending === null ? part : `${pending},${part}`;
		if (current.trim().startsWith("/") && openBrackets(current) > 0) {
			pending = current;
			continue;
		}
		pending = null;
		parts.push(current.trim());
	}
	// brackets never closed: splitting would break the entry
	if (pending !== null) return [entry.trim()];
	return parts.filter((part) => part.length > 0);
}
