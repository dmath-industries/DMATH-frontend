import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  HighlightEdgeStep,
  UpdateNodeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';

export class HungarianStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private costMatrix: number[][] = [];
  private n: number = 0;

  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;

    if (graphDTO.nodes.length === 0) {
      return this.steps;
    }

    this.n = graphDTO.nodes.length;
    this.costMatrix = this.buildCostMatrix(graphDTO);

    this.addStepDescription('Инициализация: построение матрицы стоимостей');

    this.addStepDescription('Шаг 1: Вычитание минимума из каждой строки');
    for (let i = 0; i < this.n; i++) {
      const rowMin = Math.min(...this.costMatrix[i]);
      if (rowMin > 0) {
        for (let j = 0; j < this.n; j++) {
          this.costMatrix[i][j] -= rowMin;
        }
        this.addStepDescription(`Строка ${i + 1}: вычитаем минимум ${rowMin}`);
      }
    }

    this.addStepDescription('Шаг 2: Вычитание минимума из каждого столбца');
    for (let j = 0; j < this.n; j++) {
      const colMin = Math.min(...this.costMatrix.map(row => row[j]));
      if (colMin > 0) {
        for (let i = 0; i < this.n; i++) {
          this.costMatrix[i][j] -= colMin;
        }
        this.addStepDescription(`Столбец ${j + 1}: вычитаем минимум ${colMin}`);
      }
    }

    this.addStepDescription('Шаг 3: Поиск оптимального назначения');
    const assignment = this.findOptimalAssignment();

    this.visualizeAssignment(graphDTO, assignment);

    return this.steps;
  }

  private buildCostMatrix(graphDTO: GraphDTO): number[][] {
    const matrix: number[][] = [];
    const nodeIds = graphDTO.nodes.map(n => n.id).sort();

    for (let i = 0; i < this.n; i++) {
      matrix[i] = [];
      for (let j = 0; j < this.n; j++) {
        matrix[i][j] = 9999;
      }
    }

    for (const edge of graphDTO.edges) {
      const sourceIdx = nodeIds.indexOf(edge.source);
      const targetIdx = nodeIds.indexOf(edge.target);
      
      if (sourceIdx >= 0 && targetIdx >= 0) {
        const weight = edge.weight ?? 1;
        matrix[sourceIdx][targetIdx] = weight;
      }
    }

    return matrix;
  }

  private findOptimalAssignment(): number[] {
    const assignment: number[] = new Array(this.n).fill(-1);
    const used: boolean[] = new Array(this.n).fill(false);

    for (let i = 0; i < this.n; i++) {
      let bestJ = -1;
      let bestCost = Infinity;

      for (let j = 0; j < this.n; j++) {
        if (!used[j] && this.costMatrix[i][j] < bestCost) {
          bestCost = this.costMatrix[i][j];
          bestJ = j;
        }
      }

      if (bestJ >= 0 && bestCost === 0) {
        assignment[i] = bestJ;
        used[bestJ] = true;
      }
    }

    for (let i = 0; i < this.n; i++) {
      if (assignment[i] === -1) {
        let bestJ = -1;
        let bestCost = Infinity;

        for (let j = 0; j < this.n; j++) {
          if (!used[j] && this.costMatrix[i][j] < bestCost) {
            bestCost = this.costMatrix[i][j];
            bestJ = j;
          }
        }

        if (bestJ >= 0) {
          assignment[i] = bestJ;
          used[bestJ] = true;
        }
      }
    }

    return assignment;
  }

  private visualizeAssignment(graphDTO: GraphDTO, assignment: number[]): void {
    const nodeIds = graphDTO.nodes.map(n => n.id).sort();

    this.addStepDescription('Визуализация оптимального назначения');

    for (const node of graphDTO.nodes) {
      this.addHighlightNodeStep(node.id, 'default', `Узел ${this.label(node.id)}`);
    }

    let totalCost = 0;
    for (let i = 0; i < assignment.length; i++) {
      const sourceId = nodeIds[i];
      const targetIdx = assignment[i];
      
      if (targetIdx >= 0 && sourceId) {
        const targetId = nodeIds[targetIdx];
        if (!targetId) continue;

        const edge = graphDTO.edges.find(
          e => e.source === sourceId && e.target === targetId
        );

        if (edge) {
          const cost = this.costMatrix[i][targetIdx];
          totalCost += cost;

          this.addHighlightEdgeStep(
            edge.id,
            'path',
            `Назначение: ${this.label(sourceId)} → ${this.label(targetId)} (стоимость: ${cost})`
          );
          this.addHighlightNodeStep(sourceId, 'current', `Источник: ${this.label(sourceId)}`);
          this.addHighlightNodeStep(targetId, 'path', `Назначено: ${this.label(targetId)}`);
        }
      }
    }

    for (let i = 0; i < assignment.length; i++) {
      const sourceId = nodeIds[i];
      const targetIdx = assignment[i];
      
      if (targetIdx >= 0 && sourceId) {
        const targetId = nodeIds[targetIdx];
        if (targetId) {
          this.addHighlightNodeStep(sourceId, 'visited');
          this.addHighlightNodeStep(targetId, 'visited');
        }
      }
    }

    this.addStepDescription(`Оптимальное назначение найдено. Общая стоимость: ${totalCost}`);
  }

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

  private addStepDescription(description: string): void {
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep && !lastStep.description) {
        lastStep.description = description;
      }
    }
  }

  private label(v: string): string {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0) {
      return String.fromCharCode('a'.charCodeAt(0) + n);
    }
    return v;
  }
}
