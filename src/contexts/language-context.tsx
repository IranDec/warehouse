
// src/contexts/language-context.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import enTranslations from '@/locales/en.json';
import faTranslations from '@/locales/fa.json';

type Locale = 'en' | 'fa';
type Translations = Record<string, string>;
type TranslationFile = Record<string, Translations>;

interface LanguageContextType {
  language: Locale;
  setLanguage: (language: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: TranslationFile = {
  en: enTranslations,
  fa: faTranslations,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Locale>('en'); // Default to English

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage') as Locale | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fa')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    }
  }, [language]);


  const t = (key: string, params?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || translations.en;
    let translation = langTranslations[key] || key; // Fallback to key if translation not found

    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{{${paramKey}}}`, 'g');
        translation = translation.replace(regex, String(params[paramKey]));
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
