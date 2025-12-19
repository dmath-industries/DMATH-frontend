import Graph from 'graphology';

import { GraphModel } from '@/services/graph';
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import type {
  AlgorithmParams,
  ElementState,
  GraphDTO,
  HighlightNodeStep,
  UpdateNodeStep,
  Step,
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

const COLOR_STATES: ElementState[] = [
  'current',
  'active',
  'visited',
  'path',
  'candidate',
  'rejected',
  'default',
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
    'Оранжевый',
    'Жёлтый',
    'Синий',
    'Зелёный',
    'Фиолетовый',
    'Красный',
    'Белый',
  ];
  private adjacencyMatrix: number[][] = [];

  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.nodeColors.clear();
    this.nodeIndexMap.clear();
    this.indexNodeMap.clear();

    this.graphModel = new GraphModel(false);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    const nodes = this.graph.nodes();
    if (nodes.length === 0) {
      return this.steps;
    }

    nodes.forEach((node, index) => {
      this.nodeIndexMap.set(node, index);
      this.indexNodeMap.set(index, node);
    });

    this.buildAdjacencyMatrix(nodes);

    this.heuristicColoring();

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

    for (let i = 0; i < n; i++) {
      this.adjacencyMatrix[i]![i] = -1;
    }
  }

  private getDegrees(): number[] {
    const n = this.adjacencyMatrix.length;
    const degrees = Array(n).fill(-1);

    for (let i = 0; i < n; i++) {
      if (this.nodeColors.get(this.indexNodeMap.get(i) || '') !== undefined) {
        degrees[i] = -1;
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
      if (this.nodeColors.get(this.indexNodeMap.get(i) || '') !== undefined) {
        continue;
      }

      if (accessibleVector !== undefined) {
        if (accessibleVector[i] !== 0) {
          continue;
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

  private getLine(vertexIndex: number): number[] {
    return [...this.adjacencyMatrix[vertexIndex]!];
  }

  private heuristicColoring(): void {
    let colorNum = 1;

    while (this.hasUncoloredVertices()) {
      const stepDescription = `Шаг ${colorNum}`;
      this.addInfoStep(stepDescription);

      const degrees = this.getDegrees();
      this.displayDegrees(degrees);

      let maxDegreeVertex = this.getMaxDegreeVertex(degrees);
      if (maxDegreeVertex === -1) {
        break;
      }

      const maxVertices: number[] = [maxDegreeVertex];
      const tableOfVectors: number[][] = [];

      const initialVector = this.getLine(maxDegreeVertex);
      tableOfVectors.push([...initialVector]);

      this.displayTable(maxVertices, tableOfVectors, colorNum);

      while (
        tableOfVectors[tableOfVectors.length - 1]!.some(
          (val, idx) =>
            val === 0 && this.nodeColors.get(this.indexNodeMap.get(idx) || '') === undefined
        )
      ) {
        const currentVector = tableOfVectors[tableOfVectors.length - 1];
        maxDegreeVertex = this.getMaxDegreeVertex(degrees, currentVector);

        if (maxDegreeVertex === -1) {
          break;
        }

        maxVertices.push(maxDegreeVertex);

        const newVector = [...currentVector!];
        newVector[maxDegreeVertex] = -1;

        const neighbors = this.getNeighbors(maxDegreeVertex);
        for (const neighbor of neighbors) {
          if (newVector[neighbor] !== -1) {
            newVector[neighbor] = 1;
          }
        }

        tableOfVectors.push(newVector);
        this.displayTable(maxVertices, tableOfVectors, colorNum);
      }

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

          if (colorNum === 7 && state === 'default') {
            this.addUpdateNodeStep(nodeId, { color: '#ffffff' });
          }
        }
      }

      colorNum++;
    }

    const chromaticNumber = colorNum - 1;
    this.addInfoStep(`Хроматическое число графа: ${chromaticNumber}`);
    this.addFinalSummary();

    this.addFinalResultStep();
  }

  private hasUncoloredVertices(): boolean {
    const nodes = this.graph.nodes();
    for (const node of nodes) {
      if (this.nodeColors.get(node) === undefined) {
        return true;
      }
    }
    return false;
  }

  private displayDegrees(degrees: number[]): void {
    let description = 'Степени вершин:\n';
    for (let i = 0; i < degrees.length; i++) {
      const nodeId = this.indexNodeMap.get(i);
      if (nodeId) {
        const label = formatNodeLabel(nodeId);
        if (degrees[i] === -1) {
          description += `${label}: -\n`;
        } else {
          description += `${label}: ${degrees[i]}\n`;
        }
      }
    }
    this.addInfoStep(description);
  }

  private displayTable(maxVertices: number[], tableOfVectors: number[][], colorNum: number): void {
    if (tableOfVectors.length === 0) return;

    const currentVector = tableOfVectors[tableOfVectors.length - 1];
    const verticesStr = maxVertices
      .map(idx => {
        const nodeId = this.indexNodeMap.get(idx);
        return nodeId ? formatNodeLabel(nodeId) : '';
      })
      .join(',');

    let description = `Таблица векторов (Шаг ${colorNum}):\n`;
    description += `Множество вершин: {${verticesStr}}\n`;
    description += 'Вектор: [';

    const vectorStr = currentVector!
      .map((val, idx) => {
        const nodeId = this.indexNodeMap.get(idx);
        const label = nodeId ? formatNodeLabel(nodeId) : '';
        if (val === -1) {
          return `${label}:-`;
        } else {
          return `${label}:${val}`;
        }
      })
      .join(', ');

    description += vectorStr + ']';
    this.addInfoStep(description);
  }

  private addFinalSummary(): void {
    for (const [nodeId, color] of this.nodeColors.entries()) {
      const state = color - 1 < COLOR_STATES.length ? COLOR_STATES[color - 1] : 'default';
      const colorName = this.colorNames[color - 1] || `Цвет ${color}`;

      this.addHighlightNodeStep(
        nodeId,
        state!,
        `Финальная раскраска: ${formatNodeLabel(nodeId)} - ${colorName}`
      );
    }
  }

  private addInfoStep(description: string): void {
    const firstNode = this.graph.nodes()[0];
    if (firstNode) {
      const step: HighlightNodeStep = {
        id: `step_${this.stepCounter++}`,
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: firstNode,
        state: 'default',
        description,
      };

      const explanation = explanationGeneratorRegistry.generate(step, 'graph-coloring');
      if (explanation) {
        step.explanation = explanation;
      }

      this.steps.push(step);
    }
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

    const neighbors = this.graph.neighbors(nodeId);
    const algorithmContext: AlgorithmContext = {
      neighbors: neighbors,
    };

    const explanation = explanationGeneratorRegistry.generate(
      step,
      'graph-coloring',
      algorithmContext
    );
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private addUpdateNodeStep(nodeId: string, attrs: { color?: string }): void {
    const step: UpdateNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'UPDATE_NODE',
      nodeId,
      attrs,
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'graph-coloring');
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private addFinalResultStep(): void {
    const colorGroups = new Map<number, string[]>();

    for (const [nodeId, color] of this.nodeColors.entries()) {
      if (!colorGroups.has(color)) {
        colorGroups.set(color, []);
      }
      colorGroups.get(color)!.push(nodeId);
    }

    const items: Array<{ label: string; value: string }> = [];

    const sortedColors = Array.from(colorGroups.keys()).sort((a, b) => a - b);

    for (const color of sortedColors) {
      const nodes = colorGroups.get(color)!;
      const colorName = this.colorNames[color - 1] || `Цвет ${color}`;
      const nodeLabels = nodes.map(nodeId => formatNodeLabel(nodeId)).join(', ');
      items.push({
        label: `${colorName} (цвет ${color})`,
        value: nodeLabels || '—',
      });
    }

    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      if (step && step.explanation) {
        const chromaticNumber = colorGroups.size;
        step.explanation.finalResult = {
          title: 'Итоговый результат: раскраска графа',
          items,
          summary: `Хроматическое число графа: ${chromaticNumber}`,
        };
        break;
      }
    }
  }
}
