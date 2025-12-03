/**
 * Ford-Bellman Algorithm — Step-based версия
 * Генерирует поток Step'ов для поиска кратчайших путей в графе с весами (включая отрицательные)
 */

import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  HighlightEdgeStep,
  UpdateNodeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';

/**
 * Генератор шагов для алгоритма Ford-Bellman
 */
export class FordBellmanStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private distances: Map<string, number> = new Map();
  private predecessors: Map<string, string | null> = new Map();

  /**
   * Генерировать шаги для алгоритма Ford-Bellman
   */
  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.distances.clear();
    this.predecessors.clear();

    const startNode = params.startNode ?? graphDTO.nodes[0]?.id ?? '0';

    if (graphDTO.nodes.length === 0) {
      return this.steps;
    }

    // Инициализация: расстояние до стартовой вершины = 0, до остальных = бесконечность
    for (const node of graphDTO.nodes) {
      const distance = node.id === startNode ? 0 : Infinity;
      this.distances.set(node.id, distance);
      this.predecessors.set(node.id, null);

      this.addHighlightNodeStep(
        node.id,
        node.id === startNode ? 'current' : 'default',
        node.id === startNode
          ? `Начальная вершина ${this.label(node.id)}: расстояние = 0`
          : `Вершина ${this.label(node.id)}: расстояние = ∞`
      );
    }

    const n = graphDTO.nodes.length;

    // Основной цикл: n-1 итерация релаксации
    for (let iteration = 0; iteration < n - 1; iteration++) {
      this.addStepDescription(`Итерация ${iteration + 1}/${n - 1}: релаксация рёбер`);

      let hasRelaxation = false;

      // Релаксация всех рёбер
      for (const edge of graphDTO.edges) {
        const u = edge.source;
        const v = edge.target;
        const weight = edge.weight ?? 1;

        const distU = this.distances.get(u) ?? Infinity;
        const distV = this.distances.get(v) ?? Infinity;

        if (distU !== Infinity && distU + weight < distV) {
          hasRelaxation = true;
          const newDist = distU + weight;

          // Подсветка ребра и вершин
          this.addHighlightEdgeStep(
            edge.id,
            'active',
            `Релаксация: ${this.label(u)} → ${this.label(v)} (вес: ${weight})`
          );
          this.addHighlightNodeStep(u, 'current', `Текущая вершина: ${this.label(u)}`);
          this.addHighlightNodeStep(v, 'candidate', `Обновление: ${this.label(v)}`);

          // Обновление расстояния
          this.distances.set(v, newDist);
          this.predecessors.set(v, u);

          this.addUpdateNodeStep(
            v,
            { label: `${this.label(v)}\n(${newDist})` },
            `Расстояние до ${this.label(v)} обновлено: ${distV} → ${newDist}`
          );

          // Возврат к обычному состоянию
          this.addHighlightEdgeStep(edge.id, 'path');
          this.addHighlightNodeStep(v, 'visited');
          this.addHighlightNodeStep(u, 'visited');
        } else {
          // Показываем, что релаксация не произошла
          this.addHighlightEdgeStep(edge.id, 'default');
        }
      }

      if (!hasRelaxation) {
        this.addStepDescription('Релаксация завершена досрочно: оптимальные расстояния найдены');
        break;
      }
    }

    // Проверка на отрицательные циклы
    this.addStepDescription('Проверка на отрицательные циклы');
    let hasNegativeCycle = false;

    for (const edge of graphDTO.edges) {
      const u = edge.source;
      const v = edge.target;
      const weight = edge.weight ?? 1;

      const distU = this.distances.get(u) ?? Infinity;
      const distV = this.distances.get(v) ?? Infinity;

      if (distU !== Infinity && distU + weight < distV) {
        hasNegativeCycle = true;
        this.addHighlightEdgeStep(
          edge.id,
          'rejected',
          `Обнаружен отрицательный цикл через ${this.label(u)} → ${this.label(v)}`
        );
      }
    }

    if (hasNegativeCycle) {
      this.addStepDescription('⚠️ Обнаружен отрицательный цикл! Алгоритм не может найти кратчайшие пути.');
    } else {
      // Восстановление путей
      this.addStepDescription('Восстановление кратчайших путей');
      for (const node of graphDTO.nodes) {
        if (node.id === startNode) continue;

        const path: string[] = [];
        let current: string | null = node.id;

        while (current !== null) {
          path.unshift(current);
          current = this.predecessors.get(current) ?? null;
        }

        if (path.length > 1 && path[0] === startNode) {
          // Подсветка пути
          for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            if (!from || !to) continue;

            const edge = graphDTO.edges.find(
              (e) => e.source === from && e.target === to
            );
            if (edge) {
              this.addHighlightEdgeStep(edge.id, 'path', `Путь: ${this.pathToString(path)}`);
            }
            this.addHighlightNodeStep(from, 'path');
            this.addHighlightNodeStep(to, 'path');
          }
        }
      }

      const finalDistances = Array.from(this.distances.entries())
        .map(([id, dist]) => `${this.label(id)}: ${dist === Infinity ? '∞' : dist}`)
        .join(', ');
      this.addStepDescription(`Кратчайшие расстояния: ${finalDistances}`);
    }

    return this.steps;
  }

  /**
   * Добавить шаг для подсветки узла
   */
  private addHighlightNodeStep(
    nodeId: string,
    state: ElementState,
    description?: string
  ): void {
    const step: HighlightNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_NODE',
      nodeId,
      state,
      description,
    };
    this.steps.push(step);
  }

  /**
   * Добавить шаг для подсветки ребра
   */
  private addHighlightEdgeStep(
    edgeId: string,
    state: ElementState,
    description?: string
  ): void {
    const step: HighlightEdgeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'HIGHLIGHT_EDGE',
      edgeId,
      state,
      description,
    };
    this.steps.push(step);
  }

  /**
   * Добавить шаг для обновления узла
   */
  private addUpdateNodeStep(
    nodeId: string,
    attrs: Partial<{ label: string }>,
    description?: string
  ): void {
    const step: UpdateNodeStep = {
      id: `step_${this.stepCounter++}`,
      timestamp: Date.now(),
      type: 'UPDATE_NODE',
      nodeId,
      attrs,
      description,
    };
    this.steps.push(step);
  }

  /**
   * Добавить описание шага (через обновление узла с меткой)
   */
  private addStepDescription(description: string): void {
    // Добавляем описание к последнему шагу, если он есть
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep && !lastStep.description) {
        lastStep.description = description;
      }
    }
  }

  /**
   * Получить метку узла
   */
  private label(v: string): string {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0) {
      return String.fromCharCode('a'.charCodeAt(0) + n);
    }
    return v;
  }

  /**
   * Преобразовать путь в строку
   */
  private pathToString(path: string[]): string {
    return path.map((v) => this.label(v)).join(' → ');
  }
}

