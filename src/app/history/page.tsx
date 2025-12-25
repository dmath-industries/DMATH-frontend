'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { HistoryItem, Alert } from '@/components/elements';
import { sessionRepository } from '@/shared/persistence';
import type { Session } from '@/shared/persistence';
import { AnalyticsEvents } from '@/shared/lib';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Button,
} from '@mui/material';

const ALGORITHM_ROUTES: Record<string, string> = {
  'roberts-flores': '/algorithms/roberts-flores',
  'bellman-ford': '/algorithms/bellman-ford',
  prim: '/algorithms/prim',
  'graph-coloring': '/algorithms/graph-coloring',
  hungarian: '/algorithms/hungarian',
  'bron-kerbosch': '/algorithms/bron-kerbosch',
};

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const getAlgorithmTitle = (algorithmName: string): string => {
    const keyMap: Record<string, string> = {
      'roberts-flores': 'algorithms.robertsFlores',
      'bellman-ford': 'algorithms.bellmanFord',
      prim: 'algorithms.prim',
      'graph-coloring': 'algorithms.graphColoring',
      hungarian: 'algorithms.hungarian',
      'bron-kerbosch': 'algorithms.bronKerbosch',
    };
    return t(keyMap[algorithmName] || algorithmName);
  };
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    sessionId: string | null;
    algorithmName: string;
    date: string;
  }>({
    open: false,
    sessionId: null,
    algorithmName: '',
    date: '',
  });

  useEffect(() => {
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
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenSession = (session: Session) => {
    const route = ALGORITHM_ROUTES[session.algorithmName];

    if (route) {
      localStorage.setItem('loadSessionId', session.id);

      const sessionAgeDays = Math.floor((Date.now() - session.updatedAt) / (1000 * 60 * 60 * 24));
      AnalyticsEvents.sessionLoadedFromHistory(session.algorithmName, sessionAgeDays);

      router.push(route);
    } else {
      alert(t('errors.routeNotFound', { algorithm: session.algorithmName }));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    const algorithmTitle = getAlgorithmTitle(sessionToDelete.algorithmName);

    setDeleteDialog({
      open: true,
      sessionId,
      algorithmName: algorithmTitle,
      date: formatDate(sessionToDelete.updatedAt),
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.sessionId) return;

    try {
      const sessionToDelete = sessions.find(s => s.id === deleteDialog.sessionId);

      await sessionRepository.deleteSession(deleteDialog.sessionId);

      if (sessionToDelete) {
        AnalyticsEvents.sessionDeleted(sessionToDelete.algorithmName);
      }

      setSessions(prevSessions => prevSessions.filter(s => s.id !== deleteDialog.sessionId));

      setDeleteDialog({ open: false, sessionId: null, algorithmName: '', date: '' });
    } catch (error) {
      console.error('Failed to delete session:', error);
      setDeleteDialog({ open: false, sessionId: null, algorithmName: '', date: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, sessionId: null, algorithmName: '', date: '' });
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container
        maxWidth="lg"
        sx={{
          minHeight: '100vh',
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 4, sm: 6, lg: 8 },
          mt: { xs: 2, sm: 3, md: 4 },
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
            mb: 2,
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
            {t('common.backToHome')}
          </Typography>
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem' },
            mb: { xs: 2, sm: 3 },
            textAlign: { xs: 'center', sm: 'left' },
            ml: { xs: 0, sm: 4, md: 10 },
          }}
        >
          {t('history.title')}
        </Typography>

        <Paper
          sx={{
            backgroundColor: '#756565',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 3, md: 4 },
            px: { xs: 4, sm: 6, md: 8 },
            py: { xs: 3, sm: 4 },
            pb: { xs: 4, sm: 6, md: 8 },
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
              mb: { xs: 2, sm: 0 },
              color: '#ffffff',
            }}
          >
            {t('history.historyOfSolutions')}
          </Typography>

          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
              }}
            >
              <CircularProgress sx={{ mb: 2, color: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body1" sx={{ color: '#ffffff' }}>
                {t('history.loadingHistory')}
              </Typography>
            </Box>
          ) : sessions.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
              }}
            >
              <Paper
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  p: 4,
                  maxWidth: 448,
                  mx: 'auto',
                }}
              >
                <Typography variant="body1" sx={{ color: '#ffffff', mb: 2 }}>
                  {t('common.emptyHistory')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  {t('common.emptyHistoryDescription')}
                </Typography>
                <Box
                  component={Link}
                  href="/"
                  sx={{
                    display: 'inline-block',
                    mt: 2,
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
                  {t('common.goToAlgorithms')}
                </Box>
              </Paper>
            </Box>
          ) : (
            <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
              {sessions.map(session => {
                const nodeCount = session.graphDTO?.nodes?.length || 0;
                const edgeCount = session.graphDTO?.edges?.length || 0;
                const stepCount = session.metadata?.totalSteps || session.steps?.length || 0;

                return (
                  <Box key={session.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <HistoryItem
                      title={getAlgorithmTitle(session.algorithmName)}
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
                        label={`${t('common.vertices')}: ${nodeCount}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                      <Chip
                        label={`${t('common.edges')}: ${edgeCount}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                      <Chip
                        label={`${t('common.steps')}: ${stepCount}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                      {session.metadata?.executionTime && (
                        <Chip
                          label={`${t('common.time')}: ${Math.round(session.metadata.executionTime)}${t('common.ms')}`}
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

      <Alert
        open={deleteDialog.open}
        onClose={cancelDelete}
        title={t('history.deleteSession')}
        variant="warning"
        showIcon={false}
        showCloseButton={false}
        actions={
          <>
            <Button
              onClick={cancelDelete}
              variant="outlined"
              sx={{
                borderColor: 'rgba(115, 115, 115, 0.5)',
                color: 'text.primary',
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  borderColor: 'rgba(115, 115, 115, 0.8)',
                  backgroundColor: 'rgba(115, 115, 115, 0.1)',
                },
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              sx={{
                backgroundColor: '#f59e0b',
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  backgroundColor: '#f59e0b',
                  filter: 'brightness(1.1)',
                },
              }}
            >
              {t('common.ok')}
            </Button>
          </>
        }
      >
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t('history.deleteSessionConfirm', { name: deleteDialog.algorithmName })}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('common.date')}: {deleteDialog.date}
        </Typography>
      </Alert>
    </Box>
  );
}
