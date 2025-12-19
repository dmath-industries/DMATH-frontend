import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class PrimExplanationGenerator extends ExplanationGenerator {
  generateExplanation(
    step: Step,
    _algorithmName: string,
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
        const mstNodeFormula = `\\text{MST} = \\text{MST} \\cup \\{${nodeLabel}\\}`;
        return this.createExplanation(
          'selection',
          `Добавлена вершина ${nodeLabel} в минимальное остовное дерево (MST)`,
          { nodes: [nodeId] },
          {
            reason: `Вершина ${nodeLabel} добавляется в MST через выбранное минимальное ребро. Это основа жадного алгоритма Прима - на каждом шаге выбираем ближайшую к уже построенной части MST вершину`,
            formula: mstNodeFormula,
          }
        );

      case 'path':
        return this.createExplanation(
          'general',
          `Вершина ${nodeLabel} в MST`,
          { nodes: [nodeId] },
          {
            reason: `Вершина ${nodeLabel} уже добавлена в минимальное остовное дерево и является частью текущего решения`,
          }
        );

      case 'rejected':
        return this.createExplanation(
          'decision',
          `Граф несвязный: построено MST только для доступной компоненты`,
          { nodes: [nodeId] },
          {
            reason: `Граф содержит несколько компонент связности. Алгоритм Прима может построить MST только для одной компоненты (той, где находится стартовая вершина). Для других компонент требуется запустить алгоритм отдельно`,
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
    const weight = context?.edgeWeight as number | undefined;

    if (!from || !to) {
      if (step.description) {
        return this.createExplanation('general', step.description, context);
      }
      return undefined;
    }

    const fromLabel = this.formatNode(from);
    const toLabel = this.formatNode(to);
    const weightStr = weight !== undefined ? this.formatWeight(weight) : '?';
    const edgeStr = this.formatEdge(from, to, false);

    switch (state) {
      case 'active': {
        const selectionFormulas = [
          `w(${fromLabel}, ${toLabel}) = ${weightStr}`,
          `= \\min(w(\\text{ребра-кандидаты}))`,
        ];
        return this.createExplanation(
          'selection',
          `Выбрано ребро ${edgeStr} с минимальным весом ${weightStr}`,
          { edges: [edgeId], values: { weight: weightStr } },
          {
            reason: `Жадный принцип алгоритма Прима: выбираем ребро с минимальным весом среди всех рёбер, соединяющих уже построенную часть MST с непосещёнными вершинами. Это гарантирует, что в итоге получим минимальное остовное дерево, так как каждое добавленное ребро является локально оптимальным выбором`,
            formula: selectionFormulas,
          }
        );
      }

      case 'candidate':
        const candidateWeight = weightStr;
        return this.createExplanation(
          'general',
          `Ребро ${edgeStr} — кандидат для добавления в MST`,
          { edges: [edgeId], values: { weight: candidateWeight } },
          {
            reason: `Это ребро соединяет уже построенную часть MST с непосещённой вершиной. Оно будет рассмотрено при выборе следующего минимального ребра для расширения дерева`,
          }
        );

      case 'path': {
        const mstFormulas = [
          `\\text{MST} = \\text{MST} \\cup \\{(${fromLabel}, ${toLabel})\\}`,
          `\\text{вес} = ${weightStr}`,
        ];
        return this.createExplanation(
          'selection',
          `Ребро ${edgeStr} добавлено в MST с весом ${weightStr}`,
          { edges: [edgeId], values: { weight: weightStr } },
          {
            reason: `Ребро ${edgeStr} добавляется в MST, так как оно имеет минимальный вес среди всех рёбер, соединяющих текущее MST с новыми вершинами. Это расширяет дерево, добавляя ближайшую непосещённую вершину`,
            formula: mstFormulas,
          }
        );
      }

      case 'rejected':
        return this.createExplanation(
          'decision',
          `Ребро ${edgeStr} пропускается`,
          { edges: [edgeId] },
          {
            reason: `Это ребро больше не расширяет MST, так как обе его вершины уже находятся в построенном дереве. Добавление такого ребра создало бы цикл, что нарушает свойство дерева`,
          }
        );

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }
}
