import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class BellmanFordExplanationGenerator extends ExplanationGenerator {
  generateExplanation(
    step: Step,
    _algorithmName: string,
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

    if (label && typeof label === 'string') {
      if (label.includes(': ∞') || label.includes(': 0')) {
        const value = label.includes('∞') ? '∞' : '0';
        const nodeLabel = this.formatNode(nodeId);
        const formula = `d(${nodeLabel}) = ${value === '∞' ? '∞' : '0'}`;
        const isStart = value === '0';
        return this.createExplanation(
          'general',
          `Инициализация расстояния до вершины ${nodeLabel}`,
          { nodes: [nodeId], values: { distance: value } },
          {
            reason: isStart
              ? `Стартовая вершина имеет расстояние 0, так как путь от неё до неё самой равен нулю. Это база для алгоритма поиска кратчайших путей`
              : `Начальное расстояние до всех остальных вершин устанавливается в бесконечность (∞), так как мы ещё не знаем, достижимы ли они и каков кратчайший путь`,
            formula: formula,
          }
        );
      }

      if (label.includes(':')) {
        const nodeLabel = this.formatNode(nodeId);
        const distance = label.split(':')[1]?.trim();
        const formula = `d(${nodeLabel}) = ${distance}`;
        return this.createExplanation(
          'update',
          `Расстояние до вершины ${nodeLabel} обновлено`,
          {
            nodes: [nodeId],
            values: { distance: distance || 'unknown' },
          },
          {
            reason: `В результате релаксации рёбер найдено более короткое расстояние до вершины ${nodeLabel}. Это значение может быть улучшено в следующих итерациях алгоритма`,
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
        if (context?.isStartNode) {
          const formula = `d(${nodeLabel}) = 0`;
          return this.createExplanation(
            'general',
            `Стартовая вершина: ${nodeLabel}`,
            { nodes: [nodeId] },
            {
              reason: `Стартовая вершина имеет расстояние 0, так как путь от неё до неё самой равен нулю. Все расстояния будут вычисляться относительно этой вершины`,
              formula: formula,
            }
          );
        }
        return this.createExplanation('general', `Текущая вершина: ${nodeLabel}`, {
          nodes: [nodeId],
        });

      case 'path':
        const pathInfo = context?.path as string[] | undefined;
        if (pathInfo && pathInfo.length > 0) {
          const pathStr = this.formatPath(pathInfo);
          const dist = context?.distance as number | undefined;
          const distStr = dist !== undefined ? this.formatDistance(dist) : '?';
          return this.createExplanation(
            'path',
            `Вершина ${nodeLabel} в кратчайшем пути`,
            { nodes: [nodeId], values: { distance: distStr, path: pathStr } },
            {
              reason: `Эта вершина является частью найденного кратчайшего пути от стартовой вершины. Расстояние ${distStr} является минимальным среди всех возможных путей`,
              currentPath: `Путь: ${pathStr}`,
            }
          );
        }
        return this.createExplanation('path', `Вершина ${nodeLabel} в кратчайшем пути`, {
          nodes: [nodeId],
        });

      case 'rejected':
        return this.createExplanation(
          'decision',
          `Вершина ${nodeLabel} в отрицательном цикле`,
          { nodes: [nodeId] },
          {
            reason: `Обнаружен отрицательный цикл, содержащий вершину ${nodeLabel}. Это означает, что кратчайший путь не существует, так как можно бесконечно уменьшать расстояние, проходя по циклу. Алгоритм Беллмана-Форда не может корректно работать с графами, содержащими отрицательные циклы`,
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
    const edgeStr = this.formatEdge(from, to, true);

    switch (state) {
      case 'active':
        const distFrom = context?.distanceFrom as number | undefined;
        const distTo = context?.distanceTo as number | undefined;

        if (distFrom !== undefined && distTo !== undefined && weight !== undefined) {
          const distFromStr = this.formatDistance(distFrom);
          const distToStr = this.formatDistance(distTo);
          const sum = distFrom + weight;
          const sumStr = this.formatDistance(sum);

          if (distFrom !== Infinity && sum < distTo) {
            const formulas = [
              `d(${toLabel}) = \\min(d(${toLabel}), d(${fromLabel}) + w(${fromLabel}, ${toLabel}))`,
              `= \\min(${distToStr}, ${distFromStr} + ${weightStr})`,
              `= ${sumStr}`,
            ];
            return this.createExplanation(
              'comparison',
              `Обновляем расстояние до вершины ${toLabel} через вершину ${fromLabel}`,
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
              },
              {
                reason: `Принцип релаксации (relaxation): если найден более короткий путь до вершины ${toLabel} через вершину ${fromLabel} (${distFromStr} + ${weightStr} = ${sumStr} < ${distToStr}), то обновляем расстояние. Это основа алгоритма Беллмана-Форда - многократная проверка всех рёбер для поиска кратчайших путей`,
                formula: formulas,
              }
            );
          } else {
            const formulas = [
              `d(${fromLabel}) + w(${fromLabel}, ${toLabel}) = ${distFromStr} + ${weightStr} = ${sumStr}`,
              `\\geq d(${toLabel}) = ${distToStr}`,
            ];
            return this.createExplanation(
              'comparison',
              `Релаксация не требуется для ребра ${edgeStr}`,
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
              },
              {
                reason: `Путь через вершину ${fromLabel} не короче текущего расстояния до ${toLabel}. Текущее расстояние ${distToStr} уже оптимально или меньше, чем ${sumStr}`,
                formula: formulas,
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
          { edges: [edgeId] },
          {
            reason: `Обнаружено ребро, которое позволяет ещё уменьшить расстояние после ${(context as any)?.iterations || 'последней'} итерации. Это признак отрицательного цикла - кратчайший путь не существует`,
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
