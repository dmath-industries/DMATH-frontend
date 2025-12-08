/**
 * Алгоритм локальных характеристик (проверка изоморфизма графов)
 * Порт с Java-версии LocalCharacteristicsAlgorithm.
 *
 * На вход ожидает четыре квадратные матрицы одинакового размера:
 * - arcsG, edgesG — матрицы для графа G
 * - arcsH, edgesH — матрицы для графа H
 *
 * Возвращает строку с таблицами S_k и метками P_k для обоих графов,
 * завершающуюся выводом результата об изоморфизме.
 */

export interface LocalCharacteristicsInput {
  arcsG: number[][];
  edgesG: number[][];
  arcsH: number[][];
  edgesH: number[][];
}

export class LocalCharacteristicsAlgorithm {
  private arcsG: number[][] = [];
  private edgesG: number[][] = [];
  private arcsH: number[][] = [];
  private edgesH: number[][] = [];
  private n = 0;
  private P: number[][] = [];
  private output: string[] = [];

  initialize(input: LocalCharacteristicsInput): void {
    const { arcsG, edgesG, arcsH, edgesH } = input;

    if (
      !this.isSquare(arcsG) ||
      !this.isSquare(edgesG) ||
      !this.isSquare(arcsH) ||
      !this.isSquare(edgesH) ||
      arcsG.length !== edgesG.length ||
      arcsG.length !== arcsH.length ||
      arcsG.length !== edgesH.length
    ) {
      throw new Error('All matrices must be square and have the same size');
    }

    this.arcsG = arcsG;
    this.edgesG = edgesG;
    this.arcsH = arcsH;
    this.edgesH = edgesH;
    this.n = arcsG.length;
    this.P = [new Array(this.n).fill(0), new Array(this.n).fill(0)];
    this.output = [];
  }

  execute(): string {
    this.output.push('```Алгоритм Локальных Характеристик');

    const S0G = this.calculateS0(this.arcsG, this.edgesG);
    const S0H = this.calculateS0(this.arcsH, this.edgesH);

    this.calculateP0(S0G, S0H);

    this.generateOutput('S0(G)', S0G, this.P[0]);
    this.generateOutput('S0(H)', S0H, this.P[1]);

    for (let k = 1; ; k += 1) {
      const SkG = this.calculateSk(S0G, this.P[0]);
      const SkH = this.calculateSk(S0H, this.P[1]);

      this.calculatePk(SkG, SkH);

      this.generateOutput(`S${k}(G)`, SkG, this.P[0]);
      this.generateOutput(`S${k}(H)`, SkH, this.P[1]);

      const maxValue = Math.max(...this.P[0], ...this.P[1]);
      if (maxValue < this.n) {
        continue;
      }
      if (maxValue === this.n) {
        const freqG = this.getFrequencyMap(this.P[0]);
        const freqH = this.getFrequencyMap(this.P[1]);

        if (this.isSameFrequency(freqG, freqH)) {
          this.output.push('Graphs are isomorphic.');
          const mapping = this.buildMapping(this.P[1]);
          this.output.push(`Mapping: [${mapping.join(', ')}]`);
        } else {
          this.output.push('Graphs are not isomorphic.');
        }
        break;
      }

      this.output.push('Graphs are not isomorphic.');
      break;
    }

    this.output.push('```');
    return this.output.join('\n');
  }

  private calculateS0(arcs: number[][], edges: number[][]): number[][] {
    const S0: number[][] = Array.from({ length: this.n }, () => new Array(this.n).fill(0));
    for (let i = 0; i < this.n; i += 1) {
      for (let j = 0; j < this.n; j += 1) {
        if (i !== j) {
          S0[i][j] = arcs[i][j] * 10 + edges[i][j];
        } else {
          S0[i][j] = Math.max(edges[i][j], arcs[i][j]);
        }
      }
    }
    return S0;
  }

