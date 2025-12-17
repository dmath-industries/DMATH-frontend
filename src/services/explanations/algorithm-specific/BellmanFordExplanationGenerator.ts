/**
 * Генератор пояснений для алгоритма Bellman-Ford
 */

import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class BellmanFordExplanationGenerator extends ExplanationGenerator {
  generateExplanation(
    step: Step,
    algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined {
    switch (step.type) {
      case 'UPDATE_NODE':
        return this.handleUpdateNode(step, context);
      case 'HIGHLIGHT_NODE':
        return this.handleHighlightNode(step, context);
      case 'HIGHLIGHT_EDGE':
        return this.handleHighlightEdge(step, context);
      default:
        // Используем description если есть, иначе возвращаем undefined
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }

  private handleUpdateNode(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'UPDATE_NODE') return undefined;

    const nodeId = step.nodeId;
    const label = step.attrs.label;

    // Инициализация расстояний
    if (label && typeof label === 'string') {
      if (label.includes(': ∞') || label.includes(': 0')) {
        const value = label.includes('∞') ? '∞' : '0';
        const nodeLabel = this.formatNode(nodeId);
        const formula = `d(${nodeLabel}) = ${value === '∞' ? '∞' : '0'}`;
        return this.createExplanation(
          'initialization',
          `Инициализация: расстояние до ${nodeLabel} = ${value}\nФормула: ${formula}`,
          { nodes: [nodeId], values: { distance: value }, formula: formula }
        );
      }

      // Обновление расстояния (релаксация)
      if (label.includes(':')) {
        const nodeLabel = this.formatNode(nodeId);
        const distance = label.split(':')[1]?.trim();
        const formula = `d(${nodeLabel}) = ${distance}`;
        return this.createExplanation(
          'update',
          `Обновление расстояния до ${nodeLabel}: новое значение = ${distance}\nФормула: ${formula}`,
          {
            nodes: [nodeId],
            values: { distance: distance || 'unknown' },
            formula: formula,
          }
        );
      }
    }

    if (step.description) {
      return this.createExplanation('update', step.description, context);
    }

    return undefined;
  }

  private handleHighlightNode(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'HIGHLIGHT_NODE') return undefined;

    const nodeId = step.nodeId;
    const state = step.state;
    const nodeLabel = this.formatNode(nodeId);

    switch (state) {
      case 'current':
        // Стартовая вершина или текущая вершина при релаксации
        if (context?.isStartNode) {
          const formula = `d(${nodeLabel}) = 0`;
          return this.createExplanation(
            'initialization',
            `Стартовая вершина: ${nodeLabel}\nФормула инициализации: ${formula}`,
            { nodes: [nodeId], formula: formula }
          );
        }
        return this.createExplanation('general', `Текущая вершина: ${nodeLabel}`, {
          nodes: [nodeId],
        });

      case 'path':
        // Вершина в кратчайшем пути
        const pathInfo = context?.path as string[] | undefined;
        if (pathInfo && pathInfo.length > 0) {
          const pathStr = this.formatPath(pathInfo);
          const dist = context?.distance as number | undefined;
          const distStr = dist !== undefined ? this.formatDistance(dist) : '?';
          return this.createExplanation(
            'path',
            `Вершина ${nodeLabel} в кратчайшем пути: расстояние = ${distStr}, путь: ${pathStr}`,
            { nodes: [nodeId], values: { distance: distStr, path: pathStr } }
          );
        }
        return this.createExplanation('path', `Вершина ${nodeLabel} в кратчайшем пути`, {
          nodes: [nodeId],
        });

      case 'rejected':
        return this.createExplanation('decision', `Вершина ${nodeLabel} в отрицательном цикле`, {
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

    // Получаем информацию о ребре из контекста
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
    const edgeStr = this.formatEdge(from, to, true);

    switch (state) {
      case 'active':
        // Проверка ребра
        const distFrom = context?.distanceFrom as number | undefined;
        const distTo = context?.distanceTo as number | undefined;

        if (distFrom !== undefined && distTo !== undefined && weight !== undefined) {
          const distFromStr = this.formatDistance(distFrom);
          const distToStr = this.formatDistance(distTo);
          const sum = distFrom + weight;
          const sumStr = this.formatDistance(sum);

          if (distFrom !== Infinity && sum < distTo) {
            const formula = `d(${toLabel}) = min(d(${toLabel}), d(${fromLabel}) + w(${fromLabel},${toLabel})) = min(${distToStr}, ${distFromStr} + ${weightStr}) = ${sumStr}`;
            return this.createExplanation(
              'comparison',
              `Проверка ребра ${edgeStr} (вес: ${weightStr}):\n${formula}\nСледовательно, обновляем расстояние d(${toLabel}) = ${sumStr}`,
              {
                edges: [edgeId],
                values: {
                  from: fromLabel,
                  to: toLabel,
                  weight: weightStr,
                  distFrom: distFromStr,
                  distTo: distToStr,
                  sum: sumStr,
                },
                formula: formula,
              }
            );
          } else {
            const formula = `d(${fromLabel}) + w(${fromLabel},${toLabel}) = ${distFromStr} + ${weightStr} = ${sumStr} ≥ d(${toLabel}) = ${distToStr}`;
            return this.createExplanation(
              'comparison',
              `Проверка ребра ${edgeStr} (вес: ${weightStr}):\n${formula}\nРелаксация не требуется`,
              {
                edges: [edgeId],
                values: {
                  from: fromLabel,
                  to: toLabel,
                  weight: weightStr,
                  distFrom: distFromStr,
                  distTo: distToStr,
                  sum: sumStr,
                },
                formula: formula,
              }
            );
          }
        }

        return this.createExplanation('general', `Проверка ребра ${edgeStr} (вес: ${weightStr})`, {
          edges: [edgeId],
          values: { weight: weightStr },
        });

      case 'path':
        return this.createExplanation('path', `Ребро ${edgeStr} в кратчайшем пути`, {
          edges: [edgeId],
        });

      case 'rejected':
        return this.createExplanation(
          'decision',
          `Ребро ${edgeStr} указывает на отрицательный цикл`,
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
