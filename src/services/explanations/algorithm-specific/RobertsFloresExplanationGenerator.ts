import { ExplanationGenerator } from '../ExplanationGenerator';
import type { Step, StepExplanation } from '@/types';
import type { AlgorithmContext } from '../ExplanationGenerator';

export class RobertsFloresExplanationGenerator extends ExplanationGenerator {
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
        const path = context?.path as string[] | undefined;
        const currentVertex = context?.current as string | undefined;
        const nextVertex = context?.next as string | undefined;
        const neighbors = context?.neighbors as string[] | undefined;
        const totalNodes = context?.totalNodes as number | undefined;
        const isInitial = context?.isInitial as boolean | undefined;

        if (isInitial) {
          const formulas = [`\\text{path} = [${nodeLabel}]`, `|\\text{path}| = 1`];
          return this.createExplanation(
            'initialization',
            `Инициализация: начинаем поиск Гамильтоновых циклов с вершины ${nodeLabel}`,
            { nodes: [nodeId], values: { start: nodeLabel } },
            {
              reason:
                'Используем backtracking (обход с возвратом) для систематического исследования всех возможных путей',
              formula: formulas,
            }
          );
        }

        if (path && path.length > 0 && currentVertex && nextVertex) {
          const pathStr = this.formatPath(path);
          const currentLabel = this.formatNode(currentVertex);
          const nextLabel = this.formatNode(nextVertex);
          const unvisitedNeighbors = neighbors?.filter(n => !path.includes(n)).length || 0;
          const formula = `${nextLabel} \\in \\text{neighbors}(${currentLabel}) \\land ${nextLabel} \\notin \\text{path}`;
          return this.createExplanation(
            'selection',
            `Добавляем вершину ${nextLabel} в путь`,
            {
              nodes: [nodeId],
              values: { path: pathStr, current: currentLabel, next: nextLabel },
            },
            {
              reason: `Принцип backtracking: вершина ${nextLabel} является непосещённым соседом вершины ${currentLabel} (есть ${unvisitedNeighbors} непосещённых соседей). Проверяем все возможные продолжения пути`,
              formula: formula,
              currentPath: `Текущий путь: ${pathStr}`,
            }
          );
        }

        if (path && path.length > 0) {
          const pathStr = this.formatPath(path);
          return this.createExplanation(
            'path',
            `Добавлена вершина ${nodeLabel} в путь: ${pathStr}`,
            { nodes: [nodeId], values: { path: pathStr } }
          );
        }

        return this.createExplanation('initialization', `Начало: добавлена вершина ${nodeLabel}`, {
          nodes: [nodeId],
        });

      case 'path':
        const cyclePath = context?.cyclePath as string[] | undefined;
        const totalNodesCycle = context?.totalNodes as number | undefined;
        const startNodeCycle = context?.startNode as string | undefined;

        if (cyclePath && cyclePath.length > 0 && totalNodesCycle !== undefined && startNodeCycle) {
          const cycleStr = this.formatPath(cyclePath);
          const startLabel = this.formatNode(startNodeCycle);
          const lastNode = cyclePath[cyclePath.length - 1];
          const lastLabel = lastNode ? this.formatNode(lastNode) : '?';
          const formulas = [
            `|\\text{path}| = ${cyclePath.length} = ${totalNodesCycle}`,
            `\\exists \\text{ edge}(${lastLabel}, ${startLabel})`,
          ];
          return this.createExplanation(
            'path',
            `Вершина ${nodeLabel} в Гамильтоновом цикле: ${cycleStr}`,
            {
              nodes: [nodeId],
              values: {
                cycle: cycleStr,
                n: totalNodesCycle.toString(),
                last: lastLabel,
                start: startLabel,
              },
            },
            {
              reason: `Условие выполнено: путь содержит все ${totalNodesCycle} вершин и существует ребро от ${lastLabel} к ${startLabel}`,
              formula: formulas,
            }
          );
        }

        return this.createExplanation('path', `Вершина ${nodeLabel} в пути`, { nodes: [nodeId] });

      case 'visited':
        const backtrackPath = context?.path as string[] | undefined;
        const isBacktrack = context?.isBacktrack as boolean | undefined;
        const backtrackCurrent = context?.current as string | undefined;
        const backtrackNext = context?.next as string | undefined;

        if (isBacktrack && backtrackPath && backtrackNext) {
          const backtrackStr = this.formatPath(backtrackPath);
          const currentLabel = backtrackCurrent ? this.formatNode(backtrackCurrent) : 'предыдущая';
          const nextLabel = this.formatNode(backtrackNext);
          const formula = `\\text{path.pop()} - \\text{ удаляем последнюю вершину }`;
          return this.createExplanation(
            'decision',
            `Откат (backtracking): вершина ${nextLabel} удалена из пути`,
            {
              nodes: [nodeId],
              values: { path: backtrackStr, removed: nextLabel },
            },
            {
              reason: `Все возможные продолжения пути из вершины ${nextLabel} были исследованы (все соседи либо посещены, либо не ведут к решению). Возвращаемся к вершине ${currentLabel} для проверки других вариантов`,
              formula: formula,
              currentPath: `Текущий путь: ${backtrackStr}`,
            }
          );
        }

