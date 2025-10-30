import Dexie, { Table } from 'dexie';
import { GraphDTO, Step } from '@/types';

export interface Session {
  id: string;
  algorithmName: string;
  graphDTO: GraphDTO;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    totalSteps: number;
    executionTime?: number;
    [key: string]: unknown;
  };
}

export interface GraphSnapshot {
  id: string;
  sessionId: string;
  at: number; // step index
  snapshot: GraphDTO;
  createdAt: number;
}

export interface Layout {
  id: string;
  sessionId: string;
  name: string;
  data: unknown;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
  updatedAt: number;
}

class DMathDB extends Dexie {
  sessions!: Table<Session, string>;
  graphs!: Table<GraphSnapshot, string>;
  layouts!: Table<Layout, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('DMathDB');
    
    this.version(1).stores({
      sessions: 'id, createdAt, updatedAt, algorithmName',
      graphs: 'id, sessionId, at, createdAt',
      layouts: 'id, sessionId, createdAt',
      settings: 'key, updatedAt',
    });
  }
}

export const db = new DMathDB();

export async function migrateDatabase(): Promise<void> {
}

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export async function initDatabase(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available in this environment');
  }

  try {
    if (db.isOpen()) {
      return;
    }

    await db.open();
    
    await migrateDatabase();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

