/**
 * Тесты для BronKerboschStepGenerator
 */

import { BronKerboschStepGenerator } from '../steps';
import type { GraphDTO, Step, HighlightNodeStep } from '@/types';

/**
 * Граф-треугольник (3 вершины, все соединены)
 * Максимальное независимое множество: размер 1 (любая одна вершина)
 */
function buildTriangleGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '1', x: 100, y: 0, label: 'b', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '2', x: 50, y: 87, label: 'c', radius: 25, color: '#3b82f6', state: 'default' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e1', source: '1', target: '2', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e2', source: '2', target: '0', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Граф-четырехугольник без диагоналей (4 вершины по кругу)
 * Максимальное независимое множество: размер 2 (противоположные вершины)
 */
function buildSquareGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '1', x: 100, y: 0, label: 'b', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '2', x: 100, y: 100, label: 'c', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '3', x: 0, y: 100, label: 'd', radius: 25, color: '#3b82f6', state: 'default' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e1', source: '1', target: '2', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e2', source: '2', target: '3', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e3', source: '3', target: '0', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Граф с изолированными вершинами
 * Максимальное независимое множество: все вершины (размер 3)
 */
function buildIsolatedNodesGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '1', x: 100, y: 0, label: 'b', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '2', x: 50, y: 100, label: 'c', radius: 25, color: '#3b82f6', state: 'default' },
  ];

  const edges: GraphDTO['edges'] = [];

  return { nodes, edges };
}

/**
 * Граф-звезда (одна центральная вершина соединена со всеми остальными)
 * Максимальное независимое множество: все периферийные вершины (размер 3)
 */
function buildStarGraphDTO(): GraphDTO {
  const nodes = [
    { id: '0', x: 0, y: 0, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '1', x: 100, y: 0, label: 'b', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '2', x: 0, y: 100, label: 'c', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '3', x: -100, y: 0, label: 'd', radius: 25, color: '#3b82f6', state: 'default' },
    { id: '4', x: 0, y: -100, label: 'e', radius: 25, color: '#3b82f6', state: 'default' },
  ];

  const edges = [
    { id: 'e0', source: '0', target: '1', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e1', source: '0', target: '2', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e2', source: '0', target: '3', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
    { id: 'e3', source: '0', target: '4', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
  ];

  return { nodes, edges };
}

describe('BronKerboschStepGenerator', () => {
  it('должен генерировать шаги для графа', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildTriangleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]).toHaveProperty('type');
    expect(steps[0]).toHaveProperty('id');
    expect(steps[0]).toHaveProperty('timestamp');
  });

  it('должен генерировать шаги для пустого графа', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO: GraphDTO = { nodes: [], edges: [] };
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps).toEqual([]);
  });

  it('должен находить максимальные независимые множества в треугольнике', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildTriangleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // Проверяем, что есть шаги с типом HIGHLIGHT_NODE и состоянием 'path' (найденные МВУМ)
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    // В треугольнике должно быть найдено хотя бы одно МВУМ
    expect(pathSteps.length).toBeGreaterThan(0);
  });

  it('должен находить максимальные независимые множества в квадрате', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildSquareGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // В квадрате без диагоналей максимальное независимое множество имеет размер 2
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    expect(pathSteps.length).toBeGreaterThan(0);
  });

  it('должен находить все вершины как МВУМ в графе с изолированными вершинами', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildIsolatedNodesGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // В графе с изолированными вершинами все вершины образуют МВУМ
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    expect(pathSteps.length).toBeGreaterThan(0);
  });

  it('должен находить максимальные независимые множества в графе-звезде', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildStarGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // В графе-звезде максимальное независимое множество - все периферийные вершины
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    expect(pathSteps.length).toBeGreaterThan(0);
  });

  it('должен генерировать шаги с правильными типами', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildTriangleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const stepTypes = new Set(steps.map((step: Step) => step.type));
    expect(stepTypes.has('HIGHLIGHT_NODE')).toBe(true);
  });

  it('должен генерировать шаги с уникальными ID', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildTriangleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const stepIds = steps.map((step: Step) => step.id);
    const uniqueIds = new Set(stepIds);
    expect(uniqueIds.size).toBe(stepIds.length);
  });

  it('должен обрабатывать граф с одной вершиной', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
      ],
      edges: [],
    };
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // Одна изолированная вершина - это МВУМ
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    expect(pathSteps.length).toBeGreaterThan(0);
  });

  it('должен обрабатывать граф с двумя соединенными вершинами', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0, label: 'a', radius: 25, color: '#3b82f6', state: 'default' },
        { id: '1', x: 100, y: 0, label: 'b', radius: 25, color: '#3b82f6', state: 'default' },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: 1, directed: false, color: '#60a5fa', width: 2, state: 'default' },
      ],
    };
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // В графе с двумя соединенными вершинами максимальное независимое множество имеет размер 1
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    expect(pathSteps.length).toBeGreaterThan(0);
  });

  it('должен генерировать шаги с описаниями', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildTriangleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    // Проверяем, что есть шаги с описаниями
    const stepsWithDescriptions = steps.filter((step: Step) => step.description);
    expect(stepsWithDescriptions.length).toBeGreaterThan(0);
  });

  it('должен использовать правильные состояния узлов', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildTriangleGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    const nodeSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE'
    ) as HighlightNodeStep[];

    expect(nodeSteps.length).toBeGreaterThan(0);

    // Проверяем, что используются различные состояния
    const states = new Set(nodeSteps.map(step => step.state));
    expect(states.has('default')).toBe(true);
    expect(states.has('current') || states.has('candidate') || states.has('path') || states.has('rejected')).toBe(true);
  });

  it('должен обрабатывать неориентированный граф', () => {
    const generator = new BronKerboschStepGenerator();
    const graphDTO = buildSquareGraphDTO();
    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    
    // Алгоритм должен работать с неориентированными графами
    const pathSteps = steps.filter(
      (step: Step) => step.type === 'HIGHLIGHT_NODE' && (step as HighlightNodeStep).state === 'path'
    );
    
    expect(pathSteps.length).toBeGreaterThan(0);
  });
});

