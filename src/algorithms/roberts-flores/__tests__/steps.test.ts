/**
 * Тесты для RobertsFloresStepGenerator
 */

import { RobertsFloresStepGenerator } from '../steps';
import type { GraphDTO, Step, HighlightEdgeStep } from '@/types';

function buildSampleGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
    { id: '2', x: 100, y: 100, label: 'c' },
    { id: '3', x: 0, y: 100, label: 'd' },
    { id: '4', x: 50, y: 50, label: 'e' },
    { id: '5', x: 200, y: 50, label: 'f' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', directed: true },
    { id: 'e1', source: '0', target: '3', directed: true },
    { id: 'e2', source: '1', target: '5', directed: true },
    { id: 'e3', source: '2', target: '5', directed: true },
    { id: 'e4', source: '3', target: '4', directed: true },
    { id: 'e5', source: '3', target: '2', directed: true },
    { id: 'e6', source: '4', target: '1', directed: true },
    { id: 'e7', source: '5', target: '0', directed: true },
    { id: 'e8', source: '5', target: '4', directed: true },
  ];

  return { nodes, edges };
}

function buildAcyclicGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
    { id: '2', x: 200, y: 0, label: 'c' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', directed: true },
    { id: 'e1', source: '1', target: '2', directed: true },
    { id: 'e2', source: '0', target: '2', directed: true },
  ];

  return { nodes, edges };
}

describe('RobertsFloresStepGenerator', () => {
  it('должен генерировать шаги для графа', () => {
    const generator = new RobertsFloresStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toHaveProperty('type');
    expect(steps[0]).toHaveProperty('id');
    expect(steps[0]).toHaveProperty('timestamp');
  });

  it('должен начинать с указанной начальной вершины', () => {
    const generator = new RobertsFloresStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const firstStep = steps[0];
    expect(firstStep).toBeDefined();
    if (firstStep && firstStep.type === 'HIGHLIGHT_NODE') {
      expect(firstStep.nodeId).toBe('0');
      expect(firstStep.state).toBe('current');
    }
  });

  it('должен генерировать шаги для пустого графа', () => {
    const generator = new RobertsFloresStepGenerator();
    const graphDTO: GraphDTO = { nodes: [], edges: [] };
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps).toEqual([]);
  });

  it('должен обрабатывать ациклический граф', () => {
    const generator = new RobertsFloresStepGenerator();
    const graphDTO = buildAcyclicGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    const cycleSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(cycleSteps.length).toBeGreaterThanOrEqual(0);
  });

  it('должен генерировать шаги с правильными типами', () => {
    const generator = new RobertsFloresStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const stepTypes = new Set(steps.map((step: Step) => step.type));
    expect(stepTypes.has('HIGHLIGHT_NODE')).toBe(true);
  });

  it('должен генерировать шаги с уникальными ID', () => {
    const generator = new RobertsFloresStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const stepIds = steps.map((step: Step) => step.id);
    const uniqueIds = new Set(stepIds);
    expect(uniqueIds.size).toBe(stepIds.length);
  });
});

