'use client';

import { Box, Container, Typography, Button, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { AnalyticsEvents } from '@/shared/lib';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3, md: '10%' },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.25rem', lg: '3rem' },
            fontWeight: 400,
            mb: { xs: 2, sm: 3 },
            textAlign: { xs: 'center', sm: 'left' },
            lineHeight: 1.2,
          }}
        >
          Добро пожаловать в интерактивный учебный инструмент для изучения ключевых алгоритмов
          дискретной математики и сетей
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.875rem' },
              fontWeight: 600,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Здесь вы можете:
          </Typography>
          <Box
            component="ul"
            sx={{ pl: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              Запускать алгоритмы шаг за шагом
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              Видеть, как они работают — визуально и понятно
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              Анализировать каждый этап решения
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.875rem' },
              fontWeight: 600,
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Что можно изучать:
          </Typography>
          <Box
            component="ul"
            sx={{ pl: { xs: 3, sm: 5 }, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              <strong>Графы:</strong> обход в ширину (BFS), в глубину (DFS), алгоритм Дейкстры,
              минимальное остовное дерево
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              <strong>Транспортные задачи:</strong> метод минимальной стоимости, распределение
              ресурсов
            </Typography>
            <Typography
              component="li"
              variant="body1"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              <strong>Нейросети:</strong> распространение сигнала в простой нейронной сети (MLP) —
              без формул, но с пониманием процесса
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 3, sm: 4 },
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
