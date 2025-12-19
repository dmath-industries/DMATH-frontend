'use client';

import { Box, Paper, Typography, Alert as MuiAlert, Button } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { graphConfig } from '@/shared/lib/config';
import { getAlgorithmConfig } from '@/algorithms';
import { Alert } from '@/components/elements';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';
import { useState } from 'react';

const algorithmConfig = getAlgorithmConfig('bellman-ford');

function BellmanFordContent() {
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

  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        showAlert('Ошибка', 'Матрица пуста!', 'error');
        return;
      }

      const rows = matrixText.trim().split('\n');
      const matrix = rows.map(row =>
        row.split(',').map(cell => {
          const trimmed = cell.trim();
          if (trimmed === '' || trimmed === 'inf' || trimmed === '∞') {
            return Infinity;
          }
          return parseFloat(trimmed);
        })
      );

      const nodeCount = matrix.length;
      if (nodeCount === 0) {
        showAlert('Ошибка', 'Матрица пуста!', 'error');
        return;
      }

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row || row.length !== nodeCount) {
          showAlert('Ошибка', 'Матрица должна быть квадратной!', 'error');
          return;
        }
      }

      const nodes: NodeDTO[] = [];
      const edges: EdgeDTO[] = [];

      const { nodeRadius, center, nodeSize, nodeColors, edgeColors, edgeWidth } = graphConfig;

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
        nodes.push({
          id: String(i),
          x: center.x + nodeRadius * Math.cos(angle),
          y: center.y + nodeRadius * Math.sin(angle),
          label: String.fromCharCode('a'.charCodeAt(0) + i),
          radius: nodeSize.radius,
          color: nodeColors.default,
          state: 'default',
        });
      }

      let edgeId = 0;

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = 0; j < nodeCount; j++) {
          const weight = row[j];
          if (
            i !== j &&
            weight !== undefined &&
            !isNaN(weight) &&
            isFinite(weight) &&
            weight !== Infinity
          ) {
            edges.push({
              id: `e${edgeId++}`,
              source: String(i),
              target: String(j),
              weight: weight,
              directed: true,
              color: edgeColors.default,
              width: edgeWidth,
              state: 'default',
            });
          }
        }
      }

      const graphDTO: GraphDTO = { nodes, edges };
      loadGraph(graphDTO);
    } catch (error) {
      console.error('Error parsing matrix:', error);
      showAlert('Ошибка', 'Ошибка при парсинге матрицы. Проверьте формат!', 'error');
    }
  };

  return (
    <>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Ввод матрицы весов
        </Typography>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder={algorithmConfig?.placeholder}
          exampleMatrix={algorithmConfig?.defaultMatrix}
        />
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          О алгоритме
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            <strong>Алгоритм Форда-Беллмана</strong> — это алгоритм поиска кратчайших путей от одной
            вершины до всех остальных в ориентированном взвешенном графе. В отличие от алгоритма
            Дейкстры, он может работать с рёбрами отрицательного веса и обнаруживать отрицательные
            циклы.
          </Typography>
          <Typography variant="body2">
            Алгоритм выполняет V-1 итераций релаксации всех рёбер, где V — количество вершин. После
            этого выполняется дополнительная проверка на наличие отрицательных циклов.
          </Typography>
          <Typography variant="body2">
            Временная сложность: O(V × E), где V — количество вершин, E — количество рёбер.
          </Typography>
          <MuiAlert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: Используйте матрицу весов, где элемент [i][j] — вес ребра от вершины i к
              вершине j. Используйте 0 для отсутствия ребра или 'inf' для бесконечности.
            </Typography>
          </MuiAlert>
        </Box>
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

export default function BellmanFordPage() {
  return (
    <AlgorithmLayout algorithmName="bellman-ford" algorithmTitle="Алгоритм Форда-Беллмана">
      <BellmanFordContent />
    </AlgorithmLayout>
  );
}
