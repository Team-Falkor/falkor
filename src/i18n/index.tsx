import i18next, { type Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import German from "./translations/de.json";
import English from "./translations/en.json";
import Spanish from "./translations/es.json";
import French from "./translations/fr.json";
import Hindi from "./translations/hi.json";
import Indonesian from "./translations/id.json";
import Italian from "./translations/it.json";
import Japanese from "./translations/ja.json";
import Korean from "./translations/ko.json";
import Malay from "./translations/ms.json";
import Portuguese from "./translations/pt.json";
import Thai from "./translations/th.json";
import Urdu from "./translations/ur.json";
import Vietnamese from "./translations/vi.json";
//Import all translation files
import ChineseSimplified from "./translations/zh-CN.json";

/**
 * Resources for i18n
 * Add all translation files here
 * Fallback language is english
 */
const resources: Resource = {
	en: { translation: English },
	es: { translation: Spanish },
	fr: { translation: French },
	de: { translation: German },
	cn: { translation: ChineseSimplified },
	ja: { translation: Japanese },
	ko: { translation: Korean },
	vi: { translation: Vietnamese },
	th: { translation: Thai },
	id: { translation: Indonesian },
	ms: { translation: Malay },
	pt: { translation: Portuguese },
	it: { translation: Italian },
	hi: { translation: Hindi },
	ur: { translation: Urdu },
};

i18next
	.use(initReactI18next)
	.use(LanguageDetector)
	.init({
		resources,
		fallbackLng: "en", //Fallback if language is not available
		interpolation: {
			escapeValue: true,
		},
	});

export default i18next;
