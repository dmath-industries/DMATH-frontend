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
          return this.createExplanation(
            'general',
            `Текущее множество R (растущая клика)`,
            { nodes: rSet, values: { set: rStr } },
            {
              reason: `Множество R содержит текущую растущую клику - множество вершин, где каждая пара соединена. Алгоритм пытается расширить это множество, добавляя новые вершины, которые соединены со всеми вершинами в R`,
              currentPath: `Текущая клика R: ${rStr}`,
            }
          );
        }
        return this.createExplanation(
          'general',
          `Обрабатываем вершину ${nodeLabel}`,
          { nodes: [nodeId] },
          {
            reason: `Алгоритм Bron-Kerbosch использует backtracking для систематического перебора всех возможных клик, начиная с каждой вершины`,
          }
        );

      case 'active':
        const rSetActive = context?.rSet as string[] | undefined;
        const neighbors = context?.neighbors as string[] | undefined;
        if (rSetActive) {
          const rStr = this.formatSet(rSetActive);
          const neighborsInR = neighbors?.filter(n => rSetActive.includes(n)).length || 0;
          return this.createExplanation(
            'selection',
            `Добавлена вершина ${nodeLabel} в множество R (текущая клика)`,
            { nodes: [nodeId], values: { set: rStr } },
            {
              reason: `Принцип расширения клики: вершина ${nodeLabel} добавляется в R, если она соединена со всеми вершинами текущего множества R (${neighborsInR} из ${rSetActive.length} соединены). Клика - это множество вершин, где каждая пара вершин соединена ребром`,
              currentPath: `Текущая клика R: ${rStr}`,
            }
          );
        }
        return this.createExplanation(
          'selection',
          `Добавлена вершина ${nodeLabel} в множество R (текущая клика)`,
          { nodes: [nodeId] },
          {
            reason: `Вершина ${nodeLabel} добавляется в текущую клику R, так как она соединена со всеми вершинами уже находящимися в R`,
          }
        );

      case 'path':
        const clique = context?.clique as string[] | undefined;
        if (clique && clique.length > 0) {
          const cliqueStr = this.formatSet(clique);
          return this.createExplanation(
            'selection',
            `Найдена максимальная клика, содержащая вершину ${nodeLabel}`,
            { nodes: clique, values: { clique: cliqueStr } },
            {
              reason: `Клика ${cliqueStr} является максимальной, так как она не может быть расширена - нет вершин, соединённых со всеми вершинами этой клики. Алгоритм Bron-Kerbosch находит все такие максимальные клики используя backtracking`,
              currentPath: `Максимальная клика: ${cliqueStr}`,
            }
          );
        }
        return this.createExplanation(
          'selection',
          `Вершина ${nodeLabel} в максимальной клике`,
          { nodes: [nodeId] },
          {
            reason: `Эта вершина является частью найденной максимальной клики - полного подграфа, который нельзя расширить`,
          }
        );

      case 'visited':
        const xSet = context?.xSet as string[] | undefined;
        if (xSet) {
          const xStr = this.formatSet(xSet);
          return this.createExplanation(
            'decision',
            `Перенос вершины ${nodeLabel} в множество X (исключённые)`,
            { nodes: [nodeId], values: { set: xStr } },
            {
              reason: `Принцип backtracking алгоритма Bron-Kerbosch: после исследования всех клик, содержащих вершину ${nodeLabel}, она переносится в X, чтобы исключить её из дальнейших поисков и избежать дублирования результатов`,
              currentPath: `Исключённые вершины X: ${xStr}`,
            }
          );
        }
        return this.createExplanation(
          'decision',
          `Перенос вершины ${nodeLabel} в множество X`,
          { nodes: [nodeId] },
          {
            reason: `Вершина ${nodeLabel} переносится в множество исключённых вершин X после полного исследования всех клик с её участием. Это предотвращает повторную обработку и гарантирует нахождение всех максимальных клик`,
          }
        );

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
        return this.createExplanation(
          'path',
          `Ребро ${edgeStr} в максимальной клике`,
          { edges: [edgeId] },
          {
            reason: `Это ребро соединяет две вершины максимальной клики. В клике каждая пара вершин должна быть соединена ребром - это определение полного подграфа`,
          }
        );

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
