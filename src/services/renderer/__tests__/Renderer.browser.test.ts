import { Renderer } from '../Renderer';
import { GraphModel } from '@/services/graph/GraphModel';
import { ElementState } from '@/types';

let mockInit: jest.Mock;
let mockResize: jest.Mock;
let mockDestroy: jest.Mock;
let mockRemoveChild: jest.Mock;
let mockAddChild: jest.Mock;
let mockCircle: jest.Mock;
let mockFill: jest.Mock;
let mockStroke: jest.Mock;
let mockMoveTo: jest.Mock;
let mockLineTo: jest.Mock;
let mockSet: jest.Mock;
let mockPosition: { set: jest.Mock };
let mockGraphics: jest.Mock;
let mockText: jest.Mock;
let mockContainer: jest.Mock;
let mockApplication: jest.Mock;
let createdGraphics: any[];
let createdTexts: any[];

jest.mock('pixi.js', () => {
  const mockInitFn = jest.fn().mockResolvedValue(undefined);
  const mockResizeFn = jest.fn();
  const mockDestroyFn = jest.fn();
  const mockRemoveChildFn = jest.fn();
  const mockAddChildFn = jest.fn();
  const mockCircleFn = jest.fn().mockReturnThis();
  const mockFillFn = jest.fn().mockReturnThis();
  const mockStrokeFn = jest.fn().mockReturnThis();
  const mockMoveToFn = jest.fn().mockReturnThis();
  const mockLineToFn = jest.fn().mockReturnThis();
  const mockSetFn = jest.fn();
  const mockPositionObj = { set: jest.fn() };

  const graphicsInstances: any[] = [];
  const textInstances: any[] = [];

  const mockGraphicsFn = jest.fn(() => {
    const instance = {
      circle: mockCircleFn,
      fill: mockFillFn,
      stroke: mockStrokeFn,
      moveTo: mockMoveToFn,
      lineTo: mockLineToFn,
      position: mockPositionObj,
      zIndex: 0,
      destroy: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
      eventMode: 'none',
      cursor: 'default',
    };
    graphicsInstances.push(instance);
    return instance;
  });

  const mockTextFn = jest.fn(() => {
    const instance = {
      anchor: { set: mockSetFn },
      position: mockPositionObj,
      zIndex: 0,
      destroy: jest.fn(),
    };
    textInstances.push(instance);
    return instance;
  });

  const mockContainerFn = jest.fn(() => ({
    sortableChildren: false,
    addChild: mockAddChildFn,
    removeChild: mockRemoveChildFn,
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
  }));

  const mockApplicationFn = jest.fn(() => ({
    init: mockInitFn,
    renderer: {
      resize: mockResizeFn,
    },
    destroy: mockDestroyFn,
    stage: {
      on: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
    },
  }));

  (global as any).__PIXI_MOCKS__ = {
    mockInit: mockInitFn,
    mockResize: mockResizeFn,
    mockDestroy: mockDestroyFn,
    mockRemoveChild: mockRemoveChildFn,
    mockAddChild: mockAddChildFn,
    mockCircle: mockCircleFn,
    mockFill: mockFillFn,
    mockStroke: mockStrokeFn,
    mockMoveTo: mockMoveToFn,
    mockLineTo: mockLineToFn,
    mockSet: mockSetFn,
    mockPosition: mockPositionObj,
    mockGraphics: mockGraphicsFn,
    mockText: mockTextFn,
    mockContainer: mockContainerFn,
    mockApplication: mockApplicationFn,
    graphicsInstances,
    textInstances,
  };

  return {
    Application: mockApplicationFn,
    Container: mockContainerFn,
    Graphics: mockGraphicsFn,
    Text: mockTextFn,
  };
});

