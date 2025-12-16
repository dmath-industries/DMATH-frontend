'use client';

/**
 * Prim Algorithm Page
 * Страница визуализации алгоритма Прима
 */

import { Box, Paper, Typography, Alert } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import type { EdgeDTO, GraphDTO, NodeDTO } from '@/types';
import { AnalyticsEvents } from '@/shared/lib';

function PrimContent() {
  const { loadGraph } = useAlgorithmLayout();

  /**
   * Построить граф из матрицы весов.
   * 0 или пустая ячейка означает отсутствие ребра.
   * Матрица должна быть симметричной для неориентированного графа.
   */
  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        AnalyticsEvents.matrixParseError('prim', 'empty');
        alert('Матрица пуста!');
        return;
      }

      const rows = matrixText
        .trim()
        .split('\n')
        .map(row => row.split(',').map(cell => cell.trim()));

      const size = rows.length;
      if (size === 0) {
        AnalyticsEvents.matrixParseError('prim', 'empty');
        alert('Матрица пуста!');
        return;
      }

      for (let i = 0; i < size; i++) {
        const row = rows[i];
        if (!row || row.length !== size) {
          AnalyticsEvents.matrixParseError('prim', 'not_square');
          alert('Матрица должна быть квадратной!');
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
        alert('Не найдено ни одного ребра. Заполните веса > 0.');
        return;
      }

      const graphDTO: GraphDTO = { nodes, edges };
      loadGraph(graphDTO);
    } catch (error) {
      console.error('Error parsing matrix:', error);
      AnalyticsEvents.matrixParseError('prim', 'invalid_format');
      alert('Ошибка при парсинге матрицы. Проверьте формат!');
    }
  };

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Ввод матрицы весов
        </Typography>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите симметричную матрицу весов (0 или пусто — нет ребра)"
        />
      </Paper>

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
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: используйте симметричную матрицу с весами &gt; 0. Диагональ — 0.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
          background:
            'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'info.light' }}>
          Как использовать
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography component="li" variant="body2">
            Введите симметричную матрицу весов (0 — нет ребра)
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите «Отправить», чтобы построить граф
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите «Запустить», чтобы выполнить алгоритм Прима
          </Typography>
          <Typography component="li" variant="body2">
            Шаги и подсветка появятся на холсте и в панели управления
          </Typography>
        </Box>
      </Paper>
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
