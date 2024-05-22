import { moment } from "obsidian";
import af from "src/i18n/locales/af.json";
import ar from "src/i18n/locales/ar.json";
import ca from "src/i18n/locales/ca.json";
import cs from "src/i18n/locales/cs.json";
import da from "src/i18n/locales/da.json";
import de from "src/i18n/locales/de.json";
import el from "src/i18n/locales/el.json";
import en from "src/i18n/locales/en.json";
import es from "src/i18n/locales/es.json";
import fi from "src/i18n/locales/fi.json";
import fr from "src/i18n/locales/fr.json";
import he from "src/i18n/locales/he.json";
import it from "src/i18n/locales/it.json";
import ja from "src/i18n/locales/ja.json";
import ko from "src/i18n/locales/ko.json";
import nl from "src/i18n/locales/nl.json";
import no from "src/i18n/locales/no.json";
import pl from "src/i18n/locales/pl.json";
import pt from "src/i18n/locales/pt.json";
import ptBr from "src/i18n/locales/pt-BR.json";
import ro from "src/i18n/locales/ro.json";
import ru from "src/i18n/locales/ru.json";
import sr from "src/i18n/locales/sr.json";
import sv from "src/i18n/locales/sv.json";
import tr from "src/i18n/locales/tr.json";
import uk from "src/i18n/locales/uk.json";
import vi from "src/i18n/locales/vi.json";
import zhCn from "src/i18n/locales/zh-CN.json";
import zhTw from "src/i18n/locales/zh-TW.json";

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
	"pt-BR": { translation: ptBr },
	ru: { translation: ru },
	ro: { translation: ro },
	sr: { translation: sr },
	sv: { translation: sv },
	tr: { translation: tr },
	uk: { translation: uk },
	vi: { translation: vi },
	"zh-TW": { translation: zhTw },
	"zh-CN": { translation: zhCn },
} as const;

export const translationLanguage = Object.keys(resources).find(
	(i) => i.toLocaleLowerCase() == moment.locale()
)
	? moment.locale()
	: "en";
