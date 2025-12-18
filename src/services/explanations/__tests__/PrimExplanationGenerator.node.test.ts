import { PrimExplanationGenerator } from '../algorithm-specific/PrimExplanationGenerator';
import type { Step, HighlightNodeStep, HighlightEdgeStep } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

describe('PrimExplanationGenerator', () => {
  let generator: PrimExplanationGenerator;

  beforeEach(() => {
    generator = new PrimExplanationGenerator();
  });

  describe('handleHighlightNode', () => {
    it('should handle node selection', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
        description: 'Выбираем вершину a',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeDefined();
    });

    it('should handle node in MST', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
        description: 'Вершина a в MST',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeDefined();
    });
  });

  describe('handleHighlightEdge', () => {
    it('should handle edge selection', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'current',
        description: 'Выбираем ребро (a, b) с весом 3',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        weight: 3,
      };

      const explanation = generator['generateExplanation'](step, 'prim', context);
      expect(explanation).toBeDefined();
    });

    it('should handle edge in MST', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
        description: 'Ребро (a, b) в MST',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeDefined();
    });

    it('should handle default state with description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
        description: 'Some description',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for default state without description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeUndefined();
    });

    it('should handle default edge state with description', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'visited',
        description: 'Some description',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for default edge state without description', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'visited',
      };

      const explanation = generator['generateExplanation'](step, 'prim');
      expect(explanation).toBeUndefined();
    });
  });
});
