'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer, ViewportAdapter } from '@/services';
import { GraphModel } from '@/services';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

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
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const expandedRendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);
  const expandedViewportRef = useRef<ViewportAdapter | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isExpandedReady, setIsExpandedReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDimensions, setExpandedDimensions] = useState({ width: 0, height: 0 });
  const initRef = useRef(false);
  const expandedInitRef = useRef(false);

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

        renderer.setViewportAdapter(viewport);
        viewport.pauseDrag();

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
  }, []);

  useEffect(() => {
    if (!isExpanded || expandedInitRef.current || !expandedCanvasRef.current) return;
    expandedInitRef.current = true;

    const initExpandedRenderer = async () => {
      try {
        if (!expandedCanvasRef.current) {
          throw new Error('Expanded canvas element not found');
        }

        const scale = 1.5;
        let expandedWidth = width * scale;
        let expandedHeight = height * scale;

        const maxWidth = window.innerWidth - 32;
        const maxHeight = window.innerHeight - 100;

        if (expandedWidth > maxWidth || expandedHeight > maxHeight) {
          const widthRatio = maxWidth / expandedWidth;
          const heightRatio = maxHeight / expandedHeight;
          const ratio = Math.min(widthRatio, heightRatio);

          expandedWidth = Math.floor(expandedWidth * ratio);
          expandedHeight = Math.floor(expandedHeight * ratio);
        }

        console.log('🎨 Initializing expanded renderer...', { expandedWidth, expandedHeight });

        const renderer = new Renderer();
        await renderer.init(expandedCanvasRef.current, {
          width: expandedWidth,
          height: expandedHeight,
          backgroundColor: 0x1f2937,
        });

        const viewport = new ViewportAdapter();
        const app = renderer.getApp();

        if (!app) {
          throw new Error('Failed to get Pixi.js application');
        }

        const containers = renderer.getContainers();
        viewport.create(
          app,
          {
            screenWidth: expandedWidth,
            screenHeight: expandedHeight,
          },
          containers
        );

        expandedRendererRef.current = renderer;
        expandedViewportRef.current = viewport;

        renderer.setViewportAdapter(viewport);
        viewport.resumeDrag();

        if (model.nodeCount > 0) {
          renderer.drawAll(model);
          if (viewportRef.current) {
            const state = viewportRef.current.getState();
            viewport.setState(state);
          }
        }

        setIsExpandedReady(true);
        console.log('✅ Expanded renderer initialized');
      } catch (err) {
        console.error('❌ Failed to initialize expanded renderer:', err);
        setIsExpandedReady(false);
      }
    };

    initExpandedRenderer();

    return () => {
      if (expandedRendererRef.current) {
        expandedRendererRef.current.destroy();
        expandedRendererRef.current = null;
      }
      if (expandedViewportRef.current) {
        expandedViewportRef.current.destroy();
        expandedViewportRef.current = null;
      }
      setIsExpandedReady(false);
      expandedInitRef.current = false;
    };
  }, [isExpanded, width, height, model]);

  useEffect(() => {
    if (!isReady || !rendererRef.current || !viewportRef.current) return;

    rendererRef.current.resize(width, height);
    viewportRef.current.resize(width, height);

    if (isExpanded && isExpandedReady && expandedViewportRef.current) {
      const state = viewportRef.current.getState();
      expandedViewportRef.current.setState(state);

      if (expandedRendererRef.current) {
        expandedRendererRef.current.resize(
          expandedViewportRef.current.getViewport()?.screenWidth || width * 1.5,
          expandedViewportRef.current.getViewport()?.screenHeight || height * 1.5
        );
      }
    }
  }, [width, height, isReady, isExpanded, isExpandedReady, model, onRendererReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateDimensions = () => {
      const scale = 1.5;
      let expandedWidth = width * scale;
      let expandedHeight = height * scale;

      const maxWidth = window.innerWidth - 32;
      const maxHeight = window.innerHeight - 100;

      if (expandedWidth > maxWidth || expandedHeight > maxHeight) {
        const widthRatio = maxWidth / expandedWidth;
        const heightRatio = maxHeight / expandedHeight;
        const ratio = Math.min(widthRatio, heightRatio);

        expandedWidth = Math.floor(expandedWidth * ratio);
        expandedHeight = Math.floor(expandedHeight * ratio);
      }

      setExpandedDimensions({ width: expandedWidth, height: expandedHeight });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [width, height]);

  const handleFitToGraph = () => {
    if (!viewportRef.current || model.nodeCount === 0) {
      return;
    }
    viewportRef.current.fitToGraph(model);
    if (isExpanded && expandedViewportRef.current) {
      expandedViewportRef.current.fitToGraph(model);
    }
  };

  const handleOpenExpanded = () => {
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    if (expandedViewportRef.current && viewportRef.current) {
      const state = expandedViewportRef.current.getState();
      viewportRef.current.setState(state);
      if (rendererRef.current) {
        rendererRef.current.drawAll(model);
      }
    }
    setIsExpanded(false);
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
    <>
      <div
        className="relative rounded-lg overflow-hidden"
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
          style={{
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: 'none',
          }}
        />

        {isReady && model.nodeCount > 0 && (
          <>
            <button
              onClick={handleFitToGraph}
              className="absolute top-4 left-4 p-2.5 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600 z-10 pointer-events-auto"
              title="Найти граф (центрировать)"
            >
              <RefreshIcon sx={{ width: 20, height: 20, color: '#e5e7eb' }} />
            </button>

            <button
              onClick={handleOpenExpanded}
              className="absolute bottom-4 right-4 p-2.5 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600 z-10 pointer-events-auto"
              title="Открыть в увеличенном режиме"
            >
              <OpenInFullIcon sx={{ width: 20, height: 20, color: '#e5e7eb' }} />
            </button>
          </>
        )}
      </div>

      {isExpanded && expandedDimensions.width > 0 && expandedDimensions.height > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseExpanded}
        >
          <div
            className="relative rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: `${expandedDimensions.width}px`,
              height: `${expandedDimensions.height}px`,
              backgroundColor: '#1f2937',
              maxWidth: '95vw',
              maxHeight: '95vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleCloseExpanded}
              className="absolute top-2 right-2 p-2.5 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600 z-[100]"
              title="Закрыть"
            >
              <CloseIcon sx={{ width: 20, height: 20, color: '#e5e7eb' }} />
            </button>

            {!isExpandedReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-neutral-400 text-sm">Инициализация Canvas...</p>
                </div>
              </div>
            )}

            <canvas
              ref={expandedCanvasRef}
              className="block w-full h-full"
              style={{
                width: `${expandedDimensions.width}px`,
                height: `${expandedDimensions.height}px`,
                pointerEvents: 'auto',
              }}
            />

            {isExpandedReady && model.nodeCount > 0 && (
              <button
                onClick={handleFitToGraph}
                className="absolute top-4 left-4 p-2.5 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600 z-20"
                title="Найти граф (центрировать)"
              >
                <RefreshIcon sx={{ width: 20, height: 20, color: '#e5e7eb' }} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
