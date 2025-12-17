'use client';

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { ControlPanel } from './ControlPanel';
import { GraphEditor } from './GraphEditor';
import { StepExplanationPanel } from './StepExplanationPanel';
import {
  GraphModel,
  Renderer,
  ViewportAdapter,
  Applier,
  WorkerClient,
  StepController,
} from '@/services';
import { GraphDTO, Step } from '@/types';
import { ChevronLeft, X, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { pause, updateTotalSteps, reset, setSession, setIndex } from '@/shared/store';
import { sessionRepository } from '@/shared/persistence';
import { mobileConfig, AnalyticsEvents } from '@/shared/lib';
import { getAlgorithmConfig } from '@/algorithms';
import { usePathname } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert as MuiAlert,
  IconButton,
  GridLegacy as Grid,
  Paper,
} from '@mui/material';
import { Alert } from '@/components/elements';
import '@/services/explanations/registry'; // Инициализация реестра генераторов пояснений

const STORAGE_KEYS = {
  SESSION: (algorithmName: string) => `currentSession-${algorithmName}`,
  STEP: (algorithmName: string) => `currentStep-${algorithmName}`,
  LOAD_SESSION: 'loadSessionId',
  LAST_ALGORITHM: 'lastAlgorithmVisited',
} as const;

const TIMING = {
  SESSION_RESTORE: 100,
  STEP_RESTORE: 50,
  AUTO_CENTER: 150,
} as const;

const DEFAULT_GRAPH_CENTER = { x: 5000, y: 5000 } as const;

interface AlgorithmLayoutContextType {
  loadGraph: (graphDTO: GraphDTO, skipReset?: boolean) => void;
  hasGraph: boolean;
  hasRunAlgorithm: boolean;
  graphModel: GraphModel;
}

