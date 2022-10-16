import {GitHubPublisherSettings} from "../settings/interface";

/**
 * Given a series of `censor` entries in Settings, this will loop through each
 * then find and replace.
 */
export default function findAndReplaceText(text: string, settings: GitHubPublisherSettings): string {
	/*
	* Censor text using the settings
	 */
	if (!settings.censorText) {
		return text;
	}
	for (const censor of settings.censorText) {
		const regex = new RegExp(censor.entry, 'ig');
		// @ts-ignore
		text = text.replaceAll(regex, censor.replace);
	}
	return text;
}

