'use client';

/**
 * Ford-Bellman Algorithm Page
 * Страница визуализации алгоритма Форда-Беллмана
 */

import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

/**
 * Контент страницы алгоритма Форда-Беллмана
 */
function FordBellmanContent() {
  const { loadGraph } = useAlgorithmLayout();

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
      const matrix = rows.map(row => row.split(',').map(cell => {
        const trimmed = cell.trim();
        return trimmed === '' || trimmed === '0' ? 0 : parseInt(trimmed, 10);
      }));
      
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
          const weight = row[j];
          if (weight !== undefined && weight !== 0 && !isNaN(weight)) {
            if (i === j) {
              continue;
            }
            
            const hasReverse = matrix[j]?.[i] !== 0 && !isNaN(matrix[j]?.[i]);
            const reverseWeight = hasReverse ? matrix[j]?.[i] : undefined;
            const isUndirected = hasReverse && weight === reverseWeight;
            
            if (isUndirected && i > j) {
              continue;
            }
            
            edges.push({
              id: `e${edgeId++}`,
              source: String(i),
              target: String(j),
              weight: weight,
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

  return (
    <>
      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-neutral-700/50">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-200 mb-2 sm:mb-3">Ввод матрицы смежности</h3>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите матрицу смежности построчно. Используйте запятую как разделитель. 0 означает отсутствие ребра, число - вес ребра. Поддерживаются отрицательные веса."
        />
      </div>

      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-neutral-700/50">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-200 mb-2 sm:mb-3">О алгоритме</h3>
        <div className="text-xs sm:text-sm text-neutral-300 space-y-2 leading-relaxed">
          <p>
            <strong className="text-white">Алгоритм Форда-Беллмана</strong> — это алгоритм поиска кратчайших путей 
            от одной вершины до всех остальных в взвешенном ориентированном графе.
          </p>
          <p>
            Алгоритм работает с графами, которые могут содержать рёбра с отрицательными весами, 
            но не может обработать графы с отрицательными циклами.
          </p>
          <p>
            Временная сложность: O(V × E), где V — количество вершин, E — количество рёбер.
          </p>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-medium">
              💡 Совет: Используйте ориентированный граф с весами на рёбрах. Алгоритм находит кратчайшие пути от начальной вершины ко всем остальным.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-500/30">
        <h3 className="text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">Как использовать</h3>
        <ol className="text-xs sm:text-sm text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Введите матрицу смежности графа (числа — веса рёбер, 0 — отсутствие ребра)</li>
          <li>Нажмите "Отправить" чтобы построить граф</li>
          <li>Нажмите "Запустить" чтобы выполнить алгоритм</li>
          <li>Просмотрите результаты: кратчайшие расстояния и пути от начальной вершины</li>
        </ol>
      </div>
    </>
  );
}

/**
 * Страница алгоритма Форда-Беллмана
 */
export default function FordBellmanPage() {
  return (
    <AlgorithmLayout
      algorithmName="ford-bellman"
      algorithmTitle="Алгоритм Форда-Беллмана"
    >
      <FordBellmanContent />
    </AlgorithmLayout>
  );
}

