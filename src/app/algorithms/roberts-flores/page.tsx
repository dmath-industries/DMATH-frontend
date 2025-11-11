'use client';

/**
 * Roberts-Flores Algorithm Page
 * Страница визуализации алгоритма Робертса-Флореса
 */

import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

/**
 * Контент страницы алгоритма Робертса-Флореса
 */
function RobertsFloresContent() {
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
              continue;
            }
            
            const hasReverse = matrix[j]?.[i] === 1;
            const isUndirected = hasReverse;
            
            if (isUndirected && i > j) {
              continue;
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

  return (
    <>
      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-base font-semibold text-neutral-200 mb-3">Ввод матрицы смежности</h3>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите матрицу смежности построчно, используя запятую как разделитель между элементами"
        />
      </div>

      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-base font-semibold text-neutral-200 mb-3">О алгоритме</h3>
        <div className="text-sm text-neutral-300 space-y-2 leading-relaxed">
          <p>
            <strong className="text-white">Алгоритм Робертса-Флореса</strong> — это метод поиска всех 
            гамильтоновых циклов в графе с использованием обхода с возвратом (backtracking).
          </p>
          <p>
            Алгоритм систематически строит все возможные пути, начиная с начальной вершины, 
            и проверяет, образуют ли они гамильтонов цикл.
          </p>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-medium">
              💡 Совет: Для лучших результатов используйте связный граф с 4-7 вершинами.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-base font-semibold text-blue-200 mb-3">Как использовать</h3>
        <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Введите матрицу смежности графа (используйте запятые как разделители)</li>
          <li>Нажмите "Отправить" чтобы построить граф</li>
          <li>Нажмите "Запустить" чтобы выполнить алгоритм</li>
          <li>Просмотрите результаты в блоке ниже графа</li>
        </ol>
      </div>
    </>
  );
}

/**
 * Страница алгоритма Робертса-Флореса
 */
export default function RobertsFloresPage() {
  return (
    <AlgorithmLayout
      algorithmName="roberts-flores"
      algorithmTitle="Алгоритм Робертса-Флореса"
    >
      <RobertsFloresContent />
    </AlgorithmLayout>
  );
}