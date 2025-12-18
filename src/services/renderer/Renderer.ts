/**
 * Renderer — отрисовка графа с помощью Pixi.js
 * Полностью переписанный с нуля для корректного отображения
 */

import { Application, Container, Graphics, Text } from 'pixi.js';
import { GraphModel } from '@/services/graph/GraphModel';
import { ElementState } from '@/types';
import { ViewportAdapter } from './ViewportAdapter';

interface RendererConfig {
  width: number;
  height: number;
  backgroundColor: number;
}

export class Renderer {
  private app: Application | null = null;
  private nodesContainer: Container | null = null;
  private edgesContainer: Container | null = null;
  private labelsContainer: Container | null = null;

  private nodeGraphics: Map<string, Graphics> = new Map();
  private edgeGraphics: Map<string, Graphics> = new Map();
  private labelGraphics: Map<string, Text> = new Map();
  private edgeWeightLabels: Map<string, { text: Text; bg: Graphics | null }> = new Map();

  private model: GraphModel | null = null;
  private draggingNodeId: string | null = null;
  private dragOffset: { x: number; y: number } | null = null;
  private viewportAdapter: ViewportAdapter | null = null;
  private showWeights: boolean = true;

  /**
   * Инициализация Pixi Application
   */
  async init(canvas: HTMLCanvasElement, config: RendererConfig): Promise<void> {
    try {
      this.app = new Application();

      await this.app.init({
        canvas,
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      this.edgesContainer = new Container();
      this.nodesContainer = new Container();
      this.labelsContainer = new Container();

      this.edgesContainer.sortableChildren = true;
      this.nodesContainer.sortableChildren = true;
      this.labelsContainer.sortableChildren = true;
    } catch (error) {
      console.error('Failed to initialize Pixi:', error);
      throw error;
    }
  }

  /**
   * Получить Pixi Application
   */
  getApp(): Application | null {
    return this.app;
  }

  /**
   * Получить контейнеры для добавления в viewport
   */
  getContainers() {
    return {
      edges: this.edgesContainer,
      nodes: this.nodesContainer,
      labels: this.labelsContainer,
    };
  }

  /**
   * Установить viewport adapter для управления перетаскиванием
   */
  setViewportAdapter(viewportAdapter: ViewportAdapter | null): void {
    this.viewportAdapter = viewportAdapter;
  }

  /**
   * Установить флаг отображения весов
   */
  setShowWeights(show: boolean): void {
    this.showWeights = show;
  }

  /**
   * Полная отрисовка графа
   */
  drawAll(model: GraphModel): void {
    if (!this.app) return;

    this.model = model;
    this.clear();

    for (const edgeId of model.getEdges()) {
      this.drawEdge(edgeId, model);
    }

    for (const nodeId of model.getNodes()) {
      this.drawNode(nodeId, model);
    }

    this.setupNodeInteractivity();
  }

  /**
   * Отрисовка только изменённых элементов (dirty rendering)
   */
  renderDirty(dirtyIds: Set<string>, model: GraphModel): void {
    if (!this.app) return;

    this.model = model;

    const dirtyNodes: string[] = [];
    const dirtyEdges: string[] = [];

    for (const id of dirtyIds) {
      if (model.hasNode(id)) {
        dirtyNodes.push(id);
      } else if (model.hasEdge(id)) {
        dirtyEdges.push(id);
      }
    }

    for (const edgeId of dirtyEdges) {
      this.drawEdge(edgeId, model);
    }

    for (const nodeId of dirtyNodes) {
      this.drawNode(nodeId, model);
    }

    if (dirtyNodes.length > 0) {
      this.setupNodeInteractivity();
    }
  }

  /**
   * Отрисовка узла
   */
  private drawNode(nodeId: string, model: GraphModel): void {
    if (!this.nodesContainer || !this.labelsContainer) return;

    const node = model.getNode(nodeId);
    if (!node) return;

    const oldGraphic = this.nodeGraphics.get(nodeId);
    if (oldGraphic) {
      this.nodesContainer.removeChild(oldGraphic);
      oldGraphic.destroy();
    }

    const oldLabel = this.labelGraphics.get(nodeId);
    if (oldLabel) {
      this.labelsContainer.removeChild(oldLabel);
      oldLabel.destroy();
    }

    const graphic = new Graphics();
    const color = this.getStateColor(node.state, node.color);
    const radius = node.radius ?? 25;

    graphic.circle(0, 0, radius);
    graphic.fill(color);

    graphic.stroke({ width: 3, color: 0x000000 });

    graphic.position.set(node.x, node.y);
    graphic.zIndex = 10;

    graphic.eventMode = 'static';
    graphic.cursor = 'pointer';

    this.nodesContainer.addChild(graphic);
    this.nodeGraphics.set(nodeId, graphic);

    const label = new Text({
      text: node.label ?? nodeId,
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
      },
    });

    label.anchor.set(0.5);
    label.position.set(node.x, node.y);
    label.zIndex = 20;
    label.eventMode = 'none';

    this.labelsContainer.addChild(label);
    this.labelGraphics.set(nodeId, label);
  }

  /**
   * Отрисовка ребра
   */
  private drawEdge(edgeId: string, model: GraphModel): void {
    if (!this.edgesContainer) return;

    const edge = model.getEdge(edgeId);
    if (!edge) return;

    const sourceNode = model.getNode(edge.source);
    const targetNode = model.getNode(edge.target);

    if (!sourceNode || !targetNode) return;

    const oldGraphic = this.edgeGraphics.get(edgeId);
    if (oldGraphic) {
      this.edgesContainer.removeChild(oldGraphic);
      oldGraphic.destroy();
    }

    const graphic = new Graphics();
    const color = this.getStateColor(edge.state, edge.color);
    const width = edge.width ?? 2;

    const sourceRadius = sourceNode.radius ?? 25;
    const targetRadius = targetNode.radius ?? 25;

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const nx = dx / distance;
    const ny = dy / distance;

    const startX = sourceNode.x + nx * sourceRadius;
    const startY = sourceNode.y + ny * sourceRadius;
    const endX = targetNode.x - nx * targetRadius;
    const endY = targetNode.y - ny * targetRadius;

    graphic.moveTo(startX, startY);
    graphic.lineTo(endX, endY);
    graphic.stroke({ width, color });

    if (edge.directed) {
      this.drawArrow(graphic, endX, endY, nx, ny, color, width);
    }

    graphic.zIndex = 1;

    this.edgesContainer.addChild(graphic);
    this.edgeGraphics.set(edgeId, graphic);

    if (this.showWeights && edge.weight !== undefined && edge.weight !== null) {
      this.drawEdgeWeight(edgeId, edge.weight, startX, startY, endX, endY);
    } else if (!this.showWeights) {
      const oldLabelData = this.edgeWeightLabels.get(edgeId);
      if (oldLabelData) {
        this.labelsContainer?.removeChild(oldLabelData.text);
        oldLabelData.text.destroy();
        if (oldLabelData.bg) {
          this.labelsContainer?.removeChild(oldLabelData.bg);
          oldLabelData.bg.destroy();
        }
        this.edgeWeightLabels.delete(edgeId);
      }
    }
  }

  /**
   * Отрисовка веса ребра (белые цифры без фона)
   */
  private drawEdgeWeight(
    edgeId: string,
    weight: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    if (!this.labelsContainer) return;

    const oldLabelData = this.edgeWeightLabels.get(edgeId);
    if (oldLabelData) {
      this.labelsContainer.removeChild(oldLabelData.text);
      oldLabelData.text.destroy();
      if (oldLabelData.bg) {
        this.labelsContainer.removeChild(oldLabelData.bg);
        oldLabelData.bg.destroy();
      }
    }

    // Позиция по середине ребра, смещённая перпендикулярно
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Вычисляем перпендикулярное смещение для избежания пересечений
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;

    const perpX = -dy / length;
    const perpY = dx / length;

    // Смещение на 20 пикселей перпендикулярно ребру
    const offset = 20;
    const labelX = midX + perpX * offset;
    const labelY = midY + perpY * offset;

    const weightText = new Text({
      text: String(weight),
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 2 },
      },
    });

