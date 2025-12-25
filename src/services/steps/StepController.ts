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

  setSteps(steps: Step[]): void {
    this.steps = steps;
    this.currentIndex = -1;
    this.playing = false;
    this.stopPlayback();
  }

  addSteps(steps: Step[]): void {
    this.steps.push(...steps);
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getStepByIndex(index: number): Step | null {
    if (index < 0 || index >= this.steps.length) {
      return null;
    }
    return this.steps[index] || null;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  setSpeed(speedMs: number): void {
    this.speedMs = speedMs;

    if (this.playing) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

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

  play(): void {
    if (this.playing) return;

    if (this.currentIndex >= this.steps.length - 1) {
      this.reset();
    }

    this.playing = true;
    this.startPlayback();
  }

  pause(): void {
    this.playing = false;
    this.stopPlayback();
  }

  toggle(): void {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  reset(): void {
    this.pause();
    this.goToIndex(-1);
  }

  goToEnd(): void {
    this.pause();
    this.goToIndex(this.steps.length - 1);
  }

  private startPlayback(): void {
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.speedMs);
  }

  private stopPlayback(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

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

  destroy(): void {
    this.stopPlayback();
    this.applier.clear();
    this.steps = [];
    this.currentIndex = -1;
    this.playing = false;
  }
}
