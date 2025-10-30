'use client';

import { useEffect } from 'react';
import { initDatabase } from './db';

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    initDatabase().catch((err) => {
      console.warn('Database initialization failed. App will continue, but data persistence may be unavailable:', err);
    });
  }, []);

  return <>{children}</>;
}

