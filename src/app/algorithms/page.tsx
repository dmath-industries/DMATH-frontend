'use client';

/**
 * Algorithms List Page
 * Страница со списком доступных алгоритмов
 */

import { useEffect } from 'react';
import { Box, Container, GridLegacy as Grid } from '@mui/material';
import { AlgorithmsItem } from '@/components/elements';
import type { IAlgorithmsItem } from '@/types';

/**
 * Страница списка алгоритмов
 */
export default function AlgorithmsPage() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
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
    <Box
      sx={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 12, sm: 14, md: 16, lg: 18 },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Grid container spacing={{ xs: 3, md: 4, lg: 5 }} justifyContent="center">
          {algorithms.map((algorithm, index) => (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
              <AlgorithmsItem title={algorithm.title} img={algorithm.img} href={algorithm.href} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
