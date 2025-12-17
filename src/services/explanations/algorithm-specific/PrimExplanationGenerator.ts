/**
 * Генератор пояснений для алгоритма Prim
 */

import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class PrimExplanationGenerator extends ExplanationGenerator {
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
        const mstNodeFormula = `MST = MST ∪ {${nodeLabel}}`;
        return this.createExplanation(
          'selection',
          `Добавлена вершина ${nodeLabel} в минимальное остовное дерево (MST)\nФормула: ${mstNodeFormula}`,
          { nodes: [nodeId], formula: mstNodeFormula }
        );

      case 'path':
        return this.createExplanation('general', `Вершина ${nodeLabel} в MST`, { nodes: [nodeId] });

      case 'rejected':
        return this.createExplanation(
          'decision',
          `Граф несвязный: построено MST только для доступной компоненты`,
          { nodes: [nodeId] }
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
      case 'active':
        const selectionFormula = `w(${fromLabel},${toLabel}) = ${weightStr} = min(w(ребра-кандидаты))`;
        return this.createExplanation(
          'selection',
          `Выбрано ребро ${edgeStr} с минимальным весом ${weightStr}\nФормула выбора: ${selectionFormula}`,
          { edges: [edgeId], values: { weight: weightStr }, formula: selectionFormula }
        );

      case 'candidate':
        const candidateWeight = weightStr;
        return this.createExplanation(
          'general',
          `Ребро ${edgeStr} — кандидат с весом ${candidateWeight}`,
          { edges: [edgeId], values: { weight: candidateWeight } }
        );

      case 'path':
        const mstFormula = `MST = MST ∪ {(${fromLabel},${toLabel})}, вес = ${weightStr}`;
        return this.createExplanation(
          'selection',
          `Ребро ${edgeStr} добавлено в MST с весом ${weightStr}\nФормула: ${mstFormula}`,
          { edges: [edgeId], values: { weight: weightStr }, formula: mstFormula }
        );

      case 'rejected':
        return this.createExplanation(
          'decision',
          `Ребро ${edgeStr} больше не расширяет MST и пропускается`,
          { edges: [edgeId] }
        );

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }
}
