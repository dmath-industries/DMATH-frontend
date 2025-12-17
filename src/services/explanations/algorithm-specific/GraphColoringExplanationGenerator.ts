/**
 * Генератор пояснений для алгоритма раскраски графа
 */

import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class GraphColoringExplanationGenerator extends ExplanationGenerator {
  generateExplanation(
    step: Step,
    algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined {
    switch (step.type) {
      case 'HIGHLIGHT_NODE':
        return this.handleHighlightNode(step, context);
      case 'UPDATE_NODE':
        return this.handleUpdateNode(step, context);
      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }

  private handleHighlightNode(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'HIGHLIGHT_NODE') return undefined;

    const nodeId = step.nodeId;
    const state = step.state;
    const nodeLabel = this.formatNode(nodeId);

    const color = context?.color as number | undefined;
    const colorName = context?.colorName as string | undefined;

    switch (state) {
      case 'current':
      case 'active':
      case 'visited':
      case 'path':
      case 'candidate':
        // Эти состояния используются для обозначения разных цветов
        if (color !== undefined && colorName) {
          return this.createExplanation(
            'update',
            `Вершине ${nodeLabel} присвоен цвет: ${colorName} (цвет ${color + 1})`,
            { nodes: [nodeId], values: { color: colorName, colorIndex: (color + 1).toString() } }
          );
        }
        return this.createExplanation('general', `Обрабатываем вершину ${nodeLabel}`, {
          nodes: [nodeId],
        });

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }

  private handleUpdateNode(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'UPDATE_NODE') return undefined;

    const nodeId = step.nodeId;
    const nodeLabel = this.formatNode(nodeId);
    const label = step.attrs.label;

    if (label && typeof label === 'string') {
      // Парсим цвет из label, если он там есть
      const colorMatch = label.match(/\(цвет (\d+)\)/);
      if (colorMatch) {
        const colorIndex = colorMatch[1];
        return this.createExplanation(
          'update',
          `Вершине ${nodeLabel} присвоен цвет ${colorIndex}`,
          { nodes: [nodeId], values: { colorIndex } }
        );
      }

      // Общее обновление
      if (step.description) {
        return this.createExplanation('update', step.description, context);
      }
    }

    if (step.description) {
      return this.createExplanation('update', step.description, context);
    }

    return undefined;
  }
}
