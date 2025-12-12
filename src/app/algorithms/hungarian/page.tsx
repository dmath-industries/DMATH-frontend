'use client';

import { AlgorithmLayout, useAlgorithmLayout } from '@/components/graph/AlgorithmLayout';
import { GraphMatrixInput } from '@/components/input';
import { graphConfig } from '@/shared/lib/config';
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

      const { nodeRadius, center, nodeSize, nodeColors, edgeColors, edgeWidth, angleRange } =
        graphConfig;

      for (let i = 0; i < nodeCount; i++) {
        const startAngle = -angleRange / 2;
        const angle = startAngle + (i / Math.max(1, nodeCount - 1)) * angleRange;
        nodes.push({
          id: `source_${i}`,
          x: center.x - nodeRadius * Math.cos(angle),
          y: center.y + nodeRadius * Math.sin(angle),
          label: `S${i + 1}`,
          radius: nodeSize.radius,
          color: nodeColors.default,
          state: 'default',
        });
      }

      for (let i = 0; i < nodeCount; i++) {
        const startAngle = -angleRange / 2;
        const angle = startAngle + (i / Math.max(1, nodeCount - 1)) * angleRange;
        nodes.push({
          id: `target_${i}`,
          x: center.x + nodeRadius * Math.cos(angle),
          y: center.y + nodeRadius * Math.sin(angle),
          label: `T${i + 1}`,
          radius: nodeSize.radius,
          color: nodeColors.target,
          state: 'default',
        });
      }

      let edgeId = 0;

      for (let i = 0; i < nodeCount; i++) {
        const row = matrix[i];
        if (!row) continue;
        for (let j = 0; j < nodeCount; j++) {
          const weight = row[j];
          if (
            i >= 0 &&
            i < nodeCount &&
            j >= 0 &&
            j < nodeCount &&
            weight !== undefined &&
            weight !== 0 &&
            !isNaN(weight) &&
            isFinite(weight)
          ) {
            const sourceId = `source_${i}`;
            const targetId = `target_${j}`;

            const sourceExists = nodes.some(n => n.id === sourceId);
            const targetExists = nodes.some(n => n.id === targetId);

            if (sourceExists && targetExists) {
              edges.push({
                id: `e${edgeId++}`,
                source: sourceId,
                target: targetId,
                weight: weight,
                directed: true,
                color: edgeColors.default,
                width: edgeWidth,
                state: 'default',
              });
            }
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
        <h3 className="text-sm sm:text-base font-semibold text-neutral-200 mb-2 sm:mb-3">
          Ввод матрицы стоимостей
        </h3>
        <GraphMatrixInput
          onSubmit={handleMatrixSubmit}
          placeholder="Введите квадратную матрицу стоимостей построчно. Используйте запятую как разделитель. Числа представляют стоимость назначения источника на цель."
          defaultValue={`3,4,0
1,0,2
1,3,5`}
        />
      </div>

      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-neutral-700/50">
        <h3 className="text-sm sm:text-base font-semibold text-neutral-200 mb-2 sm:mb-3">
          О алгоритме
        </h3>
        <div className="text-xs sm:text-sm text-neutral-300 space-y-2 leading-relaxed">
          <p>
            <strong className="text-white">Венгерский алгоритм</strong> — это алгоритм решения
            задачи о назначениях (assignment problem), которая заключается в нахождении оптимального
            назначения элементов одного множества элементам другого множества с минимальной общей
            стоимостью.
          </p>
          <p>
            Алгоритм работает с квадратной матрицей стоимостей и находит такое назначение, при
            котором каждый элемент первого множества назначается ровно одному элементу второго
            множества, и общая стоимость минимальна.
          </p>
          <p>Временная сложность: O(n³), где n — размер матрицы.</p>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-medium">
              💡 Совет: Используйте квадратную матрицу стоимостей. Граф будет представлен как
              двудольный граф, где левая часть — источники, правая — цели.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-500/30">
        <h3 className="text-sm sm:text-base font-semibold text-blue-200 mb-2 sm:mb-3">
          Как использовать
        </h3>
        <ol className="text-xs sm:text-sm text-neutral-300 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Введите квадратную матрицу стоимостей (числа — стоимости назначений)</li>
          <li>Нажмите "Отправить" чтобы построить двудольный граф</li>
          <li>Нажмите "Запустить" чтобы выполнить алгоритм</li>
          <li>Просмотрите результаты: оптимальное назначение и общая стоимость</li>
        </ol>
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
