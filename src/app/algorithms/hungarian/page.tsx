'use client';

import { Box, Paper, Typography, Alert as MuiAlert, Button } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { graphConfig } from '@/shared/lib/config';
import { getAlgorithmConfig } from '@/algorithms';
import { Alert } from '@/components/elements';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';
import { useState } from 'react';

const algorithmConfig = getAlgorithmConfig('hungarian');

function HungarianContent() {
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

      const rows = matrixText
        .trim()
        .split('\n')
        .filter(row => row.trim());
      const matrix = rows.map(row =>
        row.split(',').map(cell => {
          const trimmed = cell.trim();
          if (trimmed === '') return 0;
          const parsed = parseInt(trimmed, 10);
          if (isNaN(parsed)) {
            throw new Error(`Некорректное значение в матрице: "${trimmed}"`);
          }
          return parsed;
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

      const { nodeRadius, center, nodeSize, nodeColors, edgeColors, edgeWidth, angleRange } =
        graphConfig;

      for (let i = 0; i < nodeCount; i++) {
        const startAngle = -angleRange / 2;
        const angle = startAngle + (i / Math.max(1, nodeCount - 1)) * angleRange;
        nodes.push({
          id: `source_${i}`,
          x: center.x - nodeRadius * Math.cos(angle),
          y: center.y + nodeRadius * Math.sin(angle),
          label: `S${i + 1}`,
          radius: nodeSize.radius,
          color: nodeColors.default,
          state: 'default',
        });
      }

      for (let i = 0; i < nodeCount; i++) {
        const startAngle = -angleRange / 2;
        const angle = startAngle + (i / Math.max(1, nodeCount - 1)) * angleRange;
        nodes.push({
          id: `target_${i}`,
          x: center.x + nodeRadius * Math.cos(angle),
          y: center.y + nodeRadius * Math.sin(angle),
          label: `T${i + 1}`,
          radius: nodeSize.radius,
          color: nodeColors.target,
          state: 'default',
        });
      }

      let edgeId = 0;

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = 0; j < nodeCount; j++) {
          const weight = row[j];

          if (weight !== undefined && !isNaN(weight) && isFinite(weight)) {
            const sourceId = `source_${i}`;
            const targetId = `target_${j}`;

            const sourceExists = nodes.some(n => n.id === sourceId);
            const targetExists = nodes.some(n => n.id === targetId);

            if (sourceExists && targetExists) {
              edges.push({
                id: `e${edgeId++}`,
                source: sourceId,
                target: targetId,
                weight: weight,
                directed: true,
                color: edgeColors.default,
                width: edgeWidth,
                state: 'default',
              });
            }
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
          Ввод матрицы стоимостей
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
            <strong>Венгерский алгоритм</strong> — это алгоритм решения задачи о назначениях
            (assignment problem), которая заключается в нахождении оптимального назначения элементов
            одного множества элементам другого множества с минимальной общей стоимостью.
          </Typography>
          <Typography variant="body2">
            Алгоритм работает с квадратной матрицей стоимостей и находит такое назначение, при
            котором каждый элемент первого множества назначается ровно одному элементу второго
            множества, и общая стоимость минимальна.
          </Typography>
          <Typography variant="body2">
            Временная сложность: O(n³), где n — размер матрицы.
          </Typography>
          <MuiAlert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: Используйте квадратную матрицу стоимостей. Граф будет представлен как
              двудольный граф, где левая часть — источники, правая — цели.
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

export default function HungarianPage() {
  return (
    <AlgorithmLayout algorithmName="hungarian" algorithmTitle="Венгерский алгоритм">
      <HungarianContent />
    </AlgorithmLayout>
  );
}
