/**
 * Генератор пояснений для Венгерского алгоритма
 */

import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class HungarianExplanationGenerator extends ExplanationGenerator {
  generateExplanation(
    step: Step,
    algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined {
    switch (step.type) {
      case 'HIGHLIGHT_NODE':
        return this.handleHighlightNode(step, context);
      case 'HIGHLIGHT_EDGE':
        return this.handleHighlightEdge(step, context);
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

    switch (state) {
      case 'current':
        return this.createExplanation('general', `Обрабатываем строку/столбец ${nodeLabel}`, {
          nodes: [nodeId],
        });

      case 'path':
        return this.createExplanation('selection', `Назначение: строка ${nodeLabel}`, {
          nodes: [nodeId],
        });

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }

  private handleHighlightEdge(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'HIGHLIGHT_EDGE') return undefined;

    const edgeId = step.edgeId;
    const state = step.state;

    const from = context?.edgeFrom as string | undefined;
    const to = context?.edgeTo as string | undefined;
    const cost = context?.cost as number | undefined;
    const row = context?.matrixRow as number | undefined;
    const col = context?.matrixCol as number | undefined;

    if (!from || !to) {
      if (step.description) {
        return this.createExplanation('general', step.description, context);
      }
      return undefined;
    }

    const fromLabel = this.formatNode(from);
    const toLabel = this.formatNode(to);
    const costStr = cost !== undefined ? cost.toString() : '?';

    switch (state) {
      case 'active':
        if (row !== undefined && col !== undefined) {
          return this.createExplanation(
            'matrix',
            `По формуле c[${row}][${col}] - u[${row}] - v[${col}] рассматриваем элемент (${row}, ${col}) = ${costStr}`,
            {
              edges: [edgeId],
              values: { row: row.toString(), col: col.toString(), cost: costStr },
              matrix: { row, col },
              formula: 'c[i][j] - u[i] - v[j]',
            }
          );
        }
        return this.createExplanation(
          'general',
          `Рассматриваем назначение: ${fromLabel} → ${toLabel} (стоимость: ${costStr})`,
          { edges: [edgeId], values: { cost: costStr } }
        );

      case 'path':
        return this.createExplanation(
          'selection',
          `Выбрано назначение: ${fromLabel} → ${toLabel} (стоимость: ${costStr})`,
          { edges: [edgeId], values: { cost: costStr } }
        );

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }
}
