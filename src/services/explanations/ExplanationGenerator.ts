import type { Step, StepExplanation, ExplanationType } from '@/types';
import {
  formatNodeLabel as fmtNodeLabel,
  formatWeight as fmtWeight,
  formatEdge as fmtEdge,
  formatDistance as fmtDistance,
  formatPath as fmtPath,
} from './formatters';
import { createExplanation, type TemplateContext } from './templates';

export interface AlgorithmContext {
  [key: string]: unknown;
}

export abstract class ExplanationGenerator {
  abstract generateExplanation(
    step: Step,
    algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined;

  protected createExplanation(
    type: ExplanationType,
    text: string,
    context?: AlgorithmContext,
    options?: {
      reason?: string;
      formula?: string | string[];
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
      if (typeof options.formula === 'string' && options.formula.includes('\n')) {
        explanation.formula = options.formula
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0);
      } else {
        explanation.formula = options.formula;
      }
    }

    if (options?.currentPath) {
      explanation.currentPath = options.currentPath;
    }

    if (context) {
      explanation.context = this.extractContext(context);
    }

    return explanation;
  }

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

  protected formatNode(nodeId: string | number): string {
    return fmtNodeLabel(nodeId);
  }

  protected formatWeight(weight: number): string {
    return fmtWeight(weight);
  }

  protected formatEdge(from: string | number, to: string | number, directed = true): string {
    return fmtEdge(from, to, directed);
  }

  protected formatDistance(dist: number): string {
    return fmtDistance(dist);
  }

  protected formatPath(path: (string | number)[], separator = ' → '): string {
    return fmtPath(path, separator);
  }
}

export class ExplanationGeneratorRegistry {
  private generators: Map<string, ExplanationGenerator> = new Map();

  register(algorithmName: string, generator: ExplanationGenerator): void {
    this.generators.set(algorithmName, generator);
  }

  get(algorithmName: string): ExplanationGenerator | undefined {
    return this.generators.get(algorithmName);
  }

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

export const explanationGeneratorRegistry = new ExplanationGeneratorRegistry();
