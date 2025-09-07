'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTranslation, type Locale } from '@/lib/translations';
import { LanguageContextType } from '@/lib/types';

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  t: getTranslation('en'),
  setLocale: () => {},
  changeLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize with a consistent default that works for both server and client
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    // Check localStorage for saved preference (runs on client side after hydration)
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'zh-TW' || savedLocale === 'en')) {
      setLocale(savedLocale);
    } else {
      // Default to Chinese if no preference is saved
      setLocale('zh-TW');
    }
  }, []);

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const value = {
    locale,
    t: getTranslation(locale),
    setLocale: (newLocale: Locale) => setLocale(newLocale),
    changeLanguage: (newLocale: Locale) => changeLanguage(newLocale),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  return context;
}