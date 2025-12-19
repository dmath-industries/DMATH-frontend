import { createExplanation, GeneralTemplates } from '../templates';
import type { ExplanationType } from '@/types';

describe('templates', () => {
  describe('createExplanation', () => {
    it('should create explanation with interpolation', () => {
      const result = createExplanation('general', 'Hello {name}', { name: 'World' });
      expect(result.type).toBe('general');
      expect(result.text).toBe('Hello World');
    });

    it('should handle missing context values', () => {
      const result = createExplanation('general', 'Hello {name}', {});
      expect(result.text).toBe('Hello {name}');
    });

    it('should handle multiple placeholders', () => {
      const result = createExplanation('iteration', 'Iteration {n} of {total}', {
        n: 1,
        total: 10,
      });
      expect(result.type).toBe('iteration');
      expect(result.text).toBe('Iteration 1 of 10');
    });

    it('should handle number values', () => {
      const result = createExplanation('update', 'Value: {value}', { value: 42 });
      expect(result.text).toBe('Value: 42');
    });
  });

  describe('GeneralTemplates', () => {
    it('should contain all template types', () => {
      expect(GeneralTemplates.initialization).toBeDefined();
      expect(GeneralTemplates.iteration).toBeDefined();
      expect(GeneralTemplates.selection).toBeDefined();
      expect(GeneralTemplates.update).toBeDefined();
      expect(GeneralTemplates.comparison).toBeDefined();
      expect(GeneralTemplates.decision).toBeDefined();
      expect(GeneralTemplates.completion).toBeDefined();
    });
  });
});
