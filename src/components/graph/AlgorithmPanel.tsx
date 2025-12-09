'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import {
  Box,
  Paper,
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
  const { playing } = useAppSelector((state) => state.steps);

  const algorithms = [
    { id: 'roberts-flores', name: 'Roberts-Flores (Гамильтоновы циклы)', available: true },
    { id: 'bfs', name: 'BFS (Поиск в ширину)', available: false },
    { id: 'dfs', name: 'DFS (Поиск в глубину)', available: false },
    { id: 'dijkstra', name: 'Dijkstra (Кратчайший путь)', available: false },
  ];

  const handleRun = () => {
    onRun(selectedAlgorithm, startNode || undefined);
  };

  const selectedAlgo = algorithms.find((a) => a.id === selectedAlgorithm);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: 'rgba(38, 38, 38, 0.5)',
        backdropFilter: 'blur(8px)',
        borderRadius: 4,
        border: '1px solid rgba(115, 115, 115, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SettingsIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Алгоритм
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth disabled={playing}>
          <InputLabel id="algorithm-select-label">Выберите алгоритм:</InputLabel>
          <Select
            labelId="algorithm-select-label"
            value={selectedAlgorithm}
            label="Выберите алгоритм:"
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            sx={{
              bgcolor: 'rgba(23, 23, 23, 0.8)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(115, 115, 115, 0.5)',
              },
            }}
          >
            {algorithms.map((algo) => (
              <MenuItem key={algo.id} value={algo.id} disabled={!algo.available}>
                {algo.name} {!algo.available && '(скоро)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedAlgo?.id === 'roberts-flores' && (
          <TextField
            label="Начальная вершина"
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            placeholder="0"
            disabled={playing}
            fullWidth
            sx={{
              bgcolor: 'rgba(23, 23, 23, 0.8)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(115, 115, 115, 0.5)',
              },
            }}
          />
        )}

        <Button
          variant="contained"
          color="success"
          onClick={handleRun}
          disabled={disabled || playing || !selectedAlgo?.available}
          startIcon={<Play size={20} fill="white" />}
          fullWidth
          sx={{
            py: 1.5,
            fontWeight: 500,
            textTransform: 'none',
          }}
        >
          Запустить алгоритм
        </Button>

        {selectedAlgo?.id === 'roberts-flores' && (
          <Alert
            severity="info"
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              '& .MuiAlert-icon': {
                color: 'rgba(147, 197, 253, 1)',
              },
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(147, 197, 253, 1)' }}>
              <strong>Roberts-Flores:</strong> Алгоритм поиска всех Гамильтоновых циклов в графе
              методом обратного отслеживания (backtracking).
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

