/**
 * Шаблоны текстов для пояснений
 */

import type { ExplanationType } from '@/types';

/**
 * Интерфейс для контекста шаблона
 */
export interface TemplateContext {
  [key: string]: string | number | undefined;
}

/**
 * Функция для подстановки значений в шаблон
 */
function interpolate(template: string, context: TemplateContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Создание пояснения с подстановкой значений
 */
export function createExplanation(
  type: ExplanationType,
  template: string,
  context: TemplateContext = {}
): { type: ExplanationType; text: string } {
  return {
    type,
    text: interpolate(template, context),
  };
}

/**
 * Общие шаблоны
 */
export const GeneralTemplates = {
  initialization: 'Инициализация: {message}',
  iteration: 'Итерация {n}/{total}: {action}',
  selection: 'Выбираем {item}',
  update: 'Обновляем {target}: {oldValue} → {newValue}',
  comparison: 'Сравниваем: {left} и {right}',
  decision: '{condition}, следовательно {action}',
  completion: 'Завершение: {message}',
};
