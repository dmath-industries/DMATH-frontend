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

    it('should handle "Степени вершин:" with all vertices colored', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Степени вершин:\na: -\nb: -\nc: -',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
      expect(explanation?.text).toContain('все вершины уже раскрашены');
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

    it('should handle "Таблица векторов" without step number', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Таблица векторов:\nМножество вершин: {a}\nВектор: [a:0]',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
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

    it('should handle all color states', () => {
      const states = ['current', 'active', 'visited', 'path', 'candidate', 'rejected', 'default'];
      for (const state of states) {
        const step: HighlightNodeStep = {
          id: 'step1',
          timestamp: Date.now(),
          type: 'HIGHLIGHT_NODE',
          nodeId: '0',
          state: state as any,
        };

        const explanation = generator['generateExplanation'](step, 'graph-coloring');
        expect(explanation).toBeDefined();
      }
    });

    it('should handle description without color match', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Some other description',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle step without description', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle vertex color assignment without neighbors', () => {
      const step: HighlightNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'current',
        description: 'Вершина a получает Оранжевый (цвет 1)',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle final coloring with state color info', () => {
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
        description: 'Обновление цвета вершины',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle node update with label containing color', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'Вершина a (цвет 1)',
        },
      };

      const context: AlgorithmContext = {
        neighbors: ['1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('update');
    });

    it('should handle node update with label but no color match', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'Some label',
        },
        description: 'Update description',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle node update without label', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {},
        description: 'Update description',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
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

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeUndefined();
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

  describe('default case', () => {
    it('should handle step with description but no specific handler', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Some generic description',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should return undefined for step without description in default case', () => {
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

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeUndefined();
    });

    it('should handle "Таблица векторов" with step number', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Таблица векторов (Шаг 2):\nМножество вершин: {a,b}\nВектор: [a:0,b:0]',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle "Таблица векторов" with vertices set and vector', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Таблица векторов (Шаг 1):\nМножество вершин: {a}\nВектор: [a:0,b:1,c:2]',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle "Таблица векторов" without vertices set', () => {
      const step: Step = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'HIGHLIGHT_NODE',
        nodeId: '0',
        state: 'default',
        description: 'Таблица векторов (Шаг 1):\nВектор: [a:0]',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });

    it('should handle handleUpdateNode with label containing color index', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'a (цвет 1)',
        },
      };

      const context: AlgorithmContext = {
        neighbors: ['1', '2'],
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring', context);
      expect(explanation).toBeDefined();
      expect(explanation?.type).toBe('update');
    });

    it('should handle handleUpdateNode with label but no color match and description', () => {
      const step: UpdateNodeStep = {
        id: 'step1',
        timestamp: Date.now(),
        type: 'UPDATE_NODE',
        nodeId: '0',
        attrs: {
          label: 'Some label',
        },
        description: 'Update description',
      };

      const explanation = generator['generateExplanation'](step, 'graph-coloring');
      expect(explanation).toBeDefined();
    });
  });
});
