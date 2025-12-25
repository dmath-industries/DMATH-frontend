import { GraphModel } from '@/services/graph/GraphModel';
import {
  Step,
  AddNodeStep,
  RemoveNodeStep,
  UpdateNodeStep,
  AddEdgeStep,
  RemoveEdgeStep,
  UpdateEdgeStep,
  SetCoordsStep,
  BatchStep,
  HighlightNodeStep,
  HighlightEdgeStep,
} from '@/types';
import type { NodeAttrs, EdgeAttrs, ElementState, NodeDTO, EdgeDTO } from '@/types';

type PrevState =
  | Partial<NodeAttrs>
  | EdgeAttrs
  | { x: number; y: number }
  | ElementState
  | Record<string, unknown>;

export class Applier {
  private prevStates = new WeakMap<Step, PrevState>();

  clear(): void {
    this.prevStates = new WeakMap<Step, PrevState>();
  }

  apply(step: Step, model: GraphModel): string[] {
    switch (step.type) {
      case 'ADD_NODE':
        return this.applyAddNode(step, model);

      case 'REMOVE_NODE':
        return this.applyRemoveNode(step, model);

      case 'UPDATE_NODE':
        return this.applyUpdateNode(step, model);

      case 'ADD_EDGE':
        return this.applyAddEdge(step, model);

      case 'REMOVE_EDGE':
        return this.applyRemoveEdge(step, model);

      case 'UPDATE_EDGE':
        return this.applyUpdateEdge(step, model);

      case 'SET_COORDS':
        return this.applySetCoords(step, model);

      case 'BATCH':
        return this.applyBatch(step, model);

      case 'HIGHLIGHT_NODE':
        return this.applyHighlightNode(step, model);

      case 'HIGHLIGHT_EDGE':
        return this.applyHighlightEdge(step, model);

      default:
        console.warn('Unknown step type:', (step as Step).type);
        return [];
    }
  }

  revert(step: Step, model: GraphModel): string[] {
    switch (step.type) {
      case 'ADD_NODE':
        return this.revertAddNode(step, model);

      case 'REMOVE_NODE':
        return this.revertRemoveNode(step, model);

      case 'UPDATE_NODE':
        return this.revertUpdateNode(step, model);

      case 'ADD_EDGE':
        return this.revertAddEdge(step, model);

      case 'REMOVE_EDGE':
        return this.revertRemoveEdge(step, model);

      case 'UPDATE_EDGE':
        return this.revertUpdateEdge(step, model);

      case 'SET_COORDS':
        return this.revertSetCoords(step, model);

      case 'BATCH':
        return this.revertBatch(step, model);

      case 'HIGHLIGHT_NODE':
        return this.revertHighlightNode(step, model);

      case 'HIGHLIGHT_EDGE':
        return this.revertHighlightEdge(step, model);

      default:
        console.warn('Unknown step type for revert:', (step as Step).type);
        return [];
    }
  }

  private applyAddNode(step: AddNodeStep, model: GraphModel): string[] {
    if (!model.hasNode(step.node.id)) {
      model.addNode(step.node);
      return [step.node.id];
    }
    return [];
  }

  private revertAddNode(step: AddNodeStep, model: GraphModel): string[] {
    if (model.hasNode(step.node.id)) {
      model.removeNode(step.node.id);
      return [step.node.id];
    }
    return [];
  }

  private applyRemoveNode(step: RemoveNodeStep, model: GraphModel): string[] {
    if (model.hasNode(step.nodeId)) {
      if (!this.prevStates.has(step)) {
        const prev = model.getNode(step.nodeId);
        if (prev) {
          this.prevStates.set(step, prev);
        }
      }

      const affectedEdges = [...model.getOutEdges(step.nodeId), ...model.getInEdges(step.nodeId)];

      model.removeNode(step.nodeId);

      return [step.nodeId, ...affectedEdges];
    }
    return [];
  }

  private revertRemoveNode(step: RemoveNodeStep, model: GraphModel): string[] {
    const prev = this.prevStates.get(step);
    if (
      prev &&
      typeof prev === 'object' &&
      !model.hasNode(step.nodeId) &&
      'id' in prev &&
      'x' in prev &&
      'y' in prev
    ) {
      model.addNode(prev as unknown as NodeDTO);
      return [step.nodeId];
    }
    return [];
  }

  private applyUpdateNode(step: UpdateNodeStep, model: GraphModel): string[] {
    if (model.hasNode(step.nodeId)) {
      if (!this.prevStates.has(step) && step.attrs) {
        const current = model.getNode(step.nodeId);
        if (current) {
          const prev: Record<string, unknown> = {};
          for (const key of Object.keys(step.attrs)) {
            prev[key] = current[key as keyof typeof current];
          }
          this.prevStates.set(step, prev);
        }
      }

      model.updateNode(step.nodeId, step.attrs);
      return [step.nodeId];
    }
    return [];
  }

  private revertUpdateNode(step: UpdateNodeStep, model: GraphModel): string[] {
    const prev = this.prevStates.get(step);
    if (prev && model.hasNode(step.nodeId) && typeof prev === 'object') {
      model.updateNode(step.nodeId, prev as Partial<NodeAttrs>);
      return [step.nodeId];
    }
    return [];
  }

  private applyAddEdge(step: AddEdgeStep, model: GraphModel): string[] {
    if (!model.hasEdge(step.edge.id)) {
      model.addEdge(step.edge);
      return [step.edge.id, step.edge.source, step.edge.target];
    }
    return [];
  }

  private revertAddEdge(step: AddEdgeStep, model: GraphModel): string[] {
    if (model.hasEdge(step.edge.id)) {
      model.removeEdge(step.edge.id);
      return [step.edge.id, step.edge.source, step.edge.target];
    }
    return [];
  }

