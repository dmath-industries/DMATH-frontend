'use client';

import { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAppSelector } from '@/shared/store';

interface AlgorithmPanelProps {
  onRun: (algorithm: string, startNode?: string) => void;
  disabled?: boolean;
}

export function AlgorithmPanel({ onRun, disabled }: AlgorithmPanelProps) {
  const { t } = useTranslation();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('roberts-flores');
  const [startNode, setStartNode] = useState('0');
  const { playing } = useAppSelector(state => state.steps);

  const algorithms = [
    { id: 'roberts-flores', name: t('algorithms.robertsFloresFull'), available: true },
    { id: 'bfs', name: t('algorithms.bfs'), available: false },
    { id: 'dfs', name: t('algorithms.dfs'), available: false },
    { id: 'dijkstra', name: t('algorithms.dijkstra'), available: false },
  ];

  const handleRun = () => {
    onRun(selectedAlgorithm, startNode || undefined);
  };

  const selectedAlgo = algorithms.find(a => a.id === selectedAlgorithm);

  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon sx={{ color: 'text.secondary' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('algorithms.algorithm')}
        </Typography>
      </Box>

      <FormControl fullWidth>
        <InputLabel id="algorithm-select-label">{t('algorithms.selectAlgorithm')}</InputLabel>
        <Select
          labelId="algorithm-select-label"
          value={selectedAlgorithm}
          onChange={e => setSelectedAlgorithm(e.target.value)}
          label={t('algorithms.selectAlgorithm')}
          disabled={playing}
        >
          {algorithms.map(algo => (
            <MenuItem key={algo.id} value={algo.id} disabled={!algo.available}>
              {algo.name} {!algo.available && `(${t('common.soon')})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedAlgo?.id === 'roberts-flores' && (
        <TextField
          label={t('algorithms.startNode')}
          value={startNode}
          onChange={e => setStartNode(e.target.value)}
          placeholder="0"
          disabled={playing}
          fullWidth
        />
      )}

      <Button
        variant="contained"
        onClick={handleRun}
        disabled={disabled || playing || !selectedAlgo?.available}
        startIcon={<PlayArrowIcon />}
        fullWidth
        sx={{
          bgcolor: 'success.main',
          '&:hover': {
            bgcolor: 'success.dark',
          },
          '&:disabled': {
            bgcolor: 'action.disabledBackground',
            color: 'action.disabled',
          },
        }}
      >
        {t('algorithms.runAlgorithm')}
      </Button>

      {selectedAlgo?.id === 'roberts-flores' && (
        <Alert severity="info" sx={{ bgcolor: 'info.dark', color: 'info.light' }}>
          <Typography variant="body2">
            <strong>Roberts-Flores:</strong> {t('algorithms.robertsFloresDescription')}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}
