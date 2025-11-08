'use client';

import { useState } from 'react';
import { Plus, Minus, Network } from 'lucide-react';

interface GraphEditorProps {
  onAddNode: (id: string, x: number, y: number) => void;
  onAddEdge: (source: string, target: string, weight?: number) => void;
  onClear: () => void;
  onLoadSample: () => void;
}

/**
 * Компонент панели редактирования графа
 */
export function GraphEditor({
  onAddNode,
  onAddEdge,
  onClear,
  onLoadSample,
}: GraphEditorProps) {
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');

  const handleAddNode = () => {
    if (nodeId.trim()) {
      const x = Math.random() * 400 - 200;
      const y = Math.random() * 300 - 150;
      onAddNode(nodeId.trim(), x, y);
      setNodeId('');
      setShowNodeDialog(false);
    }
  };

  const handleAddEdge = () => {
    if (edgeSource.trim() && edgeTarget.trim()) {
      const weight = parseFloat(edgeWeight) || 1;
      onAddEdge(edgeSource.trim(), edgeTarget.trim(), weight);
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeWeight('1');
      setShowEdgeDialog(false);
    }
  };

  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50 shadow-2xl space-y-4">
      <h3 className="text-lg font-semibold text-neutral-200">Редактор графа</h3>

      <div className="space-y-2">
        <button
          onClick={() => setShowNodeDialog(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить вершину
        </button>

        <button
          onClick={() => setShowEdgeDialog(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Network className="w-4 h-4" />
          Добавить ребро
        </button>

        <button
          onClick={onLoadSample}
          className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          Загрузить пример
        </button>

        <button
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <Minus className="w-4 h-4" />
          Очистить граф
        </button>
      </div>

      {showNodeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-96 shadow-2xl">
            <h4 className="text-lg font-semibold mb-4 text-neutral-200">Добавить вершину</h4>
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="ID вершины (0, 1, 2, ...)"
              className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNode}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Добавить
              </button>
              <button
                onClick={() => setShowNodeDialog(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdgeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-96 shadow-2xl">
            <h4 className="text-lg font-semibold mb-4 text-neutral-200">Добавить ребро</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={edgeSource}
                onChange={(e) => setEdgeSource(e.target.value)}
                placeholder="Из вершины"
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <input
                type="text"
                value={edgeTarget}
                onChange={(e) => setEdgeTarget(e.target.value)}
                placeholder="В вершину"
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                value={edgeWeight}
                onChange={(e) => setEdgeWeight(e.target.value)}
                placeholder="Вес (опционально)"
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddEdge}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Добавить
              </button>
              <button
                onClick={() => setShowEdgeDialog(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