const AlgorithmLayoutContext = createContext<AlgorithmLayoutContextType | null>(null);

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

  const algorithmConfig = getAlgorithmConfig(algorithmName);

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'info' | 'warning' | 'error' | 'success';
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
  });
  const [currentStep, setCurrentStep] = useState<Step | null>(null);

  const rendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);
  const controllerRef = useRef<StepController | null>(null);
  const currentAlgorithmRef = useRef<string | null>(null);
  const currentGraphDTORef = useRef(graphModel.toDTO());
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const prevGraphHashRef = useRef<string | null>(null);
  const pendingStepsRef = useRef<Step[] | null>(null);
  const prevAlgorithmNameRef = useRef<string>(algorithmName);

  /**
   * Создает уникальный хеш для структуры графа для обнаружения изменений
   * @param graphDTO - Объект передачи данных графа
   * @returns Строка хеша, представляющая структуру графа
   */
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
   * Загружает граф из DTO и обновляет canvas
   * @param graphDTO - Данные графа для загрузки
   * @param skipReset - Если true, не сбрасывает состояние алгоритма
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
   * Получает центральную позицию viewport или центр по умолчанию
   * @returns Координаты центра viewport
   */
  const getCenterPosition = (): { x: number; y: number } => {
    if (viewportRef.current) {
      const viewport = viewportRef.current.getViewport();
      if (viewport) {
        return { x: viewport.center.x, y: viewport.center.y };
      }
    }
    return DEFAULT_GRAPH_CENTER;
  };

  /**
   * Обрабатывает добавление новой вершины в граф
   * @param id - Уникальный идентификатор вершины
   * @param x - Координата X (опционально, использует центр viewport если не указано)
   * @param y - Координата Y (опционально, использует центр viewport если не указано)
   */
  const handleAddNode = (id: string, x?: number, y?: number) => {
    let position: { x: number; y: number };

    if (x !== undefined && y !== undefined) {
      position = { x, y };
    } else {
      const center = getCenterPosition();
      const offsetRange = 150;
      const randomOffsetX = (Math.random() - 0.5) * offsetRange * 2;
      const randomOffsetY = (Math.random() - 0.5) * offsetRange * 2;
      position = {
        x: center.x + randomOffsetX,
        y: center.y + randomOffsetY,
      };
    }

    if (graphModel.hasNode(id)) {
      showAlert('Ошибка', `Вершина с ID "${id}" уже существует!`, 'error');
      return;
    }

    graphModel.addNode({
      id,
      x: position.x,
      y: position.y,
      label: id,
    });

    if (hasRunAlgorithm) {
      setHasRunAlgorithm(false);
      if (controllerRef.current) {
        controllerRef.current.setSteps([]);
      }
      dispatch(reset());
    }

    if (rendererRef.current) {
      rendererRef.current.drawAll(graphModel);
    }
  };

  /**
   * Обрабатывает добавление нового ребра в граф
   * @param source - ID исходной вершины
   * @param target - ID целевой вершины
   * @param weight - Вес ребра (опционально)
   */
  const handleAddEdge = (source: string, target: string, weight?: number) => {
    if (!graphModel.hasNode(source)) {
      showAlert('Ошибка', `Вершина "${source}" не существует!`, 'error');
      return;
    }
    if (!graphModel.hasNode(target)) {
      showAlert('Ошибка', `Вершина "${target}" не существует!`, 'error');
      return;
    }
    if (source === target) {
      showAlert('Ошибка', 'Нельзя создать ребро из вершины в саму себя!', 'error');
      return;
    }

    const edgeId = `${source}-${target}`;

    if (graphModel.hasEdge(edgeId)) {
      showAlert('Ошибка', `Ребро между "${source}" и "${target}" уже существует!`, 'error');
      return;
    }

    graphModel.addEdge({
      id: edgeId,
      source,
      target,
      weight,
      directed: true,
    });

    if (hasRunAlgorithm) {
      setHasRunAlgorithm(false);
      if (controllerRef.current) {
        controllerRef.current.setSteps([]);
      }
      dispatch(reset());
    }

    if (rendererRef.current) {
      rendererRef.current.drawAll(graphModel);
    }
  };

  /**
   * Обработчик очистки графа
   */
  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
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

    localStorage.removeItem(STORAGE_KEYS.SESSION(algorithmName));
    localStorage.removeItem(STORAGE_KEYS.STEP(algorithmName));

    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  /**
   * Показать кастомный алерт
   */
  const showAlert = (
    title: string,
    message: string,
    variant: 'info' | 'warning' | 'error' | 'success' = 'error'
  ) => {
    setAlertState({ open: true, title, message, variant });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, open: false }));
  };

  /**
   * Обработчик готовности renderer и viewport
   */
  const handleRendererReady = (renderer: Renderer, viewport: ViewportAdapter) => {
    rendererRef.current = renderer;
    viewportRef.current = viewport;

    renderer.setShowWeights(algorithmConfig?.useWeights ?? true);

    const controller = new StepController({
      model: graphModel,
      applier,
      renderer,
      onIndexChange: index => {
        dispatch(setIndex(index));
        // Обновляем currentStep при изменении индекса
        const step = controller.getStepByIndex(index);
        setCurrentStep(step);
      },
      onComplete: () => {
        dispatch(pause());
      },
    });

    controller.setSpeed(speedMs);
    controllerRef.current = controller;

    if (pendingStepsRef.current && pendingStepsRef.current.length > 0) {
      controller.setSteps(pendingStepsRef.current);
      pendingStepsRef.current = null;

      if (currentIndex >= 0 && currentIndex < totalSteps) {
        setTimeout(() => {
          controller.goToIndex(currentIndex);
        }, TIMING.STEP_RESTORE);
      }
    }

    if (hasGraph && graphModel.nodeCount > 0) {
      renderer.drawAll(graphModel);
      viewport.fitToGraph(graphModel);
    }
  };

  const handleRunAlgorithm = () => {
    if (!hasGraph) {
      showAlert('Внимание', 'Сначала загрузите граф!', 'warning');
      return;
    }

    if (hasRunAlgorithm) {
      showAlert(
        'Внимание',
        'Алгоритм уже был запущен для этого графа. Просмотрите результаты в панели управления или загрузите новый граф.',
        'warning'
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
    if (hasGraph && hasRunAlgorithm && rendererRef.current && viewportRef.current) {
      const timer = setTimeout(() => {
        if (graphModel.nodeCount > 0 && viewportRef.current) {
          viewportRef.current.fitToGraph(graphModel);
        }
      }, TIMING.AUTO_CENTER);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasGraph, hasRunAlgorithm, graphModel]);

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
      let sessionId = localStorage.getItem(STORAGE_KEYS.LOAD_SESSION);
      let fromHistory = false;

      if (sessionId) {
        localStorage.removeItem(STORAGE_KEYS.LOAD_SESSION);
        fromHistory = true;
      } else {
        sessionId = localStorage.getItem(STORAGE_KEYS.SESSION(algorithmName));
      }

      if (!sessionId) return;

      try {
        const session = await sessionRepository.loadSession(sessionId);
        if (!session) {
          localStorage.removeItem(STORAGE_KEYS.SESSION(algorithmName));
          return;
        }

        loadGraph(session.graphDTO, true);

        setHasRunAlgorithm(true);

        if (session.steps && session.steps.length > 0) {
          pendingStepsRef.current = session.steps;

          if (controllerRef.current) {
            controllerRef.current.setSteps(session.steps);
            pendingStepsRef.current = null;
          }
        }

        const savedStepIndex = localStorage.getItem(STORAGE_KEYS.STEP(algorithmName));
        const restoredIndex = savedStepIndex ? parseInt(savedStepIndex, 10) : -1;

        dispatch(
          setSession({
            sessionId: session.id,
            totalSteps: session.steps.length,
          })
        );

        if (restoredIndex >= -1 && restoredIndex < session.steps.length) {
          dispatch(setIndex(restoredIndex));
        }

        setTimeout(() => {
          if (rendererRef.current && viewportRef.current && graphModel.nodeCount > 0) {
            viewportRef.current.fitToGraph(graphModel);
          }
        }, TIMING.SESSION_RESTORE);

        if (fromHistory) {
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

          const sessionAgeDays = Math.floor(
            (Date.now() - session.updatedAt) / (1000 * 60 * 60 * 24)
          );
          AnalyticsEvents.sessionLoadedFromHistory(session.algorithmName, sessionAgeDays);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        localStorage.removeItem(STORAGE_KEYS.SESSION(algorithmName));
      }
    };

    loadSessionFromHistory();
  }, [dispatch, loadGraph, algorithmName, graphModel]);

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

            localStorage.setItem(STORAGE_KEYS.SESSION(currentAlgorithmRef.current), sessionId);

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
        showAlert('Ошибка выполнения', String(error), 'error');

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

      // Обновляем currentStep при изменении индекса
      const step = controllerRef.current.getStepByIndex(currentIndex);
      setCurrentStep(step);

      if (currentIndex >= 0 && totalSteps > 0) {
        const viewMethod = playing ? 'auto' : 'manual';
        AnalyticsEvents.stepViewed(algorithmName, currentIndex + 1, totalSteps, viewMethod);
      }
    }

    if (totalSteps > 0) {
      localStorage.setItem(STORAGE_KEYS.STEP(algorithmName), currentIndex.toString());
    }
  }, [currentIndex, algorithmName, totalSteps, playing]);

  useEffect(() => {
    if (!controllerRef.current) return;
    controllerRef.current.setSpeed(speedMs);
  }, [speedMs]);

  useEffect(() => {
    AnalyticsEvents.algorithmViewed(algorithmName, pathname);
  }, [algorithmName, pathname]);

  /**
   * Отслеживание смены алгоритма
   */
  useEffect(() => {
    const lastAlgorithm = sessionStorage.getItem(STORAGE_KEYS.LAST_ALGORITHM);
    const isAlgorithmChange = lastAlgorithm && lastAlgorithm !== algorithmName;

    if (isAlgorithmChange) {
      graphModel.clear();
      setHasGraph(false);
      setHasRunAlgorithm(false);
      setCurrentGraphHash(null);
      setLoadedSessionInfo(null);

      if (rendererRef.current) {
        rendererRef.current.drawAll(graphModel);
      }

      if (controllerRef.current) {
        controllerRef.current.setSteps([]);
      }

      dispatch(reset());
      dispatch(setIndex(-1));
      pendingStepsRef.current = null;
      currentAlgorithmRef.current = null;
    }

    sessionStorage.setItem(STORAGE_KEYS.LAST_ALGORITHM, algorithmName);
    prevAlgorithmNameRef.current = algorithmName;
  }, [algorithmName, graphModel, dispatch]);

  // Синхронизация currentStep при инициализации или изменении индекса извне
  useEffect(() => {
    if (!controllerRef.current) return;
    const step = controllerRef.current.getStepByIndex(currentIndex);
    setCurrentStep(step);
  }, [currentIndex]);

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
<<<<<<< HEAD
                  <MuiAlert
