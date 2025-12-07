/**
 * Roberts-Flores Algorithm — Step-based версия
 * Генерирует поток Step'ов для поиска Гамильтоновых циклов в ориентированном графе
 */

import Graph from 'graphology';
import { GraphModel } from '@/services/graph';
import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  HighlightEdgeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';

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

const formatPath = (
  path: (string | number)[],
  separator = ' → '
): string => path.map(formatNodeLabel).join(separator);

/**
 * Генератор шагов для алгоритма Roberts-Flores
 */
export class RobertsFloresStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;

  /**
   * Генерировать шаги для алгоритма Roberts-Flores
   */
  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

    // Конвертировать GraphDTO в GraphModel (направленный граф)
    this.graphModel = new GraphModel(true);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    const totalNodes = this.graph.order;
    if (totalNodes === 0) {
      return this.steps;
    }

    const firstNode = this.graph.nodes()[0];
    const startNode = params.startNode ?? firstNode ?? '0';

    if (!this.graph.hasNode(startNode)) {
      return this.steps;
    }

    const path: string[] = [startNode];

    this.addHighlightNodeStep(
      startNode,
      'current',
      `Начало: добавлена вершина ${formatNodeLabel(startNode)}`
    );

    this.findHamiltonianCycles(path, startNode, totalNodes);

    return this.steps;
  }

  /**
   * Рекурсивный поиск Гамильтоновых циклов
   */
  private findHamiltonianCycles(path: string[], current: string, totalNodes: number): void {
    if (path.length === totalNodes) {
      const firstNode = path[0];
      if (!firstNode) {
        return;
      }

      const hasCycleEdge = this.graph.hasEdge(current, firstNode);

      if (hasCycleEdge) {
        const edgeId = this.getEdgeId(current, firstNode);
        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'path', `Найден Гамильтонов цикл: ${formatPath(path)}`);
        }

        for (const nodeId of path) {
          this.addHighlightNodeStep(nodeId, 'path');
        }
      } else {
        this.addHighlightNodeStep(current, 'rejected', `Путь ${formatPath(path)} не образует цикл`);
      }

      return;
    }

    // Используем outNeighbors для получения соседей
    for (const next of this.graph.outNeighbors(current)) {
      if (!path.includes(next)) {
        path.push(next);

        this.addHighlightNodeStep(
          next,
          'current',
          `Добавлена вершина ${formatNodeLabel(next)}: ${formatPath(path)}`
        );

        const edgeId = this.getEdgeId(current, next);
        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'active');
        }

        this.findHamiltonianCycles(path, next, totalNodes);

        path.pop();

        this.addHighlightNodeStep(
          next,
          'visited',
          `Удалена вершина ${formatNodeLabel(next)}: ${formatPath(path)}`
        );

        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'default');
        }
      }
    }
  }

  /**
   * Добавить шаг для подсветки узла
   */
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

  /**
   * Добавить шаг для подсветки ребра
   */
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

  /**
   * Получить ID ребра между двумя вершинами
   */
  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
  }
}
