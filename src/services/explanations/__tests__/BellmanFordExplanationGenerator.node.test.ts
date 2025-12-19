import { BellmanFordExplanationGenerator } from '../algorithm-specific/BellmanFordExplanationGenerator';
import type { Step, HighlightNodeStep, HighlightEdgeStep, UpdateNodeStep } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

describe('BellmanFordExplanationGenerator', () => {
  let generator: BellmanFordExplanationGenerator;

  beforeEach(() => {
    generator = new BellmanFordExplanationGenerator();
  });

  describe('handleHighlightNode', () => {
    it('should handle start node', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
      };

      const context: AlgorithmContext = {
        isStartNode: true,
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('general');
      expect(explanation?.text).toContain('Стартовая вершина');
    });

    it('should handle current node without start flag', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
    });

    it('should handle path node with path info', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        path: ['0', '1', '2'],
        distance: 5,
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('path');
    });

    it('should handle path node without path info', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
    });

    it('should handle rejected node', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'rejected',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('decision');
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

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
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

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeUndefined();
    });
  });

  describe('handleHighlightEdge', () => {
    it('should handle edge without from/to', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'current',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeUndefined();
    });

    it('should handle edge without from/to but with description', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'current',
        description: 'Some edge description',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
    });

    it('should handle relaxation edge', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        edgeWeight: 3,
        distanceFrom: 5,
        distanceTo: 10,
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('comparison');
    });

    it('should handle edge without relaxation', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        edgeWeight: 3,
        distanceFrom: 10,
        distanceTo: 5,
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford', context);
      expect(explanation).toBeDefined();
    });

    it('should handle path edge', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        edgeWeight: 3,
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('path');
    });

    it('should handle rejected edge', () => {
      const step: HighlightEdgeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE',
        edgeId: 'e0',
        state: 'rejected',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        edgeWeight: -5,
        isNegativeCycle: true,
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('decision');
    });
  });

  describe('handleUpdateNode', () => {
    it('should handle node update with distance label', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'a: 5',
        },
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('update');
    });

    it('should handle node update with infinity', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'a: ∞',
        },
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('general');
    });

    it('should handle node update with zero', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'a: 0',
        },
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('general');
    });

    it('should handle node update without distance', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {},
        description: 'Update description',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for update without description', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {},
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeUndefined();
    });
  });

  describe('default case', () => {
    it('should handle step with description', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'ADD_NODE',
        node: {
          id: '0',
          x: 0,
          y: 0,
          label: 'a',
          radius: 10,
          color: '#000',
          state: 'default',
        },
        description: 'Some description',
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for step without description', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'ADD_NODE',
        node: {
          id: '0',
          x: 0,
          y: 0,
          label: 'a',
          radius: 10,
          color: '#000',
          state: 'default',
        },
      };

      const explanation = generator['generateExplanation'](step, 'bellman-ford');
      expect(explanation).toBeUndefined();
    });
  });
});
