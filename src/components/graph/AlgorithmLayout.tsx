'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from 'react';
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
import { ChevronLeft, X, Info, CheckCircle, Plus, Minus, Network } from 'lucide-react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Alert } from '@/components/elements';
import '@/services/explanations/registry';

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
  RESIZE_DEBOUNCE: 150,
} as const;

const DEFAULT_GRAPH_CENTER = { x: 5000, y: 5000 } as const;

interface AlgorithmLayoutContextType {
  loadGraph: (graphDTO: GraphDTO, skipReset?: boolean) => void;
  hasGraph: boolean;
  hasRunAlgorithm: boolean;
  graphModel: GraphModel;
  registerMatrixHandler: (
    handler: (matrixText: string) => void,
    config?: { placeholder?: string; exampleMatrix?: string }
  ) => void;
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

export function AlgorithmLayout({
  algorithmName,
  algorithmTitle,
  children,
  graphDescription,
}: AlgorithmLayoutProps) {
  const dispatch = useAppDispatch();
  const { playing, currentIndex, speedMs, totalSteps, sessionId } = useAppSelector(
    state => state.steps
  );
  const pathname = usePathname();

  const algorithmConfig = useMemo(() => getAlgorithmConfig(algorithmName), [algorithmName]);

  const [graphModel] = useState(() => new GraphModel(true));
  const [applier] = useState(() => new Applier());
  const [workerClient] = useState(() => new WorkerClient());

  const [hasGraph, setHasGraph] = useState(false);
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
  const [loadedSessionInfo, setLoadedSessionInfo] = useState<{ name: string; date: string } | null>(
    null
  );
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');
  const [matrixText, setMatrixText] = useState('');
  const [matrixHandler, setMatrixHandler] = useState<{
    handler: (matrixText: string) => void;
    placeholder?: string;
    exampleMatrix?: string;
  } | null>(null);

  const rendererRef = useRef<Renderer | null>(null);
  const viewportRef = useRef<ViewportAdapter | null>(null);
  const controllerRef = useRef<StepController | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const currentGraphDTORef = useRef<GraphDTO>(graphModel.toDTO());
  const isInitializedRef = useRef(false);
  const isRestoringRef = useRef(false);
  const pendingStepsRef = useRef<Step[] | null>(null);
  const pendingSessionRef = useRef<{ sessionId: string; restoredIndex: number } | null>(null);

  const createGraphHash = useCallback((graphDTO: GraphDTO): string => {
    const nodesStr = graphDTO.nodes
      .map(n => n.id)
      .sort()
      .join(',');
    const edgesStr = graphDTO.edges
      .map(e => `${e.source}->${e.target}`)
      .sort()
      .join(',');
    return `${nodesStr}|${edgesStr}`;
  }, []);

  const centerGraph = useCallback(() => {
    if (!viewportRef.current || !graphModel || graphModel.nodeCount === 0) return;

    requestAnimationFrame(() => {
      if (viewportRef.current && graphModel.nodeCount > 0) {
        viewportRef.current.fitToGraph(graphModel);
      }
    });
  }, [graphModel]);

  const updateCurrentStep = useCallback(
    (index: number) => {
      if (!controllerRef.current || index < 0) {
        setCurrentStep(null);
        return;
      }

      const step = controllerRef.current.getStepByIndex(index);
      if (!step) {
        setCurrentStep(null);
        return;
      }

      if (!step.explanation && index < totalSteps - 1) {
        for (let i = index - 1; i >= Math.max(0, index - 5); i--) {
          const prevStep = controllerRef.current.getStepByIndex(i);
          if (prevStep?.explanation) {
            setCurrentStep({ ...step, explanation: prevStep.explanation });
            return;
          }
        }
      }

      setCurrentStep(step);
    },
    [totalSteps]
  );

  const saveStepIndex = useCallback(
    (index: number) => {
      if (totalSteps > 0 && algorithmName) {
        localStorage.setItem(STORAGE_KEYS.STEP(algorithmName), index.toString());
      }
    },
    [algorithmName, totalSteps]
  );

  const loadGraph = useCallback(
    (graphDTO: GraphDTO, skipReset = false) => {
      console.log('📥 Loading graph with', graphDTO.nodes.length, 'nodes');

      graphModel.fromDTO(graphDTO);
      currentGraphDTORef.current = graphDTO;
      setHasGraph(true);

      const newHash = createGraphHash(graphDTO);

      if (!skipReset) {
        if (newHash !== currentGraphHash) {
          setHasRunAlgorithm(false);
          setLoadedSessionInfo(null);
          if (controllerRef.current) {
            controllerRef.current.setSteps([]);
          }
          dispatch(reset());
        }
      }

      setCurrentGraphHash(newHash);

      if (rendererRef.current) {
        rendererRef.current.drawAll(graphModel);
        centerGraph();
      }
    },
    [graphModel, createGraphHash, currentGraphHash, dispatch, centerGraph]
  );

  /**
   * Получает центральную позицию viewport
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

  const handleAddNode = (id: string, x?: number, y?: number) => {
    let position: { x: number; y: number };

    if (x !== undefined && y !== undefined) {
      position = { x, y };
    } else {
      const center = getCenterPosition();
      const offsetRange = 150;
      position = {
        x: center.x + (Math.random() - 0.5) * offsetRange * 2,
        y: center.y + (Math.random() - 0.5) * offsetRange * 2,
      };
    }

    if (graphModel.hasNode(id)) {
      showAlert('Ошибка', `Вершина с ID "${id}" уже существует!`, 'error');
      return;
    }

    graphModel.addNode({ id, x: position.x, y: position.y, label: id });

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

  const handleAddNodeFromDialog = () => {
    if (nodeId.trim()) {
      handleAddNode(nodeId.trim());
      setNodeId('');
      setShowNodeDialog(false);
    }
  };

  const handleAddEdgeFromDialog = () => {
    if (edgeSource.trim() && edgeTarget.trim()) {
      const weight = algorithmConfig?.useWeights ? parseFloat(edgeWeight) || 1 : 1;
      handleAddEdge(edgeSource.trim(), edgeTarget.trim(), weight);
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeWeight('1');
      setShowEdgeDialog(false);
    }
  };

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

    graphModel.addEdge({ id: edgeId, source, target, weight, directed: true });

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

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
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
    localStorage.removeItem(STORAGE_KEYS.SESSION(algorithmName));
    localStorage.removeItem(STORAGE_KEYS.STEP(algorithmName));
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

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

  const restoreSession = useCallback(async () => {
    if (isRestoringRef.current) return;
    isRestoringRef.current = true;

    try {
      let sessionIdToLoad = localStorage.getItem(STORAGE_KEYS.LOAD_SESSION);
      let fromHistory = false;

      if (sessionIdToLoad) {
        localStorage.removeItem(STORAGE_KEYS.LOAD_SESSION);
        fromHistory = true;
      } else {
        sessionIdToLoad = localStorage.getItem(STORAGE_KEYS.SESSION(algorithmName));
      }

      if (!sessionIdToLoad) {
        isRestoringRef.current = false;
        return;
      }

      const session = await sessionRepository.loadSession(sessionIdToLoad);
      if (!session) {
        localStorage.removeItem(STORAGE_KEYS.SESSION(algorithmName));
        isRestoringRef.current = false;
        return;
      }

      loadGraph(session.graphDTO, true);
      setHasRunAlgorithm(true);

      if (session.steps && session.steps.length > 0) {
        if (controllerRef.current) {
          controllerRef.current.setSteps(session.steps);
        } else {
          pendingStepsRef.current = session.steps;
        }
      }

      dispatch(
        setSession({
          sessionId: session.id,
          totalSteps: session.steps.length,
        })
      );

      const savedStepIndex = localStorage.getItem(STORAGE_KEYS.STEP(algorithmName));
      const restoredIndex = savedStepIndex ? parseInt(savedStepIndex, 10) : -1;

      if (restoredIndex >= -1 && restoredIndex < session.steps.length) {
        dispatch(setIndex(restoredIndex));

        if (!controllerRef.current) {
          pendingSessionRef.current = { sessionId: session.id, restoredIndex };
        } else {
          setTimeout(() => {
            if (controllerRef.current && restoredIndex >= 0) {
              controllerRef.current.goToIndex(restoredIndex);
              updateCurrentStep(restoredIndex);
            }
            centerGraph();
          }, TIMING.STEP_RESTORE);
        }
      }

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

        const sessionAgeDays = Math.floor((Date.now() - session.updatedAt) / (1000 * 60 * 60 * 24));
        AnalyticsEvents.sessionLoadedFromHistory(session.algorithmName, sessionAgeDays);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem(STORAGE_KEYS.SESSION(algorithmName));
    } finally {
      isRestoringRef.current = false;
    }
  }, [algorithmName, loadGraph, dispatch, centerGraph, updateCurrentStep]);

  const handleRendererReady = useCallback(
    (renderer: Renderer, viewport: ViewportAdapter) => {
      rendererRef.current = renderer;
      viewportRef.current = viewport;
      renderer.setShowWeights(algorithmConfig?.useWeights ?? true);

      const controller = new StepController({
        model: graphModel,
        applier,
        renderer,
        onIndexChange: index => {
          dispatch(setIndex(index));
          updateCurrentStep(index);
        },
        onComplete: () => {
          dispatch(pause());
        },
      });

      controller.setSpeed(speedMs);
      controllerRef.current = controller;

      if (pendingStepsRef.current) {
        controller.setSteps(pendingStepsRef.current);
        pendingStepsRef.current = null;
      }

      if (hasGraph && graphModel.nodeCount > 0) {
        renderer.drawAll(graphModel);
        centerGraph();
      }

      if (pendingSessionRef.current) {
        const { restoredIndex } = pendingSessionRef.current;
        setTimeout(() => {
          if (controllerRef.current && restoredIndex >= 0) {
            controllerRef.current.goToIndex(restoredIndex);
            updateCurrentStep(restoredIndex);
          }
          centerGraph();
        }, TIMING.STEP_RESTORE);
        pendingSessionRef.current = null;
      }

      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        restoreSession();
      }
    },
    [
      graphModel,
      applier,
      algorithmConfig,
      speedMs,
      hasGraph,
      dispatch,
      centerGraph,
      updateCurrentStep,
      restoreSession,
    ]
  );

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
    currentGraphDTORef.current = graphDTO;

    setHasRunAlgorithm(true);

    const inputMethod = loadedSessionInfo ? 'history' : 'manual';
    const withWeights = algorithmConfig?.useWeights ?? false;
    AnalyticsEvents.algorithmStarted(
      algorithmName,
      withWeights,
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
    let debounceTimer: NodeJS.Timeout | null = null;

    const updateCanvasSize = () => {
      if (!canvasContainerRef.current) return;

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

      if (viewportRef.current) {
        viewportRef.current.resize(width, height);
      }
    };

    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateCanvasSize, TIMING.RESIZE_DEBOUNCE);
    };

    const timeoutId = setTimeout(updateCanvasSize, 100);

    let resizeObserver: ResizeObserver | null = null;
    if (canvasContainerRef.current) {
      resizeObserver = new ResizeObserver(debouncedUpdate);
      resizeObserver.observe(canvasContainerRef.current);
    }

    window.addEventListener('resize', debouncedUpdate);
    return () => {
      clearTimeout(timeoutId);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('resize', debouncedUpdate);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (hasGraph && hasRunAlgorithm && viewportRef.current && graphModel.nodeCount > 0) {
      const timer = setTimeout(centerGraph, TIMING.AUTO_CENTER);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasGraph, hasRunAlgorithm, centerGraph, graphModel]);

  useEffect(() => {
    if (currentGraphHash === null) return undefined;

    const prevHash = currentGraphHash;
    return () => {
      if (prevHash !== currentGraphHash && currentGraphHash !== null) {
        dispatch(reset());
      }
    };
  }, [currentGraphHash, dispatch]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      restoreSession();
    }
  }, [restoreSession]);

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
        if (allSteps.length === 0) return;

        const sessionId = requestId;
        const graphDTO = currentGraphDTORef.current;

        try {
          await sessionRepository.saveSession(sessionId, algorithmName, graphDTO, allSteps, {
            totalSteps,
            executionTime,
          });

          dispatch(setSession({ sessionId, totalSteps }));
          localStorage.setItem(STORAGE_KEYS.SESSION(algorithmName), sessionId);

          AnalyticsEvents.algorithmCompleted(
            algorithmName,
            totalSteps,
            executionTime,
            graphDTO.nodes.length,
            graphDTO.edges.length
          );

          AnalyticsEvents.sessionSaved(algorithmName, totalSteps);
        } catch (error) {
          console.error('Failed to save session:', error);
        }

        allSteps = [];
      },
      onError: error => {
        console.error('Worker error:', error);
        showAlert('Ошибка выполнения', String(error), 'error');

        const graphDTO = currentGraphDTORef.current;
        AnalyticsEvents.algorithmExecutionError(
          algorithmName,
          String(error),
          graphDTO.nodes.length,
          graphDTO.edges.length
        );

        allSteps = [];
      },
    });

    return () => {
      workerClient.terminate();
    };
  }, [algorithmName, dispatch, workerClient]);

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
      updateCurrentStep(currentIndex);

      if (currentIndex >= 0 && totalSteps > 0) {
        const viewMethod = playing ? 'auto' : 'manual';
        AnalyticsEvents.stepViewed(algorithmName, currentIndex, totalSteps, viewMethod);
      }
    }

    saveStepIndex(currentIndex);
  }, [currentIndex, algorithmName, totalSteps, playing, updateCurrentStep, saveStepIndex]);

  useEffect(() => {
    if (!controllerRef.current) return;
    controllerRef.current.setSpeed(speedMs);
  }, [speedMs]);

  useEffect(() => {
    AnalyticsEvents.algorithmViewed(algorithmName, pathname);
  }, [algorithmName, pathname]);

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
    }

    sessionStorage.setItem(STORAGE_KEYS.LAST_ALGORITHM, algorithmName);
  }, [algorithmName, graphModel, dispatch]);

  const registerMatrixHandler = useCallback(
    (
      handler: (matrixText: string) => void,
      config?: { placeholder?: string; exampleMatrix?: string }
    ) => {
      setMatrixHandler({ handler, ...config });
      if (config?.exampleMatrix) {
        setMatrixText(config.exampleMatrix);
      }
    },
    []
  );

  const handleMatrixSubmit = () => {
    if (matrixHandler) {
      matrixHandler.handler(matrixText);
      setShowMatrixDialog(false);
    }
  };

  const handleLoadExample = () => {
    if (matrixHandler?.exampleMatrix) {
      setMatrixText(matrixHandler.exampleMatrix);
    }
  };

  const contextValue: AlgorithmLayoutContextType = useMemo(
    () => ({
      loadGraph,
      hasGraph,
      hasRunAlgorithm,
      graphModel,
      registerMatrixHandler,
    }),
    [loadGraph, hasGraph, hasRunAlgorithm, graphModel, registerMatrixHandler]
  );

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
              href="/"
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
                  <MuiAlert
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
                  </MuiAlert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</Box>

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

                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Box>
                      <GraphEditor
                        onAddNode={handleAddNode}
                        onAddEdge={handleAddEdge}
                        onClear={handleClear}
                        useWeights={algorithmConfig?.useWeights ?? true}
                      />
                    </Box>
                    <GraphCanvas
                      model={graphModel}
                      onRendererReady={handleRendererReady}
                      width={canvasSize.width}
                      height={canvasSize.height}
                    />

                    {hasRunAlgorithm && totalSteps > 0 && (
                      <Paper
                        sx={{
                          display: { xs: 'none', lg: 'block' },
                          backgroundColor: 'rgba(42, 42, 42, 0.5)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(115, 115, 115, 0.5)',
                          p: 4,
                        }}
                      >
                        <ControlPanel />
                      </Paper>
                    )}

                    {/* Компактные кнопки редактирования графа для экранов < 1200px */}
                    <Box
                      sx={{
                        display: { xs: 'flex', lg: 'none' },
                        position: 'absolute',
                        top: 290,
                        right: 16,
                        gap: 1,
                        backgroundColor: 'rgba(42, 42, 42, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(115, 115, 115, 0.5)',
                        borderRadius: 2,
                        p: 1,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <IconButton
                        onClick={() => setShowNodeDialog(true)}
                        title="Добавить вершину"
                        sx={{
                          color: 'text.primary',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Plus size={20} />
                      </IconButton>
                      <IconButton
                        onClick={() => setShowEdgeDialog(true)}
                        title="Добавить ребро"
                        sx={{
                          color: 'text.primary',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Network size={20} />
                      </IconButton>
                      <IconButton
                        onClick={handleClear}
                        title="Очистить граф"
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'error.dark',
                            color: 'white',
                          },
                        }}
                      >
                        <Minus size={20} />
                      </IconButton>
                    </Box>

                    {/* Плеер поверх канваса внизу для экранов < 1200px */}
                    {hasRunAlgorithm && totalSteps > 0 && (
                      <Box
                        sx={{
                          display: { xs: 'block', lg: 'none' },
                          position: 'absolute',
                          bottom: 16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(42, 42, 42, 0.95)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(115, 115, 115, 0.5)',
                          borderRadius: 2,
                          px: 2,
                          py: 1.5,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <ControlPanel compact />
                      </Box>
                    )}
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

        {/* Диалог добавления вершины */}
        <Dialog
          open={showNodeDialog}
          onClose={() => setShowNodeDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(42, 42, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(115, 115, 115, 0.5)',
            },
          }}
        >
          <DialogTitle
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            Добавить вершину
            <IconButton
              aria-label="close"
              onClick={() => setShowNodeDialog(false)}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="ID вершины"
              placeholder="0, 1, 2, ..."
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNodeFromDialog()}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNodeDialog(false)}>Отмена</Button>
            <Button onClick={handleAddNodeFromDialog} variant="contained">
              Добавить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог добавления ребра */}
        <Dialog
          open={showEdgeDialog}
          onClose={() => setShowEdgeDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(42, 42, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(115, 115, 115, 0.5)',
            },
          }}
        >
          <DialogTitle
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            Добавить ребро
            <IconButton
              aria-label="close"
              onClick={() => setShowEdgeDialog(false)}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                autoFocus
                fullWidth
                label="Из вершины"
                value={edgeSource}
                onChange={e => setEdgeSource(e.target.value)}
              />
              <TextField
                fullWidth
                label="В вершину"
                value={edgeTarget}
                onChange={e => setEdgeTarget(e.target.value)}
              />
              {algorithmConfig?.useWeights && (
                <TextField
                  fullWidth
                  type="number"
                  label="Вес (опционально)"
                  value={edgeWeight}
                  onChange={e => setEdgeWeight(e.target.value)}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEdgeDialog(false)}>Отмена</Button>
            <Button onClick={handleAddEdgeFromDialog} variant="contained" color="success">
              Добавить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AlgorithmLayoutContext.Provider>
  );
}
