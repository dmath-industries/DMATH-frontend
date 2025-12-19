'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaProps {
  formula: string;

  displayMode?: boolean;

  className?: string;
}

export function Formula({ formula, displayMode = false, className = '' }: FormulaProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      containerRef.current.innerHTML = '';

      katex.render(formula, containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: '#ef4444',
        strict: false,
        trust: false,
      });
    } catch (error) {
      if (containerRef.current) {
        containerRef.current.textContent = formula;
        containerRef.current.className = 'katex-error';
      }
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
