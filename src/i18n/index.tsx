import i18next, { Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

//Import all translation files
import ChineseSimplified from "./translations/chinese-simplified.json";
import English from "./translations/english.json";
import French from "./translations/french.json";
import German from "./translations/german.json";
import Hindi from "./translations/hindi.json";
import Indonesian from "./translations/indonesian.json";
import Italian from "./translations/italian.json";
import japanese from "./translations/japanese.json";
import Korean from "./translations/korean.json";
import Malay from "./translations/malay.json";
import Portuguese from "./translations/portuguese.json";
import Spanish from "./translations/spanish.json";
import Thai from "./translations/thai.json";
import Urdu from "./translations/urdu.json";
import Vietnamese from "./translations/vietnamese.json";

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
  ja: { translation: japanese },
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
