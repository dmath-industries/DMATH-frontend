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

      const radius = 180;
      const centerX = 0;
      const centerY = 0;

      const nodeColor = '#3b82f6';
      const edgeColor = '#60a5fa';

      for (let i = 0; i < nodeCount; i++) {
        const angleRange = Math.PI * 0.8;
        const startAngle = -angleRange / 2;
        const angle = startAngle + (i / Math.max(1, nodeCount - 1)) * angleRange;
        nodes.push({
          id: `source_${i}`,
          x: centerX - radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          label: `S${i + 1}`,
          radius: 25,
          color: nodeColor,
          state: 'default',
        });
      }

      for (let i = 0; i < nodeCount; i++) {
        const angleRange = Math.PI * 0.8;
        const startAngle = -angleRange / 2;
        const angle = startAngle + (i / Math.max(1, nodeCount - 1)) * angleRange;
        nodes.push({
          id: `target_${i}`,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          label: `T${i + 1}`,
          radius: 25,
          color: '#8b5cf6',
          state: 'default',
        });
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
