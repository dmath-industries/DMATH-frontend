/**
 * Utility functions
 * Общие вспомогательные функции для приложения
 */

/**
 * Объединяет имена классов в одну строку (class names)
 * @param classes - Массив имён классов (включая undefined/null/false)
 * @returns Строка с объединёнными классами
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Генерирует уникальный ID
 * @param prefix - Префикс для ID (по умолчанию 'id')
 * @returns Уникальная строка ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce функция - откладывает выполнение до прекращения вызовов
 * @param func - Функция для debounce
 * @param wait - Время задержки в мс
 * @returns Debounced функция
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle функция - ограничивает частоту вызовов
 * @param func - Функция для throttle
 * @param limit - Минимальный интервал между вызовами в мс
 * @returns Throttled функция
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

