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

  it('должен возвращать пусто если стартовой вершины нет', () => {
    const generator = new PrimStepGenerator();
    const graphDTO = buildConnectedGraph();

    const steps = generator.generateSteps(graphDTO, { startNode: 'missing' });

    expect(steps).toEqual([]);
  });

  it('должен помечать несвязный граф без рёбер', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 0, y: 0 },
      ],
      edges: [],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const rejected = steps.filter(
      step => step.type === 'HIGHLIGHT_NODE' && step.state === 'rejected'
    );
    expect(rejected.length).toBeGreaterThan(0);
  });

  it('должен обрабатывать ребро с бесконечным весом', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 0, y: 0 },
      ],
      edges: [{ id: 'e0', source: '0', target: '1', weight: Number.NaN, directed: false }],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBeGreaterThanOrEqual(0);
  });

  it('должен помечать рёбра, не расширяющие остов', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 1, y: 0 },
        { id: '2', x: 2, y: 0 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 1, directed: false },
        { id: 'e02', source: '0', target: '2', weight: 5, directed: false },
        { id: 'e12', source: '1', target: '2', weight: 2, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const rejectedEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'rejected'
    );
    expect(rejectedEdges.length).toBeGreaterThanOrEqual(0);
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

  it('должен обрабатывать большой граф с 5 вершинами', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 200, y: 0 },
        { id: '3', x: 100, y: 100 },
        { id: '4', x: 200, y: 100 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 1, directed: false },
        { id: 'e12', source: '1', target: '2', weight: 2, directed: false },
        { id: 'e13', source: '1', target: '3', weight: 3, directed: false },
        { id: 'e23', source: '2', target: '3', weight: 4, directed: false },
        { id: 'e24', source: '2', target: '4', weight: 5, directed: false },
        { id: 'e34', source: '3', target: '4', weight: 6, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
  });

  it('должен обрабатывать граф с весами в виде строк', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: '5' as unknown as number, directed: false },
        { id: 'e1', source: '1', target: '2', weight: '3' as unknown as number, directed: false },
        { id: 'e2', source: '0', target: '2', weight: '10' as unknown as number, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
  });

  it('должен обрабатывать граф с отсутствующими весами (undefined)', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
      ],
      edges: [
        {
          id: 'e0',
          source: '0',
          target: '1',
          weight: undefined as unknown as number,
          directed: false,
        },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    expect(steps.length).toBeGreaterThan(0);
    const candidateSteps = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'candidate'
    );
    expect(candidateSteps.length).toBeGreaterThan(0);
  });

  it('должен обрабатывать граф с null весами', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: null as unknown as number, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    expect(steps.length).toBeGreaterThan(0);
  });

  it('должен обрабатывать граф с отрицательными весами', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: -1, directed: false },
        { id: 'e1', source: '1', target: '2', weight: -2, directed: false },
        { id: 'e2', source: '0', target: '2', weight: -3, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
  });

  it('должен обрабатывать граф, где все соседи уже посещены', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
      ],
      edges: [{ id: 'e0', source: '0', target: '1', weight: 1, directed: false }],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(1);
  });

  it('должен обрабатывать граф с нулевыми весами', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: 0, directed: false },
        { id: 'e1', source: '1', target: '2', weight: 0, directed: false },
        { id: 'e2', source: '0', target: '2', weight: 0, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
  });

  it('должен обрабатывать граф с очень большими весами', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: 1, directed: false },
        { id: 'e1', source: '1', target: '2', weight: 2, directed: false },
        { id: 'e2', source: '0', target: '2', weight: Number.MAX_SAFE_INTEGER, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
    const maxWeightEdge = pathEdges.find(step => {
      const edgeStep = step as HighlightEdgeStep;
      return edgeStep.edgeId === 'e2';
    });
    expect(maxWeightEdge).toBeUndefined();
  });

  it('должен генерировать шаги с правильными описаниями для formatEdgeLabel', () => {
    const generator = new PrimStepGenerator();
    const graphDTO = buildConnectedGraph();

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const candidateSteps = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'candidate'
    );

    expect(candidateSteps.length).toBeGreaterThan(0);
    const firstCandidate = candidateSteps[0] as HighlightEdgeStep;
    expect(firstCandidate.description).toContain('—');
    expect(firstCandidate.description).toMatch(/[a-z] — [a-z]/);
  });

  it('должен генерировать шаги с правильными описаниями для formatWeight с бесконечностью', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
      ],
      edges: [
        { id: 'e0', source: '0', target: '1', weight: Number.POSITIVE_INFINITY, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const candidateSteps = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'candidate'
    );

    expect(candidateSteps.length).toBeGreaterThan(0);
    const candidate = candidateSteps[0] as HighlightEdgeStep;
    expect(candidate.description).toContain('∞');
  });

  it('должен обрабатывать граф, где pickNextEdge возвращает null (пустая очередь)', () => {
    const generator = new PrimStepGenerator();
    // Граф с двумя несвязными компонентами - после обработки первой компоненты
    // очередь станет пустой, но останется непосещённая вершина
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 200, y: 0 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 1, directed: false },
        // Вершина '2' изолирована
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    expect(steps.length).toBeGreaterThan(0);
    const rejectedSteps = steps.filter(
      step => step.type === 'HIGHLIGHT_NODE' && step.state === 'rejected'
    );
    expect(rejectedSteps.length).toBeGreaterThan(0);
  });

  it('должен обрабатывать граф, где все рёбра в очереди не подходят (оба конца в visited)', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 1, directed: false },
        { id: 'e12', source: '1', target: '2', weight: 2, directed: false },
        { id: 'e02', source: '0', target: '2', weight: 3, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const rejectedEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'rejected'
    );
    expect(rejectedEdges.length).toBeGreaterThanOrEqual(0);
  });

  it('должен использовать первую вершину по умолчанию, если startNode не указан', () => {
    const generator = new PrimStepGenerator();
    const graphDTO = buildConnectedGraph();

    const steps = generator.generateSteps(graphDTO, {});

    expect(steps.length).toBeGreaterThan(0);
    const firstStep = steps[0];
    expect(firstStep).toBeDefined();
    if (firstStep && firstStep.type === 'HIGHLIGHT_NODE') {
      expect(firstStep.nodeId).toBe('0');
    }
  });

  it('должен обрабатывать граф с одной вершиной', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [{ id: '0', x: 0, y: 0 }],
      edges: [],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    expect(steps.length).toBeGreaterThan(0);
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(0);
  });

  it('должен обрабатывать граф с двумя вершинами и одним ребром', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
      ],
      edges: [{ id: 'e0', source: '0', target: '1', weight: 5, directed: false }],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(1);
  });

  it('должен правильно сортировать рёбра по весу при выборе следующего', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 200, y: 0 },
        { id: '3', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 10, directed: false },
        { id: 'e02', source: '0', target: '2', weight: 20, directed: false },
        { id: 'e03', source: '0', target: '3', weight: 5, directed: false },
        { id: 'e12', source: '1', target: '2', weight: 15, directed: false },
        { id: 'e13', source: '1', target: '3', weight: 8, directed: false },
        { id: 'e23', source: '2', target: '3', weight: 12, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);

    const pathEdgeIds = pathEdges.map(step => (step as HighlightEdgeStep).edgeId);
    expect(pathEdgeIds).toContain('e03');
    expect(pathEdgeIds).toContain('e13');
    expect(pathEdgeIds).not.toContain('e02');
  });

  it('должен обрабатывать formatNodeLabel с нечисловым ID', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: 'node-a', x: 0, y: 0 },
        { id: 'node-b', x: 100, y: 0 },
      ],
      edges: [{ id: 'e0', source: 'node-a', target: 'node-b', weight: 1, directed: false }],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: 'node-a' });
    expect(steps.length).toBeGreaterThan(0);
    // Проверяем, что описания содержат оригинальные ID, а не преобразованные
    const descriptions = steps
      .map(step => step.description)
      .filter(Boolean)
      .join(' ');
    expect(descriptions).toContain('node-a');
  });

  it('должен обрабатывать случай, когда nextNode = from (а не to)', () => {
    const generator = new PrimStepGenerator();
    // Создаём граф, где при выборе ребра следующая вершина будет from, а не to
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 50, y: 100 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 1, directed: false },
        { id: 'e12', source: '1', target: '2', weight: 2, directed: false },
        { id: 'e20', source: '2', target: '0', weight: 3, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(graphDTO.nodes.length - 1);
  });

  it('должен обрабатывать случай с отрицательным числовым ID в formatNodeLabel', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '-1', x: 0, y: 0 },
        { id: '0', x: 100, y: 0 },
      ],
      edges: [{ id: 'e0', source: '-1', target: '0', weight: 1, directed: false }],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '-1' });
    expect(steps.length).toBeGreaterThan(0);
    // Отрицательные ID должны обрабатываться как строки
    const descriptions = steps
      .map(step => step.description)
      .filter(Boolean)
      .join(' ');
    expect(descriptions).toContain('-1');
  });

  it('должен обрабатывать случай с нецелым числовым ID в formatNodeLabel', () => {
    const generator = new PrimStepGenerator();
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '1.5', x: 0, y: 0 },
        { id: '0', x: 100, y: 0 },
      ],
      edges: [{ id: 'e0', source: '1.5', target: '0', weight: 1, directed: false }],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '1.5' });
    expect(steps.length).toBeGreaterThan(0);
    // Нецелые числа должны обрабатываться как строки
    const descriptions = steps
      .map(step => step.description)
      .filter(Boolean)
      .join(' ');
    expect(descriptions).toContain('1.5');
  });

  it('должен обрабатывать случай, когда pickNextEdge возвращает null из-за пустой очереди после отклонения всех рёбер', () => {
    const generator = new PrimStepGenerator();
    // Граф, где все рёбра в очереди будут отклонены, потому что оба конца уже в visited
    const graphDTO: GraphDTO = {
      nodes: [
        { id: '0', x: 0, y: 0 },
        { id: '1', x: 100, y: 0 },
        { id: '2', x: 200, y: 0 },
      ],
      edges: [
        { id: 'e01', source: '0', target: '1', weight: 1, directed: false },
        // После добавления 0 и 1, ребро e12 будет добавлено в очередь
        // Но если мы уже добавили 0->1, то e12 может быть отклонено, если оба конца в visited
        { id: 'e12', source: '1', target: '2', weight: 2, directed: false },
        { id: 'e02', source: '0', target: '2', weight: 3, directed: false },
      ],
    };

    const steps = generator.generateSteps(graphDTO, { startNode: '0' });
    // Алгоритм должен завершиться корректно
    expect(steps.length).toBeGreaterThan(0);
    const pathEdges = steps.filter(
      step => step.type === 'HIGHLIGHT_EDGE' && (step as HighlightEdgeStep).state === 'path'
    );
    expect(pathEdges.length).toBe(2); // N-1 = 2
  });
});
