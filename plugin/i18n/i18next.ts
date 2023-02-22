import {moment} from "obsidian";
import * as en from "./locales/en.json";
//import * as de from './locales/de.json';
//import * as fr from "./locales/fr.json";

//detect language
export const locale = moment.locale();
export const translationLanguage = locale ? moment.locale() : "en";

console.log("Init i18next");

export const ressources = {
	en: { translation: en },
	//de : { translation: de },
} as const;