'use client';

import { useAppSelector } from '@/shared/store';
import type { Step, StepExplanation } from '@/types';
import { Info, Calculator } from 'lucide-react';

interface StepExplanationPanelProps {
  currentStep: Step | null;
}

/**
 * Компонент панели пояснений к текущему шагу алгоритма
 */
export function StepExplanationPanel({ currentStep }: StepExplanationPanelProps) {
  const { currentIndex, totalSteps } = useAppSelector(state => state.steps);

  // Показываем панель всегда, когда есть шаги алгоритма
  // Если нет активного шага, показываем пустое состояние
  const hasActiveStep = currentIndex >= 0 && currentStep;

  // Используем explanation если есть, иначе description
  const explanation: StepExplanation | undefined = currentStep?.explanation;
  const description = currentStep?.description;

  // Если есть explanation, используем его, иначе создаем из description
  const displayExplanation: StepExplanation | null = hasActiveStep
    ? explanation || (description ? { type: 'general', text: description } : null)
    : null;

  // Показываем панель только если есть шаги
  if (totalSteps === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50 min-h-[100px]">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          {displayExplanation ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                {displayExplanation.text}
              </p>

              {displayExplanation.reason && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-blue-200 leading-relaxed whitespace-pre-wrap break-words">
                    {displayExplanation.reason}
                  </p>
                </div>
              )}

              {displayExplanation.formula && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-blue-300 mb-1">
                        Математическая формула:
                      </div>
                      <code className="text-sm text-blue-200 font-mono block whitespace-pre-wrap break-all">
                        {displayExplanation.formula}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {displayExplanation.currentPath && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-200 leading-relaxed whitespace-pre-wrap break-words">
                    {displayExplanation.currentPath}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">
              {currentIndex < 0
                ? 'Используйте панель управления для просмотра шагов алгоритма'
                : 'Нет пояснения для текущего шага'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
