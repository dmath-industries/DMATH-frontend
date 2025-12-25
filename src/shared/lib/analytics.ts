import { getAlgorithmConfig } from '@/algorithms';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: 'event' | 'config' | 'js',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!isGtagAvailable()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, params);
    }
    return;
  }

  try {
    window.gtag('event', eventName, params);

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [GA Event]', eventName, params || {});
    }
  } catch (error) {
    console.error('Failed to send analytics event:', error);
  }
}

/**
 * Получить читаемое название алгоритма по его ID
 */
function getAlgorithmName(algorithmId: string): string {
  const config = getAlgorithmConfig(algorithmId);
  return config?.name || algorithmId;
}

/**
 * События для алгоритмов
 */
export const AnalyticsEvents = {
  /**
   * Просмотр страницы алгоритма
   */
  algorithmViewed: (algorithmId: string, pagePath: string) => {
    trackEvent('algorithm_viewed', {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      page_path: pagePath,
    });
  },

  /**
   * Запуск алгоритма
   */
  algorithmStarted: (
    algorithmId: string,
    withWeights: boolean,
    graphNodesCount?: number,
    graphEdgesCount?: number,
    inputMethod?: 'matrix' | 'manual' | 'history'
  ) => {
    const params: Record<string, string | number | boolean> = {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      with_weights: withWeights,
    };
    if (graphNodesCount !== undefined) {
      params.graph_nodes_count = graphNodesCount;
    }
    if (graphEdgesCount !== undefined) {
      params.graph_edges_count = graphEdgesCount;
    }
    if (inputMethod) {
      params.input_method = inputMethod;
    }
    trackEvent('algorithm_started', params);
  },

  /**
   * Завершение алгоритма
   */
  algorithmCompleted: (
    algorithmId: string,
    stepsTotal: number,
    executionTimeMs: number,
    graphNodesCount?: number,
    graphEdgesCount?: number
  ) => {
    const params: Record<string, string | number | boolean> = {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      steps_total: stepsTotal,
      execution_time_ms: executionTimeMs,
    };
    if (graphNodesCount !== undefined) {
      params.graph_nodes_count = graphNodesCount;
    }
    if (graphEdgesCount !== undefined) {
      params.graph_edges_count = graphEdgesCount;
    }
    trackEvent('algorithm_completed', params);
  },

  /**
   * Просмотр шага
   */
  stepViewed: (
    algorithmId: string,
    stepIndex: number,
    totalSteps: number,
    viewMethod: 'auto' | 'manual'
  ) => {
    trackEvent('step_viewed', {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      step_index: stepIndex,
      total_steps: totalSteps,
      view_method: viewMethod,
    });
  },

  /**
   * Сохранение сессии
   */
  sessionSaved: (algorithmId: string, stepsTotal?: number) => {
    const params: Record<string, string | number | boolean> = {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
    };
    if (stepsTotal !== undefined) {
      params.steps_total = stepsTotal;
    }
    trackEvent('session_saved', params);
  },

  /**
   * Загрузка сессии из истории
   */
  sessionLoadedFromHistory: (algorithmId: string, sessionAgeDays: number) => {
    trackEvent('session_loaded_from_history', {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      session_age_days: sessionAgeDays,
    });
  },

  /**
   * Просмотр страницы истории
   */
  historyPageViewed: (sessionsCount: number) => {
    trackEvent('history_page_viewed', {
      sessions_count: sessionsCount,
    });
  },

  /**
   * Удаление сессии
   */
  sessionDeleted: (algorithmId: string) => {
    trackEvent('session_deleted', {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
    });
  },

  /**
   * Ошибка парсинга матрицы
   */
  matrixParseError: (algorithmId: string, errorType: string) => {
    trackEvent('matrix_parse_error', {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      error_type: errorType,
    });
  },

  /**
   * Ошибка выполнения алгоритма
   */
  algorithmExecutionError: (
    algorithmId: string,
    errorMessage: string,
    graphNodesCount?: number,
    graphEdgesCount?: number
  ) => {
    const params: Record<string, string | number> = {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
      error_message: errorMessage.substring(0, 100),
    };
    if (graphNodesCount !== undefined) {
      params.graph_nodes_count = graphNodesCount;
    }
    if (graphEdgesCount !== undefined) {
      params.graph_edges_count = graphEdgesCount;
    }
    trackEvent('algorithm_execution_error', params);
  },

  /**
   * Переход к алгоритмам
   */
  navigateToAlgorithms: (from?: 'home' | 'header' | 'history' | 'other') => {
    const params: Record<string, string> = {};
    if (from) {
      params.from = from;
    }
    trackEvent('navigate_to_algorithms', params);
  },

  /**
   * Выбор алгоритма из списка
   */
  algorithmSelected: (algorithmId: string) => {
    trackEvent('algorithm_selected', {
      algorithm_id: algorithmId,
      algorithm_name: getAlgorithmName(algorithmId),
    });
  },
} as const;
