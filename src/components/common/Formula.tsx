'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaProps {
  /**
   * LaTeX формула для рендеринга
   */
  formula: string;
  /**
   * Режим отображения: inline (в строке) или display (на отдельной строке)
   * @default 'inline'
   */
  displayMode?: boolean;
  /**
   * Дополнительные CSS классы
   */
  className?: string;
}

/**
 * Компонент для красивого отображения математических формул в LaTeX
 * Использует KaTeX для рендеринга формул с поддержкой темной темы
 */
export function Formula({ formula, displayMode = false, className = '' }: FormulaProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Очищаем контейнер перед рендерингом
      containerRef.current.innerHTML = '';

      // Рендерим формулу с помощью KaTeX
      katex.render(formula, containerRef.current, {
        displayMode,
        throwOnError: false, // Не выбрасывать ошибку, если формула невалидна
        errorColor: '#ef4444', // Красный цвет для ошибок
        strict: false, // Более мягкий режим парсинга
        trust: false, // Не доверять небезопасным командам
      });
    } catch (error) {
      // В случае ошибки отображаем исходный текст
      if (containerRef.current) {
        containerRef.current.textContent = formula;
        containerRef.current.className = 'katex-error';
      }
      // Не логируем ошибки в консоль, так как это может быть нормальным для простых формул
    }
  }, [formula, displayMode]);

  return (
    <span
      ref={containerRef}
      className={`katex-formula ${displayMode ? 'katex-display' : 'katex-inline'} ${className}`}
      style={{
        color: 'inherit',
      }}
    />
  );
}
