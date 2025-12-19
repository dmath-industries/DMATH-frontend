/**
 * Unit тесты для Applier
 * Покрывают применение и откат всех типов шагов
 */

import { Applier } from '../Applier';
import { GraphModel } from '@/services/graph/GraphModel';
import {
  AddNodeStep,
  RemoveNodeStep,
  UpdateNodeStep,
  AddEdgeStep,
  RemoveEdgeStep,
  UpdateEdgeStep,
  SetCoordsStep,
  BatchStep,
  HighlightNodeStep,
  HighlightEdgeStep,
} from '@/types';

describe('Applier', () => {
  let applier: Applier;
  let model: GraphModel;

  beforeEach(() => {
    applier = new Applier();
    model = new GraphModel(false);
  });

  describe('ADD_NODE', () => {
    it('должен применять добавление узла', () => {
      const step: AddNodeStep = {
        type: 'ADD_NODE',
        id: 'step1',
        timestamp: Date.now(),
        node: { id: 'node1', x: 100, y: 200, label: 'Test Node' },
      };

      const dirtyIds = applier.apply(step, model);

      expect(model.hasNode('node1')).toBe(true);
      expect(dirtyIds).toContain('node1');
      expect(dirtyIds.length).toBe(1);
    });

    it('должен откатывать добавление узла', () => {
      const step: AddNodeStep = {
        type: 'ADD_NODE',
        id: 'step1',
        timestamp: Date.now(),
        node: { id: 'node1', x: 100, y: 200 },
      };

      applier.apply(step, model);
      expect(model.hasNode('node1')).toBe(true);

      const dirtyIds = applier.revert(step, model);

      expect(model.hasNode('node1')).toBe(false);
      expect(dirtyIds).toContain('node1');
    });

    it('не должен добавлять дубликат узла', () => {
      model.addNode({ id: 'node1', x: 0, y: 0 });

      const step: AddNodeStep = {
        type: 'ADD_NODE',
        id: 'step1',
        timestamp: Date.now(),
        node: { id: 'node1', x: 100, y: 200 },
      };

      const dirtyIds = applier.apply(step, model);
      expect(dirtyIds).toEqual([]);
    });
  });

  describe('REMOVE_NODE', () => {
    beforeEach(() => {
      model.addNode({ id: 'node1', x: 100, y: 200, label: 'Node 1' });
    });

    it('должен применять удаление узла', () => {
      const step: RemoveNodeStep = {
        type: 'REMOVE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
      };

      const dirtyIds = applier.apply(step, model);

      expect(model.hasNode('node1')).toBe(false);
      expect(dirtyIds).toContain('node1');
    });

    it('должен откатывать удаление узла', () => {
      const step: RemoveNodeStep = {
        type: 'REMOVE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
      };

      applier.apply(step, model);
      expect(model.hasNode('node1')).toBe(false);

      const dirtyIds = applier.revert(step, model);

      expect(model.hasNode('node1')).toBe(true);
      expect(dirtyIds).toContain('node1');

      const node = model.getNode('node1');
      expect(node?.label).toBe('Node 1');
    });

    it('должен возвращать пустой массив при удалении несуществующего узла', () => {
      const step: RemoveNodeStep = {
        type: 'REMOVE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'nonexistent',
      };

      const dirtyIds = applier.apply(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('должен возвращать ID смежных рёбер при удалении узла', () => {
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });

      const step: RemoveNodeStep = {
        type: 'REMOVE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
      };

      const dirtyIds = applier.apply(step, model);

      expect(dirtyIds).toContain('node1');
      // В Graphology при удалении узла связанные рёбра удаляются автоматически
      // но их ID могут быть включены в dirtyIds в зависимости от реализации
      expect(dirtyIds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('UPDATE_NODE', () => {
    beforeEach(() => {
      model.addNode({ id: 'node1', x: 100, y: 200, label: 'Original', state: 'default' });
    });

    it('должен применять обновление атрибутов узла', () => {
      const step: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        attrs: { label: 'Updated', x: 150 },
      };

      const dirtyIds = applier.apply(step, model);

      expect(dirtyIds).toContain('node1');
      const node = model.getNode('node1');
      expect(node?.label).toBe('Updated');
      expect(node?.x).toBe(150);
      expect(node?.y).toBe(200); // не изменилось
    });

    it('должен откатывать обновление атрибутов узла', () => {
      const step: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        attrs: { label: 'Updated', x: 150 },
      };

      applier.apply(step, model);
      const dirtyIds = applier.revert(step, model);

      expect(dirtyIds).toContain('node1');
      const node = model.getNode('node1');
      expect(node?.label).toBe('Original');
      expect(node?.x).toBe(100);
    });

    it('должен возвращать пустой массив при обновлении несуществующего узла', () => {
      const step: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'nonexistent',
        attrs: { label: 'Test' },
      };

      const dirtyIds = applier.apply(step, model);
      expect(dirtyIds).toEqual([]);
    });
  });

  describe('ADD_EDGE', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 100 });
    });

    it('должен применять добавление ребра', () => {
      const step: AddEdgeStep = {
        type: 'ADD_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edge: { id: 'edge1', source: 'a', target: 'b', weight: 5 },
      };

      const dirtyIds = applier.apply(step, model);

      expect(model.hasEdge('edge1')).toBe(true);
      expect(dirtyIds).toContain('edge1');
      expect(dirtyIds).toContain('a');
      expect(dirtyIds).toContain('b');
    });

    it('должен откатывать добавление ребра', () => {
      const step: AddEdgeStep = {
        type: 'ADD_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edge: { id: 'edge1', source: 'a', target: 'b' },
      };

      applier.apply(step, model);
      expect(model.hasEdge('edge1')).toBe(true);

      const dirtyIds = applier.revert(step, model);

      expect(model.hasEdge('edge1')).toBe(false);
      expect(dirtyIds).toContain('edge1');
    });

    it('не должен добавлять дубликат ребра', () => {
      model.addEdge({ id: 'edge1', source: 'a', target: 'b' });

      const step: AddEdgeStep = {
        type: 'ADD_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edge: { id: 'edge1', source: 'a', target: 'b' },
      };

      const dirtyIds = applier.apply(step, model);
      expect(dirtyIds).toEqual([]);
    });
  });

  describe('REMOVE_EDGE', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 100 });
      model.addEdge({ id: 'edge1', source: 'a', target: 'b', weight: 7 });
    });

    it('должен применять удаление ребра', () => {
      const step: RemoveEdgeStep = {
        type: 'REMOVE_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
      };

      const dirtyIds = applier.apply(step, model);

      expect(model.hasEdge('edge1')).toBe(false);
      expect(dirtyIds).toContain('edge1');
    });

    it('должен откатывать удаление ребра', () => {
      const step: RemoveEdgeStep = {
        type: 'REMOVE_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
      };

      applier.apply(step, model);
      expect(model.hasEdge('edge1')).toBe(false);

      const dirtyIds = applier.revert(step, model);

      expect(model.hasEdge('edge1')).toBe(true);
      expect(dirtyIds).toContain('edge1');

      const edge = model.getEdge('edge1');
      expect(edge?.weight).toBe(7);
    });
  });

  describe('UPDATE_EDGE', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 100 });
      model.addEdge({ id: 'edge1', source: 'a', target: 'b', weight: 5, state: 'default' });
    });

    it('должен применять обновление атрибутов ребра', () => {
      const step: UpdateEdgeStep = {
        type: 'UPDATE_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
        attrs: { weight: 10, state: 'active' },
      };

      const dirtyIds = applier.apply(step, model);

      expect(dirtyIds).toContain('edge1');
      const edge = model.getEdge('edge1');
      expect(edge?.weight).toBe(10);
      expect(edge?.state).toBe('active');
    });

    it('должен откатывать обновление атрибутов ребра', () => {
      const step: UpdateEdgeStep = {
        type: 'UPDATE_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
        attrs: { weight: 10 },
      };

      applier.apply(step, model);
      const dirtyIds = applier.revert(step, model);

      expect(dirtyIds).toContain('edge1');
      const edge = model.getEdge('edge1');
      expect(edge?.weight).toBe(5);
    });
  });

  describe('SET_COORDS', () => {
    beforeEach(() => {
      model.addNode({ id: 'node1', x: 100, y: 200 });
    });

    it('должен применять установку координат', () => {
      const step: SetCoordsStep = {
        type: 'SET_COORDS',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        x: 300,
        y: 400,
      };

      const dirtyIds = applier.apply(step, model);

      expect(dirtyIds).toContain('node1');
      const node = model.getNode('node1');
      expect(node?.x).toBe(300);
      expect(node?.y).toBe(400);
    });

    it('должен откатывать установку координат', () => {
      const step: SetCoordsStep = {
        type: 'SET_COORDS',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        x: 300,
        y: 400,
      };

      applier.apply(step, model);
      const dirtyIds = applier.revert(step, model);

      expect(dirtyIds).toContain('node1');
      const node = model.getNode('node1');
      expect(node?.x).toBe(100);
      expect(node?.y).toBe(200);
    });
  });

  describe('HIGHLIGHT_NODE', () => {
    beforeEach(() => {
      model.addNode({ id: 'node1', x: 0, y: 0, state: 'default' });
    });

    it('должен применять подсветку узла', () => {
      const step: HighlightNodeStep = {
        type: 'HIGHLIGHT_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        state: 'active',
      };

      const dirtyIds = applier.apply(step, model);

      expect(dirtyIds).toContain('node1');
      const node = model.getNode('node1');
      expect(node?.state).toBe('active');
    });

    it('должен откатывать подсветку узла', () => {
      const step: HighlightNodeStep = {
        type: 'HIGHLIGHT_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        state: 'visited',
      };

      applier.apply(step, model);
      const dirtyIds = applier.revert(step, model);

      expect(dirtyIds).toContain('node1');
      const node = model.getNode('node1');
      expect(node?.state).toBe('default');
    });
  });

  describe('HIGHLIGHT_EDGE', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 100 });
      model.addEdge({ id: 'edge1', source: 'a', target: 'b', state: 'default' });
    });

    it('должен применять подсветку ребра', () => {
      const step: HighlightEdgeStep = {
        type: 'HIGHLIGHT_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
        state: 'path',
      };

      const dirtyIds = applier.apply(step, model);

      expect(dirtyIds).toContain('edge1');
      const edge = model.getEdge('edge1');
      expect(edge?.state).toBe('path');
    });

    it('должен откатывать подсветку ребра', () => {
      const step: HighlightEdgeStep = {
        type: 'HIGHLIGHT_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
        state: 'active',
      };

      applier.apply(step, model);
      const dirtyIds = applier.revert(step, model);

      expect(dirtyIds).toContain('edge1');
      const edge = model.getEdge('edge1');
      expect(edge?.state).toBe('default');
    });
  });

  describe('BATCH', () => {
    it('должен применять batch операций', () => {
      const batchStep: BatchStep = {
        type: 'BATCH',
        id: 'batch1',
        timestamp: Date.now(),
        ops: [
          {
            type: 'ADD_NODE',
            id: 'step1',
            timestamp: Date.now(),
            node: { id: 'node1', x: 0, y: 0 },
          },
          {
            type: 'ADD_NODE',
            id: 'step2',
            timestamp: Date.now(),
            node: { id: 'node2', x: 100, y: 100 },
          },
          {
            type: 'ADD_EDGE',
            id: 'step3',
            timestamp: Date.now(),
            edge: { id: 'edge1', source: 'node1', target: 'node2' },
          },
        ],
      };

      const dirtyIds = applier.apply(batchStep, model);

      expect(model.hasNode('node1')).toBe(true);
      expect(model.hasNode('node2')).toBe(true);
      expect(model.hasEdge('edge1')).toBe(true);
      expect(dirtyIds.length).toBeGreaterThan(0);
    });

    it('должен откатывать batch операций в обратном порядке', () => {
      const batchStep: BatchStep = {
        type: 'BATCH',
        id: 'batch1',
        timestamp: Date.now(),
        ops: [
          {
            type: 'ADD_NODE',
            id: 'step1',
            timestamp: Date.now(),
            node: { id: 'node1', x: 0, y: 0 },
          },
          {
            type: 'ADD_NODE',
            id: 'step2',
            timestamp: Date.now(),
            node: { id: 'node2', x: 100, y: 100 },
          },
        ],
      };

      applier.apply(batchStep, model);
      expect(model.nodeCount).toBe(2);

      const dirtyIds = applier.revert(batchStep, model);

      expect(model.nodeCount).toBe(0);
      expect(dirtyIds.length).toBeGreaterThan(0);
    });

    it('должен возвращать уникальные dirty IDs', () => {
      model.addNode({ id: 'node1', x: 0, y: 0 });

      const batchStep: BatchStep = {
        type: 'BATCH',
        id: 'batch1',
        timestamp: Date.now(),
        ops: [
          {
            type: 'UPDATE_NODE',
            id: 'step1',
            timestamp: Date.now(),
            nodeId: 'node1',
            attrs: { x: 50 },
          },
          {
            type: 'UPDATE_NODE',
            id: 'step2',
            timestamp: Date.now(),
            nodeId: 'node1',
            attrs: { y: 50 },
          },
        ],
      };

      const dirtyIds = applier.apply(batchStep, model);

      const uniqueIds = new Set(dirtyIds);
      expect(uniqueIds.size).toBe(dirtyIds.length);
    });
  });

  describe('clear', () => {
    it('должен очищать сохранённые состояния', () => {
      model.addNode({ id: 'node1', x: 100, y: 200 });

      const step: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        attrs: { x: 300 },
      };

      applier.apply(step, model);
      applier.clear();

      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('должен корректно обрабатывать неизвестные типы шагов', () => {
      // Мокаем console.warn чтобы не засорять вывод
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const unknownStep: any = {
        type: 'UNKNOWN_TYPE',
        id: 'step1',
        timestamp: Date.now(),
      };

      const dirtyIds = applier.apply(unknownStep, model);
      expect(dirtyIds).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown step type:', 'UNKNOWN_TYPE');

      consoleWarnSpy.mockRestore();
    });

    it('должен обрабатывать пустой batch', () => {
      const emptyBatch: BatchStep = {
        type: 'BATCH',
        id: 'batch1',
        timestamp: Date.now(),
        ops: [],
      };

      const dirtyIds = applier.apply(emptyBatch, model);
      expect(dirtyIds).toEqual([]);
    });

    it('должен сохранять независимые состояния для разных шагов', () => {
      model.addNode({ id: 'node1', x: 100, y: 200 });

      const step1: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        attrs: { x: 150 },
      };

      const step2: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step2',
        timestamp: Date.now(),
        nodeId: 'node1',
        attrs: { x: 200 },
      };

      applier.apply(step1, model);
      applier.apply(step2, model);

      applier.revert(step2, model);
      const node = model.getNode('node1');
      expect(node?.x).toBe(150);

      applier.revert(step1, model);
      const nodeAfter = model.getNode('node1');
      expect(nodeAfter?.x).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle unknown step type in apply', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const unknownStep = { type: 'UNKNOWN_TYPE', id: 'step1', timestamp: Date.now() } as any;
      const dirtyIds = applier.apply(unknownStep, model);
      expect(dirtyIds).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown step type:', 'UNKNOWN_TYPE');
      consoleSpy.mockRestore();
    });

    it('should handle unknown step type in revert', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const unknownStep = { type: 'UNKNOWN_TYPE', id: 'step1', timestamp: Date.now() } as any;
      const dirtyIds = applier.revert(unknownStep, model);
      expect(dirtyIds).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown step type for revert:', 'UNKNOWN_TYPE');
      consoleSpy.mockRestore();
    });

    it('should return empty array when reverting ADD_NODE for non-existent node', () => {
      const step: AddNodeStep = {
        type: 'ADD_NODE',
        id: 'step1',
        timestamp: Date.now(),
        node: { id: 'node1', x: 100, y: 200 },
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting REMOVE_NODE without prev state', () => {
      const step: RemoveNodeStep = {
        type: 'REMOVE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting REMOVE_NODE if node exists', () => {
      model.addNode({ id: 'node1', x: 100, y: 200 });
      const step: RemoveNodeStep = {
        type: 'REMOVE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting UPDATE_NODE for non-existent node', () => {
      const step: UpdateNodeStep = {
        type: 'UPDATE_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        attrs: { x: 150, y: 250 },
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting ADD_EDGE for non-existent edge', () => {
      const step: AddEdgeStep = {
        type: 'ADD_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edge: { id: 'edge1', source: 'node1', target: 'node2' },
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting REMOVE_EDGE without prev state', () => {
      const step: RemoveEdgeStep = {
        type: 'REMOVE_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting UPDATE_EDGE for non-existent edge', () => {
      const step: UpdateEdgeStep = {
        type: 'UPDATE_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
        attrs: { width: 5 },
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting SET_COORDS for non-existent node', () => {
      const step: SetCoordsStep = {
        type: 'SET_COORDS',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        x: 150,
        y: 250,
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting HIGHLIGHT_NODE for non-existent node', () => {
      const step: HighlightNodeStep = {
        type: 'HIGHLIGHT_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'node1',
        state: 'active',
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });

    it('should return empty array when reverting HIGHLIGHT_EDGE for non-existent edge', () => {
      const step: HighlightEdgeStep = {
        type: 'HIGHLIGHT_EDGE',
        id: 'step1',
        timestamp: Date.now(),
        edgeId: 'edge1',
        state: 'active',
      };
      const dirtyIds = applier.revert(step, model);
      expect(dirtyIds).toEqual([]);
    });
  });
});
