'use client';

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { ControlPanel } from './ControlPanel';
import { GraphEditor } from './GraphEditor';
import {
  GraphModel,
  Renderer,
  ViewportAdapter,
  Applier,
  WorkerClient,
  StepController,
} from '@/services';
import { GraphDTO, Step } from '@/types';
import { ChevronLeft, RotateCcw, X, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { pause, updateTotalSteps, reset, setSession, setIndex } from '@/shared/store';
import { sessionRepository } from '@/shared/persistence';
import { mobileConfig, AnalyticsEvents } from '@/shared/lib';
import { usePathname } from 'next/navigation';
import { Box, Container, Typography, Button, Alert, IconButton, GridLegacy as Grid, Paper } from '@mui/material';

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
  graphDescription?: string | React.ReactNode;
}

/**
 * Компонент layout для страниц с алгоритмами
 */
export function AlgorithmLayout({
  algorithmName,
  algorithmTitle,
  children,
  graphDescription,
}: AlgorithmLayoutProps) {
  const dispatch = useAppDispatch();
  const { playing, currentIndex, speedMs, totalSteps } = useAppSelector(state => state.steps);
  const pathname = usePathname();

  const [graphModel] = useState(() => new GraphModel(true));
  const [applier] = useState(() => new Applier());
  const [workerClient] = useState(() => new WorkerClient());
  const [hasGraph, setHasGraph] = useState(false);
  const [loadedSessionInfo, setLoadedSessionInfo] = useState<{ name: string; date: string } | null>(
    null
  );
  const [hasRunAlgorithm, setHasRunAlgorithm] = useState(false);
  const [currentGraphHash, setCurrentGraphHash] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: mobileConfig.canvas.defaultSize.width,
    height: mobileConfig.canvas.defaultSize.height,
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
  const loadGraph = useCallback(
    (graphDTO: GraphDTO, skipReset = false) => {
      console.log('📥 Loading graph with', graphDTO.nodes.length, 'nodes');

      graphModel.fromDTO(graphDTO);
      setHasGraph(true);

      const newHash = createGraphHash(graphDTO);

      if (!skipReset) {
        setCurrentGraphHash(prevHash => {
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
        if (graphModel.nodeCount > 0) {
          viewportRef.current.fitToGraph(graphModel);
        }
      }
    },
    [graphModel, createGraphHash]
  );

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
    if (graphModel.hasNode(id)) {
      alert(`Вершина с ID "${id}" уже существует!`);
      return;
    }

    graphModel.addNode({
      id,
      x: position.x,
      y: position.y,
      label: id,
    });

    if (rendererRef.current) {
      rendererRef.current.drawAll(graphModel);
    }
  };

  /**
   * Обработчик добавления ребра
   */
  const handleAddEdge = (source: string, target: string, weight?: number) => {
    // Проверяем существование вершин
    if (!graphModel.hasNode(source)) {
      alert(`Вершина "${source}" не существует!`);
      return;
    }
    if (!graphModel.hasNode(target)) {
      alert(`Вершина "${target}" не существует!`);
      return;
    }
    if (source === target) {
      alert('Нельзя создать ребро из вершины в саму себя!');
      return;
    }

    const edgeId = `${source}-${target}`;

    // Проверяем, существует ли уже такое ребро
    if (graphModel.hasEdge(edgeId)) {
      alert(`Ребро между "${source}" и "${target}" уже существует!`);
      return;
    }

    graphModel.addEdge({
      id: edgeId,
      source,
      target,
      weight,
      directed: true,
    });

    if (rendererRef.current) {
      rendererRef.current.drawAll(graphModel);
    }
  };

  /**
   * Обработчик очистки графа
   */
  const handleClear = () => {
    if (confirm('Вы уверены, что хотите очистить граф?')) {
      graphModel.clear();
      setHasGraph(false);
      setHasRunAlgorithm(false);
      setCurrentGraphHash(null);
      if (rendererRef.current) {
        rendererRef.current.drawAll(graphModel);
      }
      if (controllerRef.current) {
        controllerRef.current.setSteps([]);
      }
      dispatch(reset());
    }
  };

  /**
   * Загрузить тестовый граф с примером
   */
  const handleLoadSample = () => {
    graphModel.clear();

    const offset = 5000; // Используем центр по умолчанию
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
      graphModel.addNode(node);
    }

    for (const edge of edges) {
      graphModel.addEdge({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        directed: true,
      });
    }

    // Загружаем граф через loadGraph для правильной инициализации состояния
    const graphDTO = graphModel.toDTO();
    loadGraph(graphDTO);

    if (rendererRef.current) {
      rendererRef.current.drawAll(graphModel);
    }
  };

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
      onIndexChange: index => {
        dispatch(setIndex(index));
      },
      onComplete: () => {
        dispatch(pause());
      },
    });

    controller.setSpeed(speedMs);
    controllerRef.current = controller;

    if (hasGraph && graphModel.nodeCount > 0) {
      renderer.drawAll(graphModel);
      viewport.fitToGraph(graphModel);
    }
  };

  const handleRunAlgorithm = () => {
    if (!hasGraph) {
      alert('Сначала загрузите граф!');
      return;
    }

    if (hasRunAlgorithm) {
      alert(
        'Алгоритм уже был запущен для этого графа. Просмотрите результаты в панели управления или загрузите новый граф.'
      );
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

    const inputMethod = loadedSessionInfo ? 'history' : 'manual';
    AnalyticsEvents.algorithmStarted(
      algorithmName,
      graphDTO.nodes.length,
      graphDTO.edges.length,
      inputMethod
    );

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
        const padding = isMobile
          ? mobileConfig.canvas.padding.mobile
          : mobileConfig.canvas.padding.desktop;
        const containerWidth = canvasContainerRef.current.offsetWidth - padding * 2;
        const minWidth = isMobile
          ? mobileConfig.canvas.width.min.mobile
          : mobileConfig.canvas.width.min.desktop;
        const maxWidth = isMobile
          ? mobileConfig.canvas.width.max.mobile
          : mobileConfig.canvas.width.max.desktop;
        const width = Math.max(minWidth, Math.min(containerWidth, maxWidth));
        const headerHeight = isMobile
          ? mobileConfig.canvas.headerHeight.mobile
          : mobileConfig.canvas.headerHeight.desktop;
        const extraSpace = isMobile
          ? mobileConfig.canvas.extraSpace.mobile
          : mobileConfig.canvas.extraSpace.desktop;
        const minHeight = isMobile
          ? mobileConfig.canvas.height.min.mobile
          : mobileConfig.canvas.height.min.desktop;
        const maxHeight = isMobile
          ? mobileConfig.canvas.height.max.mobile
          : mobileConfig.canvas.height.max.desktop;
        const height = Math.min(
          maxHeight,
          Math.max(minHeight, window.innerHeight - headerHeight - extraSpace)
        );

        setCanvasSize({ width, height });

        if (rendererRef.current && viewportRef.current) {
          viewportRef.current.resize(width, height);

          // Автоцентрирование отключено
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

        dispatch(
          setSession({
            sessionId: session.id,
            totalSteps: session.steps.length,
          })
        );

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

        const sessionAgeDays = Math.floor((Date.now() - session.updatedAt) / (1000 * 60 * 60 * 24));
        AnalyticsEvents.sessionLoadedFromHistory(session.algorithmName, sessionAgeDays);
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
          const graphDTO = currentGraphDTORef.current;

          try {
            await sessionRepository.saveSession(
              sessionId,
              currentAlgorithmRef.current,
              graphDTO,
              allSteps,
              {
                totalSteps,
                executionTime,
              }
            );

            dispatch(setSession({ sessionId, totalSteps }));

            AnalyticsEvents.algorithmCompleted(
              currentAlgorithmRef.current,
              totalSteps,
              executionTime,
              graphDTO.nodes.length,
              graphDTO.edges.length
            );

            AnalyticsEvents.sessionSaved(currentAlgorithmRef.current, totalSteps);
          } catch (error) {
            console.error('Failed to save session:', error);
          }
        }

        allSteps = [];
        currentAlgorithmRef.current = null;
      },
      onError: error => {
        console.error('Worker error:', error);
        alert(`Ошибка выполнения: ${error}`);

        if (currentAlgorithmRef.current) {
          const graphDTO = currentGraphDTORef.current;
          AnalyticsEvents.algorithmExecutionError(
            currentAlgorithmRef.current,
            String(error),
            graphDTO.nodes.length,
            graphDTO.edges.length
          );
        }

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

      if (currentIndex >= 0 && totalSteps > 0) {
        const viewMethod = playing ? 'auto' : 'manual';
        AnalyticsEvents.stepViewed(algorithmName, currentIndex + 1, totalSteps, viewMethod);
      }
    }
  }, [currentIndex, algorithmName, totalSteps, playing]);

  useEffect(() => {
    if (!controllerRef.current) return;
    controllerRef.current.setSpeed(speedMs);
  }, [speedMs]);

  useEffect(() => {
    AnalyticsEvents.algorithmViewed(algorithmName, pathname);
  }, [algorithmName, pathname]);

  const contextValue: AlgorithmLayoutContextType = {
    loadGraph,
    hasGraph,
    hasRunAlgorithm,
    graphModel,
  };

  return (
    <AlgorithmLayoutContext.Provider value={contextValue}>
      <Box
        sx={{
          minHeight: '100vh',
          color: 'text.primary',
          background: 'linear-gradient(145deg, rgba(23, 23, 23, 1) 1%, rgba(38, 38, 38, 1) 100%)',
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: '1920px',
            px: { xs: 2, sm: 4 },
            py: { xs: 2, sm: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 4 },
              mb: 4,
            }}
          >
            <Box
              component={Link}
              href="/algorithms"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'text.secondary',
                textDecoration: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                transition: 'color 0.2s',
                '&:hover': {
                  color: 'text.primary',
                  '& svg': {
                    transform: 'translateX(-4px)',
                  },
                },
              }}
            >
              <ChevronLeft size={18} style={{ transition: 'transform 0.2s' }} />
              <Typography
                component="span"
                sx={{
                  display: { xs: 'none', sm: 'inline' },
                  ml: 0.5,
                }}
              >
                Назад к списку алгоритмов
              </Typography>
              <Typography
                component="span"
                sx={{
                  display: { xs: 'inline', sm: 'none' },
                  ml: 0.5,
                }}
              >
                Назад
              </Typography>
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                fontWeight: 600,
                background: 'linear-gradient(to right, #ffffff, rgba(229, 229, 229, 0.8))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: { xs: 'center', sm: 'left' },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {algorithmTitle}
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 3, sm: 4 }}>
            <Grid item xs={12} lg sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {loadedSessionInfo && (
                  <Alert
                    severity="info"
                    icon={<Info size={20} />}
                    action={
                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => setLoadedSessionInfo(null)}
                      >
                        <X size={20} />
                      </IconButton>
                    }
                    sx={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      '& .MuiAlert-icon': {
                        color: 'info.light',
                      },
                      '& .MuiAlert-message': {
                        flex: 1,
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Загружена сессия из истории
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'info.light' }}>
                      {loadedSessionInfo.name} • {loadedSessionInfo.date}
                    </Typography>
                  </Alert>
                )}

                <Paper
                  ref={canvasContainerRef}
                  sx={{
                    backgroundColor: 'rgba(42, 42, 42, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(115, 115, 115, 0.5)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      px: { xs: 2, sm: 4 },
                      py: { xs: 2, sm: 3 },
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: { xs: 2, sm: 0 },
                      borderBottom: '1px solid rgba(115, 115, 115, 0.5)',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          fontWeight: 600,
                        }}
                      >
                        Граф
                      </Typography>
                      {graphDescription && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              color: 'text.secondary',
                            }}
                          >
                            {typeof graphDescription === 'string'
                              ? graphDescription
                              : graphDescription}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      <Button
                        onClick={handleRunAlgorithm}
                        disabled={!hasGraph || isRunning || playing || hasRunAlgorithm}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(to right, #2563eb, #3b82f6)',
                          '&:hover': {
                            background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                          },
                          '&:disabled': {
                            background: 'rgba(115, 115, 115, 0.5)',
                            color: 'text.disabled',
                          },
                          width: { xs: '100%', sm: 'auto' },
                        }}
                        title={
                          hasRunAlgorithm
                            ? 'Алгоритм уже выполнен для этого графа'
                            : 'Запустить алгоритм'
                        }
                      >
                        {hasRunAlgorithm ? 'Алгоритм выполнен' : 'Запустить алгоритм'}
                      </Button>
                      <Button
                        onClick={handleReset}
                        disabled={!hasGraph}
                        variant="outlined"
                        startIcon={<RotateCcw size={16} />}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                          Сброс
                        </Box>
                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                          Сброс
                        </Box>
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <GraphCanvas
                      model={graphModel}
                      onRendererReady={handleRendererReady}
                      width={canvasSize.width}
                      height={canvasSize.height}
                    />
                  </Box>

                  {hasRunAlgorithm && !playing && currentIndex === -1 && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle size={20} />}
                      sx={{
                        m: 3,
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        '& .MuiAlert-icon': {
                          color: 'success.light',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Алгоритм выполнен
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'success.light' }}>
                        Используйте панель управления для просмотра шагов. Чтобы запустить алгоритм
                        снова, загрузите новую матрицу или нажмите "Сброс".
                      </Typography>
                    </Alert>
                  )}
                </Paper>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</Box>
              </Box>
            </Grid>
            <Grid item xs={12} lg="auto" sx={{ width: { lg: 320, xl: 380 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper
                  sx={{
                    backgroundColor: 'rgba(42, 42, 42, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(115, 115, 115, 0.5)',
                    p: 4,
                  }}
                >
                  <ControlPanel />
                </Paper>

                <Box>
                  <GraphEditor
                    onAddNode={handleAddNode}
                    onAddEdge={handleAddEdge}
                    onClear={handleClear}
                    onLoadSample={handleLoadSample}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </AlgorithmLayoutContext.Provider>
  );
}