  private calculateP0(S0G: number[][], S0H: number[][]): void {
    const uniquePatterns = new Map<string, number>();
    let code = 1;

    for (let i = 0; i < this.n; i += 1) {
      const freq = this.getFrequencyMap(S0G[i]);
      const key = this.frequencyKey(freq);
      if (!uniquePatterns.has(key)) {
        uniquePatterns.set(key, code);
        code += 1;
      }
      this.P[0][i] = uniquePatterns.get(key)!;
    }

    for (let i = 0; i < this.n; i += 1) {
      const freq = this.getFrequencyMap(S0H[i]);
      const key = this.frequencyKey(freq);
      if (!uniquePatterns.has(key)) {
        uniquePatterns.set(key, code);
        code += 1;
      }
      this.P[1][i] = uniquePatterns.get(key)!;
    }
  }

  private calculateSk(S0: number[][], P: number[]): number[][] {
    const Sk: number[][] = Array.from({ length: this.n }, () => new Array(this.n).fill(0));
    for (let i = 0; i < this.n; i += 1) {
      for (let j = 0; j < this.n; j += 1) {
        if (S0[i][j] === 0) {
          continue;
        }
        Sk[i][j] = S0[i][j] * 100 + P[i] * 10 + P[j];
      }
    }
    return Sk;
  }

  private calculatePk(SkG: number[][], SkH: number[][]): void {
    const uniquePatterns = new Map<string, number>();
    let code = 1;

    for (let i = 0; i < this.n; i += 1) {
      const freq = this.getFrequencyMap(SkG[i]);
      const key = this.frequencyKey(freq);
      if (!uniquePatterns.has(key)) {
        uniquePatterns.set(key, code);
        code += 1;
      }
      this.P[0][i] = uniquePatterns.get(key)!;
    }

    for (let i = 0; i < this.n; i += 1) {
      const freq = this.getFrequencyMap(SkH[i]);
      const key = this.frequencyKey(freq);
      if (!uniquePatterns.has(key)) {
        uniquePatterns.set(key, code);
        code += 1;
      }
      this.P[1][i] = uniquePatterns.get(key)!;
    }
  }

  private generateOutput(label: string, matrix: number[][], P: number[]): void {
    this.output.push(`${label}:`);
    const header = ['   ', ...this.rangeToArray(1, this.n).map(v => v.toString().padStart(6, ' '))];
    this.output.push(header.join(''));

    for (let i = 0; i < this.n; i += 1) {
      const rowValues = matrix[i].map(value => value.toString().padStart(6, ' '));
      const row = `${(i + 1).toString().padStart(2, ' ')} ${rowValues.join('')}  ${P[i]}`;
      this.output.push(row);
    }

    this.output.push('');
  }

  private getFrequencyMap(array: number[]): Map<number, number> {
    const frequency = new Map<number, number>();
    for (const value of array) {
      frequency.set(value, (frequency.get(value) ?? 0) + 1);
    }
    return frequency;
  }

  private frequencyKey(freq: Map<number, number>): string {
    return [...freq.entries()]
      .sort(([a], [b]) => a - b)
      .map(([value, count]) => `${value}:${count}`)
      .join('|');
  }

  private isSameFrequency(a: Map<number, number>, b: Map<number, number>): boolean {
    if (a.size !== b.size) {
      return false;
    }
    for (const [key, value] of a) {
      if (b.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  private buildMapping(P: number[]): number[] {
    const mapping = new Array(this.n).fill(0);
    for (let i = 0; i < this.n; i += 1) {
      const index = P[i] - 1;
      if (index >= 0 && index < this.n) {
        mapping[index] = i + 1;
      }
    }
    return mapping;
  }

  private isSquare(matrix: number[][]): boolean {
    if (!Array.isArray(matrix) || matrix.length === 0) {
      return false;
    }
    return matrix.every(row => Array.isArray(row) && row.length === matrix.length);
  }

  private rangeToArray(start: number, end: number): number[] {
    const result: number[] = [];
    for (let i = start; i <= end; i += 1) {
      result.push(i);
    }
    return result;
  }
}
