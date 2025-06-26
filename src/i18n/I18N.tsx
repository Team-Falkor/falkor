import type { i18n as i18next } from "i18next";
import {
	type ChangeEvent,
	createContext,
	type PropsWithChildren,
	useContext,
} from "react";
import { useTranslation } from "react-i18next";

interface LanguageContextProps {
	t: (key: string) => string;
	i18n: i18next;
	onClickLanguageChange: (e: ChangeEvent<HTMLSelectElement>) => void;
	languages: { [key: string]: { nativeName: string } };
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(
	undefined,
);

export const LanguageContextProvider = ({ children }: PropsWithChildren) => {
	const languages: { [key: string]: { nativeName: string } } = {
		"de-DE": { nativeName: "German" },
		"en-US": { nativeName: "English" },
		"es-ES": { nativeName: "Spanish" },
		"fr-FR": { nativeName: "French" },
		"hi-IN": { nativeName: "Hindi" },
		"id-ID": { nativeName: "Indonesian" },
		"it-IT": { nativeName: "Italian" },
		"ja-JP": { nativeName: "Japanese" },
		"ko-KR": { nativeName: "Korean" },
		"ms-MY": { nativeName: "Malaysian" },
		"pt-PT": { nativeName: "Portuguese" },
		"th-TH": { nativeName: "Thai" },
		"ur-PK": { nativeName: "Urdu" },
		"vi-VN": { nativeName: "Vietnamese" },
		"zh-CN": { nativeName: "Chinese Simplified" },
	};
	const { t, i18n } = useTranslation();

	const onClickLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
		const language = e.target.value;
		i18n.changeLanguage(language);
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
			"useLanguageContext must be used within a LanguageContextProvider",
		);
	}
	return context;
};
