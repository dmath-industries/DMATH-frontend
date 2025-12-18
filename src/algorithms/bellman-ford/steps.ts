import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  HighlightEdgeStep,
  UpdateNodeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import '@/services/explanations/registry';

interface Edge {
  source: string;
  target: string;
  weight: number;
  edgeId: string;
}

export class BellmanFordStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private distances: Map<string, number> = new Map();
  private predecessors: Map<string, string | null> = new Map();
  private pendingDescription: string | undefined;
  private startNode: string | null = null;

  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.distances.clear();
    this.predecessors.clear();
    this.pendingDescription = undefined;

    if (graphDTO.nodes.length === 0) {
      return this.steps;
    }

    const firstNode = graphDTO.nodes[0];
    const startNode = params.startNode ?? firstNode?.id ?? '0';
    this.startNode = startNode;

    if (!graphDTO.nodes.some(n => n.id === startNode)) {
      return this.steps;
    }

    const edges = this.buildEdgeList(graphDTO);
    const nodeCount = graphDTO.nodes.length;

    for (const node of graphDTO.nodes) {
      if (node.id === startNode) {
        this.distances.set(node.id, 0);
        this.predecessors.set(node.id, null);
        this.addUpdateNodeStep(
          node.id,
          { label: `${this.getNodeLabel(node.id)}: 0` },
          `Инициализация: расстояние до ${this.getNodeLabel(startNode)} = 0`
        );
        this.addHighlightNodeStep(
          node.id,
          'current',
          `Стартовая вершина: ${this.getNodeLabel(startNode)}`
        );
      } else {
        this.distances.set(node.id, Infinity);
        this.predecessors.set(node.id, null);
        this.addUpdateNodeStep(
          node.id,
          { label: `${this.getNodeLabel(node.id)}: ∞` },
          `Инициализация: расстояние до ${this.getNodeLabel(node.id)} = ∞`
        );
      }
    }

    for (let iteration = 0; iteration < nodeCount - 1; iteration++) {
      this.addDescriptionStep(`Итерация ${iteration + 1}/${nodeCount - 1}: релаксация рёбер`);

      let hasRelaxation = false;

      for (const edge of edges) {
        const u = edge.source;
        const v = edge.target;
        const w = edge.weight;

        const distU = this.distances.get(u) ?? Infinity;
        const distV = this.distances.get(v) ?? Infinity;

        this.addHighlightEdgeStep(
          edge.edgeId,
          'active',
          `Проверка ребра ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)} (вес: ${w})`,
          { from: u, to: v, weight: w }
        );

        if (distU !== Infinity && distU + w < distV) {
          hasRelaxation = true;
          const newDist = distU + w;
          this.distances.set(v, newDist);
          this.predecessors.set(v, u);

          this.addHighlightNodeStep(
            v,
            'current',
            `Обновление: расстояние до ${this.getNodeLabel(v)} = ${newDist}`
          );
          this.addUpdateNodeStep(
            v,
            { label: `${this.getNodeLabel(v)}: ${newDist}` },
            `Релаксация: ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)}, новое расстояние = ${newDist}`
          );
          this.addHighlightEdgeStep(
            edge.edgeId,
            'path',
            `Релаксация выполнена: ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)}`,
            { from: u, to: v, weight: w }
          );
        } else {
          this.addHighlightEdgeStep(
            edge.edgeId,
            'visited',
            `Релаксация не требуется: ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)}`,
            { from: u, to: v, weight: w }
          );
        }

        this.addHighlightEdgeStep(edge.edgeId, 'default', undefined, { from: u, to: v, weight: w });
      }

      for (const node of graphDTO.nodes) {
        if (node.id !== startNode) {
          const currentState = this.getNodeState(node.id);
          if (currentState === 'current') {
            this.addHighlightNodeStep(node.id, 'visited');
          }
        }
      }

      if (!hasRelaxation) {
        this.addDescriptionStep(
          `Итерация ${iteration + 1}: изменений нет, алгоритм завершён досрочно`
        );
        break;
      }
    }

    this.addDescriptionStep('Проверка на наличие отрицательных циклов');
    let hasNegativeCycle = false;
    const negativeCycleEdges: string[] = [];

    for (const edge of edges) {
      const u = edge.source;
      const v = edge.target;
      const w = edge.weight;

      const distU = this.distances.get(u) ?? Infinity;
      const distV = this.distances.get(v) ?? Infinity;

      this.addHighlightEdgeStep(
        edge.edgeId,
        'active',
        `Проверка ребра ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)} на отрицательный цикл`,
        { from: u, to: v, weight: w }
      );

      if (distU !== Infinity && distU + w < distV) {
        hasNegativeCycle = true;
        negativeCycleEdges.push(edge.edgeId);
        this.addHighlightEdgeStep(
          edge.edgeId,
          'rejected',
          `Обнаружено: ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)} указывает на отрицательный цикл!`,
          { from: u, to: v, weight: w }
        );
        this.addHighlightNodeStep(
          u,
          'rejected',
          `Вершина ${this.getNodeLabel(u)} в отрицательном цикле`
        );
        this.addHighlightNodeStep(
          v,
          'rejected',
          `Вершина ${this.getNodeLabel(v)} в отрицательном цикле`
        );
      } else {
        this.addHighlightEdgeStep(edge.edgeId, 'default', undefined, { from: u, to: v, weight: w });
      }
    }

    if (hasNegativeCycle) {
      this.addDescriptionStep('⚠️ Обнаружен отрицательный цикл! Кратчайшие пути не определены.');
    } else {
      this.addDescriptionStep('✓ Отрицательных циклов не обнаружено. Кратчайшие пути найдены.');

      for (const node of graphDTO.nodes) {
        if (node.id === startNode) {
          this.addHighlightNodeStep(
            node.id,
            'path',
            `Стартовая вершина: ${this.getNodeLabel(startNode)}`
          );
        } else {
          const dist = this.distances.get(node.id);
          if (dist !== undefined && dist !== Infinity) {
            const path = this.reconstructPath(startNode, node.id);
            if (path.length > 1) {
              this.addHighlightNodeStep(
                node.id,
                'path',
                `Кратчайшее расстояние: ${dist}, путь: ${path.map(n => this.getNodeLabel(n)).join(' → ')}`,
                { path, distance: dist }
              );
            }
          }
        }
      }

      for (const node of graphDTO.nodes) {
        const pred = this.predecessors.get(node.id);
        if (pred !== null && pred !== undefined) {
          const edge = edges.find(e => e.source === pred && e.target === node.id);
          if (edge) {
            this.addHighlightEdgeStep(
              edge.edgeId,
              'path',
              `Ребро в кратчайшем пути: ${this.getNodeLabel(pred)} → ${this.getNodeLabel(node.id)}`,
              { from: pred, to: node.id }
            );
          }
        }
      }

      this.addFinalResultStep(graphDTO, startNode, hasNegativeCycle);
    }

    return this.steps;
  }

  private reconstructPath(start: string, target: string): string[] {
    const path: string[] = [];
    let current: string | null = target;
    const visited = new Set<string>();

    // Восстанавливаем путь от целевой вершины к стартовой
    while (current !== null && current !== undefined) {
      // Защита от циклов
      if (visited.has(current)) {
        break;
      }
      visited.add(current);

      path.unshift(current);

      if (current === start) {
        break;
      }

      current = this.predecessors.get(current) ?? null;
    }

    // Если путь не начинается со стартовой вершины, значит путь не найден
    if (path.length === 0 || path[0] !== start) {
      return [];
    }

    return path;
  }

  private buildEdgeList(graphDTO: GraphDTO): Edge[] {
    const edges: Edge[] = [];

    for (const edge of graphDTO.edges) {
      if (edge.directed !== false) {
        // Вес может быть 0, что является валидным значением
        // Если вес не указан, используем 0 как значение по умолчанию (не Infinity)
        const weight = edge.weight !== undefined && edge.weight !== null ? edge.weight : 0;
        edges.push({
          source: edge.source,
          target: edge.target,
          weight: weight,
          edgeId: edge.id,
        });
      }
    }

    return edges;
  }

  private getNodeLabel(nodeId: string): string {
    const n = Number(nodeId);
    if (Number.isInteger(n) && n >= 0) {
      return String.fromCharCode('a'.charCodeAt(0) + n);
    }
    return nodeId;
  }

  private getNodeState(_nodeId: string): ElementState {
    return 'default';
  }

  private addHighlightNodeStep(
    nodeId: string,
    state: ElementState,
    description?: string,
    context?: AlgorithmContext
  ): void {
    const step: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId,
      state,
      description: description || this.pendingDescription,
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'bellman-ford', {
      ...context,
      isStartNode: nodeId === this.startNode,
      distances: this.distances,
      predecessors: this.predecessors,
    });
    if (explanation) {
      step.explanation = explanation;
    }

    if (this.pendingDescription) {
      this.pendingDescription = undefined;
    }
    this.steps.push(step);
  }

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
      description: description || this.pendingDescription,
    };

    const algorithmContext: AlgorithmContext = {
      edgeFrom: context?.from,
      edgeTo: context?.to,
      edgeWeight: context?.weight,
      distanceFrom: context?.from ? this.distances.get(context.from) : undefined,
      distanceTo: context?.to ? this.distances.get(context.to) : undefined,
    };
    const explanation = explanationGeneratorRegistry.generate(
      step,
      'bellman-ford',
      algorithmContext
    );
    if (explanation) {
      step.explanation = explanation;
    }

    if (this.pendingDescription) {
      this.pendingDescription = undefined;
    }
    this.steps.push(step);
  }

  private addUpdateNodeStep(nodeId: string, attrs: { label?: string }, description?: string): void {
    const step: UpdateNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'UPDATE_NODE',
      nodeId,
      attrs,
      description: description || this.pendingDescription,
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'bellman-ford', {
      distances: this.distances,
      predecessors: this.predecessors,
    });
    if (explanation) {
      step.explanation = explanation;
    }

    if (this.pendingDescription) {
      this.pendingDescription = undefined;
    }
    this.steps.push(step);
  }

  private addDescriptionStep(description: string): void {
    this.pendingDescription = description;
  }

  private addFinalResultStep(
    graphDTO: GraphDTO,
    startNode: string,
    hasNegativeCycle: boolean
  ): void {
    if (hasNegativeCycle || !this.startNode) {
      return;
    }

    const items: Array<{ label: string; value: string }> = [];

    const sortedNodes = [...graphDTO.nodes].sort((a, b) => {
      const aNum = Number(a.id);
      const bNum = Number(b.id);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }
      return String(a.id).localeCompare(String(b.id));
    });

    for (const node of sortedNodes) {
      const dist = this.distances.get(node.id);
      const nodeLabel = this.getNodeLabel(node.id);

      if (node.id === startNode) {
        items.push({
          label: `${nodeLabel}`,
          value: '0',
        });
      } else if (dist !== undefined && dist !== Infinity) {
        const path = this.reconstructPath(startNode, node.id);
        if (path.length > 1) {
          const pathStr = path.map(n => this.getNodeLabel(n)).join(' → ');
          items.push({
            label: `${nodeLabel}`,
            value: `${dist} (${pathStr})`,
          });
        } else {
          items.push({
            label: `${nodeLabel}`,
            value: '∞ (недостижима)',
          });
        }
      } else {
        items.push({
          label: `${nodeLabel}`,
          value: '∞ (недостижима)',
        });
      }
    }

    const finalStep: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId: startNode,
      state: 'path',
      description: 'Итоговый результат: кратчайшие расстояния найдены',
    };

    let explanation = explanationGeneratorRegistry.generate(finalStep, 'bellman-ford', {
      isStartNode: true,
      distances: this.distances,
      predecessors: this.predecessors,
    });

    if (!explanation) {
      explanation = {
        type: 'general',
        text: 'Итоговый результат: кратчайшие расстояния найдены',
      };
    }

    finalStep.explanation = explanation;
    finalStep.explanation.finalResult = {
      title: 'Итоговый результат: кратчайшие расстояния',
      items,
      summary: `Все кратчайшие расстояния от вершины ${this.getNodeLabel(startNode)}`,
    };

    this.steps.push(finalStep);
  }
}
