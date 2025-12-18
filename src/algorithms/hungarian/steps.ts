/**
 * Hungarian (Assignment) Algorithm — Step-based версия
 * Строит минимальное назначение для квадратной матрицы стоимостей.
 */

import Graph from 'graphology';
// eslint-disable-next-line boundaries/element-types
import { GraphModel } from '@/services/graph';
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import '@/services/explanations/registry'; // Инициализация реестра генераторов
import type {
  AlgorithmParams,
  ElementState,
  GraphDTO,
  HighlightEdgeStep,
  HighlightNodeStep,
  Step,
} from '@/types';

type Assignment = { rowId: string; colId: string; weight: number; edgeId?: string | null };

// formatNodeLabel будет использовать label узла из nodeLabels
// Если label нет, будет использоваться форматирование по умолчанию

/**
 * Реализация Венгерского алгоритма (минимизация).
 * Возвращает массив colIndex для каждой строки.
 */
export const hungarian = (costs: number[][]): number[] => {
  const n = costs.length;
  const m = costs[0]?.length ?? 0;
  if (n === 0 || m === 0 || n !== m) return [];

  const u = Array(n + 1).fill(0);
  const v = Array(n + 1).fill(0);
  const p = Array(n + 1).fill(0);
  const way = Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = Array(n + 1).fill(Infinity);
    const used = Array(n + 1).fill(false);

    let iterations = 0;
    const maxIterations = n * n; // Защита от зацикливания

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const rowIndex = i0 - 1;
        const colIndex = j - 1;
        if (rowIndex < 0 || colIndex < 0) continue;
        const row = costs[rowIndex];
        if (row === undefined) continue;
        const cell = row[colIndex];
        if (cell === undefined) continue;
        const cur = cell - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      // Защита от зацикливания: если delta остался Infinity, выходим
      if (delta === Infinity || iterations >= maxIterations) {
        break;
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
      iterations++;
    } while (p[j0] !== 0 && iterations < maxIterations);

    // augmenting
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = Array(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
};

export class HungarianStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private nodeOrder: string[] = [];
  private finalAssignments: Assignment[] = []; // Финальные назначения
  private edgeMap: Map<string, { weight: number; edgeId: string }> = new Map(); // Карта рёбер для быстрого поиска
  private nodeLabels: Map<string, string> = new Map(); // Карта ID -> label для форматирования

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

    // Сохраняем метки узлов для форматирования
    this.nodeLabels.clear();
    for (const node of graphDTO.nodes) {
      this.nodeLabels.set(node.id, node.label || node.id);
    }

    // Разделяем узлы из DTO на source и target
    const sourceNodes = graphDTO.nodes
      .filter(node => node.id.startsWith('source_'))
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('source_', ''), 10);
        const bNum = parseInt(b.id.replace('source_', ''), 10);
        return aNum - bNum;
      })
      .map(node => node.id);
    const targetNodes = graphDTO.nodes
      .filter(node => node.id.startsWith('target_'))
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('target_', ''), 10);
        const bNum = parseInt(b.id.replace('target_', ''), 10);
        return aNum - bNum;
      })
      .map(node => node.id);

    const n = sourceNodes.length;

    // Проверяем, что количество source и target узлов совпадает
    if (n === 0 || targetNodes.length !== n) {
      const firstNode = graphDTO.nodes[0];
      if (firstNode) {
        this.addHighlightNodeStep(
          firstNode.id,
          'rejected',
          `Граф должен содержать равное количество source и target узлов. Найдено: source=${sourceNodes.length}, target=${targetNodes.length}`
        );
      }
      return this.steps;
    }

    // Создаём карту рёбер для быстрого поиска
    this.edgeMap.clear();
    for (const edge of graphDTO.edges) {
      const key = `${edge.source}->${edge.target}`;
      this.edgeMap.set(key, { weight: edge.weight ?? 0, edgeId: edge.id });
    }

    // Проверяем, что есть рёбра
    if (this.edgeMap.size === 0) {
      const firstNode = sourceNodes[0];
      if (firstNode) {
        this.addHighlightNodeStep(
          firstNode,
          'rejected',
          `Граф не содержит рёбер. Проверьте, что матрица стоимостей содержит валидные значения.`
        );
      }
      return this.steps;
    }

    // Используем направленный граф для дальнейшей работы
    this.graphModel = new GraphModel(true);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    // Добавляем начальный информационный шаг
    const firstNode = sourceNodes[0];
    if (firstNode) {
      this.addHighlightNodeStep(
        firstNode,
        'current',
        `Начало: построение матрицы стоимостей размером ${n}×${n}`
      );
    }

    // Строим матрицу стоимостей: строки - source узлы, столбцы - target узлы
    const costMatrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(Number.POSITIVE_INFINITY)
    );

    for (let i = 0; i < n; i++) {
      const from = sourceNodes[i]!;
      const row = costMatrix[i]!;
      for (let j = 0; j < n; j++) {
        const to = targetNodes[j]!;
        const edgeKey = `${from}->${to}`;
        const edgeInfo = this.edgeMap.get(edgeKey);
        if (edgeInfo && Number.isFinite(edgeInfo.weight)) {
          row[j] = edgeInfo.weight;
        }
        // Если ребра нет, значение остается Infinity (это нормально для венгерского алгоритма)
      }
    }

    // Сохраняем порядок узлов для использования в назначениях
    this.nodeOrder = [...sourceNodes, ...targetNodes];

    // Проверяем, что в каждой строке есть хотя бы одно конечное значение
    // Для венгерского алгоритма это необходимо
    const hasFiniteRow = costMatrix.every(row => row.some(v => Number.isFinite(v)));
    if (!hasFiniteRow) {
      // Добавляем информационный шаг об ошибке с деталями
      const firstNode = sourceNodes[0];
      if (firstNode) {
        // Подсчитываем количество найденных рёбер для диагностики
        const edgeCount = this.edgeMap.size;

        this.addHighlightNodeStep(
          firstNode,
          'rejected',
          `Матрица стоимостей некорректна: в каждой строке должно быть хотя бы одно конечное значение. Найдено рёбер: ${edgeCount} из ${n * n} возможных. Проверьте, что для каждого источника есть хотя бы одно ребро к цели.`
        );
      }
      return this.steps;
    }

    let assignmentCols: number[];
    try {
      assignmentCols = hungarian(costMatrix);
    } catch (error) {
      // Обработка ошибок алгоритма
      const firstNode = this.nodeOrder[0];
      if (firstNode) {
        this.addHighlightNodeStep(
          firstNode,
          'rejected',
          `Ошибка при выполнении алгоритма: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      return this.steps;
    }

    // Проверяем, что алгоритм вернул результат правильной длины
    if (!assignmentCols || assignmentCols.length !== n) {
      // Добавляем информационный шаг об ошибке
      const firstNode = this.nodeOrder[0];
      if (firstNode) {
        this.addHighlightNodeStep(
          firstNode,
          'rejected',
          'Не удалось найти оптимальное назначение. Проверьте матрицу стоимостей.'
        );
      }
      return this.steps;
    }

    const assignments: Assignment[] = [];
    const sourceNodesList = this.nodeOrder
      .filter(id => id.startsWith('source_'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('source_', ''), 10);
        const bNum = parseInt(b.replace('source_', ''), 10);
        return aNum - bNum;
      });
    const targetNodesList = this.nodeOrder
      .filter(id => id.startsWith('target_'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('target_', ''), 10);
        const bNum = parseInt(b.replace('target_', ''), 10);
        return aNum - bNum;
      });

    for (let i = 0; i < n; i++) {
      const jValue = assignmentCols[i] ?? -1;
      if (jValue < 0 || jValue >= n) continue;
      const rowId = sourceNodesList[i]!;
      const colId = targetNodesList[jValue]!;
      const edgeKey = `${rowId}->${colId}`;
      const edgeInfo = this.edgeMap.get(edgeKey);
      const weight = costMatrix[i]?.[jValue];
      assignments.push({
        rowId,
        colId,
        weight: Number.isFinite(weight) ? (weight as number) : Infinity,
        edgeId: edgeInfo?.edgeId ?? null,
      });
    }

    // Если нет назначений, добавляем информационный шаг
    if (assignments.length === 0) {
      const firstNode = this.nodeOrder[0];
      if (firstNode) {
        this.addHighlightNodeStep(
          firstNode,
          'rejected',
          'Не удалось найти оптимальное назначение. Возможно, матрица стоимостей некорректна или не все строки имеют назначения.'
        );
      }
      // Добавляем итоговый ответ даже если нет назначений
      this.addFinalResultStep();
      return this.steps;
    }

    this.finalAssignments = assignments;
    this.emitAssignments(assignments);

    // Добавляем итоговый ответ на последнем шаге
    this.addFinalResultStep();

    return this.steps;
  }

  private formatNodeLabel(nodeId: string): string {
    // Используем label узла, если он есть, иначе используем ID
    return this.nodeLabels.get(nodeId) || nodeId;
  }

  private emitAssignments(assignments: Assignment[]): void {
    for (const { rowId, colId, weight, edgeId } of assignments) {
      const rowLabel = this.formatNodeLabel(rowId);
      const colLabel = this.formatNodeLabel(colId);

      this.addHighlightNodeStep(rowId, 'current', `Строка ${rowLabel}`);
      this.addHighlightNodeStep(colId, 'current', `Столбец ${colLabel}`);

      if (edgeId) {
        this.addHighlightEdgeStep(
          edgeId,
          'path',
          `Назначение ${rowLabel} → ${colLabel}, стоимость ${this.formatWeight(weight)}`
        );
      }

      this.addHighlightNodeStep(rowId, 'path');
      this.addHighlightNodeStep(colId, 'path');
    }
  }

  private getEdgeId(from: string, to: string): string | null {
    // Для направленного графа используем edge() метод
    if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) {
      return null;
    }

    try {
      const edgeKey = this.graph.edge(from, to);
      if (edgeKey !== undefined && edgeKey !== null) {
        return typeof edgeKey === 'string' ? edgeKey : String(edgeKey);
      }
    } catch (error) {
      // Если edge() не работает, пробуем найти через перебор исходящих рёбер
      try {
        const outEdges = this.graph.outEdges(from);
        for (const edgeId of outEdges) {
          const target = this.graph.target(edgeId);
          if (target === to) {
            return edgeId;
          }
        }
      } catch (e) {
        // Игнорируем ошибки
      }
    }
    return null;
  }

  private getEdgeWeight(edgeId: string): number {
    const attrs = this.graph.getEdgeAttributes(edgeId) ?? {};
    const rawWeight = (attrs as { weight?: unknown }).weight;
    const weight = typeof rawWeight === 'number' ? rawWeight : Number(rawWeight);
    return Number.isFinite(weight) ? weight : Number.POSITIVE_INFINITY;
  }

  private addHighlightNodeStep(nodeId: string, state: ElementState, description?: string): void {
    const step: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId,
      state,
      description,
    };

    // Получаем label узла для контекста
    const nodeLabel = this.formatNodeLabel(nodeId);
    const algorithmContext: AlgorithmContext = {
      nodeLabel: nodeLabel,
    };

    // Генерируем пояснение
    const explanation = explanationGeneratorRegistry.generate(step, 'hungarian', algorithmContext);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private addHighlightEdgeStep(edgeId: string, state: ElementState, description?: string): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description,
    };

    // Получаем информацию о ребре для контекста
    const from = this.graph.source(edgeId);
    const to = this.graph.target(edgeId);
    const weight = this.getEdgeWeight(edgeId);
    const fromLabel = this.formatNodeLabel(from);
    const toLabel = this.formatNodeLabel(to);
    const algorithmContext: AlgorithmContext = {
      edgeFrom: from,
      edgeTo: to,
      edgeFromLabel: fromLabel,
      edgeToLabel: toLabel,
      cost: Number.isFinite(weight) ? weight : undefined,
    };

    // Генерируем пояснение
    const explanation = explanationGeneratorRegistry.generate(step, 'hungarian', algorithmContext);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private formatWeight(weight: number): string {
    return Number.isFinite(weight) ? weight.toString() : '∞';
  }

  /**
   * Добавляет итоговый ответ алгоритма на последнем шаге
   */
  private addFinalResultStep(): void {
    const items: Array<{ label: string; value: string }> = [];
    let totalWeight = 0;

    if (this.finalAssignments.length === 0) {
      items.push({
        label: 'Результат',
        value: 'Оптимальное назначение не найдено',
      });
    } else {
      this.finalAssignments.forEach((assignment, index) => {
        const rowLabel = this.formatNodeLabel(assignment.rowId);
        const colLabel = this.formatNodeLabel(assignment.colId);
        const weight = assignment.weight;
        items.push({
          label: `Назначение ${index + 1}`,
          value: `${rowLabel} → ${colLabel} (стоимость: ${weight})`,
        });
        if (Number.isFinite(weight)) {
          totalWeight += weight;
        }
      });
    }

    // Добавляем итоговый ответ к последнему шагу с explanation
    // Если нет шагов с explanation, создаем его для последнего шага
    let lastStepWithExplanation = null;
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      if (step && step.explanation) {
        lastStepWithExplanation = step;
        break;
      }
    }

    // Если нашли шаг с explanation, добавляем итоговый ответ
    if (lastStepWithExplanation && lastStepWithExplanation.explanation) {
      lastStepWithExplanation.explanation.finalResult = {
        title: 'Итоговый результат: оптимальное назначение',
        items,
        summary:
          this.finalAssignments.length > 0
            ? `Общая стоимость: ${totalWeight}`
            : 'Назначения не найдены',
      };
    } else if (this.steps.length > 0) {
      // Если нет шагов с explanation, создаем explanation для последнего шага
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep) {
        const explanation = explanationGeneratorRegistry.generate(lastStep, 'hungarian');
        if (explanation) {
          lastStep.explanation = explanation;
          lastStep.explanation.finalResult = {
            title: 'Итоговый результат: оптимальное назначение',
            items,
            summary:
              this.finalAssignments.length > 0
                ? `Общая стоимость: ${totalWeight}`
                : 'Назначения не найдены',
          };
        }
      }
    }
  }
}
