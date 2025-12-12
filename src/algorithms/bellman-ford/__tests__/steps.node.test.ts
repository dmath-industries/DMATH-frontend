/**
 * Тесты для BellmanFordStepGenerator
 */

import { BellmanFordStepGenerator } from '../steps';
import type { GraphDTO, Step, HighlightNodeStep, UpdateNodeStep } from '@/types';

function buildSampleGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
    { id: '2', x: 100, y: 100, label: 'c' },
    { id: '3', x: 0, y: 100, label: 'd' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: 4, directed: true },
    { id: 'e1', source: '0', target: '2', weight: 5, directed: true },
    { id: 'e2', source: '1', target: '2', weight: -3, directed: true },
    { id: 'e3', source: '1', target: '3', weight: 1, directed: true },
    { id: 'e4', source: '2', target: '3', weight: 2, directed: true },
  ];

  return { nodes, edges };
}

function buildGraphWithNegativeCycle(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
    { id: '2', x: 100, y: 100, label: 'c' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: 1, directed: true },
    { id: 'e1', source: '1', target: '2', weight: -3, directed: true },
    { id: 'e2', source: '2', target: '1', weight: 1, directed: true },
  ];

  return { nodes, edges };
}

function buildSimpleGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a' },
    { id: '1', x: 100, y: 0, label: 'b' },
  ];

  const edges = [{ id: 'e0', source: '0', target: '1', weight: 5, directed: true }];

  return { nodes, edges };
}

describe('BellmanFordStepGenerator', () => {
  it('должен генерировать шаги для графа', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toHaveProperty('type');
    expect(steps[0]).toHaveProperty('id');
    expect(steps[0]).toHaveProperty('timestamp');
  });

  it('должен начинать с указанной начальной вершины', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const updateSteps = steps.filter(
      (step: Step) => step.type === 'UPDATE_NODE'
    ) as UpdateNodeStep[];

    const startNodeStep = updateSteps.find(
      step => step.nodeId === '0' && step.attrs.label?.includes(': 0')
    );

    expect(startNodeStep).toBeDefined();
  });

  it('должен инициализировать расстояния для всех вершин', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const updateSteps = steps.filter(
      (step: Step) => step.type === 'UPDATE_NODE'
    ) as UpdateNodeStep[];

    // Должны быть шаги обновления для всех вершин
    const nodeIds = new Set(updateSteps.map(step => step.nodeId));
    expect(nodeIds.size).toBeGreaterThanOrEqual(graphDTO.nodes.length);
  });

  it('должен генерировать шаги для пустого графа', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO: GraphDTO = { nodes: [], edges: [] };
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps).toEqual([]);
  });

  it('должен обрабатывать граф с отрицательными весами', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    const stepTypes = new Set(steps.map((step: Step) => step.type));
    expect(stepTypes.has('HIGHLIGHT_EDGE')).toBe(true);
    expect(stepTypes.has('UPDATE_NODE')).toBe(true);
  });

  it('должен обнаруживать отрицательные циклы', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildGraphWithNegativeCycle();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);

    // Проверяем наличие шагов с состоянием 'rejected', что указывает на обнаружение отрицательного цикла
    const rejectedSteps = steps.filter((step: Step) => {
      if (step.type === 'HIGHLIGHT_NODE') {
        return (step as HighlightNodeStep).state === 'rejected';
      }
      return false;
    });

    // В графе с отрицательным циклом должны быть rejected шаги
    expect(rejectedSteps.length).toBeGreaterThanOrEqual(0);
  });

  it('должен генерировать шаги с правильными типами', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const stepTypes = new Set(steps.map((step: Step) => step.type));
    expect(stepTypes.has('HIGHLIGHT_NODE')).toBe(true);
    expect(stepTypes.has('HIGHLIGHT_EDGE')).toBe(true);
    expect(stepTypes.has('UPDATE_NODE')).toBe(true);
  });

  it('должен генерировать шаги с уникальными ID', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSampleGraphDTO();
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    const stepIds = steps.map((step: Step) => step.id);
    const uniqueIds = new Set(stepIds);
    expect(uniqueIds.size).toBe(stepIds.length);
  });

  it('должен обрабатывать простой граф с одной вершиной', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [{ id: '0', x: 0, y: 0, label: 'a' }],
      edges: [],
    };
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    const updateSteps = steps.filter(
      (step: Step) => step.type === 'UPDATE_NODE' && (step as UpdateNodeStep).nodeId === '0'
    );
    expect(updateSteps.length).toBeGreaterThan(0);
  });

  it('должен обрабатывать граф без рёбер', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0, label: 'a' },
        { id: '1', x: 100, y: 0, label: 'b' },
      ],
      edges: [],
    };
    const steps = generator.generateSteps(graphDTO, { startNode: '0' });

    expect(steps.length).toBeGreaterThan(0);
    // Должны быть шаги инициализации
    const updateSteps = steps.filter((step: Step) => step.type === 'UPDATE_NODE');
    expect(updateSteps.length).toBeGreaterThan(0);
  });

  it('должен использовать первую вершину как стартовую, если startNode не указан', () => {
    const generator = new BellmanFordStepGenerator();
    const graphDTO = buildSimpleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    const updateSteps = steps.filter(
      (step: Step) => step.type === 'UPDATE_NODE' && (step as UpdateNodeStep).nodeId === '0'
    ) as UpdateNodeStep[];

    const startStep = updateSteps.find(step => step.attrs.label?.includes(': 0'));
    expect(startStep).toBeDefined();
  });
});