  private applyRemoveEdge(step: RemoveEdgeStep, model: GraphModel): string[] {
    if (model.hasEdge(step.edgeId)) {
      if (!this.prevStates.has(step)) {
        const prev = model.getEdge(step.edgeId);
        if (prev) {
          this.prevStates.set(step, prev);
        }
      }

      const edge = model.getEdge(step.edgeId);
      model.removeEdge(step.edgeId);

      return edge ? [step.edgeId, edge.source, edge.target] : [step.edgeId];
    }
    return [];
  }

  private revertRemoveEdge(step: RemoveEdgeStep, model: GraphModel): string[] {
    const prev = this.prevStates.get(step);
    if (
      prev &&
      typeof prev === 'object' &&
      !model.hasEdge(step.edgeId) &&
      'id' in prev &&
      'source' in prev &&
      'target' in prev
    ) {
      const edge = prev as unknown as EdgeDTO;
      model.addEdge(edge);
      return [step.edgeId, edge.source, edge.target];
    }
    return [];
  }

  private applyUpdateEdge(step: UpdateEdgeStep, model: GraphModel): string[] {
    if (model.hasEdge(step.edgeId)) {
      if (!this.prevStates.has(step) && step.attrs) {
        const current = model.getEdge(step.edgeId);
        if (current) {
          const prev: Record<string, unknown> = {};
          for (const key of Object.keys(step.attrs)) {
            prev[key] = current[key as keyof typeof current];
          }
          this.prevStates.set(step, prev);
        }
      }

      const edge = model.getEdge(step.edgeId);
      model.updateEdge(step.edgeId, step.attrs);

      return edge ? [step.edgeId, edge.source, edge.target] : [step.edgeId];
    }
    return [];
  }

  private revertUpdateEdge(step: UpdateEdgeStep, model: GraphModel): string[] {
    const prev = this.prevStates.get(step);
    if (prev && model.hasEdge(step.edgeId) && typeof prev === 'object') {
      const edge = model.getEdge(step.edgeId);
      model.updateEdge(step.edgeId, prev as Partial<EdgeAttrs>);

      return edge ? [step.edgeId, edge.source, edge.target] : [step.edgeId];
    }
    return [];
  }

  private applySetCoords(step: SetCoordsStep, model: GraphModel): string[] {
    if (model.hasNode(step.nodeId)) {
      if (!this.prevStates.has(step)) {
        const node = model.getNode(step.nodeId);
        if (node) {
          this.prevStates.set(step, { x: node.x, y: node.y });
        }
      }

      model.updateNode(step.nodeId, { x: step.x, y: step.y });
      return [step.nodeId];
    }
    return [];
  }

  private revertSetCoords(step: SetCoordsStep, model: GraphModel): string[] {
    const prev = this.prevStates.get(step);
    if (
      prev &&
      typeof prev === 'object' &&
      model.hasNode(step.nodeId) &&
      'x' in prev &&
      'y' in prev
    ) {
      model.updateNode(step.nodeId, prev as { x: number; y: number });
      return [step.nodeId];
    }
    return [];
  }

  private applyBatch(step: BatchStep, model: GraphModel): string[] {
    const dirtyIds: string[] = [];

    for (const op of step.ops) {
      const ids = this.apply(op, model);
      dirtyIds.push(...ids);
    }

    return [...new Set(dirtyIds)];
  }

  private revertBatch(step: BatchStep, model: GraphModel): string[] {
    const dirtyIds: string[] = [];

    for (let i = step.ops.length - 1; i >= 0; i--) {
      const op = step.ops[i];
      if (op) {
        const ids = this.revert(op, model);
        dirtyIds.push(...ids);
      }
    }

    return [...new Set(dirtyIds)];
  }

  private applyHighlightNode(step: HighlightNodeStep, model: GraphModel): string[] {
    if (model.hasNode(step.nodeId)) {
      if (!this.prevStates.has(step)) {
        const node = model.getNode(step.nodeId);
        if (node && node.state) {
          this.prevStates.set(step, node.state);
        }
      }

      model.updateNode(step.nodeId, { state: step.state });
      return [step.nodeId];
    }
    return [];
  }

  private revertHighlightNode(step: HighlightNodeStep, model: GraphModel): string[] {
    if (this.prevStates.has(step) && model.hasNode(step.nodeId)) {
      const prev = this.prevStates.get(step);
      if (typeof prev === 'string') {
        model.updateNode(step.nodeId, { state: prev as ElementState });
        return [step.nodeId];
      }
    }
    return [];
  }

  private applyHighlightEdge(step: HighlightEdgeStep, model: GraphModel): string[] {
    if (model.hasEdge(step.edgeId)) {
      if (!this.prevStates.has(step)) {
        const edge = model.getEdge(step.edgeId);
        if (edge && edge.state) {
          this.prevStates.set(step, edge.state);
        }
      }

      const edge = model.getEdge(step.edgeId);
      model.updateEdge(step.edgeId, { state: step.state });

      return edge ? [step.edgeId, edge.source, edge.target] : [step.edgeId];
    }
    return [];
  }

  private revertHighlightEdge(step: HighlightEdgeStep, model: GraphModel): string[] {
    if (this.prevStates.has(step) && model.hasEdge(step.edgeId)) {
      const prev = this.prevStates.get(step);
      if (typeof prev === 'string') {
        const edge = model.getEdge(step.edgeId);
        model.updateEdge(step.edgeId, { state: prev as ElementState });

        return edge ? [step.edgeId, edge.source, edge.target] : [step.edgeId];
      }
    }
    return [];
  }
}