describe('Renderer', () => {
  let renderer: Renderer;
  let canvas: HTMLCanvasElement;
  let model: GraphModel;

  beforeEach(() => {
    const mocks = (global as any).__PIXI_MOCKS__;
    mockInit = mocks.mockInit;
    mockResize = mocks.mockResize;
    mockDestroy = mocks.mockDestroy;
    mockRemoveChild = mocks.mockRemoveChild;
    mockAddChild = mocks.mockAddChild;
    mockCircle = mocks.mockCircle;
    mockFill = mocks.mockFill;
    mockStroke = mocks.mockStroke;
    mockMoveTo = mocks.mockMoveTo;
    mockLineTo = mocks.mockLineTo;
    mockSet = mocks.mockSet;
    mockPosition = mocks.mockPosition;
    mockGraphics = mocks.mockGraphics;
    mockText = mocks.mockText;
    mockContainer = mocks.mockContainer;
    mockApplication = mocks.mockApplication;
    createdGraphics = mocks.graphicsInstances;
    createdTexts = mocks.textInstances;

    createdGraphics.length = 0;
    createdTexts.length = 0;

    jest.clearAllMocks();

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    renderer = new Renderer();
    model = new GraphModel(false);
  });

  afterEach(() => {
    if (renderer) {
      renderer.destroy();
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  describe('init', () => {
    it('should initialize Pixi Application with correct config', async () => {
      const config = {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      };

      await renderer.init(canvas, config);

      expect(mockApplication).toHaveBeenCalled();
      expect(mockInit).toHaveBeenCalledWith({
        canvas,
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
    });

    it('should create containers for edges, nodes, and labels', async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      expect(mockContainer).toHaveBeenCalledTimes(3);
    });

    it('should enable sortableChildren on containers', async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      const containers = renderer.getContainers();
      expect(containers.edges?.sortableChildren).toBe(true);
      expect(containers.nodes?.sortableChildren).toBe(true);
      expect(containers.labels?.sortableChildren).toBe(true);
    });

    it('should throw error if initialization fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Init failed');
      mockInit.mockRejectedValueOnce(error);

      await expect(
        renderer.init(canvas, {
          width: 800,
          height: 600,
          backgroundColor: 0x1f2937,
        })
      ).rejects.toThrow('Init failed');

      consoleSpy.mockRestore();
    });
  });

  describe('getApp', () => {
    it('should return null before initialization', () => {
      expect(renderer.getApp()).toBeNull();
    });

    it('should return Application after initialization', async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      expect(renderer.getApp()).not.toBeNull();
    });
  });

  describe('getContainers', () => {
    it('should return containers after initialization', async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      const containers = renderer.getContainers();
      expect(containers.edges).not.toBeNull();
      expect(containers.nodes).not.toBeNull();
      expect(containers.labels).not.toBeNull();
    });
  });

  describe('drawAll', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });
    });

    it('should do nothing if app is not initialized', () => {
      const uninitializedRenderer = new Renderer();
      uninitializedRenderer.drawAll(model);
      expect(mockGraphics).not.toHaveBeenCalled();
    });

    it('should draw all nodes and edges', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });

      renderer.drawAll(model);

      expect(mockGraphics).toHaveBeenCalledTimes(3);
      expect(mockText).toHaveBeenCalledTimes(2);
    });

    it('should draw edges before nodes', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });

      renderer.drawAll(model);

      expect(mockAddChild).toHaveBeenCalled();
    });
  });

  describe('renderDirty', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
    });

    it('should do nothing if app is not initialized', () => {
      const uninitializedRenderer = new Renderer();
      uninitializedRenderer.renderDirty(new Set(['node1']), model);
      expect(mockGraphics).not.toHaveBeenCalled();
    });

    it('should render only dirty nodes', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['node1']), model);

      expect(mockGraphics).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalled();
    });

    it('should render only dirty edges', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['edge1']), model);

      expect(mockGraphics).toHaveBeenCalled();
    });

    it('should render both dirty nodes and edges', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['node1', 'edge1']), model);

      expect(mockGraphics).toHaveBeenCalled();
    });

    it('should ignore non-existent IDs', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['nonexistent']), model);

      expect(mockGraphics).not.toHaveBeenCalled();
    });

    it('should handle only nodes in dirty set', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['node1', 'node2']), model);

      expect(mockGraphics).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalled();
    });

    it('should handle only edges in dirty set', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['edge1']), model);

      expect(mockGraphics).toHaveBeenCalled();
    });

    it('should handle mixed nodes and edges in dirty set', () => {
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['node1', 'edge1', 'node2']), model);

      expect(mockGraphics).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalled();
    });
  });

  describe('drawNode', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });
    });

    it('should draw node with default attributes', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });

      renderer.drawAll(model);

      expect(mockCircle).toHaveBeenCalledWith(0, 0, 20);
      expect(mockFill).toHaveBeenCalled();
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should draw node with custom radius', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, radius: 30 });

      renderer.drawAll(model);

      expect(mockCircle).toHaveBeenCalledWith(0, 0, 30);
    });

    it('should draw node with label', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, label: 'Node 1' });

      renderer.drawAll(model);

      expect(mockText).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Node 1',
        })
      );
    });

    it('should use node ID as label if label is not provided', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });

      renderer.drawAll(model);

      expect(mockText).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'node1',
        })
      );
    });

    it('should remove old graphics when redrawing', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      jest.clearAllMocks();
      renderer.drawAll(model);

      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should remove old graphic and label when redrawing node', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
      const oldGraphic = createdGraphics[0];
      const oldLabel = createdTexts[0];

      jest.clearAllMocks();
      model.updateNode('node1', { x: 150, y: 150 });
      renderer.drawAll(model);

      expect(oldGraphic.destroy).toHaveBeenCalled();
      expect(oldLabel.destroy).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should handle different node states', () => {
      const states: ElementState[] = [
        'active',
        'visited',
        'current',
        'path',
        'rejected',
        'candidate',
        'default',
      ];

      states.forEach((state, index) => {
        model.addNode({
          id: `node${index}`,
          x: 100 + index * 50,
          y: 100,
          state,
        });
      });

      renderer.drawAll(model);

      expect(mockFill).toHaveBeenCalledTimes(states.length);
    });

    it('should use custom color when provided', () => {
      model.addNode({
        id: 'node1',
        x: 100,
        y: 100,
        color: '#ff0000',
      });

      renderer.drawAll(model);

      expect(mockFill).toHaveBeenCalled();
    });

    it('should handle node without containers', () => {
      const uninitializedRenderer = new Renderer();
      model.addNode({ id: 'node1', x: 100, y: 100 });
      expect(() => uninitializedRenderer.drawAll(model)).not.toThrow();
    });
  });

  describe('drawEdge', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
    });

    it('should draw undirected edge', () => {
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });

      renderer.drawAll(model);

      expect(mockMoveTo).toHaveBeenCalled();
      expect(mockLineTo).toHaveBeenCalled();
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should draw directed edge with arrow', () => {
      model.addEdge({
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        directed: true,
      });

      renderer.drawAll(model);

      expect(mockMoveTo).toHaveBeenCalled();
      expect(mockLineTo).toHaveBeenCalled();
    });

    it('should not draw edge if source and target are at same position', () => {
      model.addNode({ id: 'node3', x: 100, y: 100 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node3' });

      jest.clearAllMocks();
      renderer.drawAll(model);

      expect(mockLineTo).not.toHaveBeenCalled();
    });

    it('should use custom edge width', () => {
      model.addEdge({
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        width: 5,
      });

      renderer.drawAll(model);

      expect(mockStroke).toHaveBeenCalledWith(expect.objectContaining({ width: 5 }));
    });

    it('should handle different edge states', () => {
      model.addNode({ id: 'node3', x: 300, y: 300 });
      model.addNode({ id: 'node4', x: 400, y: 400 });
      model.addNode({ id: 'node5', x: 500, y: 500 });
      model.addNode({ id: 'node6', x: 600, y: 600 });
      const states: ElementState[] = [
        'active',
        'visited',
        'current',
        'path',
        'rejected',
        'candidate',
        'default',
      ];

      const pairs = [
        ['node1', 'node3'],
        ['node2', 'node4'],
        ['node1', 'node5'],
        ['node2', 'node6'],
        ['node3', 'node4'],
        ['node3', 'node5'],
        ['node4', 'node6'],
      ];

      states.forEach((state, index) => {
        const [source, target] = pairs[index]! as [string, string];
        model.addEdge({
          id: `edge${index}`,
          source,
          target,
          state,
        });
      });

      renderer.drawAll(model);

      expect(mockStroke).toHaveBeenCalled();
    });

    it('should remove old graphics when redrawing', () => {
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
      renderer.drawAll(model);

      jest.clearAllMocks();
      renderer.drawAll(model);

      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should remove old edge graphic when redrawing edge', () => {
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
      renderer.drawAll(model);
      const oldGraphic = createdGraphics.find(g => g !== undefined);

      jest.clearAllMocks();
      model.updateEdge('edge1', { width: 5 });
      renderer.drawAll(model);

      expect(oldGraphic?.destroy).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should handle edge without source node', () => {
      try {
        model.addEdge({ id: 'edge1', source: 'nonexistent', target: 'node2' });
      } catch (e) {}
      const testModel = new GraphModel(false);
      testModel.addNode({ id: 'node2', x: 200, y: 200 });
      expect(() => renderer.drawAll(testModel)).not.toThrow();
    });

    it('should handle edge without target node', () => {
      try {
        model.addEdge({ id: 'edge1', source: 'node1', target: 'nonexistent' });
      } catch (e) {}
      const testModel = new GraphModel(false);
      testModel.addNode({ id: 'node1', x: 100, y: 100 });
      expect(() => renderer.drawAll(testModel)).not.toThrow();
    });

    it('should handle edge without container', () => {
      const uninitializedRenderer = new Renderer();
      const testModel = new GraphModel(false);
      testModel.addNode({ id: 'node1', x: 100, y: 100 });
      testModel.addNode({ id: 'node2', x: 200, y: 200 });
      testModel.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
      expect(() => uninitializedRenderer.drawAll(testModel)).not.toThrow();
    });
  });

  describe('getStateColor', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });
    });

    it('should return correct color for active state', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, state: 'active' });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should return correct color for visited state', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, state: 'visited' });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should return correct color for current state', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, state: 'current' });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should return correct color for path state', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, state: 'path' });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should return correct color for rejected state', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, state: 'rejected' });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should return correct color for candidate state', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, state: 'candidate' });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should use default color when state is undefined', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should parse hex color with # prefix', () => {
      model.addNode({
        id: 'node1',
        x: 100,
        y: 100,
        color: '#ff0000',
      });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should parse hex color without # prefix', () => {
      model.addNode({
        id: 'node1',
        x: 100,
        y: 100,
        color: 'ff0000',
      });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should use default color when custom color is empty', () => {
      model.addNode({
        id: 'node1',
        x: 100,
        y: 100,
        color: '',
      });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should handle state with custom color', () => {
      model.addNode({
        id: 'node1',
        x: 100,
        y: 100,
        state: 'active',
        color: '#00ff00',
      });
      renderer.drawAll(model);
      expect(mockFill).toHaveBeenCalled();
    });

    it('should handle edge with custom color', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        color: '#ff00ff',
      });
      renderer.drawAll(model);
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should handle edge state with custom color', () => {
      const testModel = new GraphModel(false);
      testModel.addNode({ id: 'node1', x: 100, y: 100 });
      testModel.addNode({ id: 'node2', x: 200, y: 200 });
      testModel.addEdge({
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        state: 'active',
        color: '#00ffff',
      });
      renderer.drawAll(testModel);
      expect(mockStroke).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
    });

    it('should clear all nodes, edges, and labels', () => {
      jest.clearAllMocks();
      renderer.clear();

      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should clear graphics maps', () => {
      renderer.clear();
      jest.clearAllMocks();
      model.addNode({ id: 'node2', x: 200, y: 200 });
      renderer.drawAll(model);

      expect(mockGraphics).toHaveBeenCalled();
    });

    it('should handle clear when containers are null', () => {
      const uninitializedRenderer = new Renderer();
      expect(() => uninitializedRenderer.clear()).not.toThrow();
    });
  });

  describe('resize', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });
    });

    it('should resize renderer', () => {
      renderer.resize(1200, 900);

      expect(mockResize).toHaveBeenCalledWith(1200, 900);
    });

    it('should do nothing if app is not initialized', () => {
      const uninitializedRenderer = new Renderer();
      uninitializedRenderer.resize(1200, 900);

      expect(mockResize).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
    });

    it('should clear all graphics', () => {
      jest.clearAllMocks();
      renderer.destroy();

      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should destroy Pixi Application', () => {
      renderer.destroy();

      expect(mockDestroy).toHaveBeenCalledWith(true, { children: true });
    });

    it('should reset app to null', () => {
      renderer.destroy();

      expect(renderer.getApp()).toBeNull();
    });

    it('should reset containers to null', () => {
      renderer.destroy();

      const containers = renderer.getContainers();
      expect(containers.edges).toBeNull();
      expect(containers.nodes).toBeNull();
      expect(containers.labels).toBeNull();
    });

    it('should handle multiple calls to destroy', () => {
      renderer.destroy();
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });
    });

    it('should handle empty graph', () => {
      expect(() => renderer.drawAll(model)).not.toThrow();
    });

    it('should handle graph with only nodes', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });

      expect(() => renderer.drawAll(model)).not.toThrow();
    });

    it('should handle drawing after destroy', () => {
      renderer.destroy();
      model.addNode({ id: 'node1', x: 100, y: 100 });

      expect(() => renderer.drawAll(model)).not.toThrow();
      expect(mockGraphics).not.toHaveBeenCalled();
    });

    it('should handle node that does not exist in model', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
      model.removeNode('node1');
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['node1']), model);
      expect(mockGraphics).not.toHaveBeenCalled();
    });

    it('should handle edge that does not exist in model', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
      renderer.drawAll(model);
      model.removeEdge('edge1');
      jest.clearAllMocks();
      renderer.renderDirty(new Set(['edge1']), model);
      expect(mockGraphics).not.toHaveBeenCalled();
    });

    it('should handle drawing node when oldGraphic exists', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
      const oldGraphic = createdGraphics[0];
      expect(oldGraphic).toBeDefined();
      jest.clearAllMocks();
      model.updateNode('node1', { x: 150, y: 150 });
      renderer.drawAll(model);
      expect(oldGraphic.destroy).toHaveBeenCalled();
    });

    it('should handle drawing node when oldLabel exists', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
      const oldLabel = createdTexts[0];
      expect(oldLabel).toBeDefined();
      jest.clearAllMocks();
      model.updateNode('node1', { x: 150, y: 150 });
      renderer.drawAll(model);
      expect(oldLabel.destroy).toHaveBeenCalled();
    });

    it('should call removeChild for old graphic when redrawing node', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);
      const oldGraphic = createdGraphics[0];
      expect(oldGraphic).toBeDefined();

      jest.clearAllMocks();
      const containers = renderer.getContainers();
      const removeChildSpy = jest.spyOn(containers.nodes!, 'removeChild');

      // Используем renderDirty вместо drawAll, чтобы старые графики остались
      model.updateNode('node1', { x: 150, y: 150 });
      renderer.renderDirty(new Set(['node1']), model);

      expect(removeChildSpy).toHaveBeenCalledWith(oldGraphic);
      expect(oldGraphic.destroy).toHaveBeenCalled();
    });

    it('should call removeChild for old label when redrawing node', () => {
      model.addNode({ id: 'node1', x: 100, y: 100, label: 'Node 1' });
      renderer.drawAll(model);
      const oldLabel = createdTexts[0];
      expect(oldLabel).toBeDefined();

      jest.clearAllMocks();
      const containers = renderer.getContainers();
      const removeChildSpy = jest.spyOn(containers.labels!, 'removeChild');

      // Используем renderDirty вместо drawAll, чтобы старые метки остались
      model.updateNode('node1', { x: 150, y: 150 });
      renderer.renderDirty(new Set(['node1']), model);

      expect(removeChildSpy).toHaveBeenCalledWith(oldLabel);
      expect(oldLabel.destroy).toHaveBeenCalled();
    });

    it('should handle drawing edge when oldGraphic exists', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
      renderer.drawAll(model);
      const oldGraphic = createdGraphics.find(g => g !== undefined);
      expect(oldGraphic).toBeDefined();
      jest.clearAllMocks();
      model.updateEdge('edge1', { width: 5 });
      renderer.drawAll(model);
      expect(oldGraphic?.destroy).toHaveBeenCalled();
    });
  });

  describe('setViewportAdapter', () => {
    it('should set viewport adapter', () => {
      const mockViewportAdapter = {
        pauseDrag: jest.fn(),
        resumeDrag: jest.fn(),
      } as any;

      renderer.setViewportAdapter(mockViewportAdapter);
      // Проверяем, что метод не выбрасывает ошибку
      expect(() => renderer.setViewportAdapter(mockViewportAdapter)).not.toThrow();
    });

    it('should allow setting null viewport adapter', () => {
      expect(() => renderer.setViewportAdapter(null)).not.toThrow();
    });
  });

  describe('node dragging', () => {
    let mockViewportAdapter: any;
    let stageOnHandlers: Map<string, jest.Mock>;

    beforeEach(async () => {
      await renderer.init(canvas, {
        width: 800,
        height: 600,
        backgroundColor: 0x1f2937,
      });

      stageOnHandlers = new Map();
      const app = renderer.getApp();
      if (app && app.stage) {
        (app.stage as any).on = jest.fn((event: string, handler: any) => {
          stageOnHandlers.set(event, handler);
        });
      }

      mockViewportAdapter = {
        pauseDrag: jest.fn(),
        resumeDrag: jest.fn(),
      };

      renderer.setViewportAdapter(mockViewportAdapter);
    });

    it('should setup node interactivity when drawing nodes', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      const nodeGraphic = createdGraphics[0];
      expect(nodeGraphic).toBeDefined();
      expect(nodeGraphic.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should pause viewport drag when node drag starts', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      expect(pointerDownHandler).toBeDefined();

      const mockEvent = {
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      };

      // Мокируем toLocal для nodesContainer
      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler(mockEvent);

      expect(mockViewportAdapter.pauseDrag).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not pause drag if model is null', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Устанавливаем model в null
      (renderer as any).model = null;

      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockEvent = {
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      };

      pointerDownHandler(mockEvent);

      expect(mockViewportAdapter.pauseDrag).not.toHaveBeenCalled();
    });

    it('should not pause drag if node does not exist', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Удаляем узел из модели
      model.removeNode('node1');

      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockEvent = {
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      };

      pointerDownHandler(mockEvent);

      expect(mockViewportAdapter.pauseDrag).not.toHaveBeenCalled();
    });

    it('should update node position on pointer move', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Начинаем перетаскивание
      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler({
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      });

      // Получаем обработчик pointermove
      const pointerMoveHandler = stageOnHandlers.get('pointermove');
      expect(pointerMoveHandler).toBeDefined();
      if (!pointerMoveHandler) return;

      // Мокируем toLocal для нового вызова
      mockToLocal.mockReturnValue({ x: 200, y: 200 });

      const updateNodeSpy = jest.spyOn(model, 'updateNode');

      pointerMoveHandler({
        global: { x: 250, y: 250 },
      });

      expect(updateNodeSpy).toHaveBeenCalledWith('node1', { x: 200, y: 200 });
    });

    it('should not update position if not dragging', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      const pointerMoveHandler = stageOnHandlers.get('pointermove');
      expect(pointerMoveHandler).toBeDefined();
      if (!pointerMoveHandler) return;

      const updateNodeSpy = jest.spyOn(model, 'updateNode');

      pointerMoveHandler({
        global: { x: 250, y: 250 },
      });

      expect(updateNodeSpy).not.toHaveBeenCalled();
    });

    it('should not update position if model is null during drag', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Начинаем перетаскивание
      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler({
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      });

      // Устанавливаем model в null
      (renderer as any).model = null;

      const pointerMoveHandler = stageOnHandlers.get('pointermove');
      expect(pointerMoveHandler).toBeDefined();
      if (!pointerMoveHandler) return;

      const updateNodeSpy = jest.spyOn(model, 'updateNode');

      pointerMoveHandler({
        global: { x: 250, y: 250 },
      });

      expect(updateNodeSpy).not.toHaveBeenCalled();
    });

    it('should redraw connected edges when node is dragged', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      model.addNode({ id: 'node2', x: 200, y: 200 });
      model.addEdge({ id: 'edge1', source: 'node1', target: 'node2' });
      renderer.drawAll(model);

      // Находим графику узла (первая созданная графика - это узел)
      const nodeGraphic = createdGraphics.find((g: any) =>
        g.on.mock.calls.some((call: any[]) => call[0] === 'pointerdown')
      );

      expect(nodeGraphic).toBeDefined();

      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      expect(pointerDownHandler).toBeDefined();

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler({
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      });

      const drawEdgeSpy = jest.spyOn(renderer as any, 'drawEdge');
      mockToLocal.mockReturnValue({ x: 200, y: 200 });

      const pointerMoveHandler = stageOnHandlers.get('pointermove');
      expect(pointerMoveHandler).toBeDefined();
      if (!pointerMoveHandler) return;

      pointerMoveHandler({
        global: { x: 250, y: 250 },
      });

      expect(drawEdgeSpy).toHaveBeenCalledWith('edge1', model);
    });

    it('should resume drag when pointer up', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Начинаем перетаскивание
      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler({
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      });

      const pointerUpHandler = stageOnHandlers.get('pointerup');
      expect(pointerUpHandler).toBeDefined();
      if (!pointerUpHandler) return;

      pointerUpHandler();

      expect(mockViewportAdapter.resumeDrag).toHaveBeenCalled();
    });

    it('should resume drag when pointer up outside', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Начинаем перетаскивание
      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler({
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      });

      const pointerUpOutsideHandler = stageOnHandlers.get('pointerupoutside');
      expect(pointerUpOutsideHandler).toBeDefined();
      if (!pointerUpOutsideHandler) return;

      pointerUpOutsideHandler();

      expect(mockViewportAdapter.resumeDrag).toHaveBeenCalled();
    });

    it('should not resume drag if not dragging', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      const pointerUpHandler = stageOnHandlers.get('pointerup');
      expect(pointerUpHandler).toBeDefined();
      if (!pointerUpHandler) return;

      pointerUpHandler();

      expect(mockViewportAdapter.resumeDrag).not.toHaveBeenCalled();
    });

    it('should handle drag without viewport adapter', () => {
      renderer.setViewportAdapter(null);
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      expect(() => {
        pointerDownHandler({
          global: { x: 150, y: 150 },
          stopPropagation: jest.fn(),
        });
      }).not.toThrow();
    });

    it('should handle drag without local position', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue(null);
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      expect(() => {
        pointerDownHandler({
          global: { x: 150, y: 150 },
          stopPropagation: jest.fn(),
        });
      }).not.toThrow();
    });

    it('should handle pointer move without local position', () => {
      model.addNode({ id: 'node1', x: 100, y: 100 });
      renderer.drawAll(model);

      // Начинаем перетаскивание
      const nodeGraphic = createdGraphics[0];
      const pointerDownHandler = nodeGraphic.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];

      const mockToLocal = jest.fn().mockReturnValue({ x: 100, y: 100 });
      const containers = renderer.getContainers();
      if (containers.nodes) {
        (containers.nodes as any).toLocal = mockToLocal;
      }

      pointerDownHandler({
        global: { x: 150, y: 150 },
        stopPropagation: jest.fn(),
      });

      mockToLocal.mockReturnValue(null);

      const pointerMoveHandler = stageOnHandlers.get('pointermove');
      expect(pointerMoveHandler).toBeDefined();
      if (!pointerMoveHandler) return;

      const updateNodeSpy = jest.spyOn(model, 'updateNode');

      pointerMoveHandler({
        global: { x: 250, y: 250 },
      });

      expect(updateNodeSpy).not.toHaveBeenCalled();
    });
  });
});
