import React, { useState } from 'react';

interface GraphMatrixInputProps {
  onSubmit: (matrix: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function GraphMatrixInput({ onSubmit, placeholder, defaultValue }: GraphMatrixInputProps) {
  const [matrixText, setMatrixText] = useState(defaultValue || '0,1,0,1,0\n1,0,1,1,0\n0,1,0,0,1\n1,1,0,0,1\n0,0,1,1,0');

  const handleSubmit = () => {
    onSubmit(matrixText);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-400">
        {placeholder || 'Задайте матрицу смежности. Используйте запятую в качестве разделителя'}
      </p>
      <textarea
        value={matrixText}
        onChange={(e) => setMatrixText(e.target.value)}
        className="w-full h-48 bg-neutral-900 border border-neutral-600 rounded-lg p-4 font-mono text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="0,1,0,1,0&#10;1,0,1,1,0&#10;0,1,0,0,1"
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
      >
        Отправить
      </button>
    </div>
  );
}

