/**
 * UI Element types
 * Типы для общих компонентов интерфейса
 */

/**
 * Тип пропсов для компонента кнопки
 */
export interface IBtn {
  title: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Тип данных для элемента списка алгоритмов
 */
export interface IAlgorithmsItem {
  title: string;
  img?: string;
  href?: string;
}

/**
 * Тип данных для элемента истории
 */
export interface IHistory {
  title: string;
  date: string;
}