    weightText.anchor.set(0.5);
    weightText.position.set(labelX, labelY);
    weightText.zIndex = 15;

    this.labelsContainer.addChild(weightText);
    this.edgeWeightLabels.set(edgeId, { text: weightText, bg: null });
  }

  /**
   * Отрисовка стрелки для направленного ребра
   */
  private drawArrow(
    graphic: Graphics,
    tipX: number,
    tipY: number,
    dirX: number,
    dirY: number,
    color: number,
    width: number = 2
  ): void {
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;

    const angle = Math.atan2(dirY, dirX);

    const leftAngle = angle - Math.PI + arrowAngle;
    const leftX = tipX + arrowLength * Math.cos(leftAngle);
    const leftY = tipY + arrowLength * Math.sin(leftAngle);

    graphic.moveTo(tipX, tipY);
    graphic.lineTo(leftX, leftY);
    graphic.stroke({ width: width + 1, color });

    const rightAngle = angle - Math.PI - arrowAngle;
    const rightX = tipX + arrowLength * Math.cos(rightAngle);
    const rightY = tipY + arrowLength * Math.sin(rightAngle);

    graphic.moveTo(tipX, tipY);
    graphic.lineTo(rightX, rightY);
    graphic.stroke({ width: width + 1, color });
  }

  /**
   * Получить цвет в зависимости от состояния
   */
  private getStateColor(state?: ElementState, defaultColor?: string): number {
    switch (state) {
      case 'active':
        return 0xfbbf24; // amber-400 (жёлтый)
      case 'visited':
        return 0x60a5fa; // blue-400 (синий)
      case 'current':
        return 0xf59e0b; // amber-500 (оранжевый)
      case 'path':
        return 0x10b981; // emerald-500 (зелёный)
      case 'rejected':
        return 0xef4444; // red-500 (красный)
      case 'candidate':
        return 0x8b5cf6; // violet-500 (фиолетовый)
      default:
        if (defaultColor) {
          const hex = defaultColor.startsWith('#') ? defaultColor.slice(1) : defaultColor;
          return parseInt(hex, 16);
        }
        return 0x3b82f6; // blue-500 по умолчанию
    }
  }

  /**
   * Очистить всё
   */
  clear(): void {
    for (const graphic of this.nodeGraphics.values()) {
      this.nodesContainer?.removeChild(graphic);
      graphic.destroy();
    }
    this.nodeGraphics.clear();

    for (const graphic of this.edgeGraphics.values()) {
      this.edgesContainer?.removeChild(graphic);
      graphic.destroy();
    }
    this.edgeGraphics.clear();

    for (const label of this.labelGraphics.values()) {
      this.labelsContainer?.removeChild(label);
      label.destroy();
    }
    this.labelGraphics.clear();

    for (const labelData of this.edgeWeightLabels.values()) {
      this.labelsContainer?.removeChild(labelData.text);
      labelData.text.destroy();
      if (labelData.bg) {
        this.labelsContainer?.removeChild(labelData.bg);
        labelData.bg.destroy();
      }
    }
    this.edgeWeightLabels.clear();
  }

  /**
   * Изменить размер canvas
   */
  resize(width: number, height: number): void {
    if (!this.app) return;
    this.app.renderer.resize(width, height);
  }

  /**
   * Настроить интерактивность вершин (перетаскивание)
   */
  private setupNodeInteractivity(): void {
    if (!this.app || !this.model) return;

    // Удаляем старые глобальные обработчики, если они есть
    if (this.app.stage) {
      this.app.stage.removeAllListeners('pointermove');
      this.app.stage.removeAllListeners('pointerup');
      this.app.stage.removeAllListeners('pointerupoutside');
    }

    for (const [nodeId, graphic] of this.nodeGraphics.entries()) {
      graphic.removeAllListeners('pointerdown');

      graphic.on('pointerdown', event => {
        if (!this.model) return;

        const node = this.model.getNode(nodeId);
        if (!node) return;

        this.draggingNodeId = nodeId;

        this.viewportAdapter?.pauseDrag();

        const globalPos = event.global;
        const localPos = this.nodesContainer?.toLocal(globalPos);

        if (localPos) {
          this.dragOffset = {
            x: localPos.x - node.x,
            y: localPos.y - node.y,
          };
        }

        event.stopPropagation();
      });
    }

    if (this.app.stage) {
      this.app.stage.eventMode = 'static';

      const handlePointerMove = (event: any) => {
        if (!this.draggingNodeId || !this.model || !this.dragOffset) return;

        const node = this.model.getNode(this.draggingNodeId);
        if (!node) return;

        const globalPos = event.global;
        const localPos = this.nodesContainer?.toLocal(globalPos);

        if (localPos) {
          const newX = localPos.x - this.dragOffset.x;
          const newY = localPos.y - this.dragOffset.y;

          this.model.updateNode(this.draggingNodeId, { x: newX, y: newY });

          const graphic = this.nodeGraphics.get(this.draggingNodeId);
          const label = this.labelGraphics.get(this.draggingNodeId);

          if (graphic) {
            graphic.position.set(newX, newY);
          }
          if (label) {
            label.position.set(newX, newY);
          }

          const edges = this.model.getEdges();
          for (const edgeId of edges) {
            const edge = this.model.getEdge(edgeId);
            if (
              edge &&
              (edge.source === this.draggingNodeId || edge.target === this.draggingNodeId)
            ) {
              this.drawEdge(edgeId, this.model);
            }
          }
        }
      };

      const handlePointerUp = () => {
        if (this.draggingNodeId) {
          this.viewportAdapter?.resumeDrag();
        }
        this.draggingNodeId = null;
        this.dragOffset = null;
      };

      this.app.stage.on('pointermove', handlePointerMove);
      this.app.stage.on('pointerup', handlePointerUp);
      this.app.stage.on('pointerupoutside', handlePointerUp);
    }
  }

  /**
   * Уничтожить renderer
   */
  destroy(): void {
    this.clear();
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.nodesContainer = null;
    this.edgesContainer = null;
    this.labelsContainer = null;
    this.model = null;
    this.draggingNodeId = null;
    this.dragOffset = null;
    this.viewportAdapter = null;
  }
}
