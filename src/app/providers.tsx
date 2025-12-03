'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '@/shared/store';
import { DatabaseProvider } from '@/shared/persistence';
import EmotionCacheProvider from './emotion-cache';

interface ProvidersProps {
  children: ReactNode;
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export function Providers({ children }: ProvidersProps) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      import('../../hawk.client.config');
      // Загружаем сохранённую тему из localStorage
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Предоставляем toggleTheme через контекст или window для доступа из Header
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).toggleTheme = toggleTheme;
      (window as any).themeMode = themeMode;
    }
  }, [themeMode]);

  const currentTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  if (!mounted) {
    return (
      <Provider store={store}>
        <EmotionCacheProvider>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <DatabaseProvider>{children}</DatabaseProvider>
          </ThemeProvider>
        </EmotionCacheProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <EmotionCacheProvider>
        <ThemeProvider theme={currentTheme}>
          <CssBaseline />
          <DatabaseProvider>{children}</DatabaseProvider>
        </ThemeProvider>
      </EmotionCacheProvider>
    </Provider>
  );
}