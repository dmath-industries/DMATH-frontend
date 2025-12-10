'use client';

/**
 * History Page
 * Страница истории выполненных алгоритмов
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { HistoryItem } from '@/components/elements';
import { sessionRepository } from '@/shared/persistence';
import type { Session } from '@/shared/persistence';

/**
 * Маппинг имён алгоритмов на их URL маршруты
 */
const ALGORITHM_ROUTES: Record<string, string> = {
  'roberts-flores': '/algorithms/roberts-flores',
  'Roberts-Flores': '/algorithms/roberts-flores',
  'RobertsFlores': '/algorithms/roberts-flores',
  'bellman-ford': '/algorithms/bellman-ford',
  'Bellman-Ford': '/algorithms/bellman-ford',
  'ford-bellman': '/algorithms/bellman-ford',
  'Ford-Bellman': '/algorithms/bellman-ford',
};

/**
 * Страница истории решений
 */
export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем сессии из IndexedDB
    const loadSessions = async () => {
      try {
        const allSessions = await sessionRepository.getAllSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenSession = (session: Session) => {
    // Получаем маршрут для алгоритма
    const route = ALGORITHM_ROUTES[session.algorithmName];
    
    if (route) {
      // Сохраняем ID сессии в localStorage для загрузки на странице алгоритма
      localStorage.setItem('loadSessionId', session.id);
      router.push(route);
    } else {
      alert(`Не найден маршрут для алгоритма: ${session.algorithmName}`);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    const confirmMessage = sessionToDelete 
      ? `Вы уверены, что хотите удалить сессию "${sessionToDelete.algorithmName}"?\n\nДата: ${formatDate(sessionToDelete.updatedAt)}`
      : 'Вы уверены, что хотите удалить эту сессию?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await sessionRepository.deleteSession(sessionId);
      // Обновляем список сессий с плавным удалением
      setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
      
      // Показываем уведомление об успехе
      console.log('Session deleted successfully:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Ошибка при удалении сессии. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="App min-h-screen">
      <div className="min-h-screen py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8 container m-auto mt-4 sm:mt-6 md:mt-8 lg:mt-[10%]">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4 group ml-0 sm:ml-4 md:ml-10"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Назад на главную</span>
        </Link>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-6 text-center sm:text-left ml-0 sm:ml-4 md:ml-10">
          История решений
        </h1>

        <div className="bg-[#756565] flex flex-col gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 md:px-8 py-4 sm:py-6 rounded-xl pb-8 sm:pb-12 md:pb-[100px]">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-center sm:text-left ml-0 sm:ml-3 mb-4 sm:mb-0">
            История решений алгоритмов:
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-white text-lg">Загрузка истории...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/10 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-white text-lg mb-4">История пуста</p>
                <p className="text-gray-300 text-sm">
                  Запустите алгоритм, чтобы создать первую запись в истории решений.
                </p>
                <Link 
                  href="/algorithms" 
                  className="inline-block mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Перейти к алгоритмам
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {sessions.map((session) => {
                const nodeCount = session.graphDTO?.nodes?.length || 0;
                const edgeCount = session.graphDTO?.edges?.length || 0;
                const stepCount = session.metadata?.totalSteps || session.steps?.length || 0;
                
                return (
                  <div key={session.id} className="space-y-2">
                    <HistoryItem
                      title={session.algorithmName}
                      date={formatDate(session.updatedAt)}
                      onOpen={() => handleOpenSession(session)}
                      onDelete={() => handleDeleteSession(session.id)}
                    />
                    <div className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-300 flex flex-wrap gap-3 sm:gap-4">
                      <span>Вершин: {nodeCount}</span>
                      <span>Рёбер: {edgeCount}</span>
                      <span>Шагов: {stepCount}</span>
                      {session.metadata?.executionTime && (
                        <span>Время: {Math.round(session.metadata.executionTime)}мс</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
