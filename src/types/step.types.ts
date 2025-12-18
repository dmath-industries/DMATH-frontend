/**
 * Типы для Step-based представления алгоритмов
 * Каждый шаг описывает минимальную атомарную операцию над графом
 */

import type { NodeDTO, EdgeDTO, ElementState } from './dto.types';

/**
 * Базовый тип для всех шагов
 */
export interface BaseStep {
  id: string;
  timestamp: number;
  type: string;
  description?: string; // опциональное текстовое описание для UI
}

/**
 * Добавление узла
 */
export interface AddNodeStep extends BaseStep {
  type: 'ADD_NODE';
  node: NodeDTO;
}

/**
 * Удаление узла
 */
export interface RemoveNodeStep extends BaseStep {
  type: 'REMOVE_NODE';
  nodeId: string;
  prev?: NodeDTO; // для revert
}

/**
 * Обновление атрибутов узла
 */
export interface UpdateNodeStep extends BaseStep {
  type: 'UPDATE_NODE';
  nodeId: string;
  attrs: Partial<NodeDTO>;
  prev?: Partial<NodeDTO>; // предыдущие значения для revert
}

/**
 * Добавление ребра
 */
export interface AddEdgeStep extends BaseStep {
  type: 'ADD_EDGE';
  edge: EdgeDTO;
}

/**
 * Удаление ребра
 */
export interface RemoveEdgeStep extends BaseStep {
  type: 'REMOVE_EDGE';
  edgeId: string;
  prev?: EdgeDTO; // для revert
}

/**
 * Обновление атрибутов ребра
 */
export interface UpdateEdgeStep extends BaseStep {
  type: 'UPDATE_EDGE';
  edgeId: string;
  attrs: Partial<EdgeDTO>;
  prev?: Partial<EdgeDTO>; // предыдущие значения для revert
}

/**
 * Установка координат узла (для раскладок)
 */
export interface SetCoordsStep extends BaseStep {
  type: 'SET_COORDS';
  nodeId: string;
  x: number;
  y: number;
  prev?: { x: number; y: number }; // для revert
}

/**
 * Групповая операция (батч шагов)
 */
export interface BatchStep extends BaseStep {
  type: 'BATCH';
  ops: Step[];
}

/**
 * Обновление состояния узла (для подсветки)
 */
export interface HighlightNodeStep extends BaseStep {
  type: 'HIGHLIGHT_NODE';
  nodeId: string;
  state: ElementState;
  prev?: ElementState;
}

/**
 * Обновление состояния ребра (для подсветки)
 */
export interface HighlightEdgeStep extends BaseStep {
  type: 'HIGHLIGHT_EDGE';
  edgeId: string;
  state: ElementState;
  prev?: ElementState;
}

/**
 * Union type для всех шагов
 */
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

/**
 * Тип для StepType строк
 */
export type StepType = Step['type'];
