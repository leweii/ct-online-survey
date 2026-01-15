"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, Language, TranslationKeys } from "@/lib/translations";

const LANGUAGE_KEY = "survey_language";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLanguage(): Language {
  // This runs on client only
  if (typeof window === "undefined") {
    return "zh";
  }

  // 1. Check localStorage
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === "en" || saved === "zh") {
    return saved;
  }

  // 2. Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("zh")) {
    return "zh";
  }

  // 3. Default to English for other languages
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on client side
  useEffect(() => {
    const initialLang = getInitialLanguage();
    setLanguageState(initialLang);
    setIsInitialized(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = translations[language] as TranslationKeys;

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return default values if used outside provider (during SSR)
    return {
      language: "zh" as Language,
      setLanguage: (() => {}) as (lang: Language) => void,
      t: translations.zh as TranslationKeys,
    };
  }
  return context;
}
