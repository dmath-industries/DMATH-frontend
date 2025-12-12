/**
 * Tests for BronKerboschStepGenerator
 */

import { BronKerboschStepGenerator } from '../steps';
import type { GraphDTO, HighlightEdgeStep, Step } from '@/types';

function buildCliqueGraph(): GraphDTO {
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

function buildDisjointGraph(): GraphDTO {
  const nodes = [
    { id: 'a', x: 0, y: 0 },
    { id: 'b', x: 1, y: 0 },
    { id: 'c', x: 2, y: 0 },
  ];
  return { nodes, edges: [] };
}

describe('BronKerboschStepGenerator', () => {
  it('должен находить клику и подсвечивать рёбра', () => {
    const generator = new BronKerboschStepGenerator();
    const steps = generator.generateSteps(buildCliqueGraph(), {});

    expect(steps.length).toBeGreaterThan(0);
    const pathEdges = steps.filter(
      (s: Step) => s.type === 'HIGHLIGHT_EDGE' && (s as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBeGreaterThan(0);
  });

  it('должен возвращать пусто для пустого графа', () => {
    const generator = new BronKerboschStepGenerator();
    const steps = generator.generateSteps({ nodes: [], edges: [] }, {});

    expect(steps).toEqual([]);
  });

  it('должен обрабатывать граф без рёбер', () => {
    const generator = new BronKerboschStepGenerator();
    const steps = generator.generateSteps(buildDisjointGraph(), {});

    expect(steps.length).toBeGreaterThan(0);
  });
});
