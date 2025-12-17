/**
 * Форматтеры для значений в пояснениях
 */

/**
 * Форматирование метки узла (конвертация числового ID в букву)
 */
export function formatNodeLabel(nodeId: string | number): string {
  const numericId =
    typeof nodeId === 'string' && /^\d+$/.test(nodeId)
      ? Number(nodeId)
      : typeof nodeId === 'number'
        ? nodeId
        : NaN;

  if (Number.isInteger(numericId) && numericId >= 0) {
    return String.fromCharCode('a'.charCodeAt(0) + numericId);
  }
  return String(nodeId);
}

/**
 * Форматирование веса (обработка бесконечности)
 */
export function formatWeight(weight: number): string {
  if (!Number.isFinite(weight)) {
    return weight === Infinity ? '∞' : '-∞';
  }
  return weight.toString();
}

/**
 * Форматирование пути (последовательности узлов)
 */
export function formatPath(path: (string | number)[], separator = ' → '): string {
  return path.map(formatNodeLabel).join(separator);
}

/**
 * Форматирование ребра (u → v)
 */
export function formatEdge(from: string | number, to: string | number, directed = true): string {
  const fromLabel = formatNodeLabel(from);
  const toLabel = formatNodeLabel(to);
  return directed ? `${fromLabel} → ${toLabel}` : `${fromLabel} — ${toLabel}`;
}

/**
 * Форматирование расстояния (с учетом бесконечности)
 */
export function formatDistance(dist: number): string {
  if (dist === Infinity) {
    return '∞';
  }
  if (dist === -Infinity) {
    return '-∞';
  }
  return dist.toString();
}
