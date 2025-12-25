'use client';

import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup } from '@mui/material';
import { LANGUAGE_STORAGE_KEY } from '@/i18n/i18n.client';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: 'en' | 'ru') => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <ButtonGroup variant="outlined" size="small">
      <Button
        onClick={() => handleLanguageChange('en')}
        variant={i18n.language === 'en' ? 'contained' : 'outlined'}
        sx={{
          minWidth: 60,
          textTransform: 'none',
        }}
      >
        EN
      </Button>
      <Button
        onClick={() => handleLanguageChange('ru')}
        variant={i18n.language === 'ru' ? 'contained' : 'outlined'}
        sx={{
          minWidth: 60,
          textTransform: 'none',
        }}
      >
        RU
      </Button>
    </ButtonGroup>
  );
}
