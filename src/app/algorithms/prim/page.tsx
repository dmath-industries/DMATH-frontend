'use client';

/**
 * Prim Algorithm Page
 * Страница визуализации алгоритма Прима
 */

import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import type { EdgeDTO, GraphDTO, NodeDTO } from '@/types';

function PrimContent() {
  const { loadGraph } = useAlgorithmLayout();

  /**
   * Построить граф из матрицы весов.
   * 0 или пустая ячейка означает отсутствие ребра.
   * Матрица должна быть симметричной для неориентированного графа.
   */
  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        alert('Матрица пуста!');
        return;
      }

      const rows = matrixText
        .trim()
        .split('\n')
        .map(row => row.split(',').map(cell => cell.trim()));

      const size = rows.length;
      if (size === 0) {
        alert('Матрица пуста!');
        return;
      }

      for (let i = 0; i < size; i++) {
        const row = rows[i];
        if (!row || row.length !== size) {
          alert('Матрица должна быть квадратной!');
          return;
        }
      }

      const weightMatrix: number[][] = rows.map(row =>
        row.map(cell => {
          if (cell === '') return 0;
          const value = Number(cell);
          return Number.isFinite(value) ? value : 0;
        })
      );

      const nodes: NodeDTO[] = [];
      const edges: EdgeDTO[] = [];

      const radius = 180;
      const centerX = 0;
      const centerY = 0;

      const nodeColor = '#3b82f6';
      const edgeColor = '#60a5fa';

      for (let i = 0; i < size; i++) {
        const angle = (i / size) * 2 * Math.PI - Math.PI / 2;
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
      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const weight = weightMatrix[i]?.[j] ?? 0;
          if (!weight || weight <= 0) {
            continue;
          }
          edges.push({
            id: `e${edgeId++}`,
            source: String(i),
            target: String(j),
            weight,
            directed: false,
            color: edgeColor,
            width: 2,
            state: 'default',
          });
        }
      }

      if (edges.length === 0) {
        alert('Не найдено ни одного ребра. Заполните веса > 0.');
        return;
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
        <h3 className="text-base font-semibold text-neutral-200 mb-3">Ввод матрицы весов</h3>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите симметричную матрицу весов (0 или пусто — нет ребра)"
        />
      </div>

      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50">
        <h3 className="text-base font-semibold text-neutral-200 mb-3">О алгоритме</h3>
        <div className="text-sm text-neutral-300 space-y-2 leading-relaxed">
          <p>
            <strong className="text-white">Алгоритм Прима</strong> строит минимальное остовное
            дерево, постепенно расширяя остов вершинами через ребро минимального веса.
          </p>
          <p>Работает с неориентированным взвешенным графом без отрицательных весов.</p>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-medium">
              💡 Совет: используйте симметричную матрицу с весами &gt; 0. Диагональ — 0.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-base font-semibold text-blue-200 mb-3">Как использовать</h3>
        <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Введите симметричную матрицу весов (0 — нет ребра)</li>
          <li>Нажмите «Отправить», чтобы построить граф</li>
          <li>Нажмите «Запустить», чтобы выполнить алгоритм Прима</li>
          <li>Шаги и подсветка появятся на холсте и в панели управления</li>
        </ol>
      </div>
    </>
  );
}

export default function PrimPage() {
  return (
    <AlgorithmLayout algorithmName="prim" algorithmTitle="Алгоритм Прима">
      <PrimContent />
    </AlgorithmLayout>
  );
}
