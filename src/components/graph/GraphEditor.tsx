'use client';

import { useState } from 'react';
import { Plus, Minus, Network } from 'lucide-react';
import '@/styles/global.css';

interface GraphEditorProps {
  onAddNode: (id: string, x?: number, y?: number) => void;
  onAddEdge: (source: string, target: string, weight?: number) => void;
  onClear: () => void;
  onLoadSample?: () => void;
}

/**
 * Компонент панели редактирования графа
 */
export function GraphEditor({ onAddNode, onAddEdge, onClear, onLoadSample }: GraphEditorProps) {
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');

  const handleAddNode = () => {
    if (nodeId.trim()) {
      // Передаём undefined, чтобы позиция определялась в GraphContainer (центр viewport)
      onAddNode(nodeId.trim());
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
    <div className="p-3">
      <div className="flex items-center justify-center gap-2 flex-wrap max-w-[400px] mx-auto">
        <button
          onClick={() => setShowNodeDialog(true)}
          className="flex justify-center custom-btn btn-3 text-black transition"
          title="Добавить вершину"
        >
          <span>
            <Plus className="w-3.5 h-3.5" />
            Вершина
          </span>
        </button>

        <button
          onClick={() => setShowEdgeDialog(true)}
          className="flex justify-center custom-btn btn-3 text-black transition"
          title="Добавить ребро"
        >
          <span className="hidden sm:inline">
            <Network className="w-3.5 h-3.5" />
            Ребро
          </span>
        </button>

        {onLoadSample && (
          <button
            onClick={onLoadSample}
            className="flex justify-center custom-btn btn-3 text-black transition"
            title="Загрузить пример"
          >
            <span>Пример</span>
          </button>
        )}

        <button
          onClick={onClear}
          className="flex justify-center custom-btn btn-5 text-black transition"
          title="Очистить граф"
        >
          <span>
            <Minus className="w-3.5 h-3.5" />
            Очистить
          </span>
        </button>
      </div>

      {showNodeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-96 shadow-2xl">
            <h4 className="text-lg font-semibold mb-4 text-neutral-200">Добавить вершину</h4>
            <input
              type="text"
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              placeholder="ID вершины (0, 1, 2, ...)"
              className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddNode()}
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-96 shadow-2xl">
            <h4 className="text-lg font-semibold mb-4 text-neutral-200">Добавить ребро</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={edgeSource}
                onChange={e => setEdgeSource(e.target.value)}
                placeholder="Из вершины"
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <input
                type="text"
                value={edgeTarget}
                onChange={e => setEdgeTarget(e.target.value)}
                placeholder="В вершину"
                className="w-full px-3 py-2 border border-neutral-600 bg-neutral-900 text-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                value={edgeWeight}
                onChange={e => setEdgeWeight(e.target.value)}
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
