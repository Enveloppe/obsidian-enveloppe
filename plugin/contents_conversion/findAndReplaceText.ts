import {GitHubPublisherSettings} from "../settings/interface";

/**
 * Given a series of `censor` entries in Settings, this will loop through each
 * then find and replace.
 */
export default function findAndReplaceText(text: string, settings: GitHubPublisherSettings, after?: boolean): string {
	/*
	* Censor text using the settings
	 */
	if (!settings.censorText) {
		return text;
	}
	let censoring = settings.censorText.filter(censor => !censor.after);
	if (after) {
		censoring = settings.censorText.filter(censor => censor.after);
	}
	for (const censor of censoring) {
		if ((!censor.flags) || (!censor.flags.match(/^[gimsuy\s]+$/))) {
			censor.flags = '';
		}
		const regex = new RegExp(censor.entry, censor.flags);
		// @ts-ignore
		text = text.replaceAll(regex, censor.replace);
	}
	return text;
}

