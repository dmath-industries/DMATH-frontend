'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/shared/store';
import { DatabaseProvider } from '@/shared/persistence';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('../../hawk.client.config');
    }
  }, []);

  return (
    <Provider store={store}>
      <DatabaseProvider>{children}</DatabaseProvider>
    </Provider>
  );
}