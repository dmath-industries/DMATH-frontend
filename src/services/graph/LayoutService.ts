/**
 * LayoutService — обёртка над ForceAtlas2 для автоматической раскладки графа
 */

import forceAtlas2 from 'graphology-layout-forceatlas2';
import { GraphModel } from './GraphModel';

export interface LayoutOptions {
  iterations?: number;
  settings?: {
    barnesHutOptimize?: boolean;
    barnesHutTheta?: number;
    scalingRatio?: number;
    gravity?: number;
    strongGravityMode?: boolean;
    slowDown?: number;
    linLogMode?: boolean;
    outboundAttractionDistribution?: boolean;
    adjustSizes?: boolean;
    edgeWeightInfluence?: number;
  };
}

export class LayoutService {
  /**
   * Запустить ForceAtlas2 раскладку
   * Обновляет координаты узлов непосредственно в GraphModel
   */
  async runFA2(model: GraphModel, options: LayoutOptions = {}): Promise<void> {
    const graph = model.getGraph();
    
    // Проверяем, есть ли узлы
    if (graph.order === 0) {
      console.warn('Graph is empty, nothing to layout');
      return;
    }

    // Инициализируем случайные позиции для узлов без координат
    graph.forEachNode((node, attrs) => {
      if (attrs.x === undefined || attrs.y === undefined) {
        graph.mergeNodeAttributes(node, {
          x: Math.random() * 800 - 400,
          y: Math.random() * 600 - 300,
        });
      }
    });

    const defaultSettings = {
      barnesHutOptimize: true,
      barnesHutTheta: 0.5,
      scalingRatio: 10,
      gravity: 1,
      strongGravityMode: false,
      slowDown: 1,
      linLogMode: false,
      outboundAttractionDistribution: false,
      adjustSizes: false,
      edgeWeightInfluence: 1,
    };

    const settings = { ...defaultSettings, ...options.settings };
    const iterations = options.iterations ?? 100;

    // Синхронное выполнение ForceAtlas2
    forceAtlas2.assign(graph, {
      iterations,
      settings,
    });
  }

  /**
   * Применить простую круговую раскладку
   */
  circularLayout(model: GraphModel, radius: number = 200): void {
    const graph = model.getGraph();
    const nodes = graph.nodes();
    const n = nodes.length;

    if (n === 0) return;

    nodes.forEach((nodeId, i) => {
      const angle = (2 * Math.PI * i) / n;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      model.updateNode(nodeId, { x, y });
    });
  }

  /**
   * Применить случайную раскладку
   */
  randomLayout(model: GraphModel, width: number = 3000, height: number = 3000): void {  
    const graph = model.getGraph();
    
    graph.forEachNode((nodeId) => {
      const x = Math.random() * width - width / 2;
      const y = Math.random() * height - height / 2;
      
      model.updateNode(nodeId, { x, y });
    });
  }

  /**
   * Применить сеточную раскладку
   */
  gridLayout(model: GraphModel, spacing: number = 100): void {
    const graph = model.getGraph();
    const nodes = graph.nodes();
    const n = nodes.length;

    if (n === 0) return;

    const cols = Math.ceil(Math.sqrt(n));
    
    nodes.forEach((nodeId, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * spacing - (cols * spacing) / 2;
      const y = row * spacing - (Math.ceil(n / cols) * spacing) / 2;
      
      model.updateNode(nodeId, { x, y });
    });
  }
}

