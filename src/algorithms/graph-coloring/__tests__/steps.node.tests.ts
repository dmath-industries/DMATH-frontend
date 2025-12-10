/**
 * Tests for GraphColoringStepGenerator
 */

import { GraphColoringStepGenerator } from '../steps';
import type { GraphDTO, HighlightNodeStep, Step } from '@/types';

function buildTriangleGraph(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0 },
    { id: '1', x: 100, y: 0 },
    { id: '2', x: 50, y: 100 },
  ];

  const edges = [
    { id: 'e01', source: '0', target: '1', directed: false },
    { id: 'e02', source: '0', target: '2', directed: false },
    { id: 'e12', source: '1', target: '2', directed: false },
  ];

  return { nodes, edges };
}

function buildPathGraph(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0 },
    { id: '1', x: 100, y: 0 },
    { id: '2', x: 200, y: 0 },
  ];

  const edges = [
    { id: 'e01', source: '0', target: '1', directed: false },
    { id: 'e12', source: '1', target: '2', directed: false },
  ];

  return { nodes, edges };
}

function buildDisjointGraph(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0 },
    { id: '1', x: 100, y: 0 },
    { id: '2', x: 200, y: 0 },
  ];
  return { nodes, edges: [] };
}

describe('GraphColoringStepGenerator', () => {
  it('должен раскрашивать треугольник (требуется 3 цвета)', () => {
    const generator = new GraphColoringStepGenerator();
    const steps = generator.generateSteps(buildTriangleGraph(), {});

    expect(steps.length).toBeGreaterThan(0);

    // Проверяем, что все вершины были раскрашены
    const nodeSteps = steps.filter((s: Step) => s.type === 'HIGHLIGHT_NODE') as HighlightNodeStep[];

    expect(nodeSteps.length).toBeGreaterThanOrEqual(3);

    // Проверяем, что есть шаги с разными состояниями (цветами)
    const states = new Set(nodeSteps.map(s => s.state));
    expect(states.size).toBeGreaterThan(1);
  });

  it('должен раскрашивать путь (требуется 2 цвета)', () => {
    const generator = new GraphColoringStepGenerator();
    const steps = generator.generateSteps(buildPathGraph(), {});

    expect(steps.length).toBeGreaterThan(0);

    const nodeSteps = steps.filter((s: Step) => s.type === 'HIGHLIGHT_NODE') as HighlightNodeStep[];

    expect(nodeSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('должен возвращать пусто для пустого графа', () => {
    const generator = new GraphColoringStepGenerator();
    const steps = generator.generateSteps({ nodes: [], edges: [] }, {});

    expect(steps).toEqual([]);
  });

  it('должен обрабатывать граф без рёбер (все вершины одного цвета)', () => {
    const generator = new GraphColoringStepGenerator();
    const steps = generator.generateSteps(buildDisjointGraph(), {});

    expect(steps.length).toBeGreaterThan(0);

    // Все вершины могут быть одного цвета, так как нет рёбер
    const nodeSteps = steps.filter((s: Step) => s.type === 'HIGHLIGHT_NODE') as HighlightNodeStep[];

    expect(nodeSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('должен генерировать шаги с описаниями', () => {
    const generator = new GraphColoringStepGenerator();
    const steps = generator.generateSteps(buildTriangleGraph(), {});

    const nodeSteps = steps.filter((s: Step) => s.type === 'HIGHLIGHT_NODE') as HighlightNodeStep[];

    // Проверяем, что есть описания
    const stepsWithDescription = nodeSteps.filter(s => s.description);
    expect(stepsWithDescription.length).toBeGreaterThan(0);
  });

  it('должен использовать эвристический алгоритм с таблицей векторов', () => {
    const generator = new GraphColoringStepGenerator();
    const steps = generator.generateSteps(buildTriangleGraph(), {});

    // Проверяем, что есть информационные шаги (описания алгоритма)
    const infoSteps = steps.filter(s => {
      const nodeStep = s as HighlightNodeStep;
      return (
        nodeStep.description &&
        (nodeStep.description.includes('Шаг') ||
          nodeStep.description.includes('Степени') ||
          nodeStep.description.includes('Таблица векторов') ||
          nodeStep.description.includes('Хроматическое число'))
      );
    });

    expect(infoSteps.length).toBeGreaterThan(0);
  });
});
