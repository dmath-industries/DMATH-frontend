/**
 * Unit тесты для GraphModel
 * Покрывают все основные методы работы с графом
 */

import { GraphModel } from '../GraphModel';
import { NodeDTO, EdgeDTO, GraphDTO } from '@/types';

describe('GraphModel', () => {
  let model: GraphModel;

  beforeEach(() => {
    model = new GraphModel(false);
  });

  describe('constructor', () => {
    it('должен создавать неориентированный граф по умолчанию', () => {
      const undirectedModel = new GraphModel(false);
      expect(undirectedModel.isDirected()).toBe(false);
    });

    it('должен создавать ориентированный граф', () => {
      const directedModel = new GraphModel(true);
      expect(directedModel.isDirected()).toBe(true);
    });
  });

  describe('addNode', () => {
    it('должен добавлять узел с полными атрибутами', () => {
      const node: NodeDTO = {
        id: 'node1',
        x: 100,
        y: 200,
        label: 'Node 1',
        radius: 15,
        color: '#ff0000',
        state: 'default',
      };

      model.addNode(node);
      expect(model.hasNode('node1')).toBe(true);
      expect(model.nodeCount).toBe(1);
    });

    it('должен добавлять узел с минимальными атрибутами', () => {
      const node: NodeDTO = {
        id: 'node2',
        x: 50,
        y: 50,
      };

      model.addNode(node);
      const retrieved = model.getNode('node2');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('node2');
      expect(retrieved?.x).toBe(50);
      expect(retrieved?.y).toBe(50);
    });

    it('должен добавлять несколько узлов', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addNode({ id: 'c', x: 100, y: 100 });

      expect(model.nodeCount).toBe(3);
      expect(model.getNodes()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('removeNode', () => {
    beforeEach(() => {
      model.addNode({ id: 'node1', x: 0, y: 0 });
    });

    it('должен удалять существующий узел', () => {
      model.removeNode('node1');
      expect(model.hasNode('node1')).toBe(false);
      expect(model.nodeCount).toBe(0);
    });

    it('не должен выбрасывать ошибку при удалении несуществующего узла', () => {
      expect(() => model.removeNode('nonexistent')).not.toThrow();
    });

    it('должен удалять связанные рёбра при удалении узла', () => {
      model.addNode({ id: 'node2', x: 100, y: 100 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });

      expect(model.edgeCount).toBe(1);
      model.removeNode('node1');

      expect(model.edgeCount).toBe(0);
      expect(model.hasEdge('edge1')).toBe(false);
    });
  });

  describe('updateNode', () => {
    beforeEach(() => {
      model.addNode({ id: 'node1', x: 0, y: 0, label: 'Initial' });
    });

    it('должен обновлять атрибуты узла', () => {
      model.updateNode('node1', { label: 'Updated', x: 50 });
      const node = model.getNode('node1');

      expect(node?.label).toBe('Updated');
      expect(node?.x).toBe(50);
      expect(node?.y).toBe(0); // не изменился
    });

    it('должен обновлять состояние узла', () => {
      model.updateNode('node1', { state: 'active' });
      const node = model.getNode('node1');

      expect(node?.state).toBe('active');
    });

    it('не должен выбрасывать ошибку при обновлении несуществующего узла', () => {
      expect(() => model.updateNode('nonexistent', { x: 100 })).not.toThrow();
    });
  });

  describe('getNode', () => {
    it('должен возвращать узел по ID', () => {
      model.addNode({ id: 'node1', x: 10, y: 20, label: 'Test' });
      const node = model.getNode('node1');

      expect(node).toBeDefined();
      expect(node?.id).toBe('node1');
      expect(node?.x).toBe(10);
      expect(node?.y).toBe(20);
      expect(node?.label).toBe('Test');
    });

    it('должен возвращать null для несуществующего узла', () => {
      expect(model.getNode('nonexistent')).toBeNull();
    });
  });

  describe('addEdge', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
    });

    it('должен добавлять ребро с полными атрибутами', () => {
      const edge: EdgeDTO = {
        id: 'edge1',
        source: 'a',
        target: 'b',
        weight: 5,
        directed: true,
        color: '#0000ff',
        width: 2,
        state: 'path',
      };

      model.addEdge(edge);
      expect(model.hasEdge('edge1')).toBe(true);
      expect(model.edgeCount).toBe(1);
    });

    it('должен добавлять ребро с минимальными атрибутами', () => {
      model.addEdge({ id: 'edge2', source: 'a', target: 'b' });
      const edge = model.getEdge('edge2');

      expect(edge).toBeDefined();
      expect(edge?.source).toBe('a');
      expect(edge?.target).toBe('b');
    });
  });

  describe('removeEdge', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addEdge({ id: 'edge1', source: 'a', target: 'b' });
    });

    it('должен удалять существующее ребро', () => {
      model.removeEdge('edge1');
      expect(model.hasEdge('edge1')).toBe(false);
      expect(model.edgeCount).toBe(0);
    });

    it('не должен выбрасывать ошибку при удалении несуществующего ребра', () => {
      expect(() => model.removeEdge('nonexistent')).not.toThrow();
    });
  });

  describe('updateEdge', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addEdge({ id: 'edge1', source: 'a', target: 'b', weight: 1 });
    });

    it('должен обновлять атрибуты ребра', () => {
      model.updateEdge('edge1', { weight: 10, state: 'active' });
      const edge = model.getEdge('edge1');

      expect(edge?.weight).toBe(10);
      expect(edge?.state).toBe('active');
    });

    it('не должен выбрасывать ошибку при обновлении несуществующего ребра', () => {
      expect(() => model.updateEdge('nonexistent', { weight: 5 })).not.toThrow();
    });
  });

  describe('getEdge', () => {
    beforeEach(() => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addEdge({ id: 'edge1', source: 'a', target: 'b', weight: 7 });
    });

    it('должен возвращать ребро по ID', () => {
      const edge = model.getEdge('edge1');

      expect(edge).toBeDefined();
      expect(edge?.id).toBe('edge1');
      expect(edge?.source).toBe('a');
      expect(edge?.target).toBe('b');
      expect(edge?.weight).toBe(7);
    });

    it('должен возвращать null для несуществующего ребра', () => {
      expect(model.getEdge('nonexistent')).toBeNull();
    });
  });

  describe('graph queries', () => {
    beforeEach(() => {
      model = new GraphModel(true);
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addNode({ id: 'c', x: 200, y: 0 });
      model.addEdge({ id: 'e1', source: 'a', target: 'b' });
      model.addEdge({ id: 'e2', source: 'b', target: 'c' });
    });

    it('getNeighbors должен возвращать соседей узла', () => {
      const neighbors = model.getNeighbors('b');
      expect(neighbors).toContain('a');
      expect(neighbors).toContain('c');
      expect(neighbors.length).toBe(2);
    });

    it('getNeighbors должен возвращать пустой массив для несуществующего узла', () => {
      expect(model.getNeighbors('nonexistent')).toEqual([]);
    });

    it('getOutEdges должен возвращать исходящие рёбра', () => {
      const outEdges = model.getOutEdges('a');
      expect(outEdges).toContain('e1');
      expect(outEdges.length).toBeGreaterThanOrEqual(1);
    });

    it('getInEdges должен возвращать входящие рёбра', () => {
      const inEdges = model.getInEdges('c');
      expect(inEdges).toContain('e2');
      expect(inEdges.length).toBeGreaterThanOrEqual(1);
    });

    it('getAllEdgesForNode должен возвращать все рёбра узла', () => {
      const allEdges = model.getAllEdgesForNode('b');
      expect(allEdges.length).toBeGreaterThanOrEqual(2);
    });

    it('getDegree должен возвращать степень узла', () => {
      expect(model.getDegree('b')).toBeGreaterThanOrEqual(2);
      expect(model.getDegree('a')).toBeGreaterThanOrEqual(1);
    });

    it('getDegree должен возвращать 0 для несуществующего узла', () => {
      expect(model.getDegree('nonexistent')).toBe(0);
    });

    it('hasEdgeBetween должен проверять наличие ребра', () => {
      expect(model.hasEdgeBetween('a', 'b')).toBe(true);
      expect(model.hasEdgeBetween('a', 'c')).toBe(false);
    });
  });

  describe('clear', () => {
    it('должен очищать весь граф', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addEdge({ id: 'e1', source: 'a', target: 'b' });

      model.clear();

      expect(model.nodeCount).toBe(0);
      expect(model.edgeCount).toBe(0);
    });
  });

  describe('serialization', () => {
    let graphDTO: GraphDTO;

    beforeEach(() => {
      graphDTO = {
        nodes: [
          { id: 'a', x: 0, y: 0, label: 'A' },
          { id: 'b', x: 100, y: 100, label: 'B' },
          { id: 'c', x: 200, y: 200, label: 'C' },
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b', weight: 5 },
          { id: 'e2', source: 'b', target: 'c', weight: 3 },
        ],
      };
    });

    describe('toDTO', () => {
      it('должен сериализовать граф в DTO', () => {
        model.fromDTO(graphDTO);
        const dto = model.toDTO();

        expect(dto.nodes.length).toBe(3);
        expect(dto.edges.length).toBe(2);
        expect(dto.nodes.map(n => n.id)).toEqual(['a', 'b', 'c']);
        expect(dto.edges.map(e => e.id)).toEqual(['e1', 'e2']);
      });

      it('должен сохранять атрибуты узлов', () => {
        model.fromDTO(graphDTO);
        const dto = model.toDTO();
        const nodeA = dto.nodes.find(n => n.id === 'a');

        expect(nodeA?.x).toBe(0);
        expect(nodeA?.y).toBe(0);
        expect(nodeA?.label).toBe('A');
      });

      it('должен сохранять атрибуты рёбер', () => {
        model.fromDTO(graphDTO);
        const dto = model.toDTO();
        const edge1 = dto.edges.find(e => e.id === 'e1');

        expect(edge1?.source).toBe('a');
        expect(edge1?.target).toBe('b');
        expect(edge1?.weight).toBe(5);
      });
    });

    describe('fromDTO', () => {
      it('должен восстанавливать граф из DTO', () => {
        model.fromDTO(graphDTO);

        expect(model.nodeCount).toBe(3);
        expect(model.edgeCount).toBe(2);
        expect(model.hasNode('a')).toBe(true);
        expect(model.hasNode('b')).toBe(true);
        expect(model.hasNode('c')).toBe(true);
        expect(model.hasEdge('e1')).toBe(true);
        expect(model.hasEdge('e2')).toBe(true);
      });

      it('должен очищать предыдущий граф перед загрузкой', () => {
        model.addNode({ id: 'old', x: 0, y: 0 });
        model.fromDTO(graphDTO);

        expect(model.hasNode('old')).toBe(false);
        expect(model.nodeCount).toBe(3);
      });

      it('должен обрабатывать пустой DTO', () => {
        model.fromDTO({ nodes: [], edges: [] });

        expect(model.nodeCount).toBe(0);
        expect(model.edgeCount).toBe(0);
      });
    });
  });

  describe('clone', () => {
    it('должен создавать независимую копию графа', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });
      model.addEdge({ id: 'e1', source: 'a', target: 'b' });

      const cloned = model.clone();

      expect(cloned.nodeCount).toBe(model.nodeCount);
      expect(cloned.edgeCount).toBe(model.edgeCount);
      expect(cloned.hasNode('a')).toBe(true);
      expect(cloned.hasEdge('e1')).toBe(true);
    });

    it('клон должен быть независимым от оригинала', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      const cloned = model.clone();

      cloned.addNode({ id: 'b', x: 100, y: 0 });

      expect(model.hasNode('b')).toBe(false);
      expect(cloned.hasNode('b')).toBe(true);
    });

    it('должен клонировать направленность графа', () => {
      const directedModel = new GraphModel(true);
      directedModel.addNode({ id: 'a', x: 0, y: 0 });
      const cloned = directedModel.clone();

      expect(cloned.isDirected()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('должен корректно работать с графом без рёбер', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 0 });

      expect(model.nodeCount).toBe(2);
      expect(model.edgeCount).toBe(0);
      expect(model.getNeighbors('a')).toEqual([]);
    });

    it('должен корректно работать с пустым графом', () => {
      expect(model.nodeCount).toBe(0);
      expect(model.edgeCount).toBe(0);
      expect(model.getNodes()).toEqual([]);
      expect(model.getEdges()).toEqual([]);
    });

    it('должен обрабатывать граф с одним узлом', () => {
      model.addNode({ id: 'single', x: 0, y: 0 });

      expect(model.nodeCount).toBe(1);
      expect(model.getDegree('single')).toBe(0);
    });
  });
});
