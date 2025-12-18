import Graph from 'graphology';

import { GraphModel } from '@/services/graph';
import { explanationGeneratorRegistry, type AlgorithmContext } from '@/services/explanations';
import '@/services/explanations/registry';
import type {
  AlgorithmParams,
  ElementState,
  GraphDTO,
  HighlightEdgeStep,
  HighlightNodeStep,
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

export class BronKerboschStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private foundCliques: string[][] = [];

  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.foundCliques = [];

    this.graphModel = new GraphModel(false);
    this.graphModel.fromDTO(graphDTO);
    this.graph = this.graphModel.getGraph();

    const nodes = this.graph.nodes();
    if (nodes.length === 0) {
      return this.steps;
    }

    const r: string[] = [];
    const p = new Set<string>(nodes);
    const x = new Set<string>();

    this.recurse(r, p, x);

    this.addFinalResultStep();

    return this.steps;
  }

  private recurse(r: string[], p: Set<string>, x: Set<string>): void {
    for (const nodeId of r) {
      const context: AlgorithmContext = {
        rSet: [...r],
        pSet: Array.from(p),
        xSet: Array.from(x),
      };
      this.addHighlightNodeStep(nodeId, 'current', undefined, context);
    }

    if (p.size === 0 && x.size === 0) {
      this.highlightClique(r);
      return;
    }

    for (const v of Array.from(p)) {
      const neighbors = new Set(this.graph.neighbors(v) ?? []);

      r.push(v);
      const newP = new Set(Array.from(p).filter(n => neighbors.has(n)));
      const newX = new Set(Array.from(x).filter(n => neighbors.has(n)));

      const addContext: AlgorithmContext = {
        rSet: [...r],
        pSet: Array.from(newP),
        xSet: Array.from(newX),
        neighbors: Array.from(neighbors),
        addedVertex: v,
      };
      this.addHighlightNodeStep(v, 'active', undefined, addContext);

      this.recurse(r, newP, newX);

      r.pop();
      p.delete(v);
      x.add(v);

      const removeContext: AlgorithmContext = {
        rSet: [...r],
        pSet: Array.from(p),
        xSet: Array.from(x),
        removedVertex: v,
      };
      this.addHighlightNodeStep(v, 'visited', undefined, removeContext);
    }
  }

  private highlightClique(clique: string[]): void {
    this.foundCliques.push([...clique]);

    const cliqueContext: AlgorithmContext = {
      clique: [...clique],
      rSet: [...clique],
      pSet: [],
      xSet: [],
    };

    for (const nodeId of clique) {
      this.addHighlightNodeStep(nodeId, 'path', undefined, cliqueContext);
    }

    for (let i = 0; i < clique.length; i++) {
      for (let j = i + 1; j < clique.length; j++) {
        const from = clique[i];
        const to = clique[j];
        if (!from || !to) {
          continue;
        }
        const edgeId = this.getEdgeId(from, to);
        if (edgeId) {
          const edgeContext: AlgorithmContext = {
            clique: [...clique],
            edgeFrom: from,
            edgeTo: to,
          };
          this.addHighlightEdgeStep(edgeId, 'path', undefined, edgeContext);
        }
      }
    }
  }

  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
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
      description,
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'bron-kerbosch', context);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private addHighlightEdgeStep(
    edgeId: string,
    state: ElementState,
    description?: string,
    context?: AlgorithmContext
  ): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description,
    };

    const explanation = explanationGeneratorRegistry.generate(step, 'bron-kerbosch', context);
    if (explanation) {
      step.explanation = explanation;
    }

    this.steps.push(step);
  }

  private formatSet(nodes: string[]): string {
    return nodes.map(formatNodeLabel).join(', ');
  }

  private addFinalResultStep(): void {
    const items: Array<{ label: string; value: string }> = [];

    if (this.foundCliques.length === 0) {
      items.push({
        label: 'Результат',
        value: 'Максимальные клики не найдены',
      });
    } else {
      const sortedCliques = [...this.foundCliques].sort((a, b) => {
        if (b.length !== a.length) {
          return b.length - a.length;
        }
        const aStr = a.map(id => formatNodeLabel(id)).join(',');
        const bStr = b.map(id => formatNodeLabel(id)).join(',');
        return aStr.localeCompare(bStr);
      });

      sortedCliques.forEach((clique, index) => {
        const cliqueStr = clique.map(nodeId => formatNodeLabel(nodeId)).join(', ');
        const cliqueSet = `{${cliqueStr}}`;
        const size = clique.length;
        const edgesCount = (size * (size - 1)) / 2;

        items.push({
          label: `Клика ${index + 1}`,
          value: `${cliqueSet} (|C| = ${size}, |E(C)| = ${edgesCount})`,
        });
      });
    }

    let lastStepWithExplanation: Step | null = null;
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i];
      if (step && step.explanation) {
        lastStepWithExplanation = step;
        break;
      }
    }

    if (lastStepWithExplanation) {
      lastStepWithExplanation.explanation!.finalResult = {
        title: 'Итоговый результат: максимальные клики',
        items,
        summary: `Найдено максимальных клик: ${this.foundCliques.length}`,
      };
    } else if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep) {
        const explanation = explanationGeneratorRegistry.generate(lastStep, 'bron-kerbosch', {});
        if (explanation) {
          explanation.finalResult = {
            title: 'Итоговый результат: максимальные клики',
            items,
            summary: `Найдено максимальных клик: ${this.foundCliques.length}`,
          };
          lastStep.explanation = explanation;
        }
      }
    }
  }
}
