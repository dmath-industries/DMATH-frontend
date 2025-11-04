/**
 * Services module
 * Бизнес-логика и сервисы приложения
 */

// Graph services - работа с графами (модель данных, layout)
export { GraphModel } from './graph/GraphModel';
export { LayoutService } from './graph/LayoutService';
export type { LayoutOptions } from './graph/LayoutService';

// Renderer services - отрисовка графа (Pixi.js)
export { Renderer } from './renderer/Renderer';
export { ViewportAdapter } from './renderer/ViewportAdapter';
export type { ViewportConfig, ViewportState } from './renderer/ViewportAdapter';

// Step services - управление шагами алгоритма (Task 9)
// export { StepController } from './steps/StepController';
// export type { StepControllerConfig } from './steps/StepController';
// export { Applier } from './steps/Applier';

// Other services - работа с Web Worker (Task 10)
// export { WorkerClient } from './WorkerClient';
// export type { WorkerEventHandler } from './WorkerClient';