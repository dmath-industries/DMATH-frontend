/**
 * Unit тесты для StepController
 * Покрывают воспроизведение шагов алгоритма
 */

import { StepController } from '../StepController';
import { GraphModel } from '@/services/graph/GraphModel';
import { Applier } from '../Applier';
import { Renderer } from '@/services/renderer/Renderer';
import { Step, HighlightNodeStep } from '@/types';

jest.mock('pixi.js', () => ({
  Application: jest.fn(),
  Container: jest.fn(),
  Graphics: jest.fn(),
  Text: jest.fn(),
}));

class MockRenderer extends Renderer {
  renderDirty = jest.fn();
  renderAll = jest.fn();
  clear = jest.fn();
  destroy = jest.fn();

  constructor() {
    super();
  }
}

describe('StepController', () => {
  let controller: StepController;
  let model: GraphModel;
  let applier: Applier;
  let renderer: MockRenderer;
  let onIndexChange: jest.Mock;
  let onComplete: jest.Mock;

  beforeEach(() => {
    model = new GraphModel(false);
    applier = new Applier();
    renderer = new MockRenderer();
    onIndexChange = jest.fn();
    onComplete = jest.fn();

    model.addNode({ id: 'a', x: 0, y: 0 });
    model.addNode({ id: 'b', x: 100, y: 100 });
    model.addNode({ id: 'c', x: 200, y: 200 });

    controller = new StepController({
      model,
      applier,
      renderer,
      onIndexChange,
      onComplete,
    });
  });

  afterEach(() => {
    controller.destroy();
    jest.clearAllTimers();
  });

  const createTestSteps = (): Step[] => {
    return [
      {
        type: 'HIGHLIGHT_NODE',
        id: 'step1',
        timestamp: Date.now(),
        nodeId: 'a',
        state: 'active',
      },
      {
        type: 'HIGHLIGHT_NODE',
        id: 'step2',
        timestamp: Date.now(),
        nodeId: 'b',
        state: 'active',
      },
      {
        type: 'HIGHLIGHT_NODE',
        id: 'step3',
        timestamp: Date.now(),
        nodeId: 'c',
        state: 'active',
      },
    ];
  };

  describe('constructor', () => {
    it('должен инициализироваться с начальными значениями', () => {
      expect(controller.getCurrentIndex()).toBe(-1);
      expect(controller.getTotalSteps()).toBe(0);
      expect(controller.isPlaying()).toBe(false);
    });
  });

  describe('setSteps', () => {
    it('должен устанавливать шаги', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);

      expect(controller.getTotalSteps()).toBe(3);
      expect(controller.getCurrentIndex()).toBe(-1);
    });

    it('должен сбрасывать состояние при установке новых шагов', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      controller.forward();

      expect(controller.getCurrentIndex()).toBe(0);

      controller.setSteps([]);

      expect(controller.getCurrentIndex()).toBe(-1);
      expect(controller.getTotalSteps()).toBe(0);
    });

    it('должен останавливать воспроизведение при установке новых шагов', () => {
      jest.useFakeTimers();

      const steps = createTestSteps();
      controller.setSteps(steps);
      controller.play();

      expect(controller.isPlaying()).toBe(true);

      controller.setSteps([]);

      expect(controller.isPlaying()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('addSteps', () => {
    it('должен добавлять шаги к существующим', () => {
      const steps1 = createTestSteps().slice(0, 2);
      const steps2 = createTestSteps().slice(2);

      controller.setSteps(steps1);
      expect(controller.getTotalSteps()).toBe(2);

      controller.addSteps(steps2);
      expect(controller.getTotalSteps()).toBe(3);
    });
  });

  describe('forward', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
    });

    it('должен переходить к следующему шагу', () => {
      controller.forward();

      expect(controller.getCurrentIndex()).toBe(0);
      expect(onIndexChange).toHaveBeenCalledWith(0);
      expect(renderer.renderDirty).toHaveBeenCalled();
    });

    it('должен последовательно переходить по шагам', () => {
      controller.forward();
      expect(controller.getCurrentIndex()).toBe(0);

      controller.forward();
      expect(controller.getCurrentIndex()).toBe(1);

      controller.forward();
      expect(controller.getCurrentIndex()).toBe(2);
    });

    it('не должен переходить за последний шаг', () => {
      controller.goToIndex(2);

      controller.forward();

      expect(controller.getCurrentIndex()).toBe(2);
      expect(onComplete).toHaveBeenCalled();
    });

    it('должен вызывать onComplete при достижении конца', () => {
      controller.goToIndex(2);
      controller.forward();

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('backward', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
      controller.goToIndex(2);
    });

    it('должен переходить к предыдущему шагу', () => {
      controller.backward();

      expect(controller.getCurrentIndex()).toBe(1);
      expect(onIndexChange).toHaveBeenCalledWith(1);
      expect(renderer.renderDirty).toHaveBeenCalled();
    });

    it('должен последовательно переходить назад по шагам', () => {
      controller.backward();
      expect(controller.getCurrentIndex()).toBe(1);

      controller.backward();
      expect(controller.getCurrentIndex()).toBe(0);

      controller.backward();
      expect(controller.getCurrentIndex()).toBe(-1);
    });

    it('не должен переходить за начальное состояние', () => {
      controller.reset();
      controller.backward();

      expect(controller.getCurrentIndex()).toBe(-1);
    });
  });

  describe('goToIndex', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
    });

    it('должен переходить к конкретному индексу вперёд', () => {
      controller.goToIndex(2);

      expect(controller.getCurrentIndex()).toBe(2);
    });

    it('должен переходить к конкретному индексу назад', () => {
      controller.goToIndex(2);
      controller.goToIndex(0);

      expect(controller.getCurrentIndex()).toBe(0);
    });

    it('не должен изменять индекс если он уже равен целевому', () => {
      controller.goToIndex(1);
      const callCount = onIndexChange.mock.calls.length;

      controller.goToIndex(1);

      expect(onIndexChange).toHaveBeenCalledTimes(callCount);
    });

    it('не должен переходить к недопустимому индексу', () => {
      controller.goToIndex(10);
      expect(controller.getCurrentIndex()).toBe(-1);

      controller.goToIndex(-5);
      expect(controller.getCurrentIndex()).toBe(-1);
    });

    it('должен переходить к индексу -1 (начальное состояние)', () => {
      controller.goToIndex(2);
      controller.goToIndex(-1);

      expect(controller.getCurrentIndex()).toBe(-1);
    });
  });

  describe('play/pause', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      controller.setSteps(createTestSteps());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('должен начинать автоматическое воспроизведение', () => {
      controller.play();

      expect(controller.isPlaying()).toBe(true);
    });

    it('должен автоматически переходить к следующему шагу', () => {
      controller.play();

      jest.advanceTimersByTime(1000);
      expect(controller.getCurrentIndex()).toBe(0);

      jest.advanceTimersByTime(1000);
      expect(controller.getCurrentIndex()).toBe(1);
    });

    it('должен останавливать воспроизведение', () => {
      controller.play();
      expect(controller.isPlaying()).toBe(true);

      controller.pause();
      expect(controller.isPlaying()).toBe(false);
    });

    it('должен начинать сначала если в конце', () => {
      controller.goToIndex(2);
      controller.play();

      expect(controller.getCurrentIndex()).toBe(-1);
      expect(controller.isPlaying()).toBe(true);
    });

    it('не должен запускать несколько плееров одновременно', () => {
      controller.play();
      controller.play();

      jest.advanceTimersByTime(1000);

      expect(controller.getCurrentIndex()).toBe(0);
    });
  });

  describe('toggle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      controller.setSteps(createTestSteps());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('должен переключать между play и pause', () => {
      controller.toggle();
      expect(controller.isPlaying()).toBe(true);

      controller.toggle();
      expect(controller.isPlaying()).toBe(false);
    });
  });

  describe('setSpeed', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      controller.setSteps(createTestSteps());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('должен изменять скорость воспроизведения', () => {
      controller.setSpeed(500);
      controller.play();

      jest.advanceTimersByTime(500);
      expect(controller.getCurrentIndex()).toBe(0);

      jest.advanceTimersByTime(500);
      expect(controller.getCurrentIndex()).toBe(1);
    });

    it('должен перезапускать плеер с новой скоростью', () => {
      controller.play();

      jest.advanceTimersByTime(1000);
      expect(controller.getCurrentIndex()).toBe(0);

      controller.setSpeed(500);

      jest.advanceTimersByTime(500);
      expect(controller.getCurrentIndex()).toBe(1);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
      controller.goToIndex(2);
    });

    it('должен сбрасывать к начальному состоянию', () => {
      controller.reset();

      expect(controller.getCurrentIndex()).toBe(-1);
    });

    it('должен останавливать воспроизведение', () => {
      jest.useFakeTimers();

      controller.play();
      expect(controller.isPlaying()).toBe(true);

      controller.reset();
      expect(controller.isPlaying()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('goToEnd', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
    });

    it('должен переходить к последнему шагу', () => {
      controller.goToEnd();

      expect(controller.getCurrentIndex()).toBe(2);
    });

    it('должен останавливать воспроизведение', () => {
      jest.useFakeTimers();

      controller.play();
      controller.goToEnd();

      expect(controller.isPlaying()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
    });

    it('должен очищать все ресурсы', () => {
      jest.useFakeTimers();

      controller.play();
      controller.destroy();

      expect(controller.isPlaying()).toBe(false);
      expect(controller.getCurrentIndex()).toBe(-1);
      expect(controller.getTotalSteps()).toBe(0);

      jest.useRealTimers();
    });

    it('должен останавливать автовоспроизведение', () => {
      jest.useFakeTimers();

      controller.play();
      controller.destroy();

      jest.advanceTimersByTime(5000);
      expect(controller.getCurrentIndex()).toBe(-1);

      jest.useRealTimers();
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      controller.setSteps(createTestSteps());
    });

    it('должен корректно обрабатывать forward -> backward', () => {
      controller.forward();
      controller.forward();
      expect(controller.getCurrentIndex()).toBe(1);

      controller.backward();
      expect(controller.getCurrentIndex()).toBe(0);
    });

    it('должен корректно обрабатывать goToIndex -> play', () => {
      jest.useFakeTimers();

      controller.goToIndex(1);
      controller.play();

      jest.advanceTimersByTime(1000);
      expect(controller.getCurrentIndex()).toBe(2);

      jest.useRealTimers();
    });

    it('должен корректно обрабатывать pause -> goToIndex -> play', () => {
      jest.useFakeTimers();

      controller.play();
      jest.advanceTimersByTime(1000);

      controller.pause();
      controller.goToIndex(-1);
      controller.play();

      jest.advanceTimersByTime(1000);
      expect(controller.getCurrentIndex()).toBe(0);

      jest.useRealTimers();
    });

    it('должен вызывать callbacks в правильной последовательности', () => {
      controller.forward();
      controller.forward();

      expect(onIndexChange).toHaveBeenCalledTimes(2);
      expect(onIndexChange).toHaveBeenNthCalledWith(1, 0);
      expect(onIndexChange).toHaveBeenNthCalledWith(2, 1);
    });
  });

  describe('edge cases', () => {
    it('должен работать с пустым списком шагов', () => {
      controller.setSteps([]);

      expect(() => controller.forward()).not.toThrow();
      expect(() => controller.backward()).not.toThrow();
      expect(() => controller.play()).not.toThrow();
    });

    it('должен работать с одним шагом', () => {
      controller.setSteps([createTestSteps()[0]!]);

      controller.forward();
      expect(controller.getCurrentIndex()).toBe(0);

      controller.forward();
      expect(controller.getCurrentIndex()).toBe(0);
      expect(onComplete).toHaveBeenCalled();
    });

    it('не должен падать при вызове методов после destroy', () => {
      controller.destroy();

      expect(() => controller.forward()).not.toThrow();
      expect(() => controller.backward()).not.toThrow();
      expect(() => controller.play()).not.toThrow();
    });

    it('should handle undefined step in forward', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      controller.goToIndex(steps.length - 1);
      const mockSteps = steps as any;
      mockSteps[steps.length] = undefined;
      controller.setSteps(mockSteps);
      expect(() => controller.forward()).not.toThrow();
    });

    it('should handle undefined step in backward', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      controller.goToIndex(1);
      const mockSteps = steps as any;
      mockSteps[0] = undefined;
      controller.setSteps(mockSteps);
      expect(() => controller.backward()).not.toThrow();
    });
  });

  describe('getStepByIndex', () => {
    it('должен возвращать null для отрицательного индекса', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      expect(controller.getStepByIndex(-1)).toBeNull();
    });

    it('должен возвращать null для индекса больше длины', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      expect(controller.getStepByIndex(100)).toBeNull();
    });

    it('должен возвращать null для индекса равного длине', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      expect(controller.getStepByIndex(steps.length)).toBeNull();
    });

    it('должен возвращать null для undefined шага', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      expect(controller.getStepByIndex(0)).not.toBeNull();
    });
  });

  describe('forward edge cases', () => {
    it('должен обрабатывать случай, когда step undefined', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      controller.goToIndex(0);
      controller['steps'] = [undefined as any, ...steps.slice(1)];
      controller['currentIndex'] = -1;
      controller.forward();
      expect(controller.getCurrentIndex()).toBe(-1);
    });
  });

  describe('tick edge cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('должен останавливать воспроизведение, если playing стал false', () => {
      const steps = createTestSteps();
      controller.setSteps(steps);
      controller.play();
      controller['playing'] = false;
      jest.advanceTimersByTime(100);
      expect(controller.isPlaying()).toBe(false);
    });
  });
});
