'use client';

import { Box, Paper, Typography, Alert } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { graphConfig } from '@/shared/lib/config';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

function HungarianContent() {
  const { loadGraph } = useAlgorithmLayout();

  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        alert('Матрица пуста!');
        return;
      }

      const rows = matrixText.trim().split('\n');
      const matrix = rows.map(row =>
        row.split(',').map(cell => {
          const trimmed = cell.trim();
          return trimmed === '' ? 0 : parseInt(trimmed, 10);
        })
      );

      const nodeCount = matrix.length;
      if (nodeCount === 0) {
        alert('Матрица пуста!');
        return;
      }

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row || row.length !== nodeCount) {
          alert('Матрица должна быть квадратной!');
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
          if (
            i >= 0 &&
            i < nodeCount &&
            j >= 0 &&
            j < nodeCount &&
            weight !== undefined &&
            weight !== 0 &&
            !isNaN(weight) &&
            isFinite(weight)
          ) {
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
      alert('Ошибка при парсинге матрицы. Проверьте формат!');
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
          placeholder="Введите квадратную матрицу стоимостей построчно. Используйте запятую как разделитель. Числа представляют стоимость назначения источника на цель."
          defaultValue={`3,4,0
1,0,2
1,3,5`}
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
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: Используйте квадратную матрицу стоимостей. Граф будет представлен как
              двудольный граф, где левая часть — источники, правая — цели.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          background:
            'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'info.light' }}>
          Как использовать
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography component="li" variant="body2">
            Введите квадратную матрицу стоимостей (числа — стоимости назначений)
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите "Отправить" чтобы построить двудольный граф
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите "Запустить" чтобы выполнить алгоритм
          </Typography>
          <Typography component="li" variant="body2">
            Просмотрите результаты: оптимальное назначение и общая стоимость
          </Typography>
        </Box>
      </Paper>
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
