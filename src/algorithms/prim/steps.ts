/**
 * Prim Algorithm — Step-based версия
 * Генерирует поток шагов для построения минимального остовного дерева
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
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import '@/services/explanations/registry'; // Инициализация реестра генераторов

type CandidateEdge = {
  edgeId: string;
  from: string;
  to: string;
  weight: number;
};

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

export class PrimStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private mstEdges: Array<{ from: string; to: string; weight: number }> = []; // Рёбра MST

  /**
   * Генерация шагов алгоритма Прима
   */
  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.mstEdges = [];

    this.graphModel = new GraphModel(false);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    const nodes = this.graph.nodes();
    if (nodes.length === 0) {
      return this.steps;
    }

    const startNode = String(params.startNode ?? nodes[0]);
    if (!this.graph.hasNode(startNode)) {
      return this.steps;
    }

    const visited = new Set<string>();
    const edgeQueue: CandidateEdge[] = [];

    this.addHighlightNodeStep(
      startNode,
      'current',
      `Начало из вершины ${formatNodeLabel(startNode)}`
    );

    visited.add(startNode);
    this.enqueueCandidateEdges(startNode, visited, edgeQueue);

    while (visited.size < nodes.length && edgeQueue.length > 0) {
      const nextEdge = this.pickNextEdge(edgeQueue, visited);
      if (!nextEdge) {
        break;
      }

      const { edgeId, from, to, weight } = nextEdge;
      const nextNode = visited.has(from) ? to : from;
      if (visited.has(nextNode)) {
        continue;
      }

      this.addHighlightEdgeStep(
        edgeId,
        'active',
        `Выбрано ребро ${this.formatEdgeLabel(from, to)} с весом ${this.formatWeight(weight)}`,
        { from, to, weight }
      );

      this.addHighlightNodeStep(
        nextNode,
        'current',
        `Добавлена вершина ${formatNodeLabel(nextNode)} в остов`
      );

      visited.add(nextNode);

      // Сохраняем ребро MST
      this.mstEdges.push({ from, to, weight });

      this.addHighlightEdgeStep(
        edgeId,
        'path',
        `Ребро ${this.formatEdgeLabel(from, to)} зафиксировано в MST`,
        { from, to, weight }
      );
      this.addHighlightNodeStep(nextNode, 'path');

      this.enqueueCandidateEdges(nextNode, visited, edgeQueue);
    }

    if (visited.size < nodes.length) {
      this.addHighlightNodeStep(
        startNode,
        'rejected',
        'Граф несвязный: построено остовное дерево только для доступной компоненты'
      );
    }

    // Добавляем итоговый ответ на последнем шаге
    this.addFinalResultStep();

    return this.steps;
  }

  /**
   * Добавить ребра-кандидаты, ведущие к непосещённым вершинам
   */
  private enqueueCandidateEdges(
    nodeId: string,
    visited: Set<string>,
    edgeQueue: CandidateEdge[]
  ): void {
    for (const neighbor of this.graph.neighbors(nodeId)) {
      const neighborId = String(neighbor);
      if (visited.has(neighborId)) {
        continue;
      }

      const edgeId = this.getEdgeId(nodeId, neighborId);
      if (!edgeId) {
        continue;
      }

      const weight = this.getEdgeWeight(edgeId);
      edgeQueue.push({ edgeId, from: nodeId, to: neighborId, weight });

      this.addHighlightEdgeStep(
        edgeId,
        'candidate',
        `Ребро ${this.formatEdgeLabel(nodeId, neighborId)} кандидат с весом ${this.formatWeight(weight)}`,
        { from: nodeId, to: neighborId, weight }
      );
    }
  }

  /**
   * Выбрать следующее минимальное ребро, соединяющее остов с новой вершиной
   */
  private pickNextEdge(edgeQueue: CandidateEdge[], visited: Set<string>): CandidateEdge | null {
    edgeQueue.sort((a, b) => a.weight - b.weight);

    while (edgeQueue.length > 0) {
      const edge = edgeQueue.shift();
      if (!edge) {
        break;
      }

      const connectsVisited =
        (visited.has(edge.from) && !visited.has(edge.to)) ||
        (!visited.has(edge.from) && visited.has(edge.to));
      if (connectsVisited) {
        return edge;
      }

      this.addHighlightEdgeStep(
        edge.edgeId,
        'rejected',
        'Ребро больше не расширяет остов и пропускается',
        { from: edge.from, to: edge.to, weight: edge.weight }
      );
    }

    return null;
  }

  /**
   * Получить вес ребра
   */
  private getEdgeWeight(edgeId: string): number {
    const attrs = this.graph.getEdgeAttributes(edgeId) ?? {};
    const rawWeight = (attrs as { weight?: unknown }).weight;
    const weight = typeof rawWeight === 'number' ? rawWeight : Number(rawWeight);
    return Number.isFinite(weight) ? weight : Infinity;
  }

  /**
   * Получить ID ребра между двумя вершинами
   */
  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
  }

  /**
   * Добавить шаг подсветки узла
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

    // Генерируем пояснение
    const explanation = explanationGeneratorRegistry.generate(step, 'prim');
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  /**
   * Добавить шаг подсветки ребра
   */
  private addHighlightEdgeStep(
    edgeId: string,
    state: ElementState,
    description?: string,
    context?: { from?: string; to?: string; weight?: number }
  ): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description,
    };

    // Генерируем пояснение с контекстом ребра
    const algorithmContext: AlgorithmContext = {
      edgeFrom: context?.from,
      edgeTo: context?.to,
      edgeWeight: context?.weight,
    };
    const explanation = explanationGeneratorRegistry.generate(step, 'prim', algorithmContext);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private formatEdgeLabel(a: string, b: string): string {
    return `${formatNodeLabel(a)} — ${formatNodeLabel(b)}`;
  }

  private formatWeight(weight: number): string {
    return Number.isFinite(weight) ? weight.toString() : '∞';
  }

  /**
   * Добавляет итоговый ответ алгоритма на последнем шаге
   */
  private addFinalResultStep(): void {
    const items: Array<{ label: string; value: string }> = [];
    let totalWeight = 0;

    this.mstEdges.forEach((edge, index) => {
      const edgeLabel = `${this.formatEdgeLabel(edge.from, edge.to)}`;
      items.push({
        label: `Ребро ${index + 1}`,
        value: `${edgeLabel} (вес: ${this.formatWeight(edge.weight)})`,
      });
      totalWeight += edge.weight;
    });

    // Добавляем итоговый ответ к последнему шагу с explanation
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      if (step && step.explanation) {
        step.explanation.finalResult = {
          title: 'Итоговый результат: минимальное остовное дерево',
          items,
          summary: `Общий вес MST: ${this.formatWeight(totalWeight)}`,
        };
        break;
      }
    }
  }
}
