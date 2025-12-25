'use client';

import { useState } from 'react';
import { Plus, Minus, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface GraphEditorProps {
  onAddNode: (id: string, x?: number, y?: number) => void;
  onAddEdge: (source: string, target: string, weight?: number) => void;
  onClear: () => void;
  useWeights?: boolean;
}

export function GraphEditor({
  onAddNode,
  onAddEdge,
  onClear,
  useWeights = true,
}: GraphEditorProps) {
  const { t } = useTranslation();
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');

  const handleAddNode = () => {
    if (nodeId.trim()) {
      onAddNode(nodeId.trim());
      setNodeId('');
      setShowNodeDialog(false);
    }
  };

  const handleAddEdge = () => {
    if (edgeSource.trim() && edgeTarget.trim()) {
      const weight = useWeights ? parseFloat(edgeWeight) || 1 : 1;
      onAddEdge(edgeSource.trim(), edgeTarget.trim(), weight);
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeWeight('1');
      setShowEdgeDialog(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          width: '100%',
          mx: 'auto',
        }}
        data-hint="graph-editor-buttons"
      >
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setShowNodeDialog(true)}
          title={t('graph.addVertex')}
          fullWidth
        >
          {t('common.vertex')}
        </Button>

        <Button
          variant="contained"
          startIcon={<Network size={16} />}
          onClick={() => setShowEdgeDialog(true)}
          title={t('graph.addEdge')}
          fullWidth
        >
          {t('common.edge')}
        </Button>

        <Button
          variant="contained"
          color="error"
          startIcon={<Minus size={16} />}
          onClick={onClear}
          title={t('graph.clearGraph')}
          fullWidth
        >
          {t('common.clear')}
        </Button>
      </Stack>

      <Dialog
        open={showNodeDialog}
        onClose={() => setShowNodeDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {t('graph.addVertex')}
          <IconButton
            aria-label="close"
            onClick={() => setShowNodeDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t('graph.vertexId')}
            placeholder={t('graph.vertexIdPlaceholder')}
            value={nodeId}
            onChange={e => setNodeId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNode()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNodeDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleAddNode} variant="contained">
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showEdgeDialog}
        onClose={() => setShowEdgeDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {t('graph.addEdge')}
          <IconButton
            aria-label="close"
            onClick={() => setShowEdgeDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label={t('graph.fromVertex')}
              value={edgeSource}
              onChange={e => setEdgeSource(e.target.value)}
            />
            <TextField
              fullWidth
              label={t('graph.toVertex')}
              value={edgeTarget}
              onChange={e => setEdgeTarget(e.target.value)}
            />
            {useWeights && (
              <TextField
                fullWidth
                type="number"
                label={t('graph.weight')}
                value={edgeWeight}
                onChange={e => setEdgeWeight(e.target.value)}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEdgeDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleAddEdge} variant="contained" color="success">
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
