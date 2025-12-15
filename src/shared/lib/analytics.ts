/**
 * Google Analytics Event Tracking
 */

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
 * События для алгоритмов
 */
export const AnalyticsEvents = {
  /**
   * Просмотр страницы алгоритма
   */
  algorithmViewed: (algorithmName: string, pagePath: string) => {
    trackEvent('algorithm_viewed', {
      algorithm_name: algorithmName,
      page_path: pagePath,
    });
  },

  /**
   * Запуск алгоритма
   */
  algorithmStarted: (
    algorithmName: string,
    graphNodesCount: number,
    graphEdgesCount: number,
    inputMethod: 'matrix' | 'manual' | 'history'
  ) => {
    trackEvent('algorithm_started', {
      algorithm_name: algorithmName,
      graph_nodes_count: graphNodesCount,
      graph_edges_count: graphEdgesCount,
      input_method: inputMethod,
    });
  },

  /**
   * Завершение алгоритма
   */
  algorithmCompleted: (
    algorithmName: string,
    totalSteps: number,
    executionTimeMs: number,
    graphNodesCount: number,
    graphEdgesCount: number
  ) => {
    trackEvent('algorithm_completed', {
      algorithm_name: algorithmName,
      total_steps: totalSteps,
      execution_time_ms: executionTimeMs,
      graph_nodes_count: graphNodesCount,
      graph_edges_count: graphEdgesCount,
    });
  },

  /**
   * Просмотр шага
   */
  stepViewed: (
    algorithmName: string,
    stepNumber: number,
    totalSteps: number,
    viewMethod: 'auto' | 'manual'
  ) => {
    trackEvent('step_viewed', {
      algorithm_name: algorithmName,
      step_number: stepNumber,
      total_steps: totalSteps,
      view_method: viewMethod,
    });
  },

  /**
   * Сохранение сессии
   */
  sessionSaved: (algorithmName: string, totalSteps: number) => {
    trackEvent('session_saved', {
      algorithm_name: algorithmName,
      total_steps: totalSteps,
    });
  },

  /**
   * Загрузка сессии из истории
   */
  sessionLoadedFromHistory: (algorithmName: string, sessionAgeDays: number) => {
    trackEvent('session_loaded_from_history', {
      algorithm_name: algorithmName,
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
  sessionDeleted: (algorithmName: string) => {
    trackEvent('session_deleted', {
      algorithm_name: algorithmName,
    });
  },

  /**
   * Ошибка парсинга матрицы
   */
  matrixParseError: (algorithmName: string, errorType: string) => {
    trackEvent('matrix_parse_error', {
      algorithm_name: algorithmName,
      error_type: errorType,
    });
  },

  /**
   * Ошибка выполнения алгоритма
   */
  algorithmExecutionError: (
    algorithmName: string,
    errorMessage: string,
    graphNodesCount?: number,
    graphEdgesCount?: number
  ) => {
    const params: Record<string, string | number> = {
      algorithm_name: algorithmName,
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
  navigateToAlgorithms: () => {
    trackEvent('navigate_to_algorithms');
  },

  /**
   * Выбор алгоритма из списка
   */
  algorithmSelected: (algorithmName: string) => {
    trackEvent('algorithm_selected', {
      algorithm_name: algorithmName,
    });
  },
} as const;
