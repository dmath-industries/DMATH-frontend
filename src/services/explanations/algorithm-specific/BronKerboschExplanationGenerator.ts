/**
 * Генератор пояснений для алгоритма Bron-Kerbosch
 */

import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class BronKerboschExplanationGenerator extends ExplanationGenerator {
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
        const rSet = context?.rSet as string[] | undefined;
        if (rSet && rSet.length > 0) {
          const rStr = this.formatSet(rSet);
          return this.createExplanation('general', `Текущее множество R (клика): ${rStr}`, {
            nodes: rSet,
            values: { set: rStr },
          });
        }
        return this.createExplanation('general', `Обрабатываем вершину ${nodeLabel}`, {
          nodes: [nodeId],
        });

      case 'active':
        const rSetActive = context?.rSet as string[] | undefined;
        if (rSetActive) {
          const rStr = this.formatSet(rSetActive);
          return this.createExplanation(
            'selection',
            `Добавлена вершина ${nodeLabel} в R: ${rStr}`,
            { nodes: [nodeId], values: { set: rStr } }
          );
        }
        return this.createExplanation('selection', `Добавлена вершина ${nodeLabel} в множество R`, {
          nodes: [nodeId],
        });

      case 'path':
        const clique = context?.clique as string[] | undefined;
        if (clique && clique.length > 0) {
          const cliqueStr = this.formatSet(clique);
          return this.createExplanation(
            'selection',
            `Найдена максимальная клика: ${cliqueStr}, вершина ${nodeLabel} в клике`,
            { nodes: clique, values: { clique: cliqueStr } }
          );
        }
        return this.createExplanation('selection', `Вершина ${nodeLabel} в максимальной клике`, {
          nodes: [nodeId],
        });

      case 'visited':
        const xSet = context?.xSet as string[] | undefined;
        if (xSet) {
          const xStr = this.formatSet(xSet);
          return this.createExplanation(
            'decision',
            `Перенос вершины ${nodeLabel} в X (исключенные): ${xStr}`,
            { nodes: [nodeId], values: { set: xStr } }
          );
        }
        return this.createExplanation('decision', `Перенос вершины ${nodeLabel} в множество X`, {
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

    if (!from || !to) {
      if (step.description) {
        return this.createExplanation('general', step.description, context);
      }
      return undefined;
    }

    const fromLabel = this.formatNode(from);
    const toLabel = this.formatNode(to);
    const edgeStr = this.formatEdge(from, to, false);

    switch (state) {
      case 'path':
        return this.createExplanation('path', `Ребро ${edgeStr} в максимальной клике`, {
          edges: [edgeId],
        });

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }

  private formatSet(set: string[]): string {
    return `{${set.map(id => this.formatNode(id)).join(', ')}}`;
  }
}
