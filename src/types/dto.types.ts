/**
 * Data Transfer Objects (DTO) для границы UI ↔ Algorithm
 * Используются для сериализации графа между UI и Web Worker
 */

/**
 * Состояние узла/ребра для визуальной подсветки в анимации
 */
export type ElementState =
  | 'default' // обычное состояние
  | 'active' // активная обработка
  | 'visited' // посещён
  | 'current' // текущий элемент
  | 'path' // часть пути/решения
  | 'rejected' // отвергнут/исключён
  | 'candidate'; // кандидат для рассмотрения

/**
 * DTO для узла графа
 */
export interface NodeDTO {
  id: string;
  x: number;
  y: number;
  label?: string;
  radius?: number;
  color?: string;
  state?: ElementState;
}

/**
 * DTO для ребра графа
 */
export interface EdgeDTO {
  id: string;
  source: string;
  target: string;
  weight?: number;
  directed?: boolean;
  color?: string;
  width?: number;
  state?: ElementState;
}

/**
 * DTO для полного графа
 */
export interface GraphDTO {
  nodes: NodeDTO[];
  edges: EdgeDTO[];
}
