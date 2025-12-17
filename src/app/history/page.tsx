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
import { AnalyticsEvents } from '@/shared/lib';
import { Box, Container, Typography, Paper, CircularProgress, Stack, Chip } from '@mui/material';

/**
 * Маппинг имён алгоритмов на их URL маршруты
 */
const ALGORITHM_ROUTES: Record<string, string> = {
  'roberts-flores': '/algorithms/roberts-flores',
  'Roberts-Flores': '/algorithms/roberts-flores',
  RobertsFlores: '/algorithms/roberts-flores',
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
        AnalyticsEvents.historyPageViewed(allSessions.length);
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

      const sessionAgeDays = Math.floor((Date.now() - session.updatedAt) / (1000 * 60 * 60 * 24));
      AnalyticsEvents.sessionLoadedFromHistory(session.algorithmName, sessionAgeDays);

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

      if (sessionToDelete) {
        AnalyticsEvents.sessionDeleted(sessionToDelete.algorithmName);
      }

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
    <Box sx={{ minHeight: '100vh' }}>
      <Container
        maxWidth="lg"
        sx={{
          minHeight: '100vh',
          py: { xs: 4, sm: 6, md: 8 },
          px: { xs: 4, sm: 6, lg: 8 },
          mt: { xs: 4, sm: 6, md: 8, lg: '10%' },
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'text.secondary',
            textDecoration: 'none',
            mb: 4,
            ml: { xs: 0, sm: 4, md: 10 },
            transition: 'color 0.2s',
            '&:hover': {
              color: 'text.primary',
              '& svg': {
                transform: 'translateX(-4px)',
              },
            },
          }}
        >
          <ChevronLeft size={18} style={{ transition: 'transform 0.2s' }} />
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            Назад на главную
          </Typography>
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
            mb: { xs: 4, sm: 6 },
            textAlign: { xs: 'center', sm: 'left' },
            ml: { xs: 0, sm: 4, md: 10 },
          }}
        >
          История решений
        </Typography>

        <Paper
          sx={{
            backgroundColor: '#756565',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 4, sm: 6, md: 8 },
            px: { xs: 4, sm: 6, md: 8 },
            py: { xs: 4, sm: 6 },
            pb: { xs: 8, sm: 12, md: '100px' },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: {
                xs: '1.125rem',
                sm: '1.25rem',
                md: '1.5rem',
                lg: '1.875rem',
                xl: '2.25rem',
              },
              textAlign: { xs: 'center', sm: 'left' },
              ml: { xs: 0, sm: 3 },
              mb: { xs: 4, sm: 0 },
              color: '#ffffff',
            }}
          >
            История решений алгоритмов:
          </Typography>

          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 12,
              }}
            >
              <CircularProgress sx={{ mb: 4, color: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body1" sx={{ color: '#ffffff' }}>
                Загрузка истории...
              </Typography>
            </Box>
          ) : sessions.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 12,
              }}
            >
              <Paper
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  p: 8,
                  maxWidth: 448,
                  mx: 'auto',
                }}
              >
                <Typography variant="body1" sx={{ color: '#ffffff', mb: 4 }}>
                  История пуста
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                  Запустите алгоритм, чтобы создать первую запись в истории решений.
                </Typography>
                <Box
                  component={Link}
                  href="/algorithms"
                  sx={{
                    display: 'inline-block',
                    mt: 6,
                    px: 6,
                    py: 3,
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    textDecoration: 'none',
                    borderRadius: 2,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    },
                  }}
                >
                  Перейти к алгоритмам
                </Box>
              </Paper>
            </Box>
          ) : (
            <Stack spacing={{ xs: 4, sm: 6, md: 8 }}>
              {sessions.map(session => {
                const nodeCount = session.graphDTO?.nodes?.length || 0;
                const edgeCount = session.graphDTO?.edges?.length || 0;
                const stepCount = session.metadata?.totalSteps || session.steps?.length || 0;

                return (
                  <Box key={session.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <HistoryItem
                      title={session.algorithmName}
                      date={formatDate(session.updatedAt)}
                      onOpen={() => handleOpenSession(session)}
                      onDelete={() => handleDeleteSession(session.id)}
                    />
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        ml: { xs: 3, sm: 4 },
                        flexWrap: 'wrap',
                      }}
                    >
                      <Chip
                        label={`Вершин: ${nodeCount}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                      <Chip
                        label={`Рёбер: ${edgeCount}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                      <Chip
                        label={`Шагов: ${stepCount}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                      {session.metadata?.executionTime && (
                        <Chip
                          label={`Время: ${Math.round(session.metadata.executionTime)}мс`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
