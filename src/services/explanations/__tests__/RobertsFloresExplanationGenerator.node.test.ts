import { RobertsFloresExplanationGenerator } from '../algorithm-specific/RobertsFloresExplanationGenerator';
import type { Step, HighlightNodeStep, HighlightEdgeStep } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

describe('RobertsFloresExplanationGenerator', () => {
  let generator: RobertsFloresExplanationGenerator;

  beforeEach(() => {
    generator = new RobertsFloresExplanationGenerator();
  });

  describe('handleHighlightNode', () => {
    it('should handle initial node', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
        description: 'Начало: добавлена вершина a',
      };

      const context: AlgorithmContext = {
        isInitial: true,
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle node in path', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
        description: 'Добавлена вершина a в путь',
      };

      const context: AlgorithmContext = {
        path: ['0', '1'],
        currentVertex: '0',
        nextVertex: '1',
        neighbors: ['1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle node in cycle', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
        description: 'Найден Гамильтонов цикл',
      };

      const context: AlgorithmContext = {
        cyclePath: ['0', '1', '2', '0'],
        isCycle: true,
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle backtracking', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
        description: 'Backtracking: удаляем вершину a',
      };

      const context: AlgorithmContext = {
        path: ['0'],
        isBacktracking: true,
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle visited state with isBacktrack and next', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const context: AlgorithmContext = {
        path: ['0', '1'],
        isBacktrack: true,
        current: '1',
        next: '2',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle visited state without isBacktrack', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const context: AlgorithmContext = {
        path: ['0'],
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle path state with cycle info', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        cyclePath: ['0', '1', '2', '0'],
        totalNodes: 3,
        startNode: '0',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('path');
    });

    it('should handle path state without cycle info', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
      expect(explanation).toBeDefined();
    });

    it('should handle visited state with backtrackPath but no isBacktrack', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const context: AlgorithmContext = {
        path: ['0', '1'],
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle visited state without backtrackPath', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
      expect(explanation).toBeDefined();
    });

    it('should handle rejected state with path and hasCycleEdge false', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'rejected',
      };

      const context: AlgorithmContext = {
        path: ['0', '1', '2'],
        firstNode: '0',
        totalNodes: 3,
        hasCycleEdge: false,
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('decision');
    });

    it('should handle rejected state with path but no hasCycleEdge info', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'rejected',
      };

      const context: AlgorithmContext = {
        path: ['0', '1'],
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle rejected state without path', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'rejected',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
      expect(explanation).toBeDefined();
    });
  });

  describe('handleHighlightEdge', () => {
    it('should handle edge in path', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
        description: 'Ребро (a, b) в пути',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        path: ['0', '1'],
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle edge in cycle', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
        description: 'Ребро (a, b) в цикле',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        cyclePath: ['0', '1', '2', '0'],
        isCycle: true,
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle edge in path without cycle', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
        description: 'Ребро (a, b) в пути',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        path: ['0', '1'],
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores', context);
      expect(explanation).toBeDefined();
    });

    it('should handle default state with description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Some description',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for default state without description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
      };

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
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

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
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

      const explanation = generator['generateExplanation'](step, 'roberts-flores');
      expect(explanation).toBeUndefined();
    });
  });
});
