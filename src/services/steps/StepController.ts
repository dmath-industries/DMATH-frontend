/**
 * StepController — плеер для воспроизведения шагов алгоритма
 * Связывает Applier ↔ GraphModel ↔ Renderer
 */

import { GraphModel } from '@/services/graph/GraphModel';
import { Applier } from './Applier';
import { Renderer } from '@/services/renderer/Renderer';
import { Step } from '@/types';

export interface StepControllerConfig {
  model: GraphModel;
  applier: Applier;
  renderer: Renderer;
  onIndexChange?: (index: number) => void;
  onComplete?: () => void;
}

export class StepController {
  private model: GraphModel;
  private applier: Applier;
  private renderer: Renderer;

  private steps: Step[] = [];
  private currentIndex: number = -1;
  private playing: boolean = false;
  private speedMs: number = 1000;
  private intervalId: NodeJS.Timeout | null = null;

  private onIndexChange?: (index: number) => void;
  private onComplete?: () => void;

  constructor(config: StepControllerConfig) {
    this.model = config.model;
    this.applier = config.applier;
    this.renderer = config.renderer;
    this.onIndexChange = config.onIndexChange;
    this.onComplete = config.onComplete;
  }

  /**
   * Установить шаги
   */
  setSteps(steps: Step[]): void {
    this.steps = steps;
    this.currentIndex = -1;
    this.playing = false;
    this.stopPlayback();
  }

  /**
   * Добавить шаги
   */
  addSteps(steps: Step[]): void {
    this.steps.push(...steps);
  }

  /**
   * Получить текущий индекс
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Получить шаг по индексу
   */
  getStepByIndex(index: number): Step | null {
    if (index < 0 || index >= this.steps.length) {
      return null;
    }
    return this.steps[index] || null;
  }

  /**
   * Получить общее количество шагов
   */
  getTotalSteps(): number {
    return this.steps.length;
  }

  /**
   * Проверить, проигрывается ли
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Установить скорость (мс между шагами)
   */
  setSpeed(speedMs: number): void {
    this.speedMs = speedMs;

    if (this.playing) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  /**
   * Перейти к конкретному индексу
   */
  goToIndex(targetIndex: number): void {
    if (targetIndex < -1 || targetIndex >= this.steps.length) {
      return;
    }

    if (targetIndex === this.currentIndex) {
      return;
    }

    if (targetIndex > this.currentIndex) {
      while (this.currentIndex < targetIndex) {
        this.forward();
      }
    } else {
      while (this.currentIndex > targetIndex) {
        this.backward();
      }
    }
  }

  /**
   * Следующий шаг
   */
  forward(): void {
    if (this.currentIndex >= this.steps.length - 1) {
      this.pause();
      this.onComplete?.();
      return;
    }

    const nextIndex = this.currentIndex + 1;
    const step = this.steps[nextIndex];

    if (!step) {
      return;
    }

    const dirtyIds = this.applier.apply(step, this.model);
    this.renderer.renderDirty(new Set(dirtyIds), this.model);

    this.currentIndex = nextIndex;
    this.onIndexChange?.(this.currentIndex);
  }

  /**
   * Предыдущий шаг
   */
  backward(): void {
    if (this.currentIndex < 0) {
      return;
    }

    const step = this.steps[this.currentIndex];
    if (!step) {
      return;
    }

    const dirtyIds = this.applier.revert(step, this.model);
    this.renderer.renderDirty(new Set(dirtyIds), this.model);

    this.currentIndex--;
    this.onIndexChange?.(this.currentIndex);
  }

  /**
   * Начать воспроизведение
   */
  play(): void {
    if (this.playing) return;

    if (this.currentIndex >= this.steps.length - 1) {
      this.reset();
    }

    this.playing = true;
    this.startPlayback();
  }

  /**
   * Пауза
   */
  pause(): void {
    this.playing = false;
    this.stopPlayback();
  }

  /**
   * Переключить play/pause
   */
  toggle(): void {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Сброс к начальному состоянию
   */
  reset(): void {
    this.pause();
    this.goToIndex(-1);
  }

  /**
   * Перейти в конец
   */
  goToEnd(): void {
    this.pause();
    this.goToIndex(this.steps.length - 1);
  }

  /**
   * Начать автоматическое воспроизведение
   */
  private startPlayback(): void {
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.speedMs);
  }

  /**
   * Остановить автоматическое воспроизведение
   */
  private stopPlayback(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Тик плеера
   */
  private tick(): void {
    if (!this.playing) {
      this.stopPlayback();
      return;
    }

    if (this.currentIndex >= this.steps.length - 1) {
      this.pause();
      this.onComplete?.();
      return;
    }

    this.forward();
  }

  /**
   * Очистка
   */
  destroy(): void {
    this.stopPlayback();
    this.applier.clear();
    this.steps = [];
    this.currentIndex = -1;
    this.playing = false;
  }
}
