import { GitHubPublisherSettings } from "../settings/interface";
import { escapeRegex } from "./links";

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
 * @param {GitHubPublisherSettings} settings Settings
 * @param {boolean} after Whether to censor all or just the first match.
 * @returns {string} The censored text.
 */
export default function findAndReplaceText(
	text: string,
	settings: GitHubPublisherSettings,
	after?: boolean
): string {
	if (!settings.conversion.censorText) {
		return text;
	}
	const censoring = after ? settings.conversion.censorText.filter((censor) => censor.after) : settings.conversion.censorText.filter((censor) => !censor.after);
	for (const censor of censoring) {
		if (censor.entry.trim().length > 0) {
			const toReplace = censor.entry;
			const replaceWith = censor.replace;
			if (toReplace.match(/^\/.+\/[gimy]*$/)) {
				const regex = createRegexFromText(toReplace, censor.flags);
				text = replaceTextNotInCodeBlocks(text, regex, replaceWith);
			} else {
				text = replaceTextNotInCodeBlocks(text, toReplace, replaceWith);
			}
		}
	}
	return text;
}


export function replaceTextNotInCodeBlocks(text: string, toReplace: string | RegExp, replaceWith: string) {
	let regexWithString: string ;
	let regex: RegExp;
	if (toReplace instanceof RegExp) {
		regexWithString = "```[\\s\\S]*?```|`[^`]*`|" + toReplace.source;
		regex = new RegExp(regexWithString, `g${toReplace.flags}`);
	} else {
		regexWithString = "```[\\s\\S]*?```|`[^`]*`|" + escapeRegex(toReplace);
		regex = new RegExp(regexWithString, "g");
	}
	return text.replace(regex, (match) => {
		if (match.match(/`[^`]*`/)) {
			return match;
		} else if (match.match(/```[\s\S]*?```/)) {
			return match;
		} else {
			return match.replace(toReplace, replaceWith);
		}
	});
}


