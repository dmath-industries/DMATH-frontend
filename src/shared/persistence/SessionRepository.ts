import { db, Session, GraphSnapshot } from './db';
import { GraphDTO, Step } from '@/types';

export class SessionRepository {
  /**
   * Сохранить сессию
   */
  async saveSession(
    id: string,
    algorithmName: string,
    graphDTO: GraphDTO,
    steps: Step[],
    metadata?: Session['metadata']
  ): Promise<void> {
    const session: Session = {
      id,
      algorithmName,
      graphDTO,
      steps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        totalSteps: steps.length,
        ...metadata,
      },
    };

    await db.sessions.put(session);
  }

  /**
   * Загрузить сессию
   */
  async loadSession(id: string): Promise<Session | null> {
    return (await db.sessions.get(id)) || null;
  }

  /**
   * Получить все сессии
   */
  async getAllSessions(): Promise<Session[]> {
    return await db.sessions.orderBy('updatedAt').reverse().toArray();
  }

  /**
   * Получить сессии по алгоритму
   */
  async getSessionsByAlgorithm(algorithmName: string): Promise<Session[]> {
    return await db.sessions.where('algorithmName').equals(algorithmName).sortBy('updatedAt');
  }

  /**
   * Удалить сессию
   */
  async deleteSession(id: string): Promise<void> {
    await db.transaction('rw', db.sessions, db.graphs, async () => {
      await db.sessions.delete(id);
      await db.graphs.where('sessionId').equals(id).delete();
    });
  }

  /**
   * Сохранить чекпоинт графа
   */
  async saveCheckpoint(sessionId: string, at: number, snapshot: GraphDTO): Promise<void> {
    const checkpoint: GraphSnapshot = {
      id: `${sessionId}_${at}`,
      sessionId,
      at,
      snapshot,
      createdAt: Date.now(),
    };

    await db.graphs.put(checkpoint);
  }

  /**
   * Загрузить ближайший чекпоинт
   */
  async loadNearestCheckpoint(sessionId: string, index: number): Promise<GraphSnapshot | null> {
    const checkpoints = await db.graphs
      .where('sessionId')
      .equals(sessionId)
      .filter(cp => cp.at <= index)
      .sortBy('at');

    return checkpoints.length > 0 ? checkpoints[checkpoints.length - 1]! : null;
  }

  /**
   * Очистить все чекпоинты сессии
   */
  async clearCheckpoints(sessionId: string): Promise<void> {
    await db.graphs.where('sessionId').equals(sessionId).delete();
  }

  /**
   * Обновить метаданные сессии
   */
  async updateSessionMetadata(id: string, metadata: Partial<Session['metadata']>): Promise<void> {
    const session = await db.sessions.get(id);
    if (session) {
      await db.sessions.update(id, {
        updatedAt: Date.now(),
        metadata: {
          ...session.metadata,
          ...metadata,
        },
      });
    }
  }
}

export const sessionRepository = new SessionRepository();
