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
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only run on client side after hydration
    setIsHydrated(true);
    
    // Check localStorage for saved preference
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
    setLocale: (newLocale: string) => setLocale(newLocale as Locale),
    changeLanguage: (newLocale: string) => changeLanguage(newLocale as Locale),
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