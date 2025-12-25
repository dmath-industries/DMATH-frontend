'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ru from './ru.json';

export const LANGUAGE_STORAGE_KEY = 'dmath-language';

function getInitialLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en';
  }
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
    return savedLanguage === 'en' || savedLanguage === 'ru' ? savedLanguage : 'en';
  } catch {
    return 'en';
  }
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: en,
      },
      ru: {
        translation: ru,
      },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export function initI18n() {
  if (typeof window === 'undefined' || !i18n.isInitialized) {
    return;
  }

  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
  const language = savedLanguage === 'en' || savedLanguage === 'ru' ? savedLanguage : 'en';

  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
}

export default i18n;
