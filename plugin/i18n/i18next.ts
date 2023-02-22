import i18next from "i18next";
import {moment} from "obsidian";
import en from './locales/en.json';
import de from './locales/de.json';
//import fr from "./locales/fr.json";

//detect language
const locale = moment.locale();
export const translationLanguage = locale ? moment.locale() : "en";

console.log("Init i18next")

export const ressources = {
    en: { translation: en },
    de : { translation: de },
} as const;

i18next.init({
    lng: locale,
    fallbackLng: "en",
    resources: ressources,
});