        if (backtrackPath) {
          const backtrackStr = this.formatPath(backtrackPath);
          return this.createExplanation(
            'decision',
            `Откат: удалена вершина ${nodeLabel} из пути, текущий путь: ${backtrackStr}`,
            { nodes: [nodeId], values: { path: backtrackStr } }
          );
        }

        return this.createExplanation('decision', `Откат: удалена вершина ${nodeLabel}`, {
          nodes: [nodeId],
        });

      case 'rejected':
        const rejectedPath = context?.path as string[] | undefined;
        const firstNode = context?.firstNode as string | undefined;
        const totalNodesReject = context?.totalNodes as number | undefined;
        const hasCycleEdge = context?.hasCycleEdge as boolean | undefined;

        if (rejectedPath && totalNodesReject !== undefined && hasCycleEdge === false) {
          const rejectedStr = this.formatPath(rejectedPath);
          const lastNode = rejectedPath[rejectedPath.length - 1];
          const firstLabel = firstNode
            ? this.formatNode(firstNode)
            : rejectedPath[0]
              ? this.formatNode(rejectedPath[0])
              : '?';
          const lastLabel = lastNode ? this.formatNode(lastNode) : '?';
          const formulas = [
            `|\\text{path}| = ${rejectedPath.length} = ${totalNodesReject}`,
            `\\neg \\exists \\text{ edge}(${lastLabel}, ${firstLabel})`,
          ];
          return this.createExplanation(
            'decision',
            `Путь ${rejectedStr} не образует Гамильтонов цикл`,
            {
              nodes: [nodeId],
              values: {
                path: rejectedStr,
                last: lastLabel,
                first: firstLabel,
                n: totalNodesReject.toString(),
              },
            },
            {
              reason: `Путь содержит все ${totalNodesReject} вершин (|path| = ${totalNodesReject}), но нет ребра от последней вершины ${lastLabel} к начальной ${firstLabel}. Условие Гамильтонова цикла не выполнено`,
              formula: formulas,
            }
          );
        }

        if (rejectedPath) {
          const rejectedStr = this.formatPath(rejectedPath);
          return this.createExplanation(
            'decision',
            `Путь ${rejectedStr} не образует Гамильтонов цикл`,
            { nodes: [nodeId], values: { path: rejectedStr } }
          );
        }

        return this.createExplanation('decision', `Путь не образует Гамильтонов цикл`, {
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
    const edgeStr = this.formatEdge(from, to, true);

    switch (state) {
      case 'active':
        const activePath = context?.path as string[] | undefined;
        if (activePath) {
          const activePathStr = this.formatPath(activePath);
          return this.createExplanation(
            'selection',
            `Переход по ребру ${edgeStr}`,
            { edges: [edgeId], values: { path: activePathStr } },
            {
              reason: 'Принцип backtracking: проверяем возможность продолжить путь через это ребро',
              currentPath: `Текущий путь: ${activePathStr}`,
            }
          );
        }
        return this.createExplanation('selection', `Переход по ребру ${edgeStr}`, {
          edges: [edgeId],
        });

      case 'path':
        const cyclePathEdge = context?.cyclePath as string[] | undefined;
        const totalNodesEdge = context?.totalNodes as number | undefined;
        const isCycle = context?.isCycle as boolean | undefined;

        if (isCycle && cyclePathEdge && totalNodesEdge !== undefined) {
          const cycleStr = this.formatPath(cyclePathEdge);
          const formulas = [
            `|\\text{path}| = ${totalNodesEdge}`,
            `\\exists \\text{ edge}(${toLabel}, ${fromLabel})`,
          ];
          return this.createExplanation(
            'path',
            `Найден Гамильтонов цикл: ${cycleStr}\nРебро ${edgeStr} замыкает цикл (от ${toLabel} к ${fromLabel})`,
            {
              edges: [edgeId],
              values: { cycle: cycleStr, n: totalNodesEdge.toString() },
            },
            {
              reason: `Условие: путь содержит все ${totalNodesEdge} вершин и существует замыкающее ребро`,
              formula: formulas,
            }
          );
        }

        if (cyclePathEdge) {
          const cycleStr = this.formatPath(cyclePathEdge);
          return this.createExplanation(
            'path',
            `Ребро ${edgeStr} в Гамильтоновом цикле: ${cycleStr}`,
            { edges: [edgeId], values: { cycle: cycleStr } }
          );
        }

        return this.createExplanation('path', `Найден Гамильтонов цикл: ребро ${edgeStr}`, {
          edges: [edgeId],
        });

      default:
        if (step.description) {
          return this.createExplanation('general', step.description, context);
        }
        return undefined;
    }
  }
}
