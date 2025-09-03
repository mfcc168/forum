import { zhTW } from '@/lib/translations/locales/zh-TW'
import { en } from '@/lib/translations/locales/en'

export const translations = {
  'zh-TW': zhTW,
  en: en,
} as const

export type Locale = 'zh-TW' | 'en'

export function getTranslation(locale: Locale) {
  return translations[locale] || translations['zh-TW']
}