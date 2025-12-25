'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '@/shared/store';
import { DatabaseProvider } from '@/shared/persistence';
import { theme } from '@/shared/theme';
import { I18nProvider } from '@/providers';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nProvider>
          <DatabaseProvider>{children}</DatabaseProvider>
        </I18nProvider>
      </ThemeProvider>
    </Provider>
  );
}
