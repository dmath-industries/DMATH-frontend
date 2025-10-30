/**
 * Внутренние типы атрибутов для Graphology
 * Эти типы используются внутри GraphModel для хранения в Graphology
 */

import type { ElementState } from './dto.types';

/**
 * Атрибуты узла в Graphology
 */
export interface NodeAttrs {
  x: number;
  y: number;
  label?: string;
  radius: number;
  color: string;
  state: ElementState;
}

/**
 * Атрибуты ребра в Graphology
 */
export interface EdgeAttrs {
  weight: number;
  directed: boolean;
  color: string;
  width: number;
  state: ElementState;
}

/**
 * Дефолтные значения для узлов
 */
export const DEFAULT_NODE_ATTRS: Partial<NodeAttrs> = {
  radius: 20,
  color: '#3b82f6',
  state: 'default',
};

/**
 * Дефолтные значения для рёбер
 */
export const DEFAULT_EDGE_ATTRS: Partial<EdgeAttrs> = {
  weight: 1,
  directed: false,
  color: '#6b7280',
  width: 2,
  state: 'default',
};

