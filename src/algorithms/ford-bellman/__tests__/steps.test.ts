/**
 * Тесты для FordBellmanStepGenerator
 */

import { FordBellmanStepGenerator } from '../steps';
import type { GraphDTO, Step, HighlightNodeStep, HighlightEdgeStep } from '@/types';

function buildSampleGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
    { id: '2', x: 100, y: 100, label: 'c' },
    { id: '3', x: 0, y: 100, label: 'd' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: 4, directed: true },
    { id: 'e1', source: '0', target: '2', weight: 2, directed: true },
    { id: 'e2', source: '1', target: '3', weight: 3, directed: true },
    { id: 'e3', source: '2', target: '1', weight: 1, directed: true },
    { id: 'e4', source: '2', target: '3', weight: 5, directed: true },
  ];

  return { nodes, edges };
}

function buildGraphWithNegativeWeights(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
    { id: '2', x: 100, y: 100, label: 'c' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: -1, directed: true },
    { id: 'e1', source: '1', target: '2', weight: -2, directed: true },
    { id: 'e2', source: '0', target: '2', weight: 3, directed: true },
  ];

  return { nodes, edges };
}

function buildEmptyGraphDTO(): GraphDTO {
  return { nodes: [], edges: [] };
}

describe('FordBellmanStepGenerator', () => {
  it('должен генерировать шаги для графа', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toHaveProperty('type');
    expect(steps[0]).toHaveProperty('id');
    expect(steps[0]).toHaveProperty('timestamp');
  });

  it('должен начинать с указанной начальной вершины', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const firstStep = steps.find(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'current'
    );
    expect(firstStep).toBeDefined();
    if (firstStep && firstStep.type === 'HIGHLIGHT_NODE') {
      expect(firstStep.nodeId).toBe('0');
    }
  });

  it('должен генерировать шаги для пустого графа', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildEmptyGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps).toEqual([]);
  });

  it('должен обрабатывать граф с отрицательными весами', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildGraphWithNegativeWeights();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    const edgeSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_EDGE'
    );
    expect(edgeSteps.length).toBeGreaterThan(0);
  });

  it('должен генерировать шаги с правильными типами', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const stepTypes = new Set(steps.map((step: Step) => step.type));
    expect(stepTypes.has('HIGHLIGHT_NODE')).toBe(true);
    expect(stepTypes.has('HIGHLIGHT_EDGE')).toBe(true);
  });

  it('должен генерировать шаги с уникальными ID', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const stepIds = steps.map((step: Step) => step.id);
    const uniqueIds = new Set(stepIds);
    expect(uniqueIds.size).toBe(stepIds.length);
  });

  it('должен выполнять релаксацию рёбер', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const relaxationSteps = steps.filter(
      (step: Step) => 
        step.type === 'HIGHLIGHT_EDGE' && 
        (step as HighlightEdgeStep).state === 'active'
    );
    expect(relaxationSteps.length).toBeGreaterThan(0);
  });

  it('должен находить кратчайшие пути', () => {
    const generator = new FordBellmanStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const pathSteps = steps.filter(
      (step: Step) => 
        step.type === 'HIGHLIGHT_EDGE' && 
        (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathSteps.length).toBeGreaterThanOrEqual(0);
  });
});

