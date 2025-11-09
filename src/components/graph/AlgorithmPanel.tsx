'use client';

import { useState } from 'react';
import { Play, Settings } from 'lucide-react';
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
    <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50 shadow-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-neutral-300" />
        <h3 className="text-lg font-semibold text-neutral-200">Алгоритм</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-300">
          Выберите алгоритм:
        </label>
        <select
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={playing}
        >
          {algorithms.map((algo) => (
            <option key={algo.id} value={algo.id} disabled={!algo.available}>
              {algo.name} {!algo.available && '(скоро)'}
            </option>
          ))}
        </select>
      </div>

      {selectedAlgo?.id === 'roberts-flores' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">
            Начальная вершина:
          </label>
          <input
            type="text"
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={playing}
          />
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={disabled || playing || !selectedAlgo?.available}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
      >
        <Play className="w-5 h-5" fill="white" />
        Запустить алгоритм
      </button>

      {selectedAlgo?.id === 'roberts-flores' && (
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <strong className="text-blue-200">Roberts-Flores:</strong> Алгоритм поиска всех Гамильтоновых циклов 
            в графе методом обратного отслеживания (backtracking).
          </p>
        </div>
      )}
    </div>
  );
}

