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
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAppSelector } from '@/shared/store';

interface AlgorithmPanelProps {
  onRun: (algorithm: string, startNode?: string) => void;
  disabled?: boolean;
}

/**
 * Компонент панели выбора и запуска алгоритма
 */
export function AlgorithmPanel({ onRun, disabled }: AlgorithmPanelProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('roberts-flores');
  const [startNode, setStartNode] = useState('0');
  const { playing } = useAppSelector(state => state.steps);

  const algorithms = [
    { id: 'roberts-flores', name: 'Roberts-Flores (Гамильтоновы циклы)', available: true },
    { id: 'bfs', name: 'BFS (Поиск в ширину)', available: false },
    { id: 'dfs', name: 'DFS (Поиск в глубину)', available: false },
    { id: 'dijkstra', name: 'Dijkstra (Кратчайший путь)', available: false },
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
          Алгоритм
        </Typography>
      </Box>

      <FormControl fullWidth>
        <InputLabel id="algorithm-select-label">Выберите алгоритм:</InputLabel>
        <Select
          labelId="algorithm-select-label"
          value={selectedAlgorithm}
          onChange={e => setSelectedAlgorithm(e.target.value)}
          label="Выберите алгоритм:"
          disabled={playing}
        >
          {algorithms.map(algo => (
            <MenuItem key={algo.id} value={algo.id} disabled={!algo.available}>
              {algo.name} {!algo.available && '(скоро)'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedAlgo?.id === 'roberts-flores' && (
        <TextField
          label="Начальная вершина:"
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
        Запустить алгоритм
      </Button>

      {selectedAlgo?.id === 'roberts-flores' && (
        <Alert severity="info" sx={{ bgcolor: 'info.dark', color: 'info.light' }}>
          <Typography variant="body2">
            <strong>Roberts-Flores:</strong> Алгоритм поиска всех Гамильтоновых циклов в графе
            методом обратного отслеживания (backtracking).
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}
