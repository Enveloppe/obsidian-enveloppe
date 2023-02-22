import i18next from 'i18next';
import {moment} from "obsidian";
import en from './locales/en.json';
import de from './locales/de.json';
//import fr from "./locales/fr.json";

//detect language
const locale = moment.locale();
export const translationLanguage = locale ? moment.locale() : "en";

console.log("Init i18next")

const ressources = {
    en: { translation: en },
    de : { translation: de },
} as const;

declare module 'i18next' {
    interface CustomTypeOptions {
        readonly resources: typeof ressources.en;
        readonly returnNull: false
    }
}

i18next.use().init({
    lng:locale,
    fallbackLng: "en",
    resources: ressources,
});

console.log(i18next)