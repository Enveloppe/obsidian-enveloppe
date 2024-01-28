import { moment } from "obsidian";

import af from "./locales/af.json";
import ar from "./locales/ar.json";
import ca from "./locales/ca.json";
import cs from "./locales/cs.json";
import da from "./locales/da.json";
import de from "./locales/de.json";
import el from "./locales/el.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fi from "./locales/fi.json";
import fr from "./locales/fr.json";
import he from "./locales/he.json";
import it from "./locales/it.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import nl from "./locales/nl.json";
import no from "./locales/no.json";
import pl from "./locales/pl.json";
import pt from "./locales/pt.json";
import ptBR from "./locales/pt-BR.json";
import ro from "./locales/ro.json";
import ru from "./locales/ru.json";
import sr from "./locales/sr.json";
import sv from "./locales/sv.json";
import tr from "./locales/tr.json";
import uk from "./locales/uk.json";
import vi from "./locales/vi.json";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";

export const resources = {
	en: { translation: en },
	fr: { translation: fr },
	af: { translation: af },
	ar: { translation: ar },
	ca: { translation: ca },
	cs: { translation: cs },
	da: { translation: da },
	de: { translation: de },
	el: { translation: el },
	es: { translation: es },
	fi: { translation: fi },
	he: { translation: he },
	it: { translation: it },
	ja: { translation: ja },
	ko: { translation: ko },
	nl: { translation: nl },
	no: { translation: no },
	pl: { translation: pl },
	pt: { translation: pt },
	"pt-BR": { translation: ptBR },
	ru: { translation: ru },
	ro: { translation: ro },
	sr: { translation: sr },
	sv: { translation: sv },
	tr: { translation: tr },
	uk: { translation: uk },
	vi: { translation: vi },
	"zh-TW": { translation: zhTW },
	"zh-CN": { translation: zhCN },
} as const;

export const translationLanguage = Object.keys(resources).find(i => i.toLocaleLowerCase() == moment.locale()) ? moment.locale() : "en";
