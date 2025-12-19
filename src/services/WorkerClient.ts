/**
 * WorkerClient — gateway для взаимодействия с Web Worker
 * UI-side клиент для отправки задач и получения результатов
 * Поддерживает ACK, backpressure, отмену через AbortController
 */

import {
  WorkerMessage,
  RunAlgoMessage,
  StepChunkMessage,
  ChunkAckMessage,
  DoneMessage,
  ErrorMessage,
  CancelMessage,
  ProgressMessage,
  AlgorithmParams,
  GraphDTO,
  Step,
} from '@/types';

export type WorkerEventHandler = {
  onStepChunk?: (steps: Step[], chunkId: string, isLast: boolean) => void;
  onDone?: (totalSteps: number, executionTime: number, requestId: string) => void;
  onError?: (error: string, requestId?: string) => void;
  onProgress?: (current: number, total: number, percentage: number) => void;
};

export class WorkerClient {
  private worker: Worker | null = null;
  private handlers: WorkerEventHandler = {};
  private currentRequestId: string | null = null;
  private abortController: AbortController | null = null;
  private pendingChunks: Set<string> = new Set();

  /**
   * Инициализировать Worker
   */
  init(): void {
    if (this.worker) {
      return;
    }

    // Создаём Worker из src/workers/ (правильный подход для Next.js)
    this.worker = new Worker(new URL('../workers/algorithm.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleMessage(event.data);
    };

    this.worker.onerror = error => {
      console.error('Worker error:', error);
      this.handlers.onError?.(`Worker error: ${error.message}`, this.currentRequestId || undefined);
      this.reset();
    };
  }

  /**
   * Установить обработчики событий
   */
  setHandlers(handlers: WorkerEventHandler): void {
    this.handlers = handlers;
  }

  /**
   * Запустить алгоритм
   */
  runAlgorithm(name: string, graphDTO: GraphDTO, params: AlgorithmParams = {}): string {
    if (!this.worker) {
      this.init();
    }

    // Отменяем предыдущий запрос, если есть
    if (this.currentRequestId) {
      this.cancel();
    }

    // Создаём новый AbortController
    this.abortController = new AbortController();
    const requestId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentRequestId = requestId;
    this.pendingChunks.clear();

    const message: RunAlgoMessage = {
      type: 'RUN_ALGO',
      payload: {
        name,
        graphDTO,
        params: {
          chunkSize: 50, // размер чанка по умолчанию
          ...params,
        },
        requestId,
      },
    };

    this.worker?.postMessage(message);
    return requestId;
  }

  /**
   * Отменить выполнение алгоритма
   */
  cancel(requestId?: string): void {
    if (!this.worker) {
      return;
    }

    // Отменяем только текущий запрос или указанный
    if (!requestId || requestId === this.currentRequestId) {
      if (this.abortController) {
        this.abortController.abort();
      }

      const message: CancelMessage = {
        type: 'CANCEL',
        requestId: requestId || this.currentRequestId || undefined,
      };

      this.worker.postMessage(message);
      this.reset();
    }
  }

  /**
   * Отправить ACK для чанка
   */
  private sendChunkAck(chunkId: string): void {
    if (!this.worker) {
      return;
    }

    const ackMessage: ChunkAckMessage = {
      type: 'CHUNK_ACK',
      chunkId,
    };

    this.worker.postMessage(ackMessage);
    this.pendingChunks.delete(chunkId);
  }

  /**
   * Обработка сообщений от Worker
   */
  private handleMessage(message: WorkerMessage): void {
    switch (message.type) {
      case 'STEP_CHUNK': {
        const stepMessage = message as StepChunkMessage;

        // Проверяем, что это сообщение для текущего запроса
        if (this.currentRequestId && stepMessage.chunkId) {
          this.pendingChunks.add(stepMessage.chunkId);

          // Вызываем обработчик
          this.handlers.onStepChunk?.(stepMessage.payload, stepMessage.chunkId, stepMessage.isLast);

          // Отправляем ACK после обработки
          this.sendChunkAck(stepMessage.chunkId);
        }
        break;
      }

      case 'DONE': {
        const doneMessage = message as DoneMessage;
        if (doneMessage.payload) {
          this.handlers.onDone?.(
            doneMessage.payload.totalSteps,
            doneMessage.payload.executionTime,
            doneMessage.payload.requestId
          );
        }
        this.reset();
        break;
      }

      case 'ERROR': {
        const errorMessage = message as ErrorMessage;
        this.handlers.onError?.(errorMessage.payload, errorMessage.requestId);
        this.reset();
        break;
      }

      case 'PROGRESS': {
        const progressMessage = message as ProgressMessage;
        if (progressMessage.payload) {
          this.handlers.onProgress?.(
            progressMessage.payload.current,
            progressMessage.payload.total,
            progressMessage.payload.percentage
          );
        }
        break;
      }

      default:
        console.warn('Unknown message type from worker:', message.type);
    }
  }

  /**
   * Сброс состояния
   */
  private reset(): void {
    this.currentRequestId = null;
    this.abortController = null;
    this.pendingChunks.clear();
  }

  /**
   * Получить текущий request ID
   */
  getCurrentRequestId(): string | null {
    return this.currentRequestId;
  }

  /**
   * Проверить, выполняется ли запрос
   */
  isRunning(): boolean {
    return this.currentRequestId !== null;
  }

  /**
   * Получить количество неподтверждённых чанков
   */
  getPendingChunksCount(): number {
    return this.pendingChunks.size;
  }

  /**
   * Уничтожить Worker
   */
  terminate(): void {
    if (this.currentRequestId) {
      this.cancel();
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.reset();
  }
}
