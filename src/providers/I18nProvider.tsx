'use client';

import { I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';
import i18n, { initI18n } from '@/i18n/i18n.client';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initI18n();
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
