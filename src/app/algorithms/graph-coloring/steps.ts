import Graph from 'graphology';

import { GraphModel } from '@/services/graph';
import type { AlgorithmParams, ElementState, GraphDTO, HighlightNodeStep, Step } from '@/types';

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

/**
 * Цвета для раскраски (можно использовать разные состояния)
 */
const COLOR_STATES: ElementState[] = [
  'current', // Цвет 1
  'active', // Цвет 2
  'visited', // Цвет 3
  'path', // Цвет 4
  'candidate', // Цвет 5
];

export class GraphColoringStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private graphModel!: GraphModel;
  private graph!: Graph;
  private nodeColors: Map<string, number> = new Map();
  private nodeIndexMap: Map<string, number> = new Map();
  private indexNodeMap: Map<number, string> = new Map();
  private colorNames = [
    'Красный',
    'Синий',
    'Зелёный',
    'Жёлтый',
    'Фиолетовый',
    'Оранжевый',
    'Розовый',
    'Голубой',
  ];
  private adjacencyMatrix: number[][] = [];
}
