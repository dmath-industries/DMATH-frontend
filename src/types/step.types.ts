import type { NodeDTO, EdgeDTO, ElementState } from './dto.types';

export type ExplanationType =
  | 'comparison'
  | 'formula'
  | 'matrix'
  | 'selection'
  | 'update'
  | 'iteration'
  | 'decision'
  | 'path'
  | 'general';

export interface AlgorithmFinalResult {
  title: string;
  items: Array<{
    label: string;
    value: string;
  }>;
  summary?: string;
}

export interface StepExplanation {
  type: ExplanationType;
  text: string;
  reason?: string;
  formula?: string | string[];
  currentPath?: string;
  finalResult?: AlgorithmFinalResult;
  context?: {
    nodes?: string[];
    edges?: string[];
    values?: Record<string, number | string>;
    matrix?: { row?: number; col?: number };
  };
}

export interface BaseStep {
  id: string;
  timestamp: number;
  type: string;
  description?: string;
  explanation?: StepExplanation;
}

export interface AddNodeStep extends BaseStep {
  type: 'ADD_NODE';
  node: NodeDTO;
}

export interface RemoveNodeStep extends BaseStep {
  type: 'REMOVE_NODE';
  nodeId: string;
  prev?: NodeDTO;
}

export interface UpdateNodeStep extends BaseStep {
  type: 'UPDATE_NODE';
  nodeId: string;
  attrs: Partial<NodeDTO>;
  prev?: Partial<NodeDTO>;
}

export interface AddEdgeStep extends BaseStep {
  type: 'ADD_EDGE';
  edge: EdgeDTO;
}

export interface RemoveEdgeStep extends BaseStep {
  type: 'REMOVE_EDGE';
  edgeId: string;
  prev?: EdgeDTO;
}

export interface UpdateEdgeStep extends BaseStep {
  type: 'UPDATE_EDGE';
  edgeId: string;
  attrs: Partial<EdgeDTO>;
  prev?: Partial<EdgeDTO>;
}

export interface SetCoordsStep extends BaseStep {
  type: 'SET_COORDS';
  nodeId: string;
  x: number;
  y: number;
  prev?: { x: number; y: number };
}

export interface BatchStep extends BaseStep {
  type: 'BATCH';
  ops: Step[];
}

export interface HighlightNodeStep extends BaseStep {
  type: 'HIGHLIGHT_NODE';
  nodeId: string;
  state: ElementState;
  prev?: ElementState;
}

export interface HighlightEdgeStep extends BaseStep {
  type: 'HIGHLIGHT_EDGE';
  edgeId: string;
  state: ElementState;
  prev?: ElementState;
}

export type Step =
  | AddNodeStep
  | RemoveNodeStep
  | UpdateNodeStep
  | AddEdgeStep
  | RemoveEdgeStep
  | UpdateEdgeStep
  | SetCoordsStep
  | BatchStep
  | HighlightNodeStep
  | HighlightEdgeStep;

export type StepType = Step['type'];
