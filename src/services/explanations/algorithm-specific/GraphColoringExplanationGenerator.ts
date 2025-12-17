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
          const neighbors = context?.neighbors as string[] | undefined;
          const usedColors = context?.usedColors as number[] | undefined;
          const neighborsInfo = neighbors && neighbors.length > 0 
            ? `Соседи: ${neighbors.map(n => this.formatNode(n)).join(', ')}`
            : 'Нет соседей';
          return this.createExplanation(
            'update',
            `Вершине ${nodeLabel} присвоен цвет ${colorName}`,
            { nodes: [nodeId], values: { color: colorName, colorIndex: (color + 1).toString() } },
            {
              reason: `Принцип раскраски графа: вершине ${nodeLabel} присваивается минимальный цвет, который ещё не используется её соседями. Это гарантирует, что соседние вершины всегда имеют разные цвета. ${neighborsInfo}. ${usedColors && usedColors.length > 0 ? `Использованные соседями цвета: ${usedColors.map(c => c + 1).join(', ')}` : 'Все цвета доступны'}`,
            }
          );
        }
        return this.createExplanation(
          'general',
          `Обрабатываем вершину ${nodeLabel}`,
          { nodes: [nodeId] },
          {
            reason: `Алгоритм последовательно обрабатывает вершины графа, присваивая каждой вершине цвет, отличный от цветов всех её соседей. Это гарантирует правильную раскраску графа`,
          }
        );

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
        const neighbors = context?.neighbors as string[] | undefined;
        return this.createExplanation(
          'update',
          `Вершине ${nodeLabel} присвоен цвет ${colorIndex}`,
          { nodes: [nodeId], values: { colorIndex } },
          {
            reason: `Жадная стратегия раскраски: выбираем минимальный доступный цвет (цвет ${colorIndex}), который не конфликтует с цветами соседних вершин${neighbors && neighbors.length > 0 ? ` (${neighbors.map(n => this.formatNode(n)).join(', ')})` : ''}. Это позволяет минимизировать количество используемых цветов`,
          }
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
