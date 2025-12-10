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
