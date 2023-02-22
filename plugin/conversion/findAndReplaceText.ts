import { GitHubPublisherSettings } from "../settings/interface";

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
		if (!censor.flags || !censor.flags.match(/^[gimsuy\s]+$/)) {
			censor.flags = "gi";
		}
		const regex = new RegExp(censor.entry, censor.flags);
		text = text.replaceAll(regex, censor.replace);
	}
	return text;
}
