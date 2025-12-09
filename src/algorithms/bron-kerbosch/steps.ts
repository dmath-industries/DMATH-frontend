/**
 * Bron-Kerbosch Algorithm — Step-based версия
 * Генерирует поток Step'ов для поиска максимальных независимых множеств в графе
 * 
 * Алгоритм Брона-Кербоша находит все максимальные независимые множества (МВУМ) в неориентированном графе.
 * Использует три множества (стек):
 * - S: текущее независимое множество
 * - P: кандидаты для добавления
 * - M: исключенные вершины
 * 
 * Метод subtraction(P, x) удаляет из P всех соседей вершины x
 */

import type {
  GraphDTO,
  Step,
  HighlightNodeStep,
  AlgorithmParams,
  ElementState,
} from '@/types';

/**
 * Генератор шагов для алгоритма Брона-Кербоша
 */
export class BronKerboschStepGenerator {
  private steps: Step[] = [];
  private stepCounter = 0;
  private adjacency: Map<string, Set<string>> = new Map();
  private maxIndependentSets: string[][] = [];
  private maxSetSize = 0;

  /**
   * Генерировать шаги для алгоритма Брона-Кербоша
   */
  generateSteps(graphDTO: GraphDTO, params: AlgorithmParams): Step[] {
    this.steps = [];
    this.stepCounter = 0;
    this.maxIndependentSets = [];
    this.maxSetSize = 0;

    if (graphDTO.nodes.length === 0) {
      return this.steps;
    }

    // Строим список смежности (для неориентированного графа)
    this.buildAdjacencyList(graphDTO);

    // Инициализация: стеки S, P, M
    const S: string[][] = [[]]; // стек текущих множеств
    const P: string[][] = [graphDTO.nodes.map(n => n.id)]; // стек кандидатов
    const M: string[][] = [[]]; // стек исключенных

    this.showStep(S, P, M, graphDTO);

    // Запускаем итеративный алгоритм
    this.executeAlgorithm(S, P, M, graphDTO);

    // Финальный шаг с результатами
    const resultText = this.maxIndependentSets.length > 0
      ? `Число внутренней устойчивости графа: ${this.maxSetSize}. Количество МВУМ: ${this.maxIndependentSets.length}. Множества: ${this.maxIndependentSets.map(s => `{${s.map(v => this.label(v)).join(', ')}}`).join(', ')}`
      : 'Максимальные независимые множества не найдены';

    this.addStepDescription(resultText);

    return this.steps;
  }

  /**
   * Итеративный алгоритм Брона-Кербоша (как в Java версии)
   */
  private executeAlgorithm(
    S: string[][],
    P: string[][],
    M: string[][],
    graphDTO: GraphDTO
  ): void {
    while (true) {
      let x: string;
      
      // Выбираем вершину x
      const lastP = P[P.length - 1];
      if (lastP.length > 0) {
        x = lastP[0];
        
        // Добавляем x в текущее множество S
        const newS = [...S[S.length - 1], x];
        S.push(newS);
        
        // P_new = subtraction(P, x) - удаляем соседей x из P
        const newP = this.subtraction(lastP, x);
        P.push(newP);
        
        // M_new = subtraction(M, x) - удаляем соседей x из M
        const lastM = M[M.length - 1];
        const newM = this.subtraction(lastM, x);
        M.push(newM);
        
        this.showStep(S, P, M, graphDTO);
      } else {
        // Если P пусто, берем последнюю вершину из S
        const lastS = S[S.length - 1];
        if (lastS.length === 0) {
          // Если S тоже пусто, выходим
          break;
        }
        x = lastS[lastS.length - 1];
      }

      const currentP = P[P.length - 1];
      const currentM = M[M.length - 1];
      
      // Если P не пусто, продолжаем цикл (как в Java версии)
      if (currentP.length > 0) {
        continue;
      }
      
      // Если M пусто, то S - максимальное независимое множество
      if (currentM.length === 0) {
        const currentS = S[S.length - 1];
        const sizeS = currentS.length;
        
        if (sizeS > this.maxSetSize) {
          this.maxSetSize = sizeS;
          this.maxIndependentSets = [[...currentS]];
        } else if (sizeS === this.maxSetSize) {
          this.maxIndependentSets.push([...currentS]);
        }
        
        // Подсвечиваем найденное множество
        for (const nodeId of currentS) {
          this.addHighlightNodeStep(
            nodeId,
            'path',
            `МВУМ: {${currentS.map(v => this.label(v)).join(', ')}}`
          );
        }
        
        this.addStepDescription(`Найдено МВУМ размера ${sizeS}: {${currentS.map(v => this.label(v)).join(', ')}}`);
      }
      
      // Step 3: Удаляем последние элементы из стеков (откат)
      S.pop();
      P.pop();
      M.pop();
      
      // Step 4: Обновляем P и M
      if (P.length > 0 && S.length > 0 && M.length > 0) {
        const topP = P[P.length - 1];
        if (topP.length > 0) {
          topP.shift(); // Удаляем первый элемент из P (как в Java: remove(0))
        }
        M[M.length - 1].push(x); // Добавляем x в M
        
        const topS = S[S.length - 1];
        const newTopP = P[P.length - 1];
        
        // Продолжаем, если не достигли конца (как в Java версии)
        if (!(topS.length === 0 && newTopP.length === 0)) {
          this.showStep(S, P, M, graphDTO);
          continue;
        }
      }
      
      this.showStep(S, P, M, graphDTO);
      break;
    }
  }

