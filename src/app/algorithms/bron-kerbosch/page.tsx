'use client';

/**
 * Bron-Kerbosch Algorithm Page
 * Страница визуализации алгоритма Брона-Кербоша
 */

import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { GraphEditor } from '@/components/graph/GraphEditor';
import { useState } from 'react';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

/**
 * Контент страницы алгоритма Брона-Кербоша
 */
function BronKerboschContent() {
  const { loadGraph, addNode, addEdge, clearGraph, centerGraph, graphModel } = useAlgorithmLayout();
  const [inputMode, setInputMode] = useState<'matrix' | 'editor'>('editor');

  /**
   * Обработать ввод матрицы смежности и создать граф
   */
  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        alert('Матрица пуста!');
        return;
      }
      
      const rows = matrixText.trim().split('\n');
      const matrix = rows.map(row => row.split(',').map(cell => parseInt(cell.trim(), 10)));
      
      const nodeCount = matrix.length;
      if (nodeCount === 0) {
        alert('Матрица пуста!');
        return;
      }
      
      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row || row.length !== nodeCount) {
          alert('Матрица должна быть квадратной!');
          return;
        }
      }
      
      const nodes: NodeDTO[] = [];
      const edges: EdgeDTO[] = [];
      
      const radius = 180;
      const centerX = 0;
      const centerY = 0;
      
      const nodeColor = '#3b82f6'; // blue-500
      const edgeColor = '#60a5fa'; // blue-400
    
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
        nodes.push({
          id: String(i),
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          label: String.fromCharCode('a'.charCodeAt(0) + i), 
          radius: 25,
          color: nodeColor,
          state: 'default',
        });
      }
      
      let edgeId = 0;
      
      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = 0; j < nodeCount; j++) {
          if (row[j] === 1) {
            if (i === j) {
              continue; // Пропускаем петли
            }
            
            const hasReverse = matrix[j]?.[i] === 1;
            const isUndirected = hasReverse;
            
            if (isUndirected && i > j) {
              continue; // Для неориентированных графов добавляем только одно ребро
            }
            
            edges.push({
              id: `e${edgeId++}`,
              source: String(i),
              target: String(j),
              weight: 1,
              directed: !isUndirected,
              color: edgeColor,
              width: 2,
              state: 'default',
            });
          }
        }
      }
      
      const graphDTO: GraphDTO = { nodes, edges };
      loadGraph(graphDTO);
    } catch (error) {
      console.error('Error parsing matrix:', error);
      alert('Ошибка при парсинге матрицы. Проверьте формат!');
    }
  };

  const handleLoadSample = () => {
    // Пример графа для алгоритма Брона-Кербоша
    const sampleGraph: GraphDTO = {
      nodes: [
        { id: '0', x: -100, y: -100, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
        { id: '1', x: 100, y: -100, label: 'b', radius: 25, color: '#3b82f6', state: 'default' },
        { id: '2', x: 100, y: 100, label: 'c', radius: 25, color: '#3b82f6', state: 'default' },
        { id: '3', x: -100, y: 100, label: 'd', radius: 25, color: '#3b82f6', state: 'default' },
        { id: '4', x: 0, y: 0, label: 'e', radius: 25, color: '#3b82f6', state: 'default' },
      ],
      edges: [
        { id: '0-1', source: '0', target: '1', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
        { id: '1-2', source: '1', target: '2', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
        { id: '2-3', source: '2', target: '3', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
        { id: '3-0', source: '3', target: '0', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
        { id: '0-4', source: '0', target: '4', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
        { id: '2-4', source: '2', target: '4', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
      ],
    };
    // Загружаем граф с автоматическим центрированием (как кнопка "Найти граф")
    loadGraph(sampleGraph, false, true);
  };

  return (
    <>
      {/* Информация об алгоритме - сначала */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
          <h3 className="text-base font-semibold text-neutral-200 mb-3">О алгоритме</h3>
          <div className="text-sm text-neutral-300 space-y-2 leading-relaxed">
            <p>
              <strong className="text-white">Алгоритм Брона-Кербоша</strong> — это метод поиска всех 
              максимальных независимых множеств (МВУМ) в неориентированном графе.
            </p>
            <p>
              Алгоритм использует три множества: S (текущее множество), P (кандидаты) и M (исключенные).
              Он систематически строит все возможные независимые множества вершин.
            </p>
            <p>
              <strong>Независимое множество</strong> — это множество вершин, никакие две из которых не соединены ребром.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <h3 className="text-base font-semibold text-blue-200 mb-3">Как использовать</h3>
          <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Создайте неориентированный граф используя редактор или матрицу</li>
            <li>Нажмите "Запустить алгоритм" для выполнения</li>
            <li>Используйте панель управления для просмотра шагов</li>
            <li>Перетаскивайте вершины для лучшей визуализации</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-medium">
              💡 Совет: Алгоритм работает с неориентированными графами. Для лучших результатов используйте граф с 4-7 вершинами.
            </p>
          </div>
        </div>
      </div>

      {/* Редактор графа - перед визуализацией */}
      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-neutral-200">Создание графа</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('editor')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                inputMode === 'editor'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              ✏️ Редактор
            </button>
            <button
              onClick={() => setInputMode('matrix')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                inputMode === 'matrix'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              📊 Матрица
            </button>
          </div>
        </div>
        
        {inputMode === 'editor' ? (
          <GraphEditor
            onAddNode={addNode}
            onAddEdge={addEdge}
            onClear={clearGraph}
            onLoadSample={handleLoadSample}
            nodeCount={graphModel.nodeCount}
          />
        ) : (
          <GraphMatrixInput
            onSubmit={handleMatrixSubmit}
            placeholder="Введите матрицу смежности построчно, используя запятую как разделитель между элементами (для неориентированного графа)"
          />
        )}
      </div>
    </>
  );
}

/**
 * Страница алгоритма Брона-Кербоша
 */
export default function BronKerboschPage() {
  return (
    <AlgorithmLayout
      algorithmName="bron-kerbosch"
      algorithmTitle="Алгоритм Брона-Кербоша"
    >
      <BronKerboschContent />
    </AlgorithmLayout>
  );
}




