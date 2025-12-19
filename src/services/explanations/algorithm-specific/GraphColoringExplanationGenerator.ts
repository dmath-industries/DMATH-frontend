import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

const STATE_TO_COLOR: Record<string, { name: string; index: number }> = {
  current: { name: 'Оранжевый', index: 1 },
  active: { name: 'Жёлтый', index: 2 },
  visited: { name: 'Синий', index: 3 },
  path: { name: 'Зелёный', index: 4 },
  candidate: { name: 'Фиолетовый', index: 5 },
  rejected: { name: 'Красный', index: 6 },
  default: { name: 'Белый', index: 7 },
};

export class GraphColoringExplanationGenerator extends ExplanationGenerator {
  generateExplanation(
    step: Step,
    _algorithmName: string,
    context?: AlgorithmContext
  ): StepExplanation | undefined {
    if (step.description) {
      const infoExplanation = this.handleInfoStep(step.description, step, context);
      if (infoExplanation) {
        return infoExplanation;
      }
    }

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

  private handleInfoStep(
    description: string,
    _step: Step,
    context?: AlgorithmContext
  ): StepExplanation | undefined {
    const desc = description.trim();

    const stepMatch = desc.match(/^Шаг (\d+)$/);
    if (stepMatch) {
      const stepNum = parseInt(stepMatch[1]!, 10);
      const colorName = this.getColorName(stepNum);
      const formula = `k = ${stepNum}`;

      return this.createExplanation(
        'iteration',
        `Итерация ${stepNum}: начинаем раскраску вершин ${colorName} цветом (цвет ${stepNum})`,
        context,
        {
          reason: `Эвристический алгоритм раскраски: на каждой итерации выбираем множество независимых вершин (не смежных друг с другом) и раскрашиваем их одним цветом. Это позволяет минимизировать количество используемых цветов. На шаге ${stepNum} мы формируем множество вершин для ${colorName} цвета.`,
          formula: formula,
        }
      );
    }

    if (desc.startsWith('Степени вершин:')) {
      const lines = desc.split('\n').filter(line => line.trim());
      const degrees: Array<{ node: string; degree: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!.trim();
        const match = line.match(/^([a-z]):\s*(.+)$/);
        if (match) {
          degrees.push({ node: match[1]!, degree: match[2]! });
        }
      }

      const degreesList = degrees
        .filter(d => d.degree !== '-')
        .map(d => `${d.node}: ${d.degree}`)
        .join(', ');
      const formula = `\\deg(v) = |\\{u : (v, u) \\in E\\}|`;

      return this.createExplanation(
        'comparison',
        `Вычисляем степени вершин: ${degreesList || 'все вершины уже раскрашены'}`,
        context,
        {
          reason: `Степень вершины — это количество рёбер, инцидентных этой вершине. Вершины с большей степенью имеют больше соседей, поэтому их раскраска может быть более ограничивающей. Алгоритм использует степени для выбора вершин с максимальной степенью, что помогает эффективно формировать независимые множества.`,
          formula: formula,
        }
      );
    }

    if (desc.startsWith('Таблица векторов')) {
      const lines = desc.split('\n').filter(line => line.trim());
      const stepMatch = desc.match(/Шаг (\d+)/);
      const stepNum = stepMatch ? parseInt(stepMatch[1]!, 10) : 0;

      let verticesSet = '';
      let vectorStr = '';

      for (const line of lines) {
        if (line.includes('Множество вершин:')) {
          verticesSet = line.replace(/.*Множество вершин:\s*/, '').trim();
        } else if (line.includes('Вектор:')) {
          vectorStr = line
            .replace(/.*Вектор:\s*\[/, '')
            .replace(/\]$/, '')
            .trim();
        }
      }

      const verticesList = verticesSet ? `{${verticesSet}}` : '{}';
      const formula = `V_k = \\{v : v \\text{ не смежна с вершинами из } V_{k-1}\\}`;

      return this.createExplanation(
        'matrix',
        `Построение множества вершин для цвета ${stepNum}: ${verticesList}`,
        context,
        {
          reason: `Вектор доступности показывает, какие вершины можно добавить в текущее множество для раскраски одним цветом. Значение 0 означает доступную вершину (не смежную с уже выбранными), 1 — недоступную (смежную с уже выбранными), -1 — уже выбранную вершину. Алгоритм последовательно добавляет вершины с максимальной степенью в независимое множество.`,
          formula: formula,
        }
      );
    }

    const chromaticMatch = desc.match(/^Хроматическое число графа:\s*(\d+)$/);
    if (chromaticMatch) {
      const chromaticNumber = parseInt(chromaticMatch[1]!, 10);
      const formula = `\\chi(G) = ${chromaticNumber}`;

      return this.createExplanation(
        'general',
        `Хроматическое число графа: ${chromaticNumber}`,
        context,
        {
          reason: `Хроматическое число графа — это минимальное количество цветов, необходимое для правильной раскраски всех вершин так, чтобы никакие две смежные вершины не имели одинаковый цвет. Эвристический алгоритм нашёл раскраску, использующую ${chromaticNumber} цвет${chromaticNumber > 1 ? 'ов' : ''}. Это может быть не оптимальное значение, но алгоритм стремится минимизировать количество используемых цветов.`,
          formula: formula,
        }
      );
    }

    return undefined;
  }

  private handleHighlightNode(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'HIGHLIGHT_NODE') return undefined;

    const nodeId = step.nodeId;
    const state = step.state;
    const nodeLabel = this.formatNode(nodeId);
    const description = step.description || '';

    const colorMatch = description.match(/Вершина ([a-z]) получает (.+?) \(цвет (\d+)\)/);
    if (colorMatch) {
      const vertexLabel = colorMatch[1]!;
      const colorName = colorMatch[2]!;
      const colorIndex = parseInt(colorMatch[3]!, 10);

      const neighbors = context?.neighbors as string[] | undefined;
      const neighborsStr =
        neighbors && neighbors.length > 0
          ? neighbors.map(n => this.formatNode(n)).join(', ')
          : 'нет соседей';

      const formula = `\\text{color}(${vertexLabel}) = ${colorIndex}`;

      return this.createExplanation(
        'update',
        `Вершине ${vertexLabel} присвоен ${colorName} цвет (цвет ${colorIndex})`,
        {
          nodes: [nodeId],
          values: {
            color: colorName,
            colorIndex: colorIndex.toString(),
            neighbors: neighborsStr,
          },
        },
        {
          reason: `Эвристический алгоритм раскраски: вершина ${vertexLabel} добавляется в множество вершин для цвета ${colorIndex}, так как она не смежна с другими вершинами этого множества. Все вершины одного цвета образуют независимое множество (не содержат смежных вершин). Соседи вершины ${vertexLabel}: ${neighborsStr}.`,
          formula: formula,
        }
      );
    }

    const finalMatch = description.match(/Финальная раскраска:\s*([a-z])\s*-\s*(.+)$/);
    if (finalMatch) {
      const vertexLabel = finalMatch[1]!;
      const colorName = finalMatch[2]!;
      const colorInfo = STATE_TO_COLOR[state];
      const colorIndex = colorInfo ? colorInfo.index : this.getColorIndexByName(colorName);

      return this.createExplanation(
        'path',
        `Финальная раскраска: вершина ${vertexLabel} имеет ${colorName} цвет`,
        {
          nodes: [nodeId],
          values: {
            color: colorName,
            colorIndex: colorIndex.toString(),
          },
        },
        {
          reason: `Раскраска завершена. Вершина ${vertexLabel} получила ${colorName} цвет (цвет ${colorIndex}) и не конфликтует со своими соседями. Все вершины графа правильно раскрашены минимальным количеством цветов.`,
          formula: `\\text{color}(${vertexLabel}) = ${colorIndex}`,
        }
      );
    }

    const colorInfo = STATE_TO_COLOR[state];
    if (colorInfo) {
      const formula = `\\text{color}(${nodeLabel}) = ${colorInfo.index}`;

      return this.createExplanation(
        'update',
        `Вершине ${nodeLabel} присвоен ${colorInfo.name} цвет (цвет ${colorInfo.index})`,
        {
          nodes: [nodeId],
          values: {
            color: colorInfo.name,
            colorIndex: colorInfo.index.toString(),
          },
        },
        {
          reason: `Вершина ${nodeLabel} раскрашена в ${colorInfo.name} цвет (цвет ${colorInfo.index}). Это означает, что она входит в независимое множество вершин, которые можно раскрасить одним цветом, так как они не смежны друг с другом.`,
          formula: formula,
        }
      );
    }

    if (description) {
      return this.createExplanation(
        'general',
        description,
        { nodes: [nodeId] },
        {
          reason: `Обрабатываем вершину ${nodeLabel} в процессе раскраски графа.`,
        }
      );
    }

    return this.createExplanation(
      'general',
      `Обрабатываем вершину ${nodeLabel}`,
      { nodes: [nodeId] },
      {
        reason: `Вершина ${nodeLabel} обрабатывается алгоритмом раскраски графа.`,
      }
    );
  }

