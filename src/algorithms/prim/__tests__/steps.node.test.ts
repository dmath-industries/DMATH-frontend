/**
 * Tests for PrimStepGenerator
 */

import { PrimStepGenerator } from '../steps';
import type { GraphDTO, HighlightEdgeStep, Step } from '@/types';

function buildConnectedGraph(): GraphDTO {
  return {
    nodes: [
      { id: '0', x: 0, y: 0, label: 'a' },
      { id: '1', x: 100, y: 0, label: 'b' },
      { id: '2', x: 50, y: 100, label: 'c' },
    ],
    edges: [
      { id: 'e0', source: '0', target: '1', weight: 1, directed: false },
      { id: 'e1', source: '1', target: '2', weight: 2, directed: false },
      { id: 'e2', source: '0', target: '2', weight: 3, directed: false },
    ],
  };
}

function buildDisconnectedGraph(): GraphDTO {
  return {
    nodes: [
      { id: '0', x: 0, y: 0, label: 'a' },
      { id: '1', x: 100, y: 0, label: 'b' },
      { id: '2', x: 200, y: 0, label: 'c' },
    ],
    edges: [{ id: 'e0', source: '0', target: '1', weight: 1, directed: false }],
  };
}

describe('PrimStepGenerator', () => {
  it('должен генерировать шаги и собирать MST из N-1 рёбер', () => {
    const generator = new PrimStepGenerator();
    const graphDTO = buildConnectedGraph();

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);

    const pathEdges = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
  });

  it('должен начинать с указанной стартовой вершины', () => {
    const generator = new PrimStepGenerator();
    const graphDTO = buildConnectedGraph();

    const steps = generator.generateSteps(graphDTO, { startNode: '2' });

    const firstStep = steps[0];
    expect(firstStep).toBeDefined();
    if (firstStep && firstStep.type === 'HIGHLIGHT_NODE') {
      expect(firstStep.nodeId).toBe('2');
      expect(firstStep.state).toBe('current');
    }
  });

  it('должен возвращать пустой список шагов для пустого графа', () => {
    const generator = new PrimStepGenerator();
    const steps = generator.generateSteps({ nodes: [], edges: [] }, {});

    expect(steps).toEqual([]);
  });

  it('должен помечать несвязный граф', () => {
    const generator = new PrimStepGenerator();
    const graphDTO = buildDisconnectedGraph();

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const rejectedSteps = steps.filter(
      step => step.type === 'HIGHLIGHT_NODE' && step.state === 'rejected'
    );

    expect(rejectedSteps.length).toBeGreaterThan(0);
  });
});
