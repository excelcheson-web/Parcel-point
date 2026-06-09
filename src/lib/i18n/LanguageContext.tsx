'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, languages } from './translations';

interface LanguageContextType {
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dir: 'ltr' | 'rtl';
  currentLanguage: typeof languages[0];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'parcelpoint-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'EN';
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (stored && languages.find((l) => l.code === stored)) {
      return stored;
    }
    return 'EN';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentLang);
    // Update html lang and dir attributes
    const lang = languages.find((l) => l.code === currentLang);
    if (lang) {
      document.documentElement.lang = currentLang.toLowerCase();
      document.documentElement.dir = lang.dir || 'ltr';
    }
  }, [currentLang]);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLang(lang);
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];
  const dir = (currentLanguage.dir || 'ltr') as 'ltr' | 'rtl';

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, dir, currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
