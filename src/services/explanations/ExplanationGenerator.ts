/**
 * Базовый класс для генерации пояснений к шагам алгоритмов
 */

import type { Step, StepExplanation, ExplanationType } from '@/types';
import {
  formatNodeLabel as fmtNodeLabel,
  formatWeight as fmtWeight,
  formatEdge as fmtEdge,
  formatDistance as fmtDistance,
  formatPath as fmtPath,
} from './formatters';
import { createExplanation, type TemplateContext } from './templates';

/**
 * Контекст алгоритма для генерации пояснений
 */
export interface AlgorithmContext {
  [key: string]: unknown;
}

/**
 * Базовый генератор пояснений
 */
export abstract class ExplanationGenerator {
  /**
   * Генерирует пояснение для шага
   */
  abstract generateExplanation(
    step: Step,
    algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined;

  /**
   * Создает пояснение из текста и типа
   */
  protected createExplanation(
    type: ExplanationType,
    text: string,
    context?: AlgorithmContext,
    options?: {
      reason?: string;
      formula?: string;
      currentPath?: string;
    }
  ): StepExplanation {
    const explanation: StepExplanation = {
      type,
      text,
    };

    if (options?.reason) {
      explanation.reason = options.reason;
    }

    if (options?.formula) {
      explanation.formula = options.formula;
    }

    if (options?.currentPath) {
      explanation.currentPath = options.currentPath;
    }

    if (context) {
      explanation.context = this.extractContext(context);
    }

    return explanation;
  }

  /**
   * Извлекает контекст из данных алгоритма
   */
  protected extractContext(context: AlgorithmContext): StepExplanation['context'] {
    const result: StepExplanation['context'] = {};

    if (context.nodes && Array.isArray(context.nodes)) {
      result.nodes = context.nodes.map(String);
    }

    if (context.edges && Array.isArray(context.edges)) {
      result.edges = context.edges.map(String);
    }

    if (context.values && typeof context.values === 'object') {
      result.values = context.values as Record<string, number | string>;
    }

    if (context.matrix && typeof context.matrix === 'object') {
      result.matrix = context.matrix as { row?: number; col?: number };
    }

    return result;
  }

  /**
   * Форматирование узла
   */
  protected formatNode(nodeId: string | number): string {
    return fmtNodeLabel(nodeId);
  }

  /**
   * Форматирование веса
   */
  protected formatWeight(weight: number): string {
    return fmtWeight(weight);
  }

  /**
   * Форматирование ребра
   */
  protected formatEdge(from: string | number, to: string | number, directed = true): string {
    return fmtEdge(from, to, directed);
  }

  /**
   * Форматирование расстояния
   */
  protected formatDistance(dist: number): string {
    return fmtDistance(dist);
  }

  /**
   * Форматирование пути
   */
  protected formatPath(path: (string | number)[], separator = ' → '): string {
    return fmtPath(path, separator);
  }
}

/**
 * Реестр генераторов по алгоритмам
 */
export class ExplanationGeneratorRegistry {
  private generators: Map<string, ExplanationGenerator> = new Map();

  /**
   * Регистрирует генератор для алгоритма
   */
  register(algorithmName: string, generator: ExplanationGenerator): void {
    this.generators.set(algorithmName, generator);
  }

  /**
   * Получает генератор для алгоритма
   */
  get(algorithmName: string): ExplanationGenerator | undefined {
    return this.generators.get(algorithmName);
  }

  /**
   * Генерирует пояснение используя зарегистрированный генератор
   */
  generate(
    step: Step,
    algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined {
    const generator = this.get(algorithmName);
    if (!generator) {
      return undefined;
    }
    return generator.generateExplanation(step, algorithmName, context);
  }
}

/**
 * Глобальный экземпляр реестра
 */
export const explanationGeneratorRegistry = new ExplanationGeneratorRegistry();
