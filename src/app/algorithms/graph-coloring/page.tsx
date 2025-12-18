'use client';

/**
 * Graph Coloring Algorithm Page
 * Страница визуализации алгоритма раскраски графа
 */

import { Box, Paper, Typography, Alert } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { getAlgorithmConfig } from '@/algorithms';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

const algorithmConfig = getAlgorithmConfig('graph-coloring');

/**
 * Контент страницы алгоритма раскраски графа
 */
function GraphColoringContent() {
  const { loadGraph } = useAlgorithmLayout();

  /**
   * Обработать ввод матрицы смежности и создать граф
   */
  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        alert('Матрица пуста!');
        return;
      }

      const rows = matrixText.trim().split('\n');
      const matrix = rows.map(row => row.split(',').map(cell => parseInt(cell.trim(), 10)));

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

      const radius = 180;
      const centerX = 0;
      const centerY = 0;

      const nodeColor = '#3b82f6'; // blue-500
      const edgeColor = '#60a5fa'; // blue-400

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
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

      // Алгоритм раскраски работает с неориентированными графами
      // Обрабатываем только верхний треугольник матрицы
      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = i + 1; j < nodeCount; j++) {
          if (row[j] === 1) {
            // Проверяем симметричность (для неориентированного графа)
            if (matrix[j]?.[i] !== 1) {
              alert(
                `Граф должен быть неориентированным! Проверьте симметричность матрицы (элемент [${i}][${j}] и [${j}][${i}]).`
              );
              return;
            }

            edges.push({
              id: `e${edgeId++}`,
              source: String(i),
              target: String(j),
              weight: 1,
              directed: false, // Неориентированное ребро
              color: edgeColor,
              width: 2,
              state: 'default',
            });
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
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Ввод матрицы смежности
        </Typography>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder={algorithmConfig?.placeholder}
          exampleMatrix={algorithmConfig?.defaultMatrix}
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          О алгоритме
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            <strong>Алгоритм раскраски графа</strong> — это алгоритм для назначения цветов вершинам
            графа таким образом, чтобы никакие две смежные вершины не имели одинаковый цвет.
          </Typography>
          <Typography variant="body2">
            Реализован <strong>жадный алгоритм</strong> (Greedy Coloring), который проходит по
            вершинам и назначает каждой вершине минимальный доступный цвет (не используемый её
            соседями).
          </Typography>
          <Typography variant="body2">
            <strong>Хроматическое число</strong> графа — это минимальное количество цветов,
            необходимое для правильной раскраски. Жадный алгоритм не всегда находит оптимальное
            решение, но работает быстро.
          </Typography>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: Алгоритм работает с неориентированными графами. Матрица должна быть
              симметричной.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
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
            Введите симметричную матрицу смежности неориентированного графа
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите "Отправить" чтобы построить граф
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите "Запустить" чтобы выполнить алгоритм раскраски
          </Typography>
          <Typography component="li" variant="body2">
            Просмотрите процесс раскраски вершин пошагово
          </Typography>
          <Typography component="li" variant="body2">
            Обратите внимание на финальное количество использованных цветов
          </Typography>
          <Typography component="li" variant="body2">
            Используйте панель управления для пошагового просмотра алгоритма
          </Typography>
        </Box>
      </Paper>
    </>
  );
}

/**
 * Страница алгоритма раскраски графа
 */
export default function GraphColoringPage() {
  return (
    <AlgorithmLayout algorithmName="graph-coloring" algorithmTitle="Алгоритм раскраски графа">
      <GraphColoringContent />
    </AlgorithmLayout>
  );
}
