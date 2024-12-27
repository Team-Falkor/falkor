import { type i18n as i18next } from "i18next";
import React, { createContext, PropsWithChildren, useContext } from "react";
import { useTranslation } from "react-i18next";

interface LanguageContextProps {
  t: (key: string) => string;
  i18n: i18next;
  onClickLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  languages: { [key: string]: { nativeName: string } };
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined
);

export const LanguageContextProvider = ({ children }: PropsWithChildren) => {
  const languages: { [key: string]: { nativeName: string } } = {
    en: { nativeName: "English" },
    es: { nativeName: "Spanish" },
    fr: { nativeName: "French" },
    de: { nativeName: "German" },
    cn: { nativeName: "Chinese Simplified" },
    ja: { nativeName: "japanese" },
    ko: { nativeName: "Korean" },
    vi: { nativeName: "Vietnamese" },
    th: { nativeName: "Thai" },
    id: { nativeName: "Indonesian" },
    ms: { nativeName: "Malaysian" },
    pt: { nativeName: "Portuguese" },
    it: { nativeName: "Italian" },
    hi: { nativeName: "Hindi" },
    ur: { nativeName: "Urdu" },
  };

  const { t, i18n } = useTranslation();

  const onClickLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    i18n.changeLanguage(language); // change the language
  };

  return (
    <LanguageContext.Provider
      value={{ t, i18n, onClickLanguageChange, languages }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      "useLanguageContext must be used within a LanguageContextProvider"
    );
  }
  return context;
};
