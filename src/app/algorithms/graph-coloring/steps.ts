import Graph from 'graphology';

import { GraphModel } from '@/services/graph';
import type { AlgorithmParams, ElementState, GraphDTO, HighlightNodeStep, Step } from '@/types';

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
 * Цвета для раскраски (можно использовать разные состояния)
 */
const COLOR_STATES: ElementState[] = [
  'current', // Цвет 1
  'active', // Цвет 2
  'visited', // Цвет 3
  'path', // Цвет 4
  'candidate', // Цвет 5
];

export class GraphColoringStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private nodeColors: Map<string, number> = new Map();
  private nodeIndexMap: Map<string, number> = new Map();
  private indexNodeMap: Map<number, string> = new Map();
  private colorNames = [
    'Красный',
    'Синий',
    'Зелёный',
    'Жёлтый',
    'Фиолетовый',
    'Оранжевый',
    'Розовый',
    'Голубой',
  ];
  private adjacencyMatrix: number[][] = [];

  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.nodeColors.clear();
    this.nodeIndexMap.clear();
    this.indexNodeMap.clear();

    this.graphModel = new GraphModel(false); // Неориентированный граф
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    const nodes = this.graph.nodes();
    if (nodes.length === 0) {
      return this.steps;
    }

    // Создаем индексное отображение
    nodes.forEach((node, index) => {
      this.nodeIndexMap.set(node, index);
      this.indexNodeMap.set(index, node);
    });

    // Создаем матрицу смежности
    this.buildAdjacencyMatrix(nodes);

    // Эвристический алгоритм раскраски
    this.heuristicColoring(nodes);

    return this.steps;
  }

  private buildAdjacencyMatrix(nodes: string[]): void {
    const n = nodes.length;
    this.adjacencyMatrix = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      const nodeI = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const nodeJ = nodes[j];
        if (this.graph.hasEdge(nodeI, nodeJ)) {
          this.adjacencyMatrix[i]![j] = 1;
          this.adjacencyMatrix[j]![i] = 1;
        }
      }
    }

    // Устанавливаем -1 на диагонали
    for (let i = 0; i < n; i++) {
      this.adjacencyMatrix[i]![i] = -1;
    }
  }

  private getDegrees(): number[] {
    const n = this.adjacencyMatrix.length;
    const degrees = Array(n).fill(-1);

    for (let i = 0; i < n; i++) {
      if (this.nodeColors.get(this.indexNodeMap.get(i) || '') !== undefined) {
        degrees[i] = -1; // Уже раскрашена
        continue;
      }

      let degree = 0;
      for (let j = 0; j < n; j++) {
        if (this.adjacencyMatrix[i]![j] === 1) {
          degree++;
        } else if (this.adjacencyMatrix[i]![j] === 0 && degrees[i] === -1) {
          degrees[i] = 0;
        }
      }
      if (degree > 0) {
        degrees[i] = degree;
      }
    }

    return degrees;
  }

  private getMaxDegreeVertex(degrees: number[], accessibleVector?: number[]): number {
    let maxDegreeVertex = -1;
    let maxDegree = -1;

    for (let i = 0; i < degrees.length; i++) {
      // Пропускаем уже раскрашенные вершины
      if (this.nodeColors.get(this.indexNodeMap.get(i) || '') !== undefined) {
        continue;
      }

      // Если передан вектор доступности, проверяем его
      if (accessibleVector !== undefined) {
        if (accessibleVector[i] !== 0) {
          continue; // Вершина недоступна (уже выбрана или смежна с выбранными)
        }
      }

      if (degrees[i]! > maxDegree) {
        maxDegree = degrees[i]!;
        maxDegreeVertex = i;
      }
    }

    return maxDegreeVertex;
  }
}
