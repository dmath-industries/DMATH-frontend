'use client';

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { ControlPanel } from './ControlPanel';
import { GraphModel, Renderer, ViewportAdapter, Applier, WorkerClient, StepController } from '@/services';
import { GraphDTO, Step } from '@/types';
import { ChevronLeft, RotateCcw, X, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { pause, updateTotalSteps, reset, setSession, setIndex } from '@/shared/store';
import { sessionRepository } from '@/shared/persistence';
import { mobileConfig } from '@/shared/lib';

interface AlgorithmLayoutContextType {
  loadGraph: (graphDTO: GraphDTO, skipReset?: boolean) => void;
  hasGraph: boolean;
  hasRunAlgorithm: boolean;
  graphModel: GraphModel;
}

const AlgorithmLayoutContext = createContext<AlgorithmLayoutContextType | null>(null);

/**
 * Хук для доступа к контексту AlgorithmLayout
 */
export const useAlgorithmLayout = () => {
  const context = useContext(AlgorithmLayoutContext);
  if (!context) {
    throw new Error('useAlgorithmLayout must be used within AlgorithmLayout');
  }
  return context;
};

interface AlgorithmLayoutProps {
  algorithmName: string;
  algorithmTitle: string;
  children?: React.ReactNode;
}

/**
 * Компонент layout для страниц с алгоритмами
 */
export function AlgorithmLayout({ algorithmName, algorithmTitle, children }: AlgorithmLayoutProps) {
  const dispatch = useAppDispatch();
  const { playing, currentIndex } = useAppSelector((state) => state.steps);

  const [graphModel] = useState(() => new GraphModel(true));
  const [applier] = useState(() => new Applier());
  const [workerClient] = useState(() => new WorkerClient());
  const [hasGraph, setHasGraph] = useState(false);
  const [loadedSessionInfo, setLoadedSessionInfo] = useState<{ name: string; date: string } | null>(null);
  const [hasRunAlgorithm, setHasRunAlgorithm] = useState(false);
  const [currentGraphHash, setCurrentGraphHash] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ 
    width: mobileConfig.canvas.defaultSize.width, 
    height: mobileConfig.canvas.defaultSize.height 
  });

  const rendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);
  const controllerRef = useRef<StepController | null>(null);
  const currentAlgorithmRef = useRef<string | null>(null);
  const currentGraphDTORef = useRef(graphModel.toDTO());
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const prevGraphHashRef = useRef<string | null>(null);

  const createGraphHash = useCallback((graphDTO: GraphDTO): string => {
    const nodesStr = graphDTO.nodes
      .map(n => `${n.id}`)
      .sort()
      .join(',');
    const edgesStr = graphDTO.edges
      .map(e => `${e.source}->${e.target}`)
      .sort()
      .join(',');
    return `${nodesStr}|${edgesStr}`;
  }, []);

  /**
   * Загрузить граф из DTO
   */
  const loadGraph = useCallback((graphDTO: GraphDTO, skipReset = false) => {
    console.log('📥 Loading graph with', graphDTO.nodes.length, 'nodes');
    
    graphModel.fromDTO(graphDTO);
    setHasGraph(true);
    
    const newHash = createGraphHash(graphDTO);
    
    if (!skipReset) {
      setCurrentGraphHash((prevHash) => {
        if (newHash !== prevHash) {
          setHasRunAlgorithm(false);
          setLoadedSessionInfo(null);
          
          if (controllerRef.current) {
            controllerRef.current.setSteps([]);
          }
        }
        return newHash;
      });
    } else {
      setCurrentGraphHash(newHash);
    }
    
    if (rendererRef.current && viewportRef.current) {
      rendererRef.current.drawAll(graphModel);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          viewportRef.current?.fitToGraph(graphModel);
        });
      });
    }
  }, [graphModel, createGraphHash]);

  /**
   * Обработчик готовности renderer и viewport
   */
  const handleRendererReady = (renderer: Renderer, viewport: ViewportAdapter) => {
    rendererRef.current = renderer;
    viewportRef.current = viewport;

    const controller = new StepController({
      model: graphModel,
      applier,
      renderer,
      onIndexChange: (index) => {
        dispatch(setIndex(index));
      },
      onComplete: () => {
        dispatch(pause());
      },
    });

    controllerRef.current = controller;

    if (hasGraph && graphModel.nodeCount > 0) {
      renderer.drawAll(graphModel);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          viewport.fitToGraph(graphModel);
        });
      });
    }
  };

  const handleRunAlgorithm = () => {
    if (!hasGraph) {
      alert('Сначала загрузите граф!');
      return;
    }

    if (hasRunAlgorithm) {
      alert('Алгоритм уже был запущен для этого графа. Просмотрите результаты в панели управления или загрузите новый граф.');
      return;
    }
    
    dispatch(reset());
    
    if (controllerRef.current) {
      controllerRef.current.setSteps([]);
    }
    
    const graphDTO = graphModel.toDTO();

    currentAlgorithmRef.current = algorithmName;
    currentGraphDTORef.current = graphDTO;
    
    setHasRunAlgorithm(true);
    
    workerClient.runAlgorithm(algorithmName, graphDTO, {
      startNode: graphDTO.nodes[0]?.id || '0',
    });
  };

  const handleReset = () => {
    dispatch(reset());
    setHasGraph(false);
    setHasRunAlgorithm(false);
    setCurrentGraphHash(null);
    setLoadedSessionInfo(null);
    graphModel.clear();
    
    if (controllerRef.current) {
      controllerRef.current.setSteps([]);
    }
    
    if (rendererRef.current) {
      rendererRef.current.drawAll(graphModel);
    }
  };

  const isRunning = workerClient.isRunning();

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const isMobile = window.innerWidth < mobileConfig.breakpoint;
        const padding = isMobile ? mobileConfig.canvas.padding.mobile : mobileConfig.canvas.padding.desktop;
        const containerWidth = canvasContainerRef.current.offsetWidth - padding * 2; 
        const minWidth = isMobile ? mobileConfig.canvas.width.min.mobile : mobileConfig.canvas.width.min.desktop;
        const maxWidth = isMobile ? mobileConfig.canvas.width.max.mobile : mobileConfig.canvas.width.max.desktop;
        const width = Math.max(minWidth, Math.min(containerWidth, maxWidth));
        const headerHeight = isMobile ? mobileConfig.canvas.headerHeight.mobile : mobileConfig.canvas.headerHeight.desktop;
        const extraSpace = isMobile ? mobileConfig.canvas.extraSpace.mobile : mobileConfig.canvas.extraSpace.desktop;
        const minHeight = isMobile ? mobileConfig.canvas.height.min.mobile : mobileConfig.canvas.height.min.desktop;
        const maxHeight = isMobile ? mobileConfig.canvas.height.max.mobile : mobileConfig.canvas.height.max.desktop;
        const height = Math.min(
          maxHeight, 
          Math.max(minHeight, window.innerHeight - headerHeight - extraSpace)
        ); 
        setCanvasSize({ width, height });
        
        if (rendererRef.current && viewportRef.current) {
          viewportRef.current.resize(width, height);
          
          if (hasGraph && graphModel.nodeCount > 0) {
            setTimeout(() => {
              viewportRef.current?.fitToGraph(graphModel);
            }, 50);
          }
        }
      }
    };

    const timeoutId = setTimeout(updateCanvasSize, 100);
    
    let resizeObserver: ResizeObserver | null = null;
    if (canvasContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(canvasContainerRef.current);
    }
    
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [hasGraph, graphModel]);

  useEffect(() => {
    if (currentGraphHash === null) {
      prevGraphHashRef.current = null;
      return;
    }
    
    if (prevGraphHashRef.current !== null && prevGraphHashRef.current !== currentGraphHash) {
      dispatch(reset());
    }
    
    prevGraphHashRef.current = currentGraphHash;
  }, [currentGraphHash, dispatch]);

  useEffect(() => {
    const loadSessionFromHistory = async () => {
      const sessionId = localStorage.getItem('loadSessionId');
      if (!sessionId) return;

      localStorage.removeItem('loadSessionId');

      try {
        const session = await sessionRepository.loadSession(sessionId);
        if (!session) {
          return;
        }

        loadGraph(session.graphDTO, true);
        
        setHasRunAlgorithm(true);

        if (controllerRef.current && session.steps) {
          controllerRef.current.setSteps(session.steps);
        }

        dispatch(setSession({
          sessionId: session.id,
          totalSteps: session.steps.length,
        }));

        const date = new Date(session.updatedAt);
        setLoadedSessionInfo({
          name: session.algorithmName,
          date: date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      } catch (error) {
        console.error('Failed to load session:', error);
        alert('Ошибка при загрузке сессии');
      }
    };

    loadSessionFromHistory();
  }, [dispatch, loadGraph]);

  useEffect(() => {
    workerClient.init();
    let allSteps: Step[] = [];
    
    workerClient.setHandlers({
      onStepChunk: async (newSteps, _chunkId, isLast) => {
        allSteps.push(...newSteps);
        
        if (controllerRef.current) {
          controllerRef.current.addSteps(newSteps);
        }
        
        if (isLast) {
          dispatch(updateTotalSteps(allSteps.length));
        }
      },
      onDone: async (totalSteps, executionTime, requestId) => {
        if (currentAlgorithmRef.current && allSteps.length > 0) {
          const sessionId = requestId;
          
          try {
            await sessionRepository.saveSession(
              sessionId,
              currentAlgorithmRef.current,
              currentGraphDTORef.current,
              allSteps,
              {
                totalSteps,
                executionTime,
              }
            );
            
            dispatch(setSession({ sessionId, totalSteps }));
          } catch (error) {
            console.error('Failed to save session:', error);
          }
        }
        
        allSteps = [];
        currentAlgorithmRef.current = null;
      },
      onError: (error) => {
        console.error('Worker error:', error);
        alert(`Ошибка выполнения: ${error}`);
        allSteps = [];
        currentAlgorithmRef.current = null;
      },
    });

    return () => {
      workerClient.terminate();
    };
  }, [dispatch, workerClient]);

  useEffect(() => {
    if (!controllerRef.current) return;

    if (playing) {
      controllerRef.current.play();
    } else {
      controllerRef.current.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (!controllerRef.current) return;

    const controllerIndex = controllerRef.current.getCurrentIndex();
    if (controllerIndex !== currentIndex) {
      controllerRef.current.goToIndex(currentIndex);
    }
  }, [currentIndex]);

  const contextValue: AlgorithmLayoutContextType = {
    loadGraph,
    hasGraph,
    hasRunAlgorithm,
    graphModel,
  };

  return (
    <AlgorithmLayoutContext.Provider value={contextValue}>
      <div className="min-h-screen text-white bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
            <Link href="/algorithms" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors group text-xs sm:text-sm">
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Назад к списку алгоритмов</span>
              <span className="sm:hidden">Назад</span>
            </Link>
            
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent text-center sm:text-left w-full sm:w-auto">
              {algorithmTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-3 sm:gap-4">
            <div className="space-y-4">
            {loadedSessionInfo && (
              <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-3 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Info className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-200 mb-1">Загружена сессия из истории</h4>
                    <p className="text-xs text-blue-300">
                      {loadedSessionInfo.name} • {loadedSessionInfo.date}
                    </p>
                  </div>
                  <button
                    onClick={() => setLoadedSessionInfo(null)}
                    className="flex-shrink-0 text-blue-300 hover:text-blue-200 transition-colors"
                    title="Закрыть"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div ref={canvasContainerRef} className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden">
              <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 border-b border-neutral-700/50">
                <h3 className="text-sm sm:text-base font-semibold text-neutral-200">Граф</h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleRunAlgorithm}
                    disabled={!hasGraph || isRunning || playing || hasRunAlgorithm}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:shadow-none text-sm sm:text-base w-full sm:w-auto"
                    title={hasRunAlgorithm ? 'Алгоритм уже выполнен для этого графа' : 'Запустить алгоритм'}
                  >
                    {hasRunAlgorithm ? 'Алгоритм выполнен' : 'Запустить алгоритм'}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={!hasGraph}
                    className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Сброс</span>
                    <span className="sm:hidden">Сброс</span>
                  </button>
                </div>
              </div>
              <div className="p-1 sm:p-2 flex justify-center overflow-x-auto">
                <GraphCanvas
                  model={graphModel}
                  onRendererReady={handleRendererReady}
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              </div>
            </div>

            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50">
              <ControlPanel />
            </div>

            {hasRunAlgorithm && !playing && currentIndex === -1 && (
              <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-3 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-200 mb-1">Алгоритм выполнен</h4>
                    <p className="text-xs text-green-300">
                      Используйте панель управления для просмотра шагов. Чтобы запустить алгоритм снова, загрузите новую матрицу или нажмите "Сброс".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {children}
          </div>
          </div>
        </div>
      </div>
    </AlgorithmLayoutContext.Provider>
  );
}

