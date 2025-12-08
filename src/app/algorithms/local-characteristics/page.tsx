'use client';

import { useMemo, useState } from 'react';
import { LocalCharacteristicsAlgorithm } from '@/algorithms';

type MatrixKind = 'arcsG' | 'edgesG' | 'arcsH' | 'edgesH';

const defaultMatrices: Record<MatrixKind, string> = {
  arcsG: '0,1,0\n0,0,1\n1,0,0',
  edgesG: '0,1,0\n1,0,1\n0,1,0',
  arcsH: '0,1,0\n0,0,1\n1,0,0',
  edgesH: '0,1,0\n1,0,1\n0,1,0',
};

function parseMatrix(text: string): number[][] {
  const rows = text
    .trim()
    .split('\n')
    .map(row =>
      row
        .split(',')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
        .map(cell => Number(cell))
    );

  if (rows.length === 0) {
    throw new Error('Матрица пуста');
  }

  const size = rows.length;
  for (const row of rows) {
    if (row.length !== size) {
      throw new Error('Матрица должна быть квадратной');
    }
    row.forEach(value => {
      if (!Number.isFinite(value)) {
        throw new Error('Матрица содержит нечисловое значение');
      }
    });
  }

  return rows;
}

export default function LocalCharacteristicsPage() {
  const [matrices, setMatrices] = useState<Record<MatrixKind, string>>(defaultMatrices);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const areMatricesSameSize = useMemo(() => {
    try {
      const sizes = (Object.keys(matrices) as MatrixKind[]).map(
        key => parseMatrix(matrices[key]).length
      );
      return new Set(sizes).size === 1;
    } catch {
      return false;
    }
  }, [matrices]);

  const handleChange = (key: MatrixKind, value: string) => {
    setMatrices(prev => ({ ...prev, [key]: value }));
  };

  const handleRun = () => {
    setError('');
    setResult('');

    try {
      const arcsG = parseMatrix(matrices.arcsG);
      const edgesG = parseMatrix(matrices.edgesG);
      const arcsH = parseMatrix(matrices.arcsH);
      const edgesH = parseMatrix(matrices.edgesH);

      const algo = new LocalCharacteristicsAlgorithm();
      algo.initialize({ arcsG, edgesG, arcsH, edgesH });
      const output = algo.execute();
      setResult(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось выполнить алгоритм';
      setError(message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-blue-400">Алгоритм</p>
        <h1 className="text-2xl font-semibold text-white">Локальные характеристики</h1>
        <p className="text-neutral-300">
          Проверка изоморфизма двух ориентированных графов по их матрицам дуг и рёбер. Визуализация
          пока отсутствует — результат выводится в текстовом виде.
        </p>
        {!areMatricesSameSize && (
          <p className="text-sm text-amber-400">
            Матрицы должны быть квадратными и одинакового размера.
          </p>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <MatrixInput
          label="Матрица дуг G (arcsG)"
          value={matrices.arcsG}
          onChange={value => handleChange('arcsG', value)}
        />
        <MatrixInput
          label="Матрица рёбер G (edgesG)"
          value={matrices.edgesG}
          onChange={value => handleChange('edgesG', value)}
        />
        <MatrixInput
          label="Матрица дуг H (arcsH)"
          value={matrices.arcsH}
          onChange={value => handleChange('arcsH', value)}
        />
        <MatrixInput
          label="Матрица рёбер H (edgesH)"
          value={matrices.edgesH}
          onChange={value => handleChange('edgesH', value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRun}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          Запустить алгоритм
        </button>
        <button
          type="button"
          onClick={() => setMatrices(defaultMatrices)}
          className="bg-neutral-800 border border-neutral-700 text-neutral-200 hover:border-neutral-500 px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          Сбросить к примеру
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {result && (
        <pre className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-100 overflow-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}

      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-200 space-y-2">
        <p className="font-semibold text-white">Как работает</p>
        <ul className="list-disc list-inside space-y-1 text-neutral-300">
          <li>S₀ формируется из матриц дуг и рёбер.</li>
          <li>Для каждой итерации Sₖ вычисляются метки Pₖ по частотам значений строк.</li>
          <li>Если максимальная метка достигает n и частоты совпадают, графы изоморфны.</li>
        </ul>
        <p className="text-neutral-400">
          Формат ввода: строки матрицы через перевод строки, значения через запятую. Матрицы должны
          быть квадратными и одинакового размера.
        </p>
      </div>
    </div>
  );
}

interface MatrixInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function MatrixInput({ label, value, onChange }: MatrixInputProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-100">{label}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-36 bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="0,1,0&#10;1,0,1&#10;0,1,0"
      />
    </div>
  );
}