  /**
   * Показать шаг алгоритма (подсветка узлов)
   */
  private showStep(
    S: string[][],
    P: string[][],
    M: string[][],
    graphDTO: GraphDTO
  ): void {
    // Сбрасываем подсветку всех узлов
    for (const node of graphDTO.nodes) {
      this.addHighlightNodeStep(node.id, 'default');
    }
    
    // Подсвечиваем текущее множество S
    if (S.length > 0) {
      const currentS = S[S.length - 1];
      for (const nodeId of currentS) {
        this.addHighlightNodeStep(nodeId, 'current', `В множестве S: ${this.label(nodeId)}`);
      }
    }
    
    // Подсвечиваем кандидатов P
    if (P.length > 0) {
      const currentP = P[P.length - 1];
      for (const nodeId of currentP) {
        this.addHighlightNodeStep(nodeId, 'candidate', `Кандидат: ${this.label(nodeId)}`);
      }
    }
    
    // Подсвечиваем исключенные M
    if (M.length > 0) {
      const currentM = M[M.length - 1];
      for (const nodeId of currentM) {
        this.addHighlightNodeStep(nodeId, 'rejected', `Исключен: ${this.label(nodeId)}`);
      }
    }
    
    const sStr = S.length > 0 ? this.formatSet(S[S.length - 1]) : '∅';
    const pStr = P.length > 0 ? this.formatSet(P[P.length - 1]) : '∅';
    const mStr = M.length > 0 ? this.formatSet(M[M.length - 1]) : '∅';
    
    this.addStepDescription(`S = ${sStr}, P = ${pStr}, M = ${mStr}`);
  }

  /**
   * Вычитание: удаляет из списка всех соседей вершины x
   * (аналог graph.subtraction в Java)
   * 
   * В Java: newList.removeAll(getNeighbors(vert))
   * getNeighbors возвращает всех соседей, включая саму вершину (если есть петля)
   */
  private subtraction(list: string[], x: string): string[] {
    const neighborsX = this.adjacency.get(x) || new Set();
    // Удаляем всех соседей x из списка (включая x, если есть петля)
    // Это соответствует Java версии: removeAll(getNeighbors(x))
    return list.filter(v => !neighborsX.has(v));
  }

  /**
   * Построить список смежности из GraphDTO (неориентированный граф)
   */
  private buildAdjacencyList(graphDTO: GraphDTO): void {
    this.adjacency.clear();

    // Инициализируем список для всех узлов
    for (const node of graphDTO.nodes) {
      this.adjacency.set(node.id, new Set());
    }

    // Добавляем рёбра
    for (const edge of graphDTO.edges) {
      const sourceNeighbors = this.adjacency.get(edge.source) || new Set();
      sourceNeighbors.add(edge.target);
      this.adjacency.set(edge.source, sourceNeighbors);

      // Для неориентированных графов добавляем обратное ребро
      // Для ориентированных - только прямое ребро
      if (!edge.directed) {
        const targetNeighbors = this.adjacency.get(edge.target) || new Set();
        targetNeighbors.add(edge.source);
        this.adjacency.set(edge.target, targetNeighbors);
      }
    }

    // Добавляем петли (как в Java реализации)
    for (const node of graphDTO.nodes) {
      const neighbors = this.adjacency.get(node.id) || new Set();
      neighbors.add(node.id);
      this.adjacency.set(node.id, neighbors);
    }
  }

  /**
   * Получить метку узла (a, b, c, ...)
   */
  private label(v: string): string {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0) {
      return String.fromCharCode('a'.charCodeAt(0) + n);
    }
    return v;
  }

  /**
   * Форматировать множество вершин
   */
  private formatSet(vertices: string[]): string {
    if (vertices.length === 0) {
      return '∅';
    }
    return `{${vertices.map(v => this.label(v)).join(', ')}}`;
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
   * Добавить шаг с описанием
   */
  private addStepDescription(description: string): void {
    // Добавляем описание к последнему шагу, если он есть
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep && !lastStep.description) {
        lastStep.description = description;
        return;
      }
    }
    
    // Если нет предыдущего шага, создаем шаг с описанием для первого узла
    // (если есть узлы в графе)
    // Это будет видно в UI через описание шага
  }
}

