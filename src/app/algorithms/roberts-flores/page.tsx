'use client';

/**
 * Roberts-Flores Algorithm Page
 * Страница визуализации алгоритма Робертса-Флореса
 */

import { Box, Paper, Typography, Alert } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

/**
 * Контент страницы алгоритма Робертса-Флореса
 */
function RobertsFloresContent() {
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

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = 0; j < nodeCount; j++) {
          if (row[j] === 1) {
            if (i === j) {
              continue;
            }

            const hasReverse = matrix[j]?.[i] === 1;
            const isUndirected = hasReverse;

            if (isUndirected && i > j) {
              continue;
            }

            edges.push({
              id: `e${edgeId++}`,
              source: String(i),
              target: String(j),
              weight: 1,
              directed: !isUndirected,
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
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Ввод матрицы смежности
        </Typography>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите матрицу смежности построчно, используя запятую как разделитель между элементами"
        />
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          О алгоритме
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">
            <strong>Алгоритм Робертса-Флореса</strong> — это метод поиска всех гамильтоновых циклов
            в графе с использованием обхода с возвратом (backtracking).
          </Typography>
          <Typography variant="body2">
            Алгоритм систематически строит все возможные пути, начиная с начальной вершины, и
            проверяет, образуют ли они гамильтонов цикл.
          </Typography>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Совет: Для лучших результатов используйте связный граф с 4-7 вершинами.
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
            Введите матрицу смежности графа (используйте запятые как разделители)
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите "Отправить" чтобы построить граф
          </Typography>
          <Typography component="li" variant="body2">
            Нажмите "Запустить" чтобы выполнить алгоритм
          </Typography>
          <Typography component="li" variant="body2">
            Просмотрите результаты в блоке ниже графа
          </Typography>
        </Box>
      </Paper>
    </>
  );
}

/**
 * Страница алгоритма Робертса-Флореса
 */
export default function RobertsFloresPage() {
  return (
    <AlgorithmLayout
      algorithmName="roberts-flores"
      algorithmTitle="Алгоритм Робертса-Флореса"
      graphDescription="Граф для поиска всех гамильтоновых циклов. Введите матрицу смежности для построения графа."
    >
      <RobertsFloresContent />
    </AlgorithmLayout>
  );
}
