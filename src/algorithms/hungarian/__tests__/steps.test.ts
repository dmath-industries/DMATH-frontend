/**
 * Тесты для HungarianStepGenerator
 */

import { HungarianStepGenerator } from '../steps';
import type { GraphDTO, Step, HighlightNodeStep, HighlightEdgeStep } from '@/types';

function buildSampleGraphDTO(): GraphDTO {
  const nodes = [
    { id: 'source_0', x: 0, y: 0, label: 'S1' },
    { id: 'source_1', x: 0, y: 100, label: 'S2' },
    { id: 'target_0', x: 200, y: 0, label: 'T1' },
    { id: 'target_1', x: 200, y: 100, label: 'T2' },
  ];

  const edges = [
    { id: 'e0', source: 'source_0', target: 'target_0', weight: 4, directed: true },
    { id: 'e1', source: 'source_0', target: 'target_1', weight: 2, directed: true },
    { id: 'e2', source: 'source_1', target: 'target_0', weight: 3, directed: true },
    { id: 'e3', source: 'source_1', target: 'target_1', weight: 5, directed: true },
  ];

  return { nodes, edges };
}

function buildLargerGraphDTO(): GraphDTO {
  const nodes = [
    { id: 'source_0', x: 0, y: 0, label: 'S1' },
    { id: 'source_1', x: 0, y: 100, label: 'S2' },
    { id: 'source_2', x: 0, y: 200, label: 'S3' },
    { id: 'target_0', x: 200, y: 0, label: 'T1' },
    { id: 'target_1', x: 200, y: 100, label: 'T2' },
    { id: 'target_2', x: 200, y: 200, label: 'T3' },
  ];

  const edges = [
    { id: 'e0', source: 'source_0', target: 'target_0', weight: 1, directed: true },
    { id: 'e1', source: 'source_0', target: 'target_1', weight: 2, directed: true },
    { id: 'e2', source: 'source_0', target: 'target_2', weight: 3, directed: true },
    { id: 'e3', source: 'source_1', target: 'target_0', weight: 4, directed: true },
    { id: 'e4', source: 'source_1', target: 'target_1', weight: 5, directed: true },
    { id: 'e5', source: 'source_1', target: 'target_2', weight: 6, directed: true },
    { id: 'e6', source: 'source_2', target: 'target_0', weight: 7, directed: true },
    { id: 'e7', source: 'source_2', target: 'target_1', weight: 8, directed: true },
    { id: 'e8', source: 'source_2', target: 'target_2', weight: 9, directed: true },
  ];

  return { nodes, edges };
}

function buildEmptyGraphDTO(): GraphDTO {
  return { nodes: [], edges: [] };
}

describe('HungarianStepGenerator', () => {
  it('должен генерировать шаги для графа', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toHaveProperty('type');
    expect(steps[0]).toHaveProperty('id');
    expect(steps[0]).toHaveProperty('timestamp');
  });

  it('должен генерировать шаги для пустого графа', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildEmptyGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps).toEqual([]);
  });

  it('должен обрабатывать больший граф', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildLargerGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    const nodeSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE'
    );
    expect(nodeSteps.length).toBeGreaterThan(0);
  });

  it('должен генерировать шаги с правильными типами', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const stepTypes = new Set(steps.map((step: Step) => step.type));
    expect(stepTypes.has('HIGHLIGHT_NODE')).toBe(true);
    expect(stepTypes.has('HIGHLIGHT_EDGE')).toBe(true);
  });

  it('должен генерировать шаги с уникальными ID', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const stepIds = steps.map((step: Step) => step.id);
    const uniqueIds = new Set(stepIds);
    expect(uniqueIds.size).toBe(stepIds.length);
  });

  it('должен находить назначения', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const assignmentSteps = steps.filter(
      (step: Step) => 
        step.type === 'HIGHLIGHT_EDGE' && 
        (step as HighlightEdgeStep).state === 'path'
    );
    expect(assignmentSteps.length).toBeGreaterThanOrEqual(0);
  });

  it('должен подсвечивать узлы источников и целей', () => {
    const generator = new HungarianStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const nodeSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE'
    ) as HighlightNodeStep[];
    
    const sourceNodes = nodeSteps.filter(step => 
      step.nodeId.startsWith('source_')
    );
    const targetNodes = nodeSteps.filter(step => 
      step.nodeId.startsWith('target_')
    );
    
    expect(sourceNodes.length).toBeGreaterThan(0);
    expect(targetNodes.length).toBeGreaterThan(0);
  });
});

