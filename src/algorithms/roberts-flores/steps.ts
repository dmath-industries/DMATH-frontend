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
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import '@/services/explanations/registry'; // Инициализация реестра генераторов

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

const formatPath = (path: (string | number)[], separator = ' → '): string =>
  path.map(formatNodeLabel).join(separator);

/**
 * Генератор шагов для алгоритма Roberts-Flores
 */
export class RobertsFloresStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private totalNodes: number = 0;
  private startNode: string | null = null;

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
    this.totalNodes = totalNodes;
    if (totalNodes === 0) {
      return this.steps;
    }

    const firstNode = this.graph.nodes()[0];
    const startNode = params.startNode ?? firstNode ?? '0';
    this.startNode = startNode;

    if (!this.graph.hasNode(startNode)) {
      return this.steps;
    }

    const path: string[] = [startNode];

    this.addHighlightNodeStep(
      startNode,
      'current',
      `Начало: добавлена вершина ${formatNodeLabel(startNode)}`,
      { path: [...path], startNode, totalNodes: this.totalNodes, isInitial: true }
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
          this.addHighlightEdgeStep(
            edgeId,
            'path',
            `Найден Гамильтонов цикл: ${formatPath(path)}`,
            {
              from: current,
              to: firstNode,
              path: [...path],
              totalNodes: this.totalNodes,
              isCycle: true,
            }
          );
        }

        for (const nodeId of path) {
          this.addHighlightNodeStep(nodeId, 'path', undefined, {
            path: [...path],
            cyclePath: [...path],
            totalNodes: this.totalNodes,
            startNode: this.startNode,
          });
        }
      } else {
        this.addHighlightNodeStep(
          current,
          'rejected',
          `Путь ${formatPath(path)} не образует цикл`,
          {
            path: [...path],
            current,
            firstNode,
            totalNodes: this.totalNodes,
            hasCycleEdge: false,
          }
        );
      }

      return;
    }

    // Используем outNeighbors для получения соседей
    const neighbors = this.graph.outNeighbors(current);
    for (const next of neighbors) {
      if (!path.includes(next)) {
        path.push(next);

        this.addHighlightNodeStep(
          next,
          'current',
          `Добавлена вершина ${formatNodeLabel(next)}: ${formatPath(path)}`,
          {
            path: [...path],
            current,
            next,
            neighbors: neighbors.map(String),
            totalNodes: this.totalNodes,
          }
        );

        const edgeId = this.getEdgeId(current, next);
        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'active', undefined, { from: current, to: next });
        }

        this.findHamiltonianCycles(path, next, totalNodes);

        path.pop();

        this.addHighlightNodeStep(
          next,
          'visited',
          `Удалена вершина ${formatNodeLabel(next)}: ${formatPath(path)}`,
          { path: [...path], current, next, totalNodes: this.totalNodes, isBacktrack: true }
        );

        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'default', undefined, { from: current, to: next });
        }
      }
    }
  }

  /**
   * Добавить шаг для подсветки узла
   */
  private addHighlightNodeStep(
    nodeId: string,
    state: ElementState,
    description?: string,
    context?: Record<string, unknown>
  ): void {
    const step: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId,
      state,
      description,
    };
    this.steps.push(step);

    // Добавляем пояснение через генератор
    if (context) {
      const explanation = explanationGeneratorRegistry.generate(
        step,
        'roberts-flores',
        context as AlgorithmContext
      );
      if (explanation) {
        step.explanation = explanation;
      }
    }
  }

  /**
   * Добавить шаг для подсветки ребра
   */
  private addHighlightEdgeStep(
    edgeId: string,
    state: ElementState,
    description?: string,
    context?: Record<string, unknown>
  ): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description,
    };
    this.steps.push(step);

    // Добавляем пояснение через генератор
    if (context) {
      const explanation = explanationGeneratorRegistry.generate(
        step,
        'roberts-flores',
        context as AlgorithmContext
      );
      if (explanation) {
        step.explanation = explanation;
      }
    }
  }

  /**
   * Получить ID ребра между двумя вершинами
   */
  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
  }
}
