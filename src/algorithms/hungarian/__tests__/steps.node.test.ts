/**
 * Tests for HungarianStepGenerator
 */

import { HungarianStepGenerator, hungarian } from '../steps';
import type { GraphDTO, HighlightEdgeStep, Step } from '@/types';

function buildSquareCostGraph(): GraphDTO {
  const nodes = [
    { id: 'source_0', x: 0, y: 0, label: 'a' },
    { id: 'source_1', x: 100, y: 0, label: 'b' },
    { id: 'source_2', x: 200, y: 0, label: 'c' },
    { id: 'target_0', x: 0, y: 100, label: 'A' },
    { id: 'target_1', x: 100, y: 100, label: 'B' },
    { id: 'target_2', x: 200, y: 100, label: 'C' },
  ];

  const edges = [
    { id: 'e0', source: 'source_0', target: 'target_0', weight: 4 },
    { id: 'e1', source: 'source_0', target: 'target_1', weight: 1 },
    { id: 'e2', source: 'source_0', target: 'target_2', weight: 3 },
    { id: 'e3', source: 'source_1', target: 'target_0', weight: 2 },
    { id: 'e4', source: 'source_1', target: 'target_1', weight: 0 },
    { id: 'e5', source: 'source_1', target: 'target_2', weight: 5 },
    { id: 'e6', source: 'source_2', target: 'target_0', weight: 3 },
    { id: 'e7', source: 'source_2', target: 'target_1', weight: 2 },
    { id: 'e8', source: 'source_2', target: 'target_2', weight: 2 },
  ];

  return { nodes, edges };
}

describe('HungarianStepGenerator', () => {
  it('должен генерировать шаги для квадратной матрицы', () => {
    const generator = new HungarianStepGenerator();
    const steps = generator.generateSteps(buildSquareCostGraph(), {});

    expect(steps.length).toBeGreaterThan(0);
  });

  it('должен создавать назначения по количеству вершин', () => {
    const generator = new HungarianStepGenerator();
    const steps = generator.generateSteps(buildSquareCostGraph(), {});

    const pathEdges = steps.filter(
      (s: Step) => s.type === 'HIGHLIGHT_EDGE' && (s as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(3);
  });

  it('должен возвращать пусто для пустого графа', () => {
    const generator = new HungarianStepGenerator();
    const steps = generator.generateSteps({ nodes: [], edges: [] }, {});

    expect(steps).toEqual([]);
  });

  it('должен возвращать пусто если в строке нет конечных весов', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: 'source_0', x: 0, y: 0 },
        { id: 'target_0', x: 1, y: 0 },
      ],
      edges: [
        {
          id: 'e0',
          source: 'source_0',
          target: 'target_0',
          weight: Number.POSITIVE_INFINITY,
          directed: true,
        },
      ],
    };

    const steps = generator.generateSteps(graphDTO, {});
    const pathEdges = steps.filter(
      (s: Step) => s.type === 'HIGHLIGHT_EDGE' && (s as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(0);
  });

  it('должен поддерживать числовые string-идентификаторы', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '10', x: 1, y: 0 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '10', weight: 1, directed: true },
        { id: 'e1', source: '10', target: '0', weight: 1, directed: true },
      ],
    };

    const steps = generator.generateSteps(graphDTO, {});
    expect(steps.length).toBeGreaterThan(0);
  });

  it('должен поддерживать нечисловые идентификаторы', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: 'row', x: 0, y: 0 },
        { id: 'col', x: 1, y: 0 },
      ],
      edges: [
        { id: 'e0', source: 'row', target: 'col', weight: 3, directed: true },
        { id: 'e1', source: 'col', target: 'row', weight: 4, directed: true },
      ],
    };

    const steps = generator.generateSteps(graphDTO, {});
    expect(steps.length).toBeGreaterThan(0);
  });

  it('hungarian должен возвращать пусто для пустой матрицы', () => {
    expect(hungarian([])).toEqual([]);
  });

  it('hungarian должен возвращать пусто для неквадратной матрицы', () => {
    expect(
      hungarian([
        [1, 2, 3],
        [4, 5, 6],
      ])
    ).toEqual([]);
  });
});
