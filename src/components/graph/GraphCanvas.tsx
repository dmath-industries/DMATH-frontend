'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer, ViewportAdapter } from '@/services';
import { GraphModel } from '@/services';
import RefreshIcon from '@mui/icons-material/Refresh';

interface GraphCanvasProps {
  model: GraphModel;
  onRendererReady?: (renderer: Renderer, viewport: ViewportAdapter) => void;
  width?: number;
  height?: number;
}

export function GraphCanvas({
  model,
  onRendererReady,
  width = 1200,
  height = 800,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initRenderer = async () => {
      try {
        if (!canvasRef.current) {
          throw new Error('Canvas element not found');
        }

        console.log('🎨 Initializing renderer...', { width, height });

        const renderer = new Renderer();
        await renderer.init(canvasRef.current, {
          width,
          height,
          backgroundColor: 0x1f2937,
        });

        console.log('✅ Renderer initialized');

        const viewport = new ViewportAdapter();
        const app = renderer.getApp();

        if (!app) {
          throw new Error('Failed to get Pixi.js application');
        }

        const containers = renderer.getContainers();
        viewport.create(
          app,
          {
            screenWidth: width,
            screenHeight: height,
          },
          containers
        );

        console.log('✅ Viewport initialized');

        rendererRef.current = renderer;
        viewportRef.current = viewport;

        // Устанавливаем viewport adapter в renderer для управления перетаскиванием
        renderer.setViewportAdapter(viewport);

        if (model.nodeCount > 0) {
          console.log('📊 Drawing initial graph with', model.nodeCount, 'nodes');
          renderer.drawAll(model);
        }

        onRendererReady?.(renderer, viewport);

        setIsReady(true);
        console.log('✅ GraphCanvas ready');
      } catch (err) {
        console.error('❌ Failed to initialize renderer:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsReady(false);
      }
    };

    initRenderer();

    return () => {
      console.log('🧹 Cleaning up GraphCanvas');
      rendererRef.current?.destroy();
      viewportRef.current?.destroy();
      rendererRef.current = null;
      viewportRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isReady || !rendererRef.current || !viewportRef.current) return;

    rendererRef.current.resize(width, height);
    viewportRef.current.resize(width, height);

    if (model.nodeCount > 0) {
    }
  }, [width, height, isReady, model, onRendererReady]);

  const handleFitToGraph = () => {
    if (!viewportRef.current || model.nodeCount === 0) {
      return;
    }
    viewportRef.current.fitToGraph(model);
  };

  if (error) {
    return (
      <div
        className="relative bg-red-500/10 border border-red-500/30 rounded-lg overflow-hidden shadow-inner p-8 flex items-center justify-center"
        style={{ width, height }}
      >
        <div className="text-red-400 text-center space-y-3">
          <p className="font-bold mb-2 text-lg">Ошибка инициализации Canvas</p>
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative m-auto rounded-lg overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#1f2937',
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-neutral-400 text-sm">Инициализация Canvas...</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ width: `${width}px`, height: `${height}px` }}
      />

      {isReady && model.nodeCount > 0 && (
        <button
          onClick={handleFitToGraph}
          className="absolute top-4 left-4 p-2.5 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600 z-10"
          title="Найти граф (центрировать)"
        >
          <RefreshIcon sx={{ width: 20, height: 20, color: '#e5e7eb' }} />
        </button>
      )}
    </div>
  );
}
