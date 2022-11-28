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
		const regex = new RegExp(censor.entry, 'mig');
		// @ts-ignore
		text = text.replaceAll(regex, censor.replace);
	}
	return text;
}

