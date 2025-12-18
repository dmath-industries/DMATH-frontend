import { GraphColoringExplanationGenerator } from '../algorithm-specific/GraphColoringExplanationGenerator';
import type { Step, HighlightNodeStep, UpdateNodeStep } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

describe('GraphColoringExplanationGenerator', () => {
  let generator: GraphColoringExplanationGenerator;

  beforeEach(() => {
    generator = new GraphColoringExplanationGenerator();
  });

  describe('handleInfoStep', () => {
    it('should handle "Шаг N" description', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Шаг 1',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('iteration');
      expect(explanation?.text).toContain('Итерация 1');
    });

    it('should handle "Степени вершин:" description', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Степени вершин:\na: 2\nb: 3\nc: 1',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('comparison');
      expect(explanation?.text).toContain('Вычисляем степени вершин');
    });

    it('should handle "Таблица векторов" description', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Таблица векторов (Шаг 1):\nМножество вершин: {a}\nВектор: [a:0,b:1]',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('matrix');
    });

    it('should handle "Хроматическое число графа: N" description', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Хроматическое число графа: 3',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('general');
      expect(explanation?.text).toContain('Хроматическое число графа: 3');
    });
  });

  describe('handleHighlightNode', () => {
    it('should handle vertex color assignment', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
        description: 'Вершина a получает Оранжевый (цвет 1)',
      };

      const context: AlgorithmContext = {
        neighbors: ['1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('update');
      expect(explanation?.text).toContain('Вершине a присвоен Оранжевый цвет');
    });

    it('should handle final coloring', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'path',
        description: 'Финальная раскраска: a - Зелёный',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('path');
      expect(explanation?.text).toContain('Финальная раскраска');
    });

    it('should handle state-based coloring', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'active',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('update');
      expect(explanation?.text).toContain('Жёлтый цвет');
    });
  });

  describe('handleUpdateNode', () => {
    it('should handle node update with color', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          color: '#ffffff',
        },
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });
  });

  describe('getColorName', () => {
    it('should return correct color name for index', () => {
      const colorName1 = generator['getColorName'](1);
      expect(colorName1).toBe('Оранжевый');

      const colorName2 = generator['getColorName'](2);
      expect(colorName2).toBe('Жёлтый');

      const colorName7 = generator['getColorName'](7);
      expect(colorName7).toBe('Белый');
    });

    it('should return default for invalid index', () => {
      const colorName = generator['getColorName'](10);
      expect(colorName).toContain('Цвет 10');
    });
  });
});
