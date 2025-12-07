/**
 * Hungarian (Assignment) Algorithm — Step-based версия
 * Строит минимальное назначение для квадратной матрицы стоимостей.
 */

import Graph from 'graphology';
// eslint-disable-next-line boundaries/element-types
import { GraphModel } from '@/services/graph';
import type {
  AlgorithmParams,
  ElementState,
  GraphDTO,
  HighlightEdgeStep,
  HighlightNodeStep,
  Step,
} from '@/types';

type Assignment = { rowId: string; colId: string; weight: number; edgeId?: string | null };

const formatNodeLabel = (nodeId: string | number): string => {
  const numericId =
    typeof nodeId === 'string' && /^\d+$/.test(nodeId)
      ? Number(nodeId)
      : typeof nodeId === 'number'
        ? nodeId
        : NaN;

  if (Number.isInteger(numericId) && numericId >= 0) {
    return String.fromCharCode('a'.charCodeAt(0) + numericId);
  }
  return String(nodeId);
};

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

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

    // Используем направленный граф, чтобы хранить стоимость для каждой пары (i,j)
    this.graphModel = new GraphModel(true);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();
    this.nodeOrder = [...this.graph.nodes()];

    if (this.nodeOrder.length === 0) {
      return this.steps;
    }

    this.nodeOrder.sort();
    const n = this.nodeOrder.length;

    const costMatrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(Number.POSITIVE_INFINITY)
    );

    for (let i = 0; i < n; i++) {
      const from = this.nodeOrder[i]!;
      const row = costMatrix[i]!;
      for (let j = 0; j < n; j++) {
        const to = this.nodeOrder[j]!;
        const edgeId = this.getEdgeId(from, to);
        if (!edgeId) continue;
        const weight = this.getEdgeWeight(edgeId);
        row[j] = Number.isFinite(weight) ? weight : Number.POSITIVE_INFINITY;
      }
    }

    const hasFiniteRow = costMatrix.every(row => row.some(v => Number.isFinite(v)));
    if (!hasFiniteRow) {
      return this.steps;
    }

    const assignmentCols = hungarian(costMatrix);

    const assignments: Assignment[] = [];
    for (let i = 0; i < n; i++) {
      const jValue = assignmentCols[i] ?? -1;
      if (jValue < 0 || jValue >= n) continue;
      const rowId = this.nodeOrder[i]!;
      const colId = this.nodeOrder[jValue]!;
      const edgeId = this.getEdgeId(rowId, colId);
      const weight = costMatrix[i]?.[jValue];
      assignments.push({
        rowId,
        colId,
        weight: Number.isFinite(weight) ? (weight as number) : Infinity,
        edgeId,
      });
    }

    this.emitAssignments(assignments);

    return this.steps;
  }

  private emitAssignments(assignments: Assignment[]): void {
    for (const { rowId, colId, weight, edgeId } of assignments) {
      this.addHighlightNodeStep(rowId, 'current', `Строка ${formatNodeLabel(rowId)}`);
      this.addHighlightNodeStep(colId, 'current', `Столбец ${formatNodeLabel(colId)}`);

      if (edgeId) {
        this.addHighlightEdgeStep(
          edgeId,
          'path',
          `Назначение ${formatNodeLabel(rowId)} → ${formatNodeLabel(colId)}, вес ${this.formatWeight(weight)}`
        );
      }

      this.addHighlightNodeStep(rowId, 'path');
      this.addHighlightNodeStep(colId, 'path');
    }
  }

  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
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
    this.steps.push(step);
  }

  private formatWeight(weight: number): string {
    return Number.isFinite(weight) ? weight.toString() : '∞';
  }
}
