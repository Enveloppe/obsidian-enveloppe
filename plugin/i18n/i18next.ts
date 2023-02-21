import i18next from 'i18next';
import {moment} from "obsidian";
import * as en from './locales/en.json';
import * as de from './locales/de.json';
//import fr from "./locales/fr.json";

//detect language
const locale = moment.locale();
export const translationLanguage = locale ? moment.locale() : "en";

console.log("Init i18next")

i18next.init({
    lng:locale,
    fallbackLng: "en",
    resources: {
        en: {
            translation: en,
        },
        de: {
            translation: de,
        }
    },
});

console.log(i18next)