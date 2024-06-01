import { FIND_REGEX } from "@interfaces";
import { escapeRegex } from "src/conversion/links";
import type Enveloppe from "../main";

/**
 * Convert a string to a regex object when the string is in the form of a regex (enclosed by /)
 * @param toReplace {string} The string to be converted to a regex object
 * @param withflag {string} The flags to be used in the regex object. If not provided, the flags will be extracted from the string.
 * @returns RegExp The regex object
 */

export function createRegexFromText(toReplace: string, withflag?: string): RegExp {
	let flags = withflag;
	if (!withflag) {
		const flagsRegex = toReplace.match(/\/([gimy]+)$/);
		flags = flagsRegex ? Array.from(new Set(flagsRegex[1].split(""))).join("") : "";
	}
	return new RegExp(toReplace.replace(/\/(.+)\/.*/, "$1"), flags);
}

/**
 * Given a series of `censor` entries in Settings, this will loop through each
 * then find and replace.
 * @param {string} text The text to be censored.
 * @param {EnveloppeSettings} settings Settings
 * @param {boolean} after Whether to censor all or just the first match.
 * @returns {string} The censored text.
 */
export default function findAndReplaceText(
	text: string,
	plugin: Enveloppe,
	after?: boolean
): string {
	const settings = plugin.settings;
	if (!settings.conversion.censorText) {
		return text;
	}
	const censoring = after
		? settings.conversion.censorText.filter((censor) => censor.after)
		: settings.conversion.censorText.filter((censor) => !censor.after);
	for (const censor of censoring) {
		if (censor.entry.trim().length > 0) {
			const toReplace = censor.entry;
			const replaceWith = censor.replace;
			if (toReplace.match(FIND_REGEX)) {
				const regex = createRegexFromText(toReplace, censor.flags);
				text = censor.inCodeBlocks
					? text.replace(regex, replaceWith)
					: replaceText(text, regex, replaceWith, plugin);
			} else {
				text = censor.inCodeBlocks
					? text.replace(toReplace, replaceWith)
					: replaceText(text, toReplace, replaceWith, plugin);
			}
		}
	}
	return text;
}

/**
 * Replace the String.prototype.replace() function with a function that will not replace text in code blocks.
 * In `links` allow to exclude the replacement if the string is prepended by a backslash.
 * So, enable the replacing for all text that is **not** in a codeblocks.
 * @param fileContent {string} The entire file content
 * @param pattern {string | RegExp} The string or regex to be replaced
 * @param replaceWith {string} The string to replace with
 * @param links {boolean} Whether to exclude the replacement if the string is prepended by a backslash.
 * @returns {string} The file content with the replacements
 */
export function replaceText(
	fileContent: string,
	pattern: string | RegExp,
	replaceWith: string,
	plugin: Enveloppe,
	links?: boolean
): string {
	let regexWithString: string;
	let regex: RegExp;

	if (pattern instanceof RegExp) {
		regexWithString = "```[\\s\\S]*?```|`[^`]*`|";
		if (links) regexWithString += "\\\\?!?";
		regexWithString += pattern.source;
		regex = new RegExp(regexWithString, `g${pattern.flags.replace("g", "")}`);
	} else {
		regexWithString = "```[\\s\\S]*?```|`[^`]*`|\\\\?!?";
		if (links) regexWithString += "\\\\?!?";
		regexWithString += escapeRegex(pattern);
		regex = new RegExp(regexWithString, "g");
	}
	return fileContent.replace(regex, (match) => {
		if (match.match(/`[^`]*`/) || match.match(/```[\s\S]*?```/)) {
			return match;
		} else if (links && match.match(/^\\/)) {
			return match;
		} else {
			try {
				const replaceWithParsed = JSON.parse(`"${replaceWith}"`);
				return match.replace(pattern, replaceWithParsed);
			} catch (e) {
				plugin.console.logs({ e: true }, e);
				return match.replace(pattern, replaceWith);
			}
		}
	});
}
