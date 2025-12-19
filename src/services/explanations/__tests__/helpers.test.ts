import { enrichStepWithExplanation } from '../helpers';
import type { Step, HighlightNodeStep } from '@/types';
import { explanationGeneratorRegistry } from '../ExplanationGenerator';
import { GraphColoringExplanationGenerator } from '../algorithm-specific/GraphColoringExplanationGenerator';

describe('helpers', () => {
  beforeEach(() => {
    explanationGeneratorRegistry.register(
      'test-algorithm',
      new GraphColoringExplanationGenerator()
    );
  });

  afterEach(() => {
    explanationGeneratorRegistry['generators'].clear();
  });

  describe('enrichStepWithExplanation', () => {
    it('should not overwrite existing explanation', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        explanation: {
          type: 'general',
          text: 'Existing explanation',
        },
      };

      const result = enrichStepWithExplanation(step, 'test-algorithm');
      expect(result.explanation?.text).toBe('Existing explanation');
    });

    it('should add explanation if not present', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Шаг 1',
      };

      const result = enrichStepWithExplanation(step, 'test-algorithm');
      expect(result.explanation).toBeDefined();
    });

    it('should return step unchanged if no generator found', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
      };

      const result = enrichStepWithExplanation(step, 'non-existent-algorithm');
      expect(result.explanation).toBeUndefined();
    });
  });
});
