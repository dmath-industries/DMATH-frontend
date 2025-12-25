'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphCanvas } from './GraphCanvas';
import { GraphEditor } from './GraphEditor';
import { GraphModel, Renderer, ViewportAdapter } from '@/services';

export function GraphContainer() {
  const { t } = useTranslation();
  const [model] = useState(() => new GraphModel(true));

  const rendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);

  const handleRendererReady = (renderer: Renderer, viewport: ViewportAdapter) => {
    rendererRef.current = renderer;
    viewportRef.current = viewport;
  };

  const getCenterPosition = (): { x: number; y: number } => {
    if (viewportRef.current) {
      const viewport = viewportRef.current.getViewport();
      if (viewport) {
        const centerX = viewport.center.x;
        const centerY = viewport.center.y;
        return { x: centerX, y: centerY };
      }
    }
    return { x: 5000, y: 5000 };
  };

  const handleAddNode = (id: string, x?: number, y?: number) => {
    const position = x !== undefined && y !== undefined ? { x, y } : getCenterPosition();

    if (model.hasNode(id)) {
      alert(t('errors.vertexExists', { id }));
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

  const handleAddEdge = (source: string, target: string, weight?: number) => {
    if (!model.hasNode(source)) {
      alert(t('errors.vertexNotFound', { vertex: source }));
      return;
    }
    if (!model.hasNode(target)) {
      alert(t('errors.vertexNotFound', { vertex: target }));
      return;
    }
    if (source === target) {
      alert(t('errors.cannotCreateSelfLoop'));
      return;
    }

    const edgeId = `${source}-${target}`;

    if (model.hasEdge(edgeId)) {
      alert(t('errors.edgeExists', { source, target }));
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

  const handleClear = () => {
    if (confirm(t('alerts.clearGraphMessage'))) {
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
