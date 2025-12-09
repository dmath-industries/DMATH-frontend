'use client';

import { useRef, useState } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { GraphModel, Renderer, ViewportAdapter } from '@/services';

/**
 * Главный контейнер для графа и управления алгоритмами
 */
export function GraphContainer() {
  const [model] = useState(() => new GraphModel(true));

  const rendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);

  /**
   * Обработчик готовности renderer и viewport
   */
  const handleRendererReady = (renderer: Renderer, viewport: ViewportAdapter) => {
    rendererRef.current = renderer;
    viewportRef.current = viewport;
    loadSampleGraph();
  };

  /**
   * Загрузить тестовый граф с примером
   */
  const loadSampleGraph = () => {
    model.clear();

    const offset = 500;
    const nodes = [
      { id: 'a', x: offset + 0, y: offset - 150, label: 'a' },
      { id: 'b', x: offset + 150, y: offset - 50, label: 'b' },
      { id: 'c', x: offset + 150, y: offset + 100, label: 'c' },
      { id: 'd', x: offset - 150, y: offset + 100, label: 'd' },
      { id: 'e', x: offset - 150, y: offset - 50, label: 'e' },
    ];

    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
      { source: 'd', target: 'e' },
      { source: 'e', target: 'a' },
      { source: 'a', target: 'c' },
      { source: 'e', target: 'b' },
    ];

    for (const node of nodes) {
      model.addNode(node);
    }

    for (const edge of edges) {
      model.addEdge({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        directed: true,
      });
    }

    if (rendererRef.current && viewportRef.current) {
      rendererRef.current.drawAll(model);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50 shadow-2xl">
              <GraphCanvas
                model={model}
                onRendererReady={handleRendererReady}
                width={1200}
                height={800}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
