/**
 * GraphModel — обёртка над Graphology для управления графом
 * Предоставляет удобные методы для работы с узлами и рёбрами
 * Поддерживает сериализацию/десериализацию через DTO
 */

import Graph from 'graphology';
import {
  NodeDTO,
  EdgeDTO,
  GraphDTO,
  NodeAttrs,
  EdgeAttrs,
  DEFAULT_NODE_ATTRS,
  DEFAULT_EDGE_ATTRS,
} from '@/types';

export class GraphModel {
  private graph: Graph<NodeAttrs, EdgeAttrs>;

  constructor(directed = false) {
    this.graph = directed 
      ? new Graph({ type: 'directed' })
      : new Graph({ type: 'undirected' });
  }

  /**
   * Получить внутренний граф Graphology
   */
  getGraph(): Graph<NodeAttrs, EdgeAttrs> {
    return this.graph;
  }

  /**
   * Проверить, является ли граф направленным
   */
  isDirected(): boolean {
    return this.graph.type === 'directed';
  }

  /**
   * Добавить узел
   */
  addNode(dto: NodeDTO): void {
    const attrs: NodeAttrs = {
      x: dto.x,
      y: dto.y,
      label: dto.label,
      radius: dto.radius ?? DEFAULT_NODE_ATTRS.radius!,
      color: dto.color ?? DEFAULT_NODE_ATTRS.color!,
      state: dto.state ?? DEFAULT_NODE_ATTRS.state!,
      distance: dto.distance,
    };

    this.graph.addNode(dto.id, attrs);
  }

  /**
   * Удалить узел
   */
  removeNode(id: string): void {
    if (this.graph.hasNode(id)) {
      this.graph.dropNode(id);
    }
  }

  /**
   * Обновить атрибуты узла
   */
  updateNode(id: string, attrs: Partial<NodeAttrs & { distance?: number }>): void {
    if (this.graph.hasNode(id)) {
      this.graph.mergeNodeAttributes(id, attrs);
    }
  }

  /**
   * Получить узел как DTO
   */
  getNode(id: string): NodeDTO | null {
    if (!this.graph.hasNode(id)) {
      return null;
    }

    const attrs = this.graph.getNodeAttributes(id);
    return {
      id,
      x: attrs.x,
      y: attrs.y,
      label: attrs.label,
      radius: attrs.radius,
      color: attrs.color,
      state: attrs.state,
      distance: (attrs as any).distance,
    };
  }

  /**
   * Проверить существование узла
   */
  hasNode(id: string): boolean {
    return this.graph.hasNode(id);
  }

  /**
   * Получить все узлы
   */
  getNodes(): string[] {
    return this.graph.nodes();
  }

  /**
   * Добавить ребро
   */
  addEdge(dto: EdgeDTO): void {
    const attrs: EdgeAttrs = {
      weight: dto.weight ?? DEFAULT_EDGE_ATTRS.weight!,
      directed: dto.directed ?? DEFAULT_EDGE_ATTRS.directed!,
      color: dto.color ?? DEFAULT_EDGE_ATTRS.color!,
      width: dto.width ?? DEFAULT_EDGE_ATTRS.width!,
      state: dto.state ?? DEFAULT_EDGE_ATTRS.state!,
    };

    // EdgeDTO всегда содержит id, используем addEdgeWithKey
    this.graph.addEdgeWithKey(dto.id, dto.source, dto.target, attrs);
  }

  /**
   * Удалить ребро
   */
  removeEdge(id: string): void {
    if (this.graph.hasEdge(id)) {
      this.graph.dropEdge(id);
    }
  }

  /**
   * Обновить атрибуты ребра
   */
  updateEdge(id: string, attrs: Partial<EdgeAttrs>): void {
    if (this.graph.hasEdge(id)) {
      this.graph.mergeEdgeAttributes(id, attrs);
    }
  }

  /**
   * Получить ребро как DTO
   */
  getEdge(id: string): EdgeDTO | null {
    if (!this.graph.hasEdge(id)) {
      return null;
    }

    const attrs = this.graph.getEdgeAttributes(id);
    const source = this.graph.source(id);
    const target = this.graph.target(id);

    return {
      id,
      source,
      target,
      weight: attrs.weight,
      directed: attrs.directed,
      color: attrs.color,
      width: attrs.width,
      state: attrs.state,
    };
  }

  /**
   * Проверить существование ребра
   */
  hasEdge(id: string): boolean {
    return this.graph.hasEdge(id);
  }

  /**
   * Получить все рёбра
   */
  getEdges(): string[] {
    return this.graph.edges();
  }

  /**
   * Получить смежные узлы
   */
  getNeighbors(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.neighbors(nodeId);
  }

  /**
   * Получить исходящие рёбра
   */
  getOutEdges(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.outEdges(nodeId);
  }

  /**
   * Получить входящие рёбра
   */
  getInEdges(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.inEdges(nodeId);
  }

  /**
   * Получить все рёбра узла (входящие + исходящие)
   */
  getAllEdgesForNode(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.edges(nodeId);
  }

  /**
   * Получить степень узла
   */
  getDegree(nodeId: string): number {
    if (!this.graph.hasNode(nodeId)) {
      return 0;
    }
    return this.graph.degree(nodeId);
  }

  /**
   * Проверить наличие ребра между двумя узлами
   */
  hasEdgeBetween(source: string, target: string): boolean {
    return this.graph.hasEdge(source, target);
  }

  /**
   * Очистить граф
   */
  clear(): void {
    this.graph.clear();
  }

  /**
   * Сериализовать в DTO
   */
  toDTO(): GraphDTO {
    const nodes: NodeDTO[] = this.graph.nodes().map((nodeId) => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      return {
        id: nodeId,
        x: attrs.x,
        y: attrs.y,
        label: attrs.label,
        radius: attrs.radius,
        color: attrs.color,
        state: attrs.state,
      };
    });

    const edges: EdgeDTO[] = this.graph.edges().map((edgeId) => {
      const attrs = this.graph.getEdgeAttributes(edgeId);
      const source = this.graph.source(edgeId);
      const target = this.graph.target(edgeId);

      return {
        id: edgeId,
        source,
        target,
        weight: attrs.weight,
        directed: attrs.directed,
        color: attrs.color,
        width: attrs.width,
        state: attrs.state,
      };
    });

    return { nodes, edges };
  }

  /**
   * Восстановить из DTO
   */
  fromDTO(dto: GraphDTO): void {
    this.clear();

    // Добавляем узлы
    for (const nodeDTO of dto.nodes) {
      this.addNode(nodeDTO);
    }

    // Добавляем рёбра
    for (const edgeDTO of dto.edges) {
      this.addEdge(edgeDTO);
    }
  }

  /**
   * Получить количество узлов
   */
  get nodeCount(): number {
    return this.graph.order;
  }

  /**
   * Получить количество рёбер
   */
  get edgeCount(): number {
    return this.graph.size;
  }

  /**
   * Клонировать граф
   */
  clone(): GraphModel {
    const cloned = new GraphModel(this.isDirected());
    cloned.fromDTO(this.toDTO());
    return cloned;
  }
}

