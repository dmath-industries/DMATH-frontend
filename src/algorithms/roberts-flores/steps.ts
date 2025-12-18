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
import '@/services/explanations/registry';

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

export class RobertsFloresStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private totalNodes: number = 0;
  private startNode: string | null = null;
  private foundCycles: string[][] = [];
  private isDirected: boolean = false;

  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.foundCycles = [];

    this.isDirected = graphDTO.edges.some(edge => edge.directed === true);

    this.graphModel = new GraphModel(this.isDirected);
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

    this.addFinalResultStep();

    return this.steps;
  }

  private findHamiltonianCycles(path: string[], current: string, totalNodes: number): void {
    if (path.length === totalNodes) {
      const firstNode = path[0];
      if (!firstNode) {
        return;
      }

      const hasCycleEdge = this.isDirected
        ? this.graph.hasEdge(current, firstNode)
        : this.graph.hasEdge(current, firstNode) || this.graph.hasEdge(firstNode, current);

      if (hasCycleEdge) {
        const cycle = [...path, firstNode];
        this.foundCycles.push(cycle);

        let edgeId = this.getEdgeId(current, firstNode);
        if (!edgeId && !this.isDirected) {
          edgeId = this.getEdgeId(firstNode, current);
        }

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

    const neighbors = this.isDirected
      ? this.graph.outNeighbors(current)
      : this.graph.neighbors(current);

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

        let edgeId = this.getEdgeId(current, next);
        if (!edgeId && !this.isDirected) {
          edgeId = this.getEdgeId(next, current);
        }

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

  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
  }

  private addFinalResultStep(): void {
    const items: Array<{ label: string; value: string }> = [];

    if (this.foundCycles.length === 0) {
      items.push({
        label: 'Результат',
        value: 'Гамильтоновы циклы не найдены',
      });
    } else {
      this.foundCycles.forEach((cycle, index) => {
        const cycleStr = cycle.map(nodeId => formatNodeLabel(nodeId)).join(' → ');
        items.push({
          label: `Цикл ${index + 1}`,
          value: cycleStr,
        });
      });
    }

    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      if (step && step.explanation) {
        step.explanation.finalResult = {
          title: 'Итоговый результат: Гамильтоновы циклы',
          items,
          summary: `Найдено циклов: ${this.foundCycles.length}`,
        };
        break;
      }
    }
  }
}
