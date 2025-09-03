'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Button } from '@/app/components/ui/Button';
import { Icon } from '@/app/components/ui/Icon';

export function LanguageSwitcher() {
  const { locale, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <span>{currentLanguage?.flag}</span>
        <span className="hidden sm:inline">{currentLanguage?.name}</span>
        <Icon name="chevron-down" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 min-w-[160px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  changeLanguage(language.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors ${
                  locale === language.code 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {locale === language.code && (
                  <Icon name="check" className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}