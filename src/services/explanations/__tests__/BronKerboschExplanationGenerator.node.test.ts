import { BronKerboschExplanationGenerator } from '../algorithm-specific/BronKerboschExplanationGenerator';
import type { Step, HighlightNodeStep } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

describe('BronKerboschExplanationGenerator', () => {
  let generator: BronKerboschExplanationGenerator;

  beforeEach(() => {
    generator = new BronKerboschExplanationGenerator();
  });

  describe('handleHighlightNode', () => {
    it('should handle initial node with sets', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
      };

      const context: AlgorithmContext = {
        rSet: ['0'],
        pSet: ['1', '2'],
        xSet: [],
        isInitial: true,
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle initial node without sets', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
      };

      const context: AlgorithmContext = {
        isInitial: true,
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle active node with added vertex', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        rSet: ['0'],
        pSet: ['1'],
        xSet: [],
        addedVertex: '0',
        neighbors: ['1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('selection');
    });

    it('should handle active node without added vertex', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeDefined();
    });

    it('should handle path node with clique', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        clique: ['0', '1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('selection');
    });

    it('should handle path node without clique', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeDefined();
    });

    it('should handle path node with clique of size 1', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        clique: ['0'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
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

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeDefined();
    });

    it('should handle visited state without removed vertex', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('decision');
    });

    it('should handle visited state with removed vertex', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'visited',
      };

      const context: AlgorithmContext = {
        rSet: [],
        pSet: ['1'],
        xSet: ['0'],
        removedVertex: '0',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('decision');
    });

    it('should return undefined for default state without description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeUndefined();
    });

    it('should handle path node with clique of size 1', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        clique: ['0'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle path node with clique of size 2', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
      };

      const context: AlgorithmContext = {
        clique: ['0', '1'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle active node with rSetActive and addedVertex matching', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        rSet: ['0'],
        pSet: ['1'],
        xSet: [],
        addedVertex: '0',
        neighbors: ['1'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('selection');
    });

    it('should handle active node with rSetActive length 1', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        rSet: ['0'],
        pSet: ['1'],
        xSet: [],
        addedVertex: '0',
        neighbors: ['1'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle active node with empty neighbors', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        rSet: ['0'],
        pSet: [],
        xSet: [],
        addedVertex: '0',
        neighbors: [],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle active node with empty pSet and xSet', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const context: AlgorithmContext = {
        rSet: ['0'],
        pSet: [],
        xSet: [],
        addedVertex: '0',
        neighbors: ['1'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });
  });

  describe('handleHighlightEdge', () => {
    it('should handle edge without from/to', () => {
      const step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE' as const,
        edgeId: 'e0',
        state: 'path' as const,
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeUndefined();
    });

    it('should handle edge without from/to but with description', () => {
      const step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE' as const,
        edgeId: 'e0',
        state: 'path' as const,
        description: 'Some description',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch');
      expect(explanation).toBeDefined();
    });

    it('should handle path edge with clique', () => {
      const step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE' as const,
        edgeId: 'e0',
        state: 'path' as const,
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
        clique: ['0', '1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('path');
    });

    it('should handle path edge without clique', () => {
      const step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE' as const,
        edgeId: 'e0',
        state: 'path' as const,
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should handle default edge state with description', () => {
      const step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE' as const,
        edgeId: 'e0',
        state: 'visited' as const,
        description: 'Some description',
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeDefined();
    });

    it('should return undefined for default edge state without description', () => {
      const step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_EDGE' as const,
        edgeId: 'e0',
        state: 'visited' as const,
      };

      const context: AlgorithmContext = {
        edgeFrom: '0',
        edgeTo: '1',
      };

      const explanation = generator['generateExplanation'](step, 'bron-kerbosch', context);
      expect(explanation).toBeUndefined();
    });
  });
});
