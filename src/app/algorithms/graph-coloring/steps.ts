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

  private getNeighbors(vertexIndex: number): number[] {
    const neighbors: number[] = [];
    const n = this.adjacencyMatrix.length;

    for (let j = 0; j < n; j++) {
      if (this.adjacencyMatrix[vertexIndex]![j] === 1) {
        neighbors.push(j);
      }
    }

    return neighbors;
  }

  /**
   * Получить строку матрицы
   */
  private getLine(vertexIndex: number): number[] {
    return [...this.adjacencyMatrix[vertexIndex]!];
  }

  /**
   * Эвристический алгоритм раскраски графа
   */
  private heuristicColoring(nodes: string[]): void {
    let colorNum = 1;

    // Пока есть нераскрашенные вершины
    while (this.hasUncoloredVertices()) {
      const stepDescription = `Шаг ${colorNum}`;
      this.addInfoStep(stepDescription);

      // Получаем степени вершин
      const degrees = this.getDegrees();
      this.displayDegrees(degrees);

      // Находим вершину с максимальной степенью
      let maxDegreeVertex = this.getMaxDegreeVertex(degrees);
      if (maxDegreeVertex === -1) {
        break;
      }

      const maxVertices: number[] = [maxDegreeVertex];
      const tableOfVectors: number[][] = [];

      // Инициализируем первый вектор из строки матрицы
      const initialVector = this.getLine(maxDegreeVertex);
      tableOfVectors.push([...initialVector]);

      this.displayTable(maxVertices, tableOfVectors, colorNum);

      // Пока в последнем векторе есть 0 (доступные вершины)
      while (
        tableOfVectors[tableOfVectors.length - 1]!.some(
          (val, idx) =>
            val === 0 && this.nodeColors.get(this.indexNodeMap.get(idx) || '') === undefined
        )
      ) {
        // Находим следующую вершину с максимальной степенью среди доступных
        const currentVector = tableOfVectors[tableOfVectors.length - 1];
        maxDegreeVertex = this.getMaxDegreeVertex(degrees, currentVector);

        if (maxDegreeVertex === -1) {
          break;
        }

        maxVertices.push(maxDegreeVertex);

        // Создаем новый вектор
        const newVector = [...currentVector!];
        newVector[maxDegreeVertex] = -1; // Помечаем выбранную вершину

        // Помечаем соседей выбранной вершины как недоступные (1)
        const neighbors = this.getNeighbors(maxDegreeVertex);
        for (const neighbor of neighbors) {
          if (newVector[neighbor] !== -1) {
            newVector[neighbor] = 1;
          }
        }

        tableOfVectors.push(newVector);
        this.displayTable(maxVertices, tableOfVectors, colorNum);
      }

      // Раскрашиваем все вершины из множества текущим цветом
      const state = colorNum - 1 < COLOR_STATES.length ? COLOR_STATES[colorNum - 1] : 'default';
      const colorName = this.colorNames[colorNum - 1] || `Цвет ${colorNum}`;

      for (const vertexIndex of maxVertices) {
        const nodeId = this.indexNodeMap.get(vertexIndex);
        if (nodeId) {
          this.nodeColors.set(nodeId, colorNum);
          this.addHighlightNodeStep(
            nodeId,
            state!,
            `Вершина ${formatNodeLabel(nodeId)} получает ${colorName} (цвет ${colorNum})`
          );
        }
      }

      colorNum++;
    }
    // Финальное резюме
    const chromaticNumber = colorNum - 1;
    this.addInfoStep(`Хроматическое число графа: ${chromaticNumber}`);
    this.addFinalSummary(chromaticNumber);
  }
}
