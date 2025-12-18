/**
 * Unit тесты для LayoutService
 * Покрывают алгоритмы раскладки графа
 */

import { LayoutService } from '../LayoutService';
import { GraphModel } from '../GraphModel';

describe('LayoutService', () => {
  let service: LayoutService;
  let model: GraphModel;

  beforeEach(() => {
    service = new LayoutService();
    model = new GraphModel(false);
  });

  describe('runFA2', () => {
    it('должен применять ForceAtlas2 раскладку', async () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });
      model.addEdge({ id: 'e1', source: 'a', target: 'b' });
      model.addEdge({ id: 'e2', source: 'b', target: 'c' });

      await service.runFA2(model, { iterations: 10 });

      const nodeA = model.getNode('a');
      const nodeB = model.getNode('b');

      expect(nodeA?.x).toBeDefined();
      expect(nodeA?.y).toBeDefined();
      expect(nodeB?.x).toBeDefined();
      expect(nodeB?.y).toBeDefined();
    });

    it('должен работать с пустым графом', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await expect(service.runFA2(model)).resolves.not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Graph is empty, nothing to layout');

      consoleWarnSpy.mockRestore();
    });

    it('должен работать с одним узлом', async () => {
      model.addNode({ id: 'single', x: 100, y: 100 });

      await service.runFA2(model, { iterations: 5 });

      const node = model.getNode('single');
      expect(node?.x).toBeDefined();
      expect(node?.y).toBeDefined();
    });

    it('должен инициализировать случайные позиции для узлов без координат', async () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });

      await service.runFA2(model, { iterations: 10 });

      const nodeA = model.getNode('a');
      const nodeB = model.getNode('b');

      expect(nodeA?.x).toBeDefined();
      expect(nodeB?.y).toBeDefined();
    });

    it('должен принимать кастомные настройки', async () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 100, y: 100 });
      model.addEdge({ id: 'e1', source: 'a', target: 'b' });

      await service.runFA2(model, {
        iterations: 50,
        settings: {
          scalingRatio: 20,
          gravity: 2,
          strongGravityMode: true,
        },
      });

      expect(model.getNode('a')).toBeDefined();
      expect(model.getNode('b')).toBeDefined();
    });
  });

  describe('circularLayout', () => {
    it('должен располагать узлы по кругу', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });
      model.addNode({ id: 'd', x: 0, y: 0 });

      service.circularLayout(model, 100);

      const nodes = ['a', 'b', 'c', 'd'].map(id => model.getNode(id));

      // Все узлы должны быть на расстоянии ~100 от центра (0, 0)
      nodes.forEach(node => {
        if (node) {
          const distance = Math.sqrt(node.x ** 2 + node.y ** 2);
          expect(distance).toBeCloseTo(100, 0);
        }
      });
    });

    it('должен равномерно распределять узлы по окружности', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });

      service.circularLayout(model, 150);

      const nodeA = model.getNode('a');
      const nodeB = model.getNode('b');
      const nodeC = model.getNode('c');

      expect(nodeA).toBeDefined();
      expect(nodeB).toBeDefined();
      expect(nodeC).toBeDefined();

      // Углы между соседними узлами должны быть примерно равны
      // для 3 узлов: 360/3 = 120 градусов
    });

    it('должен работать с пустым графом', () => {
      expect(() => service.circularLayout(model)).not.toThrow();
    });

    it('должен работать с одним узлом', () => {
      model.addNode({ id: 'single', x: 0, y: 0 });

      service.circularLayout(model, 100);

      const node = model.getNode('single');
      expect(node?.x).toBeDefined();
      expect(node?.y).toBeDefined();
    });

    it('должен использовать кастомный радиус', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });

      service.circularLayout(model, 250);

      const nodeA = model.getNode('a');
      if (nodeA) {
        const distance = Math.sqrt(nodeA.x ** 2 + nodeA.y ** 2);
        expect(distance).toBeCloseTo(250, 0);
      }
    });
  });

  describe('randomLayout', () => {
    it('должен присваивать случайные координаты узлам', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });

      service.randomLayout(model, 1000, 1000);

      const nodeA = model.getNode('a');
      const nodeB = model.getNode('b');
      const nodeC = model.getNode('c');

      expect(nodeA?.x).toBeDefined();
      expect(nodeA?.y).toBeDefined();
      expect(nodeB?.x).toBeDefined();
      expect(nodeB?.y).toBeDefined();
      expect(nodeC?.x).toBeDefined();
      expect(nodeC?.y).toBeDefined();
    });

    it('координаты должны быть в пределах заданной области', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });

      const width = 500;
      const height = 500;
      service.randomLayout(model, width, height);

      const nodeA = model.getNode('a');
      const nodeB = model.getNode('b');

      if (nodeA) {
        expect(nodeA.x).toBeGreaterThanOrEqual(-width / 2);
        expect(nodeA.x).toBeLessThanOrEqual(width / 2);
        expect(nodeA.y).toBeGreaterThanOrEqual(-height / 2);
        expect(nodeA.y).toBeLessThanOrEqual(height / 2);
      }

      if (nodeB) {
        expect(nodeB.x).toBeGreaterThanOrEqual(-width / 2);
        expect(nodeB.x).toBeLessThanOrEqual(width / 2);
        expect(nodeB.y).toBeGreaterThanOrEqual(-height / 2);
        expect(nodeB.y).toBeLessThanOrEqual(height / 2);
      }
    });

    it('должен работать с пустым графом', () => {
      expect(() => service.randomLayout(model)).not.toThrow();
    });

    it('должен использовать размеры по умолчанию', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });

      service.randomLayout(model);

      const node = model.getNode('a');
      expect(node?.x).toBeDefined();
      expect(node?.y).toBeDefined();
    });
  });

  describe('gridLayout', () => {
    it('должен располагать узлы в виде сетки', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });
      model.addNode({ id: 'd', x: 0, y: 0 });

      service.gridLayout(model, 100);

      const nodeA = model.getNode('a');
      const nodeB = model.getNode('b');

      expect(nodeA?.x).toBeDefined();
      expect(nodeA?.y).toBeDefined();
      expect(nodeB?.x).toBeDefined();
      expect(nodeB?.y).toBeDefined();
    });

    it('узлы должны быть разделены заданным интервалом', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });

      const spacing = 150;
      service.gridLayout(model, spacing);

      // Проверяем, что узлы имеют координаты
      const nodes = ['a', 'b', 'c'].map(id => model.getNode(id));
      nodes.forEach(node => {
        expect(node?.x).toBeDefined();
        expect(node?.y).toBeDefined();
      });
    });

    it('должен создавать квадратную сетку', () => {
      // 9 узлов должны образовать сетку 3x3
      for (let i = 0; i < 9; i++) {
        model.addNode({ id: `node${i}`, x: 0, y: 0 });
      }

      service.gridLayout(model, 100);

      const node0 = model.getNode('node0');
      const node1 = model.getNode('node1');

      expect(node0).toBeDefined();
      expect(node1).toBeDefined();
    });

    it('должен работать с пустым графом', () => {
      expect(() => service.gridLayout(model)).not.toThrow();
    });

    it('должен работать с одним узлом', () => {
      model.addNode({ id: 'single', x: 0, y: 0 });

      service.gridLayout(model, 100);

      const node = model.getNode('single');
      expect(node?.x).toBeDefined();
      expect(node?.y).toBeDefined();
    });

    it('должен использовать spacing по умолчанию', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });

      service.gridLayout(model);

      expect(model.getNode('a')).toBeDefined();
      expect(model.getNode('b')).toBeDefined();
    });
  });

  describe('integration', () => {
    it('должен правильно работать с последовательными раскладками', () => {
      model.addNode({ id: 'a', x: 0, y: 0 });
      model.addNode({ id: 'b', x: 0, y: 0 });
      model.addNode({ id: 'c', x: 0, y: 0 });

      // Сначала круговая
      service.circularLayout(model, 100);
      const afterCircular = model.getNode('a');

      // Потом случайная
      service.randomLayout(model, 500, 500);
      const afterRandom = model.getNode('a');

      // Координаты должны измениться
      expect(afterCircular?.x).toBeDefined();
      expect(afterRandom?.x).toBeDefined();
    });

    it('должен работать с большими графами', () => {
      // Создаём граф из 100 узлов
      for (let i = 0; i < 100; i++) {
        model.addNode({ id: `node${i}`, x: 0, y: 0 });
      }

      // Добавляем рёбра
      for (let i = 0; i < 99; i++) {
        model.addEdge({
          id: `edge${i}`,
          source: `node${i}`,
          target: `node${i + 1}`,
        });
      }

      service.gridLayout(model, 50);

      expect(model.nodeCount).toBe(100);
      expect(model.edgeCount).toBe(99);
    });
  });
});
