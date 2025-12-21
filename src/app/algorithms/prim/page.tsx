'use client';

/**
 * Prim Algorithm Page
 * Страница визуализации алгоритма Прима
 */

import { Box, Paper, Typography, Alert as MuiAlert, Button } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { getAlgorithmConfig } from '@/algorithms';
import { Alert } from '@/components/elements';
import type { EdgeDTO, GraphDTO, NodeDTO } from '@/types';
import { AnalyticsEvents } from '@/shared/lib';
import { useState } from 'react';

const algorithmConfig = getAlgorithmConfig('prim');

function PrimContent() {
  const { loadGraph } = useAlgorithmLayout();
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'info' | 'warning' | 'error' | 'success';
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'error',
  });

  const showAlert = (
    title: string,
    message: string,
    variant: 'info' | 'warning' | 'error' | 'success' = 'error'
  ) => {
    setAlertState({ open: true, title, message, variant });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, open: false }));
  };

  /**
   * Построить граф из матрицы весов.
   * 0 или пустая ячейка означает отсутствие ребра.
   * Матрица должна быть симметричной для неориентированного графа.
   */
  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        AnalyticsEvents.matrixParseError('prim', 'empty');
        showAlert('Ошибка', 'Матрица пуста!', 'error');
        return;
      }

      const rows = matrixText
        .trim()
        .split('\n')
        .map(row => row.split(',').map(cell => cell.trim()));

      const size = rows.length;
      if (size === 0) {
        AnalyticsEvents.matrixParseError('prim', 'empty');
        showAlert('Ошибка', 'Матрица пуста!', 'error');
        return;
      }

      for (let i = 0; i < size; i++) {
        const row = rows[i];
        if (!row || row.length !== size) {
          AnalyticsEvents.matrixParseError('prim', 'not_square');
          showAlert('Ошибка', 'Матрица должна быть квадратной!', 'error');
          return;
        }
      }

      const weightMatrix: number[][] = rows.map(row =>
        row.map(cell => {
          if (cell === '') return 0;
          const value = Number(cell);
          return Number.isFinite(value) ? value : 0;
        })
      );

      const nodes: NodeDTO[] = [];
      const edges: EdgeDTO[] = [];

      const radius = 180;
      const centerX = 0;
      const centerY = 0;

      const nodeColor = '#3b82f6';
      const edgeColor = '#60a5fa';

      for (let i = 0; i < size; i++) {
        const angle = (i / size) * 2 * Math.PI - Math.PI / 2;
        nodes.push({
          id: String(i),
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          label: String.fromCharCode('a'.charCodeAt(0) + i),
          radius: 25,
          color: nodeColor,
          state: 'default',
        });
      }

      let edgeId = 0;
      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const weight = weightMatrix[i]?.[j] ?? 0;
          if (!weight || weight <= 0) {
            continue;
          }
          edges.push({
            id: `e${edgeId++}`,
            source: String(i),
            target: String(j),
            weight,
            directed: false,
            color: edgeColor,
            width: 2,
            state: 'default',
          });
        }
      }

      if (edges.length === 0) {
        AnalyticsEvents.matrixParseError('prim', 'no_edges');
        showAlert('Ошибка', 'Не найдено ни одного ребра. Заполните веса > 0.', 'error');
        return;
      }

      const graphDTO: GraphDTO = { nodes, edges };
      loadGraph(graphDTO);
    } catch (error) {
      console.error('Error parsing matrix:', error);
      AnalyticsEvents.matrixParseError('prim', 'invalid_format');
      showAlert('Ошибка', 'Ошибка при парсинге матрицы. Проверьте формат!', 'error');
    }
  };

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          О алгоритме
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            <strong>Алгоритм Прима</strong> строит минимальное остовное дерево, постепенно расширяя
            остов вершинами через ребро минимального веса.
          </Typography>
          <Typography variant="body2">
            Работает с неориентированным взвешенным графом без отрицательных весов.
          </Typography>
          <MuiAlert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: используйте симметричную матрицу с весами &gt; 0. Диагональ — 0.
            </Typography>
          </MuiAlert>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Ввод матрицы весов
        </Typography>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder={algorithmConfig?.placeholder}
          exampleMatrix={algorithmConfig?.defaultMatrix}
        />
      </Paper>

      <Alert
        open={alertState.open}
        onClose={closeAlert}
        title={alertState.title}
        variant={alertState.variant}
        actions={
          <Button
            onClick={closeAlert}
            variant="contained"
            sx={{
              textTransform: 'none',
              px: 4,
            }}
          >
            ОК
          </Button>
        }
      >
        {alertState.message}
      </Alert>
    </>
  );
}

export default function PrimPage() {
  return (
    <AlgorithmLayout algorithmName="prim" algorithmTitle="Алгоритм Прима">
      <PrimContent />
    </AlgorithmLayout>
  );
}