=======
                  <Alert
>>>>>>> 54a7587 (refactor: DMATH-42 convert AlgorithmLayout to Material UI and integrate StepExplanationPanel with local state)
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
<<<<<<< HEAD
                  </MuiAlert>
                )}

                {hasRunAlgorithm && currentIndex >= 0 && totalSteps > 0 && <StepExplanationPanel />}

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

                  {hasRunAlgorithm && !playing && currentIndex === -1 && totalSteps > 0 && (
                    <MuiAlert
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
                        снова, загрузите новую матрицу или нажмите кнопку "Очистить".
                      </Typography>
                    </MuiAlert>
                  )}

                  {hasRunAlgorithm && currentIndex >= 0 && totalSteps > 0 && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      <StepExplanationPanel currentStep={currentStep} />
                    </Box>
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
                    useWeights={algorithmConfig?.useWeights ?? true}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>

        <Alert
          open={showClearConfirm}
          onClose={cancelClear}
          title="Очистка графа"
          variant="warning"
          actions={
            <>
              <Button
                onClick={cancelClear}
                variant="outlined"
                sx={{
                  borderColor: 'rgba(115, 115, 115, 0.5)',
                  color: 'text.primary',
                  textTransform: 'none',
                  px: 3,
                  '&:hover': {
                    borderColor: 'rgba(115, 115, 115, 0.8)',
                    backgroundColor: 'rgba(115, 115, 115, 0.1)',
                  },
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={confirmClear}
                variant="contained"
                sx={{
                  backgroundColor: '#f59e0b',
                  textTransform: 'none',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#f59e0b',
                    filter: 'brightness(1.1)',
                  },
                }}
              >
                Очистить
              </Button>
            </>
          }
        >
          <Typography variant="body1">
            Вы уверены, что хотите очистить граф? Все вершины, рёбра и результаты алгоритма будут
            удалены.
          </Typography>
        </Alert>

        <Alert
          open={alertState.open}
          onClose={closeAlert}
          title={alertState.title}
          variant={alertState.variant}
          actions={
            <Button
              onClick={closeAlert}
              variant="contained"
              sx={{
                textTransform: 'none',
                px: 4,
              }}
            >
              ОК
            </Button>
          }
        >
          {alertState.message}
        </Alert>
      </Box>
    </AlgorithmLayoutContext.Provider>
  );
}
