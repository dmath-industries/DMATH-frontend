'use client';

import { useTranslation } from 'react-i18next';
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

  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        showAlert(t('common.error'), t('matrix.matrixEmpty'), 'error');
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
      showAlert(t('common.error'), t('matrix.matrixParseError'), 'error');
    }
  };

  return (
    <>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('algorithms.descriptions.bellmanFord.title')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t('algorithms.descriptions.bellmanFord.paragraph1'),
            }}
          />
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t('algorithms.descriptions.bellmanFord.paragraph2'),
            }}
          />
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t('algorithms.descriptions.bellmanFord.paragraph3'),
            }}
          />
          <MuiAlert severity="info" sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              dangerouslySetInnerHTML={{ __html: t('algorithms.descriptions.bellmanFord.tip') }}
            />
          </MuiAlert>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('algorithms.weightMatrixInput')}
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

export default function BellmanFordPage() {
  const { t } = useTranslation();
  return (
    <AlgorithmLayout algorithmName="bellman-ford" algorithmTitle={t('algorithms.bellmanFord')}>
      <BellmanFordContent />
    </AlgorithmLayout>
  );
}
