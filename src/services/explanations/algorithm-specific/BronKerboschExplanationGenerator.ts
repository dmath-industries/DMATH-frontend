/**
 * Генератор пояснений для алгоритма Bron-Kerbosch
 * Алгоритм находит все максимальные клики в неориентированном графе
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
      case 'current': {
        const rSet = context?.rSet as string[] | undefined;
        const pSet = context?.pSet as string[] | undefined;
        const xSet = context?.xSet as string[] | undefined;

        if (rSet && rSet.length > 0) {
          const rStr = this.formatSet(rSet);
          const pStr = pSet && pSet.length > 0 ? this.formatSet(pSet) : '∅';
          const xStr = xSet && xSet.length > 0 ? this.formatSet(xSet) : '∅';

          // Формулы для текущего состояния алгоритма (каждая на отдельной строке)
          const formulas = [`R = ${rStr}`, `P = ${pStr}`, `X = ${xStr}`];

          // Формула определения клики
          const cliqueFormula =
            rSet.length > 1 ? `\\forall u, v \\in R: (u, v) \\in E` : `|R| = ${rSet.length}`;

          return this.createExplanation(
            'general',
            `Текущее состояние алгоритма: множество R (растущая клика)`,
            { nodes: rSet, values: { rSet: rStr, pSet: pStr, xSet: xStr } },
            {
              reason: `Алгоритм Bron-Kerbosch использует три множества: R (текущая растущая клика), P (кандидаты для добавления), X (исключённые вершины). Множество R содержит вершины, образующие клику - полный подграф, где каждая пара вершин соединена ребром. Алгоритм пытается расширить R, добавляя вершины из P, которые соединены со всеми вершинами в R.`,
              formula: formulas,
              currentPath: `Текущая клика R: ${rStr}\nКандидаты P: ${pStr}\nИсключённые X: ${xStr}`,
            }
          );
        }
        return this.createExplanation(
          'general',
          `Инициализация: начинаем поиск максимальных клик`,
          { nodes: [nodeId] },
          {
            reason: `Алгоритм Bron-Kerbosch использует backtracking (обход с возвратом) для систематического перебора всех возможных клик. Начинаем с пустого множества R и всех вершин графа в множестве P.`,
            formula: [`R = \\emptyset`, `P = V`, `X = \\emptyset`],
          }
        );
      }

      case 'active': {
        const rSetActive = context?.rSet as string[] | undefined;
        const pSetActive = context?.pSet as string[] | undefined;
        const xSetActive = context?.xSet as string[] | undefined;
        const neighbors = context?.neighbors as string[] | undefined;
        const addedVertex = context?.addedVertex as string | undefined;

        if (rSetActive && addedVertex === nodeId) {
          const rStr = this.formatSet(rSetActive);
          const pStr = pSetActive && pSetActive.length > 0 ? this.formatSet(pSetActive) : '∅';
          const xStr = xSetActive && xSetActive.length > 0 ? this.formatSet(xSetActive) : '∅';

          // Формулы (каждая на отдельной строке)
          const neighborsStr = neighbors && neighbors.length > 0 ? this.formatSet(neighbors) : '∅';
          const formulas = [
            `R' = R \\cup \\{${nodeLabel}\\} = ${rStr}`,
            `P' = P \\cap N(${nodeLabel}) = ${pStr}`,
            `X' = X \\cap N(${nodeLabel}) = ${xStr}`,
          ];

          // Проверка условия клики
          const cliqueCondition =
            rSetActive.length > 1 ? `\\forall u \\in R: (${nodeLabel}, u) \\in E` : `|R| = 1`;

          formulas.push(`\\text{Условие клики: } ${cliqueCondition}`);

          return this.createExplanation(
            'selection',
            `Добавляем вершину ${nodeLabel} в множество R (растущая клика)`,
            { nodes: rSetActive, values: { rSet: rStr, pSet: pStr, xSet: xStr } },
            {
              reason: `Вершина ${nodeLabel} добавляется в R, так как она соединена со всеми вершинами текущего множества R. Это гарантирует, что R остаётся кликой. Множества P и X обновляются: в P остаются только соседи ${nodeLabel}, которые ещё могут быть добавлены, а в X - только соседи, которые уже были исключены.`,
              formula: formulas,
              currentPath: `R = ${rStr}\nP = ${pStr}\nX = ${xStr}\nСоседи ${nodeLabel}: ${neighborsStr}`,
            }
          );
        }
        return this.createExplanation(
          'selection',
          `Добавлена вершина ${nodeLabel} в множество R`,
          { nodes: [nodeId] },
          {
            reason: `Вершина ${nodeLabel} добавляется в текущую клику R, так как она соединена со всеми вершинами уже находящимися в R. Это сохраняет свойство клики: каждая пара вершин в R соединена ребром.`,
            formula: `R' = R \\cup \\{${nodeLabel}\\}`,
          }
        );
      }

      case 'path': {
        const clique = context?.clique as string[] | undefined;
        if (clique && clique.length > 0 && clique.includes(nodeId)) {
          const cliqueStr = this.formatSet(clique);

          // Формулы (каждая на отдельной строке)
          const formulas = [`C = ${cliqueStr}`, `|C| = ${clique.length}`];

          // Условие максимальности
          formulas.push(`\\text{Условие максимальности: } P = \\emptyset \\land X = \\emptyset`);

          // Условие клики (полный подграф)
          const cliqueFormula =
            clique.length > 1 ? `\\forall u, v \\in C, u \\neq v: (u, v) \\in E` : `|C| = 1`;
          formulas.push(`\\text{Условие клики: } ${cliqueFormula}`);

          // Формула для количества рёбер в клике
          const edgesFormula =
            clique.length > 1
              ? `|E(C)| = C(${clique.length}, 2) = ${(clique.length * (clique.length - 1)) / 2}`
              : `|E(C)| = 0`;
          formulas.push(edgesFormula);

          return this.createExplanation(
            'selection',
            `Найдена максимальная клика, содержащая вершину ${nodeLabel}`,
            { nodes: clique, values: { clique: cliqueStr, size: clique.length.toString() } },
            {
              reason: `Клика ${cliqueStr} является максимальной, так как выполнено условие P = ∅ и X = ∅. Это означает, что нет вершин, которые можно добавить в клику, сохраняя свойство полного подграфа. Клика - это полный подграф, где каждая пара вершин соединена ребром.`,
              formula: formulas,
              currentPath: `Максимальная клика: ${cliqueStr}`,
            }
          );
        }
        return this.createExplanation(
          'selection',
          `Вершина ${nodeLabel} в максимальной клике`,
          { nodes: [nodeId] },
          {
            reason: `Эта вершина является частью найденной максимальной клики - полного подграфа, который нельзя расширить добавлением новых вершин.`,
            formula: `${nodeLabel} \\in C, \\text{ где } C \\text{ - максимальная клика}`,
          }
        );
      }

      case 'visited': {
        const rSetVisited = context?.rSet as string[] | undefined;
        const pSetVisited = context?.pSet as string[] | undefined;
        const xSetVisited = context?.xSet as string[] | undefined;
        const removedVertex = context?.removedVertex as string | undefined;

        if (xSetVisited && removedVertex === nodeId) {
          const rStr = rSetVisited && rSetVisited.length > 0 ? this.formatSet(rSetVisited) : '∅';
          const pStr = pSetVisited && pSetVisited.length > 0 ? this.formatSet(pSetVisited) : '∅';
          const xStr = this.formatSet(xSetVisited);

          // Формулы backtracking (каждая на отдельной строке)
          const formulas = [
            `R' = R \\setminus \\{${nodeLabel}\\} = ${rStr}`,
            `P' = P \\setminus \\{${nodeLabel}\\} = ${pStr}`,
            `X' = X \\cup \\{${nodeLabel}\\} = ${xStr}`,
          ];

          return this.createExplanation(
            'decision',
            `Backtracking: переносим вершину ${nodeLabel} в множество X (исключённые)`,
            { nodes: xSetVisited, values: { rSet: rStr, pSet: pStr, xSet: xStr } },
            {
              reason: `Принцип backtracking алгоритма Bron-Kerbosch: после полного исследования всех клик, содержащих вершину ${nodeLabel}, мы выполняем откат (backtracking). Вершина ${nodeLabel} удаляется из R и переносится в X, чтобы исключить её из дальнейших поисков. Это гарантирует, что каждая максимальная клика будет найдена ровно один раз, без дублирования результатов.`,
              formula: formulas,
              currentPath: `После backtracking:\nR = ${rStr}\nP = ${pStr}\nX = ${xStr}`,
            }
          );
        }
        return this.createExplanation(
          'decision',
          `Перенос вершины ${nodeLabel} в множество X`,
          { nodes: [nodeId] },
          {
            reason: `Вершина ${nodeLabel} переносится в множество исключённых вершин X после полного исследования всех клик с её участием. Это предотвращает повторную обработку и гарантирует нахождение всех максимальных клик без дублирования.`,
            formula: `X' = X \\cup \\{${nodeLabel}\\}`,
          }
        );
      }

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
    const clique = context?.clique as string[] | undefined;

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
      case 'path': {
        const cliqueStr =
          clique && clique.length > 0 ? this.formatSet(clique) : `{${fromLabel}, ${toLabel}}`;

        // Формулы (каждая на отдельной строке)
        const formulas = [
          `(${fromLabel}, ${toLabel}) \\in E(C)`,
          `\\text{Условие клики: } \\forall u, v \\in C: (u, v) \\in E`,
        ];

        return this.createExplanation(
          'path',
          `Ребро ${edgeStr} в максимальной клике`,
          { edges: [edgeId], values: { clique: cliqueStr } },
          {
            reason: `Это ребро соединяет две вершины максимальной клики ${cliqueStr}. В клике (полном подграфе) каждая пара вершин должна быть соединена ребром. Это является определением клики: клика - это подмножество вершин графа, индуцирующее полный подграф.`,
            formula: formulas,
            currentPath: `Клика: ${cliqueStr}`,
          }
        );
      }

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
