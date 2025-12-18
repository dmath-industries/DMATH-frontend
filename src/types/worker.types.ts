/**
 * Протокол сообщений между UI и Web Worker
 * Поддерживает ACK, чанки, отмену через AbortController
 */

import type { GraphDTO } from './dto.types';
import type { Step } from './step.types';

/**
 * Типы сообщений Worker
 */
export type WorkerMessageType =
  | 'RUN_ALGO' // UI → Worker: запуск алгоритма
  | 'STEP_CHUNK' // Worker → UI: батч шагов
  | 'CHUNK_ACK' // UI → Worker: подтверждение получения чанка
  | 'DONE' // Worker → UI: алгоритм завершён
  | 'ERROR' // Worker → UI: ошибка выполнения
  | 'CANCEL' // UI → Worker: отмена выполнения
  | 'PROGRESS'; // Worker → UI: прогресс выполнения

/**
 * Базовое сообщение Worker
 */
export interface WorkerMessage<T = unknown> {
  type: WorkerMessageType;
  payload?: T;
  chunkId?: string; // ID чанка для ACK
}

/**
 * Параметры алгоритма
 */
export interface AlgorithmParams {
  [key: string]: unknown;
  startNode?: string;
  endNode?: string;
  maxIterations?: number;
  chunkSize?: number; // размер чанка (по умолчанию 50)
}

/**
 * Запрос на запуск алгоритма (UI → Worker)
 */
export interface AlgorithmRequest {
  name: string;
  graphDTO: GraphDTO;
  params: AlgorithmParams;
  requestId: string; // уникальный ID запроса
}

/**
 * Сообщение RUN_ALGO
 */
export interface RunAlgoMessage extends WorkerMessage<AlgorithmRequest> {
  type: 'RUN_ALGO';
  payload: AlgorithmRequest;
}

/**
 * Сообщение STEP_CHUNK (батч шагов)
 */
export interface StepChunkMessage extends WorkerMessage<Step[]> {
  type: 'STEP_CHUNK';
  payload: Step[];
  chunkId: string;
  chunkIndex: number;
  totalChunks?: number;
  isLast: boolean;
}

/**
 * Сообщение CHUNK_ACK (подтверждение получения чанка)
 */
export interface ChunkAckMessage extends WorkerMessage {
  type: 'CHUNK_ACK';
  chunkId: string;
}

/**
 * Сообщение DONE
 */
export interface DoneMessage extends WorkerMessage {
  type: 'DONE';
  payload: {
    totalSteps: number;
    executionTime: number;
    requestId: string;
  };
}

/**
 * Сообщение ERROR
 */
export interface ErrorMessage extends WorkerMessage<string> {
  type: 'ERROR';
  payload: string;
  requestId?: string;
}

/**
 * Сообщение CANCEL
 */
export interface CancelMessage extends WorkerMessage {
  type: 'CANCEL';
  requestId?: string;
}

/**
 * Сообщение PROGRESS (прогресс выполнения)
 */
export interface ProgressMessage extends WorkerMessage {
  type: 'PROGRESS';
  payload: {
    current: number;
    total: number;
    percentage: number;
  };
}

/**
 * Union type для всех сообщений
 */
export type WorkerMessages =
  | RunAlgoMessage
  | StepChunkMessage
  | ChunkAckMessage
  | DoneMessage
  | ErrorMessage
  | CancelMessage
  | ProgressMessage;
