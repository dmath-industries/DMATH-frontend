'use client';

import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import type { GraphDTO, NodeDTO, EdgeDTO } from '@/types';

function HungarianContent() {
  const { loadGraph } = useAlgorithmLayout();

  const handleMatrixSubmit = (matrixText: string) => {
    try {
      if (!matrixText || !matrixText.trim()) {
        alert('Матрица пуста!');
        return;
      }

      const rows = matrixText.trim().split('\n');
      const matrix = rows.map(row =>
        row.split(',').map(cell => {
          const trimmed = cell.trim();
          return trimmed === '' ? 0 : parseInt(trimmed, 10);
        })
      );

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

      // TODO: create nodes and edges from matrix

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
        <h3 className="text-sm sm:text-base font-semibold text-neutral-200 mb-2 sm:mb-3">
          Ввод матрицы стоимостей
        </h3>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите квадратную матрицу стоимостей построчно. Используйте запятую как разделитель."
        />
      </div>
    </>
  );
}

export default function HungarianPage() {
  return (
    <AlgorithmLayout algorithmName="hungarian" algorithmTitle="Венгерский алгоритм">
      <HungarianContent />
    </AlgorithmLayout>
  );
}
