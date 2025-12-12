'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/shared/store';
import { DatabaseProvider } from '@/shared/persistence';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <DatabaseProvider>{children}</DatabaseProvider>
    </Provider>
  );
}
