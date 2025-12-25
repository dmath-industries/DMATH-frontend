import type { Step } from '@/types';
import type { AlgorithmContext } from './ExplanationGenerator';
import { explanationGeneratorRegistry } from './ExplanationGenerator';

export function enrichStepWithExplanation(
  step: Step,
  algorithmName: string,
  context?: AlgorithmContext
): Step {
  if (step.explanation) {
    return step;
  }

  const explanation = explanationGeneratorRegistry.generate(step, algorithmName, context);
  if (explanation) {
    step.explanation = explanation;
  }

  return step;
}
