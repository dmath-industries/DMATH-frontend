import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  HighlightEdgeStep,
  UpdateNodeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';

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
          `Проверка ребра ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)} (вес: ${w})`
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
            `Релаксация выполнена: ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)}`
          );
        } else {
          this.addHighlightEdgeStep(
            edge.edgeId,
            'visited',
            `Релаксация не требуется: ${this.getNodeLabel(u)} → ${this.getNodeLabel(v)}`
          );
        }

        this.addHighlightEdgeStep(edge.edgeId, 'default');
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

    return this.steps;
  }

  private buildEdgeList(graphDTO: GraphDTO): Edge[] {
    const edges: Edge[] = [];

    for (const edge of graphDTO.edges) {
      if (edge.directed !== false) {
        edges.push({
          source: edge.source,
          target: edge.target,
          weight: edge.weight ?? Infinity,
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

  private addHighlightNodeStep(nodeId: string, state: ElementState, description?: string): void {
    const step: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId,
      state,
      description: description || this.pendingDescription,
    };
    if (this.pendingDescription) {
      this.pendingDescription = undefined;
    }
    this.steps.push(step);
  }

  private addHighlightEdgeStep(edgeId: string, state: ElementState, description?: string): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description: description || this.pendingDescription,
    };
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
    if (this.pendingDescription) {
      this.pendingDescription = undefined;
    }
    this.steps.push(step);
  }

  private addDescriptionStep(description: string): void {
    this.pendingDescription = description;
  }
}
