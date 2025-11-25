/**
 * Graph utilities
 * Вспомогательные функции для работы с графами
 */

import Graph from 'graphology';
import type { GraphDTO } from '@/types';

/**
 * Результат конвертации GraphDTO в graphology Graph
 */
export interface GraphConversionResult {
  /** Graphology граф (без атрибутов, только структура) */
  graph: Graph;
  /** Маппинг для поиска ID рёбер: "source-target" -> edgeId */
  edgeIdMap: Map<string, string>;
}

/**
 * Конвертировать GraphDTO в легковесный graphology Graph
 * Создаёт граф без атрибутов узлов/рёбер, только структуру
 * Также создаёт маппинг для поиска ID рёбер по source-target
 * 
 * @param graphDTO - DTO графа
 * @param directed - Создать направленный граф (по умолчанию true)
 * @returns Граф и маппинг ID рёбер
 */
export function graphDTOToGraphology(
  graphDTO: GraphDTO,
  directed = true
): GraphConversionResult {
  const graph = new Graph({ type: directed ? 'directed' : 'undirected' });
  const edgeIdMap = new Map<string, string>();

  // Добавить узлы
  for (const node of graphDTO.nodes) {
    graph.addNode(node.id);
  }

  // Добавить рёбра и создать маппинг для поиска ID
  for (const edge of graphDTO.edges) {
    graph.addEdge(edge.source, edge.target);
    edgeIdMap.set(`${edge.source}-${edge.target}`, edge.id);

    // Если ребро не направленное, добавить обратное
    if (!edge.directed) {
      graph.addEdge(edge.target, edge.source);
      edgeIdMap.set(`${edge.target}-${edge.source}`, edge.id);
    }
  }

  return { graph, edgeIdMap };
}

