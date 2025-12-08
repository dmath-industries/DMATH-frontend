import { LocalCharacteristicsAlgorithm } from '../index';

function parseAdjacencyList(rows: string[]): number[][] {
  const size = rows.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  rows.forEach((row, from) => {
    for (const ch of row) {
      if (/\d/.test(ch)) {
        const to = Number(ch) - 1;
        if (to >= 0 && to < size) {
          matrix[from][to] += 1;
        }
      }
    }
  });

  return matrix;
}

function buildMatrices() {
  const inputData = [
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '3',
    '3',
    '2 2 6 6 8',
    '1 1 3 8',
    '2 3',
    '8',
    '5 7',
    '1 1 7',
    '5 6',
    '1 2 4',
    '0',
    '7',
    '7',
    '0',
    '0',
    '0',
    '0',
    '0',
    '2',
    '156',
    '4 8',
    '3 6 6',
    '2 6 6 7',
    '2 4 4 5 5',
    '5 7',
    '3 8',
  ];

  const quarter = inputData.length / 4;

  return {
    arcsG: parseAdjacencyList(inputData.slice(0, quarter)),
    edgesG: parseAdjacencyList(inputData.slice(quarter, 2 * quarter)),
    arcsH: parseAdjacencyList(inputData.slice(2 * quarter, 3 * quarter)),
    edgesH: parseAdjacencyList(inputData.slice(3 * quarter)),
  };
}

describe('LocalCharacteristicsAlgorithm', () => {
  it('совпадает с Java-версией по шагам и сопоставлению', () => {
    const matrices = buildMatrices();
    const algorithm = new LocalCharacteristicsAlgorithm();
    algorithm.initialize(matrices);

    const result = algorithm.executeDetailed();

    expect(result.verdict).toBe('isomorphic');
    expect(result.mapping).toEqual([6, 5, 7, 1, 8, 4, 3, 2]);
    expect(result.steps).toHaveLength(4);

    const [S0G, S0H, S1G, S1H] = result.steps;

    expect(S0G.matrix[0]).toEqual([0, 2, 0, 0, 0, 2, 0, 1]);
    expect(S0G.p).toEqual([1, 2, 3, 4, 3, 5, 6, 7]);
    expect(S0H.p).toEqual([4, 7, 6, 5, 2, 1, 3, 3]);

    expect(S1G.p).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(S1H.p).toEqual([4, 8, 7, 6, 2, 1, 3, 5]);

    expect(S1G.matrix[6][2]).toBe(1063);
    expect(S1H.matrix[1][6]).toBe(1073);
  });

  it('возвращает структурированный результат без форматирования строки', () => {
    const matrices = buildMatrices();
    const algorithm = new LocalCharacteristicsAlgorithm();
    algorithm.initialize(matrices);

    const detailed = algorithm.executeDetailed();
    const result = algorithm.execute();

    expect(result).toEqual(detailed);
  });

  it('бросает ошибку для неквадратных матриц', () => {
    const algorithm = new LocalCharacteristicsAlgorithm();
    expect(() =>
      algorithm.initialize({
        arcsG: [
          [0, 1],
          [1, 0],
          [0, 1],
        ],
        edgesG: [
          [0, 1],
          [1, 0],
        ],
        arcsH: [
          [0, 1],
          [1, 0],
        ],
        edgesH: [
          [0, 1],
          [1, 0],
        ],
      })
    ).toThrow('All matrices must be square and have the same size');
  });

  it('возвращает not-isomorphic при несовпадении частот меток', () => {
    const algorithm = new LocalCharacteristicsAlgorithm();
    const arcsG = [
      [0, 1],
      [0, 0],
    ];
    const edgesG = [
      [0, 0],
      [0, 0],
    ];
    const arcsH = [
      [0, 0],
      [0, 0],
    ];
    const edgesH = [
      [0, 0],
      [0, 0],
    ];

    algorithm.initialize({ arcsG, edgesG, arcsH, edgesH });
    const result = algorithm.executeDetailed();

    expect(result.verdict).toBe('not-isomorphic');
    expect(result.mapping).toBeUndefined();
  });
});
