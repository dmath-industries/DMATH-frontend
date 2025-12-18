'use client';

import { useRef, useState } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { GraphEditor } from './GraphEditor';
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
  };

  /**
   * Получить позицию в центре видимой области viewport
   */
  const getCenterPosition = (): { x: number; y: number } => {
    if (viewportRef.current) {
      const viewport = viewportRef.current.getViewport();
      if (viewport) {
        // Получаем центр экрана в мировых координатах
        const centerX = viewport.center.x;
        const centerY = viewport.center.y;
        return { x: centerX, y: centerY };
      }
    }
    // Если viewport не готов, используем центр по умолчанию
    return { x: 5000, y: 5000 };
  };

  /**
   * Обработчик добавления вершины
   */
  const handleAddNode = (id: string, x?: number, y?: number) => {
    // Если координаты не указаны, размещаем в центре viewport
    const position = x !== undefined && y !== undefined ? { x, y } : getCenterPosition();

    // Проверяем, существует ли уже вершина с таким ID
    if (model.hasNode(id)) {
      alert(`Вершина с ID "${id}" уже существует!`);
      return;
    }

    model.addNode({
      id,
      x: position.x,
      y: position.y,
      label: id,
    });

    if (rendererRef.current) {
      rendererRef.current.drawAll(model);
    }
  };

  /**
   * Обработчик добавления ребра
   */
  const handleAddEdge = (source: string, target: string, weight?: number) => {
    // Проверяем существование вершин
    if (!model.hasNode(source)) {
      alert(`Вершина "${source}" не существует!`);
      return;
    }
    if (!model.hasNode(target)) {
      alert(`Вершина "${target}" не существует!`);
      return;
    }
    if (source === target) {
      alert('Нельзя создать ребро из вершины в саму себя!');
      return;
    }

    const edgeId = `${source}-${target}`;

    // Проверяем, существует ли уже такое ребро
    if (model.hasEdge(edgeId)) {
      alert(`Ребро между "${source}" и "${target}" уже существует!`);
      return;
    }

    model.addEdge({
      id: edgeId,
      source,
      target,
      weight,
      directed: true,
    });

    if (rendererRef.current) {
      rendererRef.current.drawAll(model);
    }
  };

  /**
   * Обработчик очистки графа
   */
  const handleClear = () => {
    if (confirm('Вы уверены, что хотите очистить граф?')) {
      model.clear();
      if (rendererRef.current) {
        rendererRef.current.drawAll(model);
      }
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
          <div className="w-80 space-y-4">
            <GraphEditor
              onAddNode={handleAddNode}
              onAddEdge={handleAddEdge}
              onClear={handleClear}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
