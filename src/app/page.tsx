'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Container, GridLegacy as Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AlgorithmsItem } from '@/components/elements';
import { AnalyticsEvents } from '@/shared/lib';
import type { IAlgorithmsItem } from '@/types';

export default function Home() {
  const { t } = useTranslation();
  const pathname = usePathname();

  useEffect(() => {
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    const from =
      referrer.includes('/history') || pathname.includes('/history') ? 'history' : 'other';

    AnalyticsEvents.navigateToAlgorithms(from);
  }, [pathname]);

  const algorithms: IAlgorithmsItem[] = useMemo(
    () => [
      {
        title: t('algorithms.robertsFlores'),
        img: '/algorithms/1.jpg',
        href: '/algorithms/roberts-flores',
      },
      {
        title: t('algorithms.prim'),
        img: '/algorithms/2.jpg',
        href: '/algorithms/prim',
      },
      {
        title: t('algorithms.graphColoring'),
        img: '/algorithms/4.jpg',
        href: '/algorithms/graph-coloring',
      },
      {
        title: t('algorithms.bellmanFord'),
        img: '/algorithms/5.jpg',
        href: '/algorithms/bellman-ford',
      },
      {
        title: t('algorithms.hungarian'),
        img: '/algorithms/3.jpg',
        href: '/algorithms/hungarian',
      },
      {
        title: t('algorithms.bronKerbosch'),
        img: '/algorithms/6.jpg',
        href: '/algorithms/bron-kerbosch',
      },
    ],
    [t]
  );

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
        <Grid
          container
          spacing={{ xs: 4, md: 5, lg: 6 }}
          sx={{
            justifyContent: 'center',
          }}
        >
          {algorithms.map((algorithm, index) => (
            <Grid item xs={12} sm={6} lg={4} xl={4} key={index}>
              <AlgorithmsItem title={algorithm.title} img={algorithm.img} href={algorithm.href} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
