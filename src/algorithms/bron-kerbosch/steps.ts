/**
 * Bron–Kerbosch Algorithm — Step-based версия
 * Находит максимальные клики в неориентированном графе.
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

  generateSteps(graphDTO: GraphDTO, _params?: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

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

    return this.steps;
  }

  private recurse(r: string[], p: Set<string>, x: Set<string>): void {
    this.highlightSet(r, 'current', `Текущее множество R: ${this.formatSet(r)}`);

    if (p.size === 0 && x.size === 0) {
      this.highlightClique(r);
      return;
    }

    for (const v of Array.from(p)) {
      const neighbors = new Set(this.graph.neighbors(v) ?? []);

      r.push(v);
      const newP = new Set(Array.from(p).filter(n => neighbors.has(n)));
      const newX = new Set(Array.from(x).filter(n => neighbors.has(n)));

      this.addHighlightNodeStep(
        v,
        'active',
        `Добавлена вершина ${formatNodeLabel(v)} в R: ${this.formatSet(r)}`
      );

      this.recurse(r, newP, newX);

      r.pop();
      p.delete(v);
      x.add(v);

      this.addHighlightNodeStep(
        v,
        'visited',
        `Перенос вершины ${formatNodeLabel(v)} в X: ${this.formatSet(Array.from(x))}`
      );
    }
  }

  private highlightClique(clique: string[]): void {
    const description = `Найдена клика: ${this.formatSet(clique)}`;
    for (const nodeId of clique) {
      this.addHighlightNodeStep(nodeId, 'path', description);
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
          this.addHighlightEdgeStep(edgeId, 'path');
        }
      }
    }
  }

  private highlightSet(set: string[], state: ElementState, description?: string): void {
    for (const nodeId of set) {
      this.addHighlightNodeStep(nodeId, state, description);
    }
  }

  private getEdgeId(from: string, to: string): string | null {
    const edgeKey = this.graph.edge(from, to);
    return typeof edgeKey === 'string' ? edgeKey : null;
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
    this.steps.push(step);
  }

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

  private formatSet(nodes: string[]): string {
    return nodes.map(formatNodeLabel).join(', ');
  }
}
