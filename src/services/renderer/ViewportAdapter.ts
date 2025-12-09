/**
 * ViewportAdapter — управление камерой и viewport
 * Полностью переписанный с нуля для правильного центрирования графа
 */

import { Application, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { GraphModel } from '@/services/graph/GraphModel';

export interface ViewportConfig {
  screenWidth: number;
  screenHeight: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface ViewportSettings {
  minZoom: number;
  maxZoom: number;
  wheelSmooth: number;
  wheelPercent: number;
}

const DEFAULT_SETTINGS: ViewportSettings = {
  minZoom: 0.1,
  maxZoom: 5,
  wheelSmooth: 3,
  wheelPercent: 0.1,
};

export class ViewportAdapter {
  private viewport: Viewport | null = null;
  private onViewportChange?: (state: ViewportState) => void;
  private settings: ViewportSettings = DEFAULT_SETTINGS;

  /**
   * Создать viewport с взаимодействием
   */
  create(
    app: Application,
    config: ViewportConfig,
    containers?: { edges: Container | null; nodes: Container | null; labels: Container | null },
    customSettings?: Partial<ViewportSettings>
  ): Viewport {
    this.settings = { ...DEFAULT_SETTINGS, ...customSettings };

    const worldSize = 10000;

    this.viewport = new Viewport({
      screenWidth: config.screenWidth,
      screenHeight: config.screenHeight,
      worldWidth: worldSize,
      worldHeight: worldSize,
      events: app.renderer.events,
      passiveWheel: false,
    });

    app.stage.addChild(this.viewport);

    if (containers && containers.edges && containers.nodes && containers.labels) {
      this.viewport.addChild(containers.edges);
      this.viewport.addChild(containers.nodes);
      this.viewport.addChild(containers.labels);
    }

    this.viewport
      .drag({
        mouseButtons: 'left',
      })
      .wheel({
        smooth: this.settings.wheelSmooth,
        percent: this.settings.wheelPercent,
      })
      .pinch()
      .decelerate({
        friction: 0.88,
      })
      .clampZoom({
        minScale: this.settings.minZoom,
        maxScale: this.settings.maxZoom,
      });

    this.viewport.on('moved', () => this.emitChange());
    this.viewport.on('zoomed', () => this.emitChange());

    this.viewport.moveCenter(worldSize / 2, worldSize / 2);
    this.viewport.setZoom(1, true);

    return this.viewport;
  }

  /**
   * Установить обработчик изменений viewport
   */
  setOnChange(callback: (state: ViewportState) => void): void {
    this.onViewportChange = callback;
  }

  /**
   * Получить текущий viewport
   */
  getViewport(): Viewport | null {
    return this.viewport;
  }

  /**
   * Вписать граф в видимую область И ЦЕНТРИРОВАТЬ
   * Это основной метод для правильного отображения графа
   */
  fitToGraph(model: GraphModel): void {
    if (!this.viewport) {
      console.warn('Viewport not initialized');
      return;
    }

    if (model.nodeCount === 0) {
      console.warn('No nodes in graph');
      return;
    }

    const bounds = this.calculateGraphBounds(model);
    if (!bounds) {
      console.warn('Could not calculate graph bounds');
      return;
    }

    const { minX, maxX, minY, maxY } = bounds;

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;
    const graphWidth = Math.max(maxX - minX, 50);
    const graphHeight = Math.max(maxY - minY, 50);

    const padding = 80;
    const availableWidth = this.viewport.screenWidth - padding * 2;
    const availableHeight = this.viewport.screenHeight - padding * 2;

    const zoomX = availableWidth / graphWidth;
    const zoomY = availableHeight / graphHeight;

    let targetZoom = Math.min(zoomX, zoomY);
    targetZoom = Math.max(this.settings.minZoom, Math.min(this.settings.maxZoom, targetZoom));
    targetZoom *= 0.9;

    this.viewport.setZoom(targetZoom, true);
    this.viewport.moveCenter(graphCenterX, graphCenterY);
  }

  /**
   * Вычислить границы графа с учётом радиусов узлов
   */
  private calculateGraphBounds(model: GraphModel): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null {
    const nodes = model.getNodes();

    if (nodes.length === 0) {
      return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const nodeId of nodes) {
      const node = model.getNode(nodeId);
      if (!node) continue;

      const radius = node.radius ?? 25;

      minX = Math.min(minX, node.x - radius);
      maxX = Math.max(maxX, node.x + radius);
      minY = Math.min(minY, node.y - radius);
      maxY = Math.max(maxY, node.y + radius);
    }

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return null;
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Сбросить вид к начальному состоянию
   */
  resetView(): void {
    if (!this.viewport) return;

    const worldSize = 10000;
    this.viewport.setZoom(1, true);
    this.viewport.moveCenter(worldSize / 2, worldSize / 2);
  }

  /**
   * Приблизить камеру
   */
  zoomIn(factor: number = 1.3): void {
    if (!this.viewport) return;

    const currentZoom = this.viewport.scale.x;
    const newZoom = Math.min(this.settings.maxZoom, currentZoom * factor);

    this.viewport.animate({
      scale: newZoom,
      time: 200,
    });
  }

  /**
   * Отдалить камеру
   */
  zoomOut(factor: number = 1.3): void {
    if (!this.viewport) return;

    const currentZoom = this.viewport.scale.x;
    const newZoom = Math.max(this.settings.minZoom, currentZoom / factor);

    this.viewport.animate({
      scale: newZoom,
      time: 200,
    });
  }

  /**
   * Установить зум напрямую
   */
  setZoom(zoom: number): void {
    if (!this.viewport) return;

    const clampedZoom = Math.max(this.settings.minZoom, Math.min(this.settings.maxZoom, zoom));

    this.viewport.setZoom(clampedZoom, true);
  }

  /**
   * Переместить центр камеры
   */
  moveCenter(x: number, y: number): void {
    if (!this.viewport) return;
    this.viewport.moveCenter(x, y);
  }

  /**
   * Получить текущее состояние viewport
   */
  getState(): ViewportState {
    if (!this.viewport) {
      return { x: 0, y: 0, zoom: 1 };
    }

    return {
      x: this.viewport.center.x,
      y: this.viewport.center.y,
      zoom: this.viewport.scale.x,
    };
  }

  /**
   * Установить состояние viewport
   */
  setState(state: ViewportState): void {
    if (!this.viewport) return;

    this.viewport.setZoom(state.zoom, true);
    this.viewport.moveCenter(state.x, state.y);
  }

  /**
   * Обновить размер экрана при изменении размера окна
   */
  resize(width: number, height: number): void {
    if (!this.viewport) return;

    console.log('📐 Resizing viewport to:', { width, height });

    this.viewport.resize(width, height);

    this.viewport.screenWidth = width;
    this.viewport.screenHeight = height;
  }

  /**
   * Эмитировать событие изменения
   */
  private emitChange(): void {
    if (this.onViewportChange) {
      this.onViewportChange(this.getState());
    }
  }

  /**
   * Приостановить перетаскивание viewport (например, при перетаскивании узла)
   */
  pauseDrag(): void {
    if (this.viewport) {
      this.viewport.plugins.pause('drag');
    }
  }

  /**
   * Возобновить перетаскивание viewport
   */
  resumeDrag(): void {
    if (this.viewport) {
      this.viewport.plugins.resume('drag');
    }
  }

  /**
   * Уничтожить viewport
   */
  destroy(): void {
    if (this.viewport) {
      this.viewport.destroy({ children: true });
      this.viewport = null;
    }
  }
}
