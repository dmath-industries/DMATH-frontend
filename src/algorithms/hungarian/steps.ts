import Graph from 'graphology';

import { GraphModel } from '@/services/graph';
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import '@/services/explanations/registry';
import type {
  AlgorithmParams,
  ElementState,
  GraphDTO,
  HighlightEdgeStep,
  HighlightNodeStep,
  Step,
} from '@/types';

type Assignment = { rowId: string; colId: string; weight: number; edgeId?: string | null };

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
    const maxIterations = n * n;

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
  private finalAssignments: Assignment[] = [];
  private edgeMap: Map<string, { weight: number; edgeId: string }> = new Map();
  private nodeLabels: Map<string, string> = new Map();

  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

    this.nodeLabels.clear();
    for (const node of graphDTO.nodes) {
      this.nodeLabels.set(node.id, node.label || node.id);
    }

    let sourceNodes = graphDTO.nodes
      .filter(node => node.id.startsWith('source_'))
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('source_', ''), 10);
        const bNum = parseInt(b.id.replace('source_', ''), 10);
        return aNum - bNum;
      })
      .map(node => node.id);
    let targetNodes = graphDTO.nodes
      .filter(node => node.id.startsWith('target_'))
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('target_', ''), 10);
        const bNum = parseInt(b.id.replace('target_', ''), 10);
        return aNum - bNum;
      })
      .map(node => node.id);

    if (sourceNodes.length === 0 || targetNodes.length === 0) {
      const allNodes = graphDTO.nodes.map(node => node.id).sort();
      const n = allNodes.length;
      if (n === 0 || n % 2 !== 0) {
        return this.steps;
      }
      const half = Math.floor(n / 2);
      sourceNodes = allNodes.slice(0, half);
      targetNodes = allNodes.slice(half);
    }

    const n = sourceNodes.length;

    if (n === 0 || targetNodes.length !== n) {
      return this.steps;
    }

    this.edgeMap.clear();
    for (const edge of graphDTO.edges) {
      const key = `${edge.source}->${edge.target}`;
      this.edgeMap.set(key, { weight: edge.weight ?? 0, edgeId: edge.id });
    }

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

    this.graphModel = new GraphModel(true);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    const firstNode = sourceNodes[0];
    if (firstNode) {
      this.addHighlightNodeStep(
        firstNode,
        'current',
        `Начало: построение матрицы стоимостей размером ${n}×${n}`
      );
    }

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
      }
    }

    this.nodeOrder = [...sourceNodes, ...targetNodes];

    const hasFiniteRow = costMatrix.some(row => row.some(v => Number.isFinite(v)));
    if (!hasFiniteRow) {
      return this.steps;
    }

    let assignmentCols: number[];
    try {
      assignmentCols = hungarian(costMatrix);
    } catch (error) {
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

    if (!assignmentCols || assignmentCols.length !== n) {
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
    let sourceNodesList = this.nodeOrder
      .filter(id => id.startsWith('source_'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('source_', ''), 10);
        const bNum = parseInt(b.replace('source_', ''), 10);
        return aNum - bNum;
      });
    let targetNodesList = this.nodeOrder
      .filter(id => id.startsWith('target_'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('target_', ''), 10);
        const bNum = parseInt(b.replace('target_', ''), 10);
        return aNum - bNum;
      });

    if (sourceNodesList.length === 0 || targetNodesList.length === 0) {
      const allNodes = [...this.nodeOrder].sort();
      const half = allNodes.length / 2;
      sourceNodesList = allNodes.slice(0, half);
      targetNodesList = allNodes.slice(half);
    }

    for (let i = 0; i < n; i++) {
      const jValue = assignmentCols[i] ?? -1;
      if (jValue < 0 || jValue >= n) continue;
      const rowId = sourceNodesList[i]!;
      const colId = targetNodesList[jValue]!;
      const edgeKey = `${rowId}->${colId}`;
      let edgeInfo = this.edgeMap.get(edgeKey);
      if (!edgeInfo && this.graph) {
        const edgeId = this.getEdgeId(rowId, colId);
        if (edgeId) {
          const weight = this.getEdgeWeight(edgeId);
          edgeInfo = { weight, edgeId };
        }
      }
      const weight = costMatrix[i]?.[jValue];
      assignments.push({
        rowId,
        colId,
        weight: Number.isFinite(weight) ? (weight as number) : Infinity,
        edgeId: edgeInfo?.edgeId ?? null,
      });
    }

    if (assignments.length === 0) {
      const firstNode = this.nodeOrder[0];
      if (firstNode) {
        this.addHighlightNodeStep(
          firstNode,
          'rejected',
          'Не удалось найти оптимальное назначение. Возможно, матрица стоимостей некорректна или не все строки имеют назначения.'
        );
      }

      this.addFinalResultStep();
      return this.steps;
    }

    this.finalAssignments = assignments;
    this.emitAssignments(assignments);

    this.addFinalResultStep();

    return this.steps;
  }

  private formatNodeLabel(nodeId: string): string {
    return this.nodeLabels.get(nodeId) || nodeId;
  }

  private emitAssignments(assignments: Assignment[]): void {
    // Находим индексы строк и столбцов для передачи в контекст
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

    for (const { rowId, colId, weight, edgeId } of assignments) {
      const rowLabel = this.formatNodeLabel(rowId);
      const colLabel = this.formatNodeLabel(colId);
      const rowIndex = sourceNodesList.indexOf(rowId);
      const colIndex = targetNodesList.indexOf(colId);

      this.addHighlightNodeStep(rowId, 'current', `Строка ${rowLabel}`, {
        rowIndex: rowIndex >= 0 ? rowIndex : undefined,
      });
      this.addHighlightNodeStep(colId, 'current', `Столбец ${colLabel}`, {
        colIndex: colIndex >= 0 ? colIndex : undefined,
      });

      if (edgeId) {
        this.addHighlightEdgeStep(
          edgeId,
          'path',
          `Назначение ${rowLabel} → ${colLabel}, стоимость ${this.formatWeight(weight)}`,
          {
            matrixRow: rowIndex >= 0 ? rowIndex : undefined,
            matrixCol: colIndex >= 0 ? colIndex : undefined,
          }
        );
      }

      this.addHighlightNodeStep(rowId, 'path');
      this.addHighlightNodeStep(colId, 'path');
    }
  }

  private getEdgeId(from: string, to: string): string | null {
    if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) {
      return null;
    }

    try {
      const edgeKey = this.graph.edge(from, to);
      if (edgeKey !== undefined && edgeKey !== null) {
        return typeof edgeKey === 'string' ? edgeKey : String(edgeKey);
      }
    } catch (error) {
      try {
        const outEdges = this.graph.outEdges(from);
        for (const edgeId of outEdges) {
          const target = this.graph.target(edgeId);
          if (target === to) {
            return edgeId;
          }
        }
      } catch (e) {}
    }
    return null;
  }

  private getEdgeWeight(edgeId: string): number {
    const attrs = this.graph.getEdgeAttributes(edgeId) ?? {};
    const rawWeight = (attrs as { weight?: unknown }).weight;
    const weight = typeof rawWeight === 'number' ? rawWeight : Number(rawWeight);
    return Number.isFinite(weight) ? weight : Number.POSITIVE_INFINITY;
  }

  private addHighlightNodeStep(
    nodeId: string,
    state: ElementState,
    description?: string,
    additionalContext?: {
      rowIndex?: number;
      colIndex?: number;
      minValue?: number;
      maxValue?: number;
    }
  ): void {
    const step: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId,
      state,
      description,
    };

    const nodeLabel = this.formatNodeLabel(nodeId);
    const algorithmContext: AlgorithmContext = {
      nodeLabel: nodeLabel,
      ...(additionalContext || {}),
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'hungarian', algorithmContext);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private addHighlightEdgeStep(
    edgeId: string,
    state: ElementState,
    description?: string,
    additionalContext?: {
      matrixRow?: number;
      matrixCol?: number;
      uValue?: number;
      vValue?: number;
      reducedCost?: number;
    }
  ): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description,
    };

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
      ...(additionalContext || {}),
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'hungarian', algorithmContext);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private formatWeight(weight: number): string {
    return Number.isFinite(weight) ? weight.toString() : '∞';
  }

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

    let lastStepWithExplanation = null;
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      if (step && step.explanation) {
        lastStepWithExplanation = step;
        break;
      }
    }

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
