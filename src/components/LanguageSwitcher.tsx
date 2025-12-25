'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup, Box } from '@mui/material';
import { LANGUAGE_STORAGE_KEY } from '@/i18n/i18n.client';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'ru') => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const currentLanguage = mounted ? i18n.language : 'en';

  if (!mounted) {
    return <Box sx={{ width: 128, height: 32 }} />;
  }

  return (
    <ButtonGroup variant="outlined" size="small">
      <Button
        onClick={() => handleLanguageChange('en')}
        variant={currentLanguage === 'en' ? 'contained' : 'outlined'}
        sx={{
          minWidth: 60,
          textTransform: 'none',
        }}
      >
        EN
      </Button>
      <Button
        onClick={() => handleLanguageChange('ru')}
        variant={currentLanguage === 'ru' ? 'contained' : 'outlined'}
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
