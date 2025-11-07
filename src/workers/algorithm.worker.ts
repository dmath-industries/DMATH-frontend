/**
 * Algorithm Web Worker
 * Web Worker для выполнения алгоритмов на графа
 */

import type {
  WorkerMessage,
  RunAlgoMessage,
  StepChunkMessage,
  ChunkAckMessage,
  DoneMessage,
  ErrorMessage,
  CancelMessage,
  ProgressMessage,
  Step,
} from '@/types';

import { RobertsFloresStepGenerator } from '@/algorithms/roberts-flores/steps';

interface ExecutionState {
  requestId: string;
  cancelled: boolean;
  abortController: AbortController;
  pendingChunks: number;
}

let currentExecution: ExecutionState | null = null;

const pendingAcks: Set<string> = new Set();

/**
 * Обработчик сообщений от UI
 */
self.onmessage = (event: MessageEvent<WorkerMessage>): void => {
  const message = event.data;

  switch (message.type) {
    case 'RUN_ALGO':
      handleRunAlgorithm(message as RunAlgoMessage);
      break;

    case 'CANCEL':
      handleCancel(message as CancelMessage);
      break;

    case 'CHUNK_ACK':
      handleChunkAck(message as ChunkAckMessage);
      break;

    default:
      console.warn('Unknown message type in worker:', message.type);
  }
};

/**
 * Обработчик запуска алгоритма
 * Генерирует шаги алгоритма и отправляет их батчами
 */
async function handleRunAlgorithm(message: RunAlgoMessage): Promise<void> {
  if (!message.payload) {
    const errorMessage: ErrorMessage = {
      type: 'ERROR',
      payload: 'No payload provided',
      requestId: undefined,
    };
    self.postMessage(errorMessage);
    return;
  }

  const { name, graphDTO, params, requestId } = message.payload;
  const startTime = Date.now();
  const chunkSize = params.chunkSize || 50;

  if (currentExecution) {
    currentExecution.cancelled = true;
    currentExecution.abortController.abort();
  }

  const abortController = new AbortController();
  currentExecution = {
    requestId,
    cancelled: false,
    abortController,
    pendingChunks: 0,
  };

  try {
    let steps: Step[] = [];

    switch (name) {
      case 'roberts-flores': {
        const generator = new RobertsFloresStepGenerator();
        steps = generator.generateSteps(graphDTO, params);
        break;
      }

      case 'bfs':
        steps = [];
        break;

      case 'dfs':
        steps = [];
        break;

      default:
        throw new Error(`Unknown algorithm: ${name}`);
    }

    if (currentExecution?.cancelled || abortController.signal.aborted) {
      return;
    }

    await sendStepsInChunks(steps, chunkSize, requestId, abortController.signal);

    if (currentExecution?.cancelled || abortController.signal.aborted) {
      return;
    }

    const doneMessage: DoneMessage = {
      type: 'DONE',
      payload: {
        totalSteps: steps.length,
        executionTime: Date.now() - startTime,
        requestId,
      },
    };

    self.postMessage(doneMessage);
    currentExecution = null;
  } catch (error) {
    if (abortController.signal.aborted || currentExecution?.cancelled) {
      return;
    }

    const errorMessage: ErrorMessage = {
      type: 'ERROR',
      payload: error instanceof Error ? error.message : String(error),
      requestId,
    };

    self.postMessage(errorMessage);
    currentExecution = null;
  }
}

/**
 * Отправка шагов батчами с поддержкой backpressure
 * 
 * @param steps - Массив шагов алгоритма
 * @param chunkSize - Размер одного чанка
 * @param requestId - ID запроса для отслеживания
 * @param signal - AbortSignal для отмены операции
 */
async function sendStepsInChunks(
  steps: Step[],
  chunkSize: number,
  requestId: string,
  signal: AbortSignal
): Promise<void> {
  const totalChunks = Math.ceil(steps.length / chunkSize);
  let chunkIndex = 0;

  for (let i = 0; i < steps.length; i += chunkSize) {
    if (signal.aborted || currentExecution?.cancelled) {
      break;
    }

    const chunk = steps.slice(i, i + chunkSize);
    const chunkId = `${requestId}_chunk_${chunkIndex}`;
    const isLast = chunkIndex === totalChunks - 1;

    while (currentExecution && currentExecution.pendingChunks >= 3) {
      if (signal.aborted || currentExecution.cancelled) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const message: StepChunkMessage = {
      type: 'STEP_CHUNK',
      payload: chunk,
      chunkId,
      chunkIndex,
      totalChunks,
      isLast,
    };

    self.postMessage(message);
    pendingAcks.add(chunkId);

    if (currentExecution) {
      currentExecution.pendingChunks++;
    }

    if (chunkIndex % 5 === 0 || isLast) {
      const progressMessage: ProgressMessage = {
        type: 'PROGRESS',
        payload: {
          current: Math.min(i + chunkSize, steps.length),
          total: steps.length,
          percentage: Math.round(((i + chunkSize) / steps.length) * 100),
        },
      };
      self.postMessage(progressMessage);
    }

    chunkIndex++;
  }
}

/**
 * Обработчик отмены выполнения алгоритма
 */
function handleCancel(message: CancelMessage): void {
  if (currentExecution && (!message.requestId || currentExecution.requestId === message.requestId)) {
    currentExecution.cancelled = true;
    currentExecution.abortController.abort();
    currentExecution = null;
    pendingAcks.clear();
  }
}

/**
 * Обработчик подтверждения получения чанка (ACK)
 */
function handleChunkAck(message: ChunkAckMessage): void {
  pendingAcks.delete(message.chunkId);

  if (currentExecution && currentExecution.pendingChunks > 0) {
    currentExecution.pendingChunks--;
  }
}

