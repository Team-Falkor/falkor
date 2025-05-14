import i18next, { type Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import German from "./translations/de-DE.json";
import English from "./translations/en-US.json";
import Spanish from "./translations/es-ES.json";
import French from "./translations/fr-FR.json";
import Hindi from "./translations/hi-IN.json";
import Indonesian from "./translations/id-ID.json";
import Italian from "./translations/it-IT.json";
import Japanese from "./translations/ja-JP.json";
import Korean from "./translations/ko-KR.json";
import Malay from "./translations/ms-MY.json";
import Portuguese from "./translations/pt-PT.json";
import Thai from "./translations/th-TH.json";
import Urdu from "./translations/ur-PK.json";
import Vietnamese from "./translations/vi-VN.json";
import ChineseSimplified from "./translations/zh-CN.json";

/**
 * Resources for i18n
 * Add all translation files here
 * Fallback language is English (en-US)
 */
const resources: Resource = {
	"en-US": { translation: English },
	"es-ES": { translation: Spanish },
	"fr-FR": { translation: French },
	"de-DE": { translation: German },
	"zh-CN": { translation: ChineseSimplified },
	"ja-JP": { translation: Japanese },
	"ko-KR": { translation: Korean },
	"vi-VN": { translation: Vietnamese },
	"th-TH": { translation: Thai },
	"id-ID": { translation: Indonesian },
	"ms-MY": { translation: Malay },
	"pt-PT": { translation: Portuguese },
	"it-IT": { translation: Italian },
	"hi-IN": { translation: Hindi },
	"ur-PK": { translation: Urdu },
};

i18next
	.use(initReactI18next)
	.use(LanguageDetector)
	.init({
		resources,
		fallbackLng: "en-US", // Fallback if language is not available
		interpolation: {
			escapeValue: true,
		},
	});

export default i18next;
