'use client';

import { useState } from 'react';
import { Plus, Minus, Network } from 'lucide-react';
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

/**
 * Компонент панели редактирования графа
 */
export function GraphEditor({
  onAddNode,
  onAddEdge,
  onClear,
  useWeights = true,
}: GraphEditorProps) {
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
        direction="column"
        spacing={2}
        sx={{
          maxWidth: 250,
          mx: 'auto',
        }}
      >
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setShowNodeDialog(true)}
          title="Добавить вершину"
          fullWidth
        >
          Вершина
        </Button>

        <Button
          variant="contained"
          startIcon={<Network size={16} />}
          onClick={() => setShowEdgeDialog(true)}
          title="Добавить ребро"
          fullWidth
        >
          Ребро
        </Button>

        <Button
          variant="contained"
          color="error"
          startIcon={<Minus size={16} />}
          onClick={onClear}
          title="Очистить граф"
          fullWidth
        >
          Очистить
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
          Добавить вершину
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
            label="ID вершины"
            placeholder="0, 1, 2, ..."
            value={nodeId}
            onChange={e => setNodeId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNode()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNodeDialog(false)}>Отмена</Button>
          <Button onClick={handleAddNode} variant="contained">
            Добавить
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
          Добавить ребро
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
              label="Из вершины"
              value={edgeSource}
              onChange={e => setEdgeSource(e.target.value)}
            />
            <TextField
              fullWidth
              label="В вершину"
              value={edgeTarget}
              onChange={e => setEdgeTarget(e.target.value)}
            />
            {useWeights && (
              <TextField
                fullWidth
                type="number"
                label="Вес (опционально)"
                value={edgeWeight}
                onChange={e => setEdgeWeight(e.target.value)}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEdgeDialog(false)}>Отмена</Button>
          <Button onClick={handleAddEdge} variant="contained" color="success">
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