  private handleUpdateNode(step: Step, context?: AlgorithmContext): StepExplanation | undefined {
    if (step.type !== 'UPDATE_NODE') return undefined;

    const nodeId = step.nodeId;
    const nodeLabel = this.formatNode(nodeId);
    const label = step.attrs?.label;

    if (label && typeof label === 'string') {
      const colorMatch = label.match(/\(цвет (\d+)\)/);
      if (colorMatch) {
        const colorIndex = parseInt(colorMatch[1]!, 10);
        const colorName = this.getColorName(colorIndex);
        const neighbors = context?.neighbors as string[] | undefined;
        const neighborsStr =
          neighbors && neighbors.length > 0
            ? neighbors.map(n => this.formatNode(n)).join(', ')
            : 'нет соседей';
        const formula = `\\text{color}(${nodeLabel}) = ${colorIndex}`;

        return this.createExplanation(
          'update',
          `Вершине ${nodeLabel} присвоен ${colorName} цвет (цвет ${colorIndex})`,
          {
            nodes: [nodeId],
            values: {
              colorIndex: colorIndex.toString(),
              color: colorName,
              neighbors: neighborsStr,
            },
          },
          {
            reason: `Жадная стратегия раскраски: выбираем минимальный доступный цвет (${colorName}, цвет ${colorIndex}), который не конфликтует с цветами соседних вершин (${neighborsStr}). Это позволяет минимизировать количество используемых цветов.`,
            formula: formula,
          }
        );
      }

      if (step.description) {
        return this.createExplanation('update', step.description, context, {
          reason: `Обновление атрибутов вершины ${nodeLabel} в процессе раскраски графа.`,
        });
      }
    }

    if (step.description) {
      return this.createExplanation('update', step.description, context, {
        reason: `Обновление вершины ${nodeLabel} в процессе раскраски графа.`,
      });
    }

    return undefined;
  }

  private getColorName(colorIndex: number): string {
    const colorNames = [
      'Оранжевый',
      'Жёлтый',
      'Синий',
      'Зелёный',
      'Фиолетовый',
      'Красный',
      'Белый',
    ];
    return colorNames[colorIndex - 1] || `Цвет ${colorIndex}`;
  }

  private getColorIndexByName(colorName: string): number {
    const colorNames = [
      'Красный',
      'Синий',
      'Зелёный',
      'Жёлтый',
      'Фиолетовый',
      'Оранжевый',
      'Розовый',
      'Голубой',
    ];
    const index = colorNames.indexOf(colorName);
    return index >= 0 ? index + 1 : 0;
  }
}
