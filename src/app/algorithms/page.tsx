'use client';

/**
 * Algorithms List Page
 * Страница со списком доступных алгоритмов
 */

import { Box, Container, GridLegacy as Grid } from '@mui/material';
import { AlgorithmsItem } from '@/components/elements';
import type { IAlgorithmsItem } from '@/types';

/**
 * Страница списка алгоритмов
 */
export default function AlgorithmsPage() {
  const algorithms: IAlgorithmsItem[] = [
    {
      title: 'Алгоритм Робертса-Флореса',
      img: '',
      href: '/algorithms/roberts-flores',
    },
    {
      title: 'Алгоритм Прима',
      img: '',
      href: '/algorithms/prim',
    },
    {
      title: 'Алгоритм раскраски графа',
      img: '',
      href: '/algorithms/graph-coloring',
    },
    {
      title: 'Алгоритм Форда-Беллмана',
      img: '',
      href: '/algorithms/bellman-ford',
    },
    {
      title: 'Венгерский алгоритм',
      img: '',
      href: '/algorithms/hungarian',
    },
    {
      title: 'Алгоритм Брона-Кербоша',
      img: '',
      href: '/algorithms/bron-kerbosch',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 3, md: 5 },
          px: { xs: 2, sm: 3, lg: 4 },
          pb: 8,
        }}
      >
        <Grid container spacing={{ xs: 4, md: 5, lg: 6 }}>
          {algorithms.map((algorithm, index) => (
            <Grid item xs={12} sm={6} lg={3} xl={3} key={index}>
              <AlgorithmsItem title={algorithm.title} img={algorithm.img} href={algorithm.href} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
