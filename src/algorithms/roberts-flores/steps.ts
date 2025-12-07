/**
 * Roberts-Flores Algorithm — Step-based версия
 * Генерирует поток Step'ов для поиска Гамильтоновых циклов в ориентированном графе
 */

import Graph from 'graphology';
import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  HighlightEdgeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';

/**
 * Генератор шагов для алгоритма Roberts-Flores
 */
export class RobertsFloresStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graph!: Graph;
  private edgeIdMap: Map<string, string> = new Map();

  /**
   * Генерировать шаги для алгоритма Roberts-Flores
   */
  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.edgeIdMap.clear();

    // Построить graphology граф из DTO
    this.graph = this.buildGraph(graphDTO);

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
      `Начало: добавлена вершина ${this.label(startNode)}`
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
            `Найден Гамильтонов цикл: ${this.pathToString(path)}`
          );
        }

        for (const nodeId of path) {
          this.addHighlightNodeStep(nodeId, 'path');
        }
      } else {
        this.addHighlightNodeStep(
          current,
          'rejected',
          `Путь ${this.pathToString(path)} не образует цикл`
        );
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
          `Добавлена вершина ${this.label(next)}: ${this.pathToString(path)}`
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
          `Удалена вершина ${this.label(next)}: ${this.pathToString(path)}`
        );

        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'default');
        }
      }
    }
  }

  /**
   * Построить graphology граф из GraphDTO
   */
  private buildGraph(graphDTO: GraphDTO): Graph {
    const graph = new Graph({ type: 'directed' });

    // Добавить узлы
    for (const node of graphDTO.nodes) {
      graph.addNode(node.id);
    }

    // Добавить рёбра и создать маппинг для поиска ID
    for (const edge of graphDTO.edges) {
      graph.addEdge(edge.source, edge.target);
      this.edgeIdMap.set(`${edge.source}-${edge.target}`, edge.id);

      // Если ребро не направленное, добавить обратное
      if (!edge.directed) {
        graph.addEdge(edge.target, edge.source);
        this.edgeIdMap.set(`${edge.target}-${edge.source}`, edge.id);
      }
    }

    return graph;
  }

  /**
   * Получить ID ребра по source и target
   */
  private getEdgeId(from: string, to: string): string | null {
    return this.edgeIdMap.get(`${from}-${to}`) ?? null;
  }

  /**
   * Преобразовать путь в строку
   */
  private pathToString(path: string[]): string {
    return path.map(v => this.label(v)).join(' → ');
  }

  /**
   * Получить метку узла (a, b, c, ...)
   */
  private label(v: string): string {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0) {
      return String.fromCharCode('a'.charCodeAt(0) + n);
    }
    return v;
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
}
