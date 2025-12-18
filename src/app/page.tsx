'use client';

import { Box, Container, Typography, Button, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { AnalyticsEvents } from '@/shared/lib';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 12, sm: 14, md: 16, lg: 18 },
        pb: 4,
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3, md: '10%' },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem', lg: '1.75rem' },
            fontWeight: 400,
            mb: { xs: 1.5, sm: 2 },
            textAlign: { xs: 'center', sm: 'left' },
            lineHeight: 1.2,
          }}
        >
          Добро пожаловать в интерактивный учебный инструмент для изучения ключевых алгоритмов
          дискретной математики и сетей
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 600,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Здесь вы можете:
          </Typography>
          <Box
            component="ul"
            sx={{ pl: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              Запускать алгоритмы шаг за шагом
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              Видеть, как они работают — визуально и понятно
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              Анализировать каждый этап решения
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 600,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Что можно изучать:
          </Typography>
          <Box
            component="ul"
            sx={{ pl: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              <strong>Графы:</strong> обход в ширину (BFS), в глубину (DFS), алгоритм Дейкстры,
              минимальное остовное дерево
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              <strong>Транспортные задачи:</strong> метод минимальной стоимости, распределение
              ресурсов
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' } }}
            >
              <strong>Нейросети:</strong> распространение сигнала в простой нейронной сети (MLP) —
              без формул, но с пониманием процесса
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 2, sm: 2.5 },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Button
            component={Link}
            href="/algorithms"
            variant="contained"
            color="primary"
            size="large"
            onClick={() => AnalyticsEvents.navigateToAlgorithms()}
            sx={{
              px: { xs: 4, sm: 5 },
              py: { xs: 2, sm: 2.5 },
              fontSize: { xs: '1rem', sm: '1.125rem' },
            }}
          >
            Перейти к алгоритмам
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
