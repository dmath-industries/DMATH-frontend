'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '@/shared/store';
import { setTheme } from '@/shared/store/ui.slice';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { darkTheme, lightTheme, type ThemeMode } from '@/shared/lib/theme';
import { DatabaseProvider } from '@/shared/persistence';
import EmotionCacheProvider from './emotion-cache';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Внутренний компонент для синхронизации темы MUI с Redux store
 */
function ThemeSync({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.ui.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      import('../../hawk.client.config');
      // Загружаем сохранённую тему из localStorage и синхронизируем с Redux
      const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
      if (savedTheme && savedTheme !== themeMode) {
        dispatch(setTheme(savedTheme));
      } else if (!savedTheme) {
        // Если тема не сохранена, сохраняем текущую из Redux
        localStorage.setItem('theme', themeMode);
      }
    }
  }, [dispatch, themeMode]);

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('theme', themeMode);
    }
  }, [themeMode, mounted]);

  const currentTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  if (!mounted) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <EmotionCacheProvider>
        <ThemeSync>
          <DatabaseProvider>{children}</DatabaseProvider>
        </ThemeSync>
      </EmotionCacheProvider>
    </Provider>
  );
}