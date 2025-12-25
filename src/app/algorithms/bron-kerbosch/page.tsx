'use client';

/**
 * Bron-Kerbosch Algorithm Page
 * Страница визуализации алгоритма Брона-Кербоша
 */

import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Alert as MuiAlert, Button } from '@mui/material';
import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { getAlgorithmConfig } from '@/algorithms';
import { Alert } from '@/components/elements';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';
import { useState } from 'react';

const algorithmConfig = getAlgorithmConfig('bron-kerbosch');

/**
 * Контент страницы алгоритма Брона-Кербоша
 */
function BronKerboschContent() {
  const { t } = useTranslation();
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
   * Обработать ввод матрицы смежности и создать граф
   */
  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        showAlert(t('common.error'), t('matrix.matrixEmpty'), 'error');
        return;
      }

      const rows = matrixText.trim().split('\n');
      const matrix = rows.map(row => row.split(',').map(cell => parseInt(cell.trim(), 10)));

      const nodeCount = matrix.length;
      if (nodeCount === 0) {
        showAlert(t('common.error'), t('matrix.matrixEmpty'), 'error');
        return;
      }

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row || row.length !== nodeCount) {
          showAlert(t('common.error'), t('matrix.matrixMustBeSquare'), 'error');
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

      // Алгоритм Брона-Кербоша работает с неориентированными графами
      // Обрабатываем только верхний треугольник матрицы
      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = i + 1; j < nodeCount; j++) {
          if (row[j] === 1) {
            // Проверяем симметричность (для неориентированного графа)
            if (matrix[j]?.[i] !== 1) {
              showAlert(t('common.error'), t('errors.graphMustBeUndirected', { i, j }), 'error');
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
      showAlert(t('common.error'), t('matrix.matrixParseError'), 'error');
    }
  };

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('algorithms.descriptions.bronKerbosch.title')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t('algorithms.descriptions.bronKerbosch.paragraph1'),
            }}
          />
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t('algorithms.descriptions.bronKerbosch.paragraph2'),
            }}
          />
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t('algorithms.descriptions.bronKerbosch.paragraph3'),
            }}
          />
          <MuiAlert severity="info" sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              dangerouslySetInnerHTML={{ __html: t('algorithms.descriptions.bronKerbosch.tip') }}
            />
          </MuiAlert>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('algorithms.adjacencyMatrixInput')}
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
            {t('common.ok')}
          </Button>
        }
      >
        {alertState.message}
      </Alert>
    </>
  );
}

/**
 * Страница алгоритма Брона-Кербоша
 */
export default function BronKerboschPage() {
  const { t } = useTranslation();
  return (
    <AlgorithmLayout algorithmName="bron-kerbosch" algorithmTitle={t('algorithms.bronKerbosch')}>
      <BronKerboschContent />
    </AlgorithmLayout>
  );
}
