/**
 * Вспомогательные функции для работы с пояснениями
 */

import type { Step, AlgorithmContext } from '@/types';
import { explanationGeneratorRegistry } from './ExplanationGenerator';

/**
 * Добавляет пояснение к шагу, если генератор для алгоритма доступен
 */
export function enrichStepWithExplanation(
  step: Step,
  algorithmName: string,
  context?: AlgorithmContext
): Step {
  // Если пояснение уже есть, не перезаписываем
  if (step.explanation) {
    return step;
  }

  // Генерируем пояснение
  const explanation = explanationGeneratorRegistry.generate(step, algorithmName, context);
  if (explanation) {
    step.explanation = explanation;
  }

  return step;
}
