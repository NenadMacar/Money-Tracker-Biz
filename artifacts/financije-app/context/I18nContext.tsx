import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LANGUAGES, TRANSLATIONS, LangCode, Language, TranslationKeys } from "@/i18n/translations";

const LANG_KEY = "@pf_language";

interface I18nContextType {
  language: LangCode;
  locale: string;
  lang: Language;
  languages: Language[];
  t: (key: keyof TranslationKeys) => string;
  tf: (key: keyof TranslationKeys, ...args: string[]) => string;
  setLanguage: (code: LangCode) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LangCode>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(saved => {
      if (saved && LANGUAGES.find(l => l.code === saved)) {
        setLanguageState(saved as LangCode);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = useCallback((code: LangCode) => {
    setLanguageState(code);
    AsyncStorage.setItem(LANG_KEY, code).catch(() => {});
  }, []);

  const t = useCallback((key: keyof TranslationKeys): string => {
    return TRANSLATIONS[language][key] ?? TRANSLATIONS["en"][key] ?? key;
  }, [language]);

  const tf = useCallback((key: keyof TranslationKeys, ...args: string[]): string => {
    let str = TRANSLATIONS[language][key] ?? TRANSLATIONS["en"][key] ?? key;
    args.forEach(arg => { str = str.replace("%s", arg); });
    return str;
  }, [language]);

  const lang = LANGUAGES.find(l => l.code === language)!;

  return (
    <I18nContext.Provider value={{ language, locale: lang.locale, lang, languages: LANGUAGES, t, tf, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
