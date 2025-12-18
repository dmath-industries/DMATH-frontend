import { HungarianExplanationGenerator } from '../algorithm-specific/HungarianExplanationGenerator';
import type { Step, HighlightNodeStep, HighlightEdgeStep } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

describe('HungarianExplanationGenerator', () => {
  let generator: HungarianExplanationGenerator;

  beforeEach(() => {
    generator = new HungarianExplanationGenerator();
  });

  describe('handleHighlightNode', () => {
    it('should handle source node highlighting', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: 'source_0',
        state: 'current',
        description: 'Обрабатываем строку 0',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian');
      expect(explanation).toBeDefined();
    });

    it('should handle target node highlighting', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: 'target_0',
        state: 'current',
        description: 'Обрабатываем столбец 0',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian');
      expect(explanation).toBeDefined();
    });

    it('should handle assignment highlighting', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: 'source_0',
        state: 'path',
        description: 'Назначение: source_0 → target_1',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian');
      expect(explanation).toBeDefined();
    });
  });

  describe('handleHighlightEdge', () => {
    it('should handle edge highlighting for assignment', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
        description: 'Назначение: source_0 → target_1, стоимость 5',
      };

      const context: AlgorithmContext = {
        edgeFrom: 'source_0',
        edgeTo: 'target_1',
        weight: 5,
      };

      const explanation = generator['generateExplanation'](step, 'hungarian', context);
      expect(explanation).toBeDefined();
    });

    it('should handle edge highlighting without context', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
        description: 'Ребро в назначении',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian');
      expect(explanation).toBeDefined();
    });

    it('should handle active edge with matrix row and col', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        edgeFrom: 'source_0',
        edgeTo: 'target_1',
        cost: 5,
        matrixRow: 0,
        matrixCol: 1,
      };

      const explanation = generator['generateExplanation'](step, 'hungarian', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('matrix');
    });

    it('should handle active edge without matrix row and col', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        edgeFrom: 'source_0',
        edgeTo: 'target_1',
        cost: 5,
      };

      const explanation = generator['generateExplanation'](step, 'hungarian', context);
      expect(explanation).toBeDefined();
    });

    it('should handle default state with description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: 'source_0',
        state: 'visited',
        description: 'Some description',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for default state without description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: 'source_0',
        state: 'visited',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian');
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

      const context: AlgorithmContext = {
        edgeFrom: 'source_0',
        edgeTo: 'target_1',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian', context);
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

      const context: AlgorithmContext = {
        edgeFrom: 'source_0',
        edgeTo: 'target_1',
      };

      const explanation = generator['generateExplanation'](step, 'hungarian', context);
      expect(explanation).toBeUndefined();
    });
  });
});
