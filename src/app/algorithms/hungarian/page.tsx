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

const algorithmConfig = getAlgorithmConfig('hungarian');

function HungarianContent() {
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
            throw new Error(t('errors.invalidMatrixValue', { value: trimmed }));
          }
          return parsed;
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
      showAlert(t('common.error'), t('matrix.matrixParseError'), 'error');
    }
  };

  return (
    <>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('algorithms.descriptions.hungarian.title')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: t('algorithms.descriptions.hungarian.paragraph1') }}
          />
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: t('algorithms.descriptions.hungarian.paragraph2') }}
          />
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: t('algorithms.descriptions.hungarian.paragraph3') }}
          />
          <MuiAlert severity="info" sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              dangerouslySetInnerHTML={{ __html: t('algorithms.descriptions.hungarian.tip') }}
            />
          </MuiAlert>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('algorithms.costMatrixInput')}
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

export default function HungarianPage() {
  const { t } = useTranslation();
  return (
    <AlgorithmLayout algorithmName="hungarian" algorithmTitle={t('algorithms.hungarian')}>
      <HungarianContent />
    </AlgorithmLayout>
  );
}
