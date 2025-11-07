/**
 * Roberts-Flores Algorithm — Step-based версия
 * Генерирует поток Step'ов для поиска Гамильтоновых циклов в ориентированном графе
 */

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

  /**
   * Генерировать шаги для алгоритма Roberts-Flores
   */
  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

    const firstNode = graphDTO.nodes[0];
    const startNode = params.startNode ?? firstNode?.id ?? '0';

    const adjacency = this.buildAdjacencyList(graphDTO);
    const totalNodes = graphDTO.nodes.length;

    if (totalNodes === 0) {
      return this.steps;
    }

    const path: string[] = [startNode];
    
    this.addHighlightNodeStep(
      startNode,
      'current',
      `Начало: добавлена вершина ${this.label(startNode)}`
    );

    this.findHamiltonianCycles(
      path,
      startNode,
      totalNodes,
      adjacency,
      graphDTO
    );

    return this.steps;
  }

  /**
   * Рекурсивный поиск Гамильтоновых циклов
   */
  private findHamiltonianCycles(
    path: string[],
    current: string,
    totalNodes: number,
    adjacency: Map<string, string[]>,
    graphDTO: GraphDTO
  ): void {
    if (path.length === totalNodes) {
      const firstNode = path[0];
      if (!firstNode) {
        return;
      }

      const hasCycleEdge = this.hasEdge(current, firstNode, graphDTO);

      if (hasCycleEdge) {
        const edgeId = this.findEdgeId(current, firstNode, graphDTO);
        
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

    const neighbors = adjacency.get(current) ?? [];

    for (const next of neighbors) {
      if (!path.includes(next)) {
        path.push(next);

        this.addHighlightNodeStep(
          next,
          'current',
          `Добавлена вершина ${this.label(next)}: ${this.pathToString(path)}`
        );

        const edgeId = this.findEdgeId(current, next, graphDTO);
        if (edgeId) {
          this.addHighlightEdgeStep(edgeId, 'active');
        }

        this.findHamiltonianCycles(path, next, totalNodes, adjacency, graphDTO);

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
   * Построить adjacency list из GraphDTO
   */
  private buildAdjacencyList(graphDTO: GraphDTO): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const node of graphDTO.nodes) {
      adjacency.set(node.id, []);
    }

    for (const edge of graphDTO.edges) {
      const neighbors = adjacency.get(edge.source) ?? [];
      neighbors.push(edge.target);
      adjacency.set(edge.source, neighbors);

      if (!edge.directed) {
        const reverseNeighbors = adjacency.get(edge.target) ?? [];
        reverseNeighbors.push(edge.source);
        adjacency.set(edge.target, reverseNeighbors);
      }
    }

    return adjacency;
  }

  /**
   * Проверить существование ребра
   */
  private hasEdge(from: string, to: string, graphDTO: GraphDTO): boolean {
    return graphDTO.edges.some(
      (edge) =>
        (edge.source === from && edge.target === to) ||
        (!edge.directed && edge.source === to && edge.target === from)
    );
  }

  /**
   * Найти ID ребра
   */
  private findEdgeId(from: string, to: string, graphDTO: GraphDTO): string | null {
    const edge = graphDTO.edges.find(
      (e) =>
        (e.source === from && e.target === to) ||
        (!e.directed && e.source === to && e.target === from)
    );
    return edge?.id ?? null;
  }

  /**
   * Преобразовать путь в строку
   */
  private pathToString(path: string[]): string {
    return path.map((v) => this.label(v)).join(' → ');
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
  private addHighlightNodeStep(
    nodeId: string,
    state: ElementState,
    description?: string
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
  }

  /**
   * Добавить шаг для подсветки ребра
   */
  private addHighlightEdgeStep(
    edgeId: string,
    state: ElementState,
    description?: string
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
  }
}

