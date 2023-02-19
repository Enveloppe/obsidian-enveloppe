import {moment} from "obsidian";
import * as en from "./locales/en.json";
import * as fr from "./locales/fr.json";

export const ressources = {
	en: { translation: en },
	fr: { translation: fr },
} as const;

export const translationLanguage = Object.keys(ressources).find(i => i==moment.locale()) ? moment.locale() : "en";
