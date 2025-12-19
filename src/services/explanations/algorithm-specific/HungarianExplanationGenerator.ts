import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class HungarianExplanationGenerator extends ExplanationGenerator {
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

    const nodeLabel = (context?.nodeLabel as string | undefined) || this.formatNode(nodeId);
    const rowIndex = context?.rowIndex as number | undefined;
    const colIndex = context?.colIndex as number | undefined;
    const minValue = context?.minValue as number | undefined;
    const maxValue = context?.maxValue as number | undefined;

    switch (state) {
      case 'current':
        let formulas: string[] = [];
        let reason = `Венгерский алгоритм последовательно обрабатывает строки и столбцы матрицы, выполняя приведение матрицы (вычитание минимумов) и поиск полного паросочетания в графе назначений`;

        if (rowIndex !== undefined && minValue !== undefined) {
          formulas = [
            `\\min_{j} c[${rowIndex}][j] = ${minValue}`,
            `u[${rowIndex}] = ${minValue}`,
            `c'[${rowIndex}][j] = c[${rowIndex}][j] - u[${rowIndex}]`,
          ];
          reason = `Для строки ${nodeLabel} (индекс ${rowIndex}) находим минимальный элемент и вычитаем его из всех элементов строки. Это приведение строки, которое не изменяет оптимальность решения, но упрощает поиск назначений`;
        } else if (colIndex !== undefined && minValue !== undefined) {
          formulas = [
            `\\min_{i} c[i][${colIndex}] = ${minValue}`,
            `v[${colIndex}] = ${minValue}`,
            `c'[i][${colIndex}] = c[i][${colIndex}] - v[${colIndex}]`,
          ];
          reason = `Для столбца ${nodeLabel} (индекс ${colIndex}) находим минимальный элемент и вычитаем его из всех элементов столбца. Это приведение столбца, которое не изменяет оптимальность решения`;
        } else if (minValue !== undefined) {
          formulas = [
            `\\min = ${minValue}`,
            `Приведение матрицы: вычитаем минимум из строк/столбцов`,
          ];
        }

        return this.createExplanation(
          'general',
          `Обрабатываем строку/столбец ${nodeLabel}`,
          { nodes: [nodeId] },
          {
            reason,
            formula: formulas.length > 0 ? formulas : undefined,
          }
        );

      case 'path':
        return this.createExplanation(
          'selection',
          `Назначение: строка ${nodeLabel}`,
          { nodes: [nodeId] },
          {
            reason: `Строка ${nodeLabel} включена в текущее частичное назначение. Алгоритм строит паросочетание (назначения), где каждая строка и каждый столбец используются ровно один раз. Математически это соответствует поиску полного паросочетания минимальной стоимости в двудольном графе`,
            formula: `\\text{Назначение}: \\sum_{i,j \\in M} c[i][j] \\to \\min`,
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
    const cost = context?.cost as number | undefined;
    const row = context?.matrixRow as number | undefined;
    const col = context?.matrixCol as number | undefined;
    const uValue = context?.uValue as number | undefined;
    const vValue = context?.vValue as number | undefined;
    const reducedCost = context?.reducedCost as number | undefined;

    const fromLabel =
      (context?.edgeFromLabel as string | undefined) || (from ? this.formatNode(from) : '?');
    const toLabel =
      (context?.edgeToLabel as string | undefined) || (to ? this.formatNode(to) : '?');
    const costStr = cost !== undefined ? cost.toString() : '?';

    if (!from || !to) {
      if (step.description) {
        return this.createExplanation('general', step.description, context);
      }
      return undefined;
    }

    switch (state) {
      case 'active':
        if (row !== undefined && col !== undefined) {
          const formulas: string[] = [];

          if (uValue !== undefined && vValue !== undefined && reducedCost !== undefined) {
            formulas.push(
              `c'[${row}][${col}] = c[${row}][${col}] - u[${row}] - v[${col}]`,
              `= ${costStr} - ${uValue} - ${vValue} = ${reducedCost}`
            );
          } else if (uValue !== undefined && vValue !== undefined) {
            formulas.push(
              `c'[${row}][${col}] = c[${row}][${col}] - u[${row}] - v[${col}]`,
              `= ${costStr} - ${uValue} - ${vValue}`
            );
          } else {
            formulas.push(`c'[${row}][${col}] = c[${row}][${col}] - u[${row}] - v[${col}]`);
          }

          return this.createExplanation(
            'matrix',
            `Рассматриваем элемент матрицы (${row}, ${col})`,
            {
              edges: [edgeId],
              values: { row: row.toString(), col: col.toString(), cost: costStr },
              matrix: { row, col },
            },
            {
              reason: `Венгерский алгоритм работает с приведённой матрицей стоимостей. Элементы вычисляются как c'[i][j] = c[i][j] - u[i] - v[j], где u[i] = min_j(c[i][j]) - минимум строки i, а v[j] = min_i(c'[i][j]) - минимум столбца j в приведённой матрице. Нулевые элементы в приведённой матрице соответствуют возможным оптимальным назначениям`,
              formula: formulas,
            }
          );
        }
        return this.createExplanation(
          'general',
          `Рассматриваем назначение: ${fromLabel} → ${toLabel}`,
          { edges: [edgeId], values: { cost: costStr } },
          {
            reason: `Проверяем возможность назначения строки ${fromLabel} на столбец ${toLabel} с учётом текущей приведённой матрицы стоимостей. Ищем элементы с нулевой приведённой стоимостью для построения оптимального паросочетания`,
            formula: `c'[${fromLabel}][${toLabel}] = c[${fromLabel}][${toLabel}] - u[${fromLabel}] - v[${toLabel}]`,
          }
        );

      case 'path':
        const assignmentFormulas: string[] = [];
        if (row !== undefined && col !== undefined && cost !== undefined) {
          assignmentFormulas.push(
            `c[${row}][${col}] = ${costStr}`,
            `\\text{Общая стоимость} = \\sum_{(i,j) \\in M} c[i][j]`
          );
        }

        return this.createExplanation(
          'selection',
          `Выбрано назначение: ${fromLabel} → ${toLabel}`,
          { edges: [edgeId], values: { cost: costStr } },
          {
            reason: `Это назначение соответствует нулевому элементу в приведённой матрице стоимостей (c'[i][j] = 0), что означает его оптимальность при текущих потенциалах. Назначения с нулевой приведённой стоимостью не увеличивают общую стоимость решения. Алгоритм минимизирует сумму стоимостей всех назначений`,
            formula:
              assignmentFormulas.length > 0
                ? assignmentFormulas
                : `\\min \\sum_{(i,j) \\in M} c[i][j]`,
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
