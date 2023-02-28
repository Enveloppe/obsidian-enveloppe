import { GitHubPublisherSettings } from "../settings/interface";


export function createRegexFromText(toReplace: string, withflag?: string): RegExp|null {
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
	let censoring = settings.conversion.censorText.filter((censor) => !censor.after);
	if (after) {
		censoring = settings.conversion.censorText.filter((censor) => censor.after);
	}
	for (const censor of censoring) {
		if (censor.entry.trim().length > 0) {
			const toReplace = censor.entry;
			const replaceWith = censor.replace;
			if (toReplace.match(/\/.+\//)) {
				const regex = createRegexFromText(toReplace, censor.flags);
				text = text.replace(regex, replaceWith);
			} else {
				text = text.replaceAll(toReplace, replaceWith);
			}
		}
	}
	return text;
}
