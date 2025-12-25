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
    this.graph = directed ? new Graph({ type: 'directed' }) : new Graph({ type: 'undirected' });
  }

  getGraph(): Graph<NodeAttrs, EdgeAttrs> {
    return this.graph;
  }

  isDirected(): boolean {
    return this.graph.type === 'directed';
  }

  addNode(dto: NodeDTO): void {
    const attrs: NodeAttrs = {
      x: dto.x,
      y: dto.y,
      label: dto.label,
      radius: dto.radius ?? DEFAULT_NODE_ATTRS.radius!,
      color: dto.color ?? DEFAULT_NODE_ATTRS.color!,
      state: dto.state ?? DEFAULT_NODE_ATTRS.state!,
    };

    this.graph.addNode(dto.id, attrs);
  }

  removeNode(id: string): void {
    if (this.graph.hasNode(id)) {
      this.graph.dropNode(id);
    }
  }

  updateNode(id: string, attrs: Partial<NodeAttrs>): void {
    if (this.graph.hasNode(id)) {
      this.graph.mergeNodeAttributes(id, attrs);
    }
  }

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
    };
  }

  hasNode(id: string): boolean {
    return this.graph.hasNode(id);
  }

  getNodes(): string[] {
    return this.graph.nodes();
  }

  addEdge(dto: EdgeDTO): void {
    const attrs: EdgeAttrs = {
      weight: dto.weight ?? DEFAULT_EDGE_ATTRS.weight!,
      directed: dto.directed ?? DEFAULT_EDGE_ATTRS.directed!,
      color: dto.color ?? DEFAULT_EDGE_ATTRS.color!,
      width: dto.width ?? DEFAULT_EDGE_ATTRS.width!,
      state: dto.state ?? DEFAULT_EDGE_ATTRS.state!,
    };

    this.graph.addEdgeWithKey(dto.id, dto.source, dto.target, attrs);
  }

  removeEdge(id: string): void {
    if (this.graph.hasEdge(id)) {
      this.graph.dropEdge(id);
    }
  }

  updateEdge(id: string, attrs: Partial<EdgeAttrs>): void {
    if (this.graph.hasEdge(id)) {
      this.graph.mergeEdgeAttributes(id, attrs);
    }
  }

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

  hasEdge(id: string): boolean {
    return this.graph.hasEdge(id);
  }

  getEdges(): string[] {
    return this.graph.edges();
  }

  getNeighbors(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.neighbors(nodeId);
  }

  getOutEdges(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.outEdges(nodeId);
  }

  getInEdges(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.inEdges(nodeId);
  }

  getAllEdgesForNode(nodeId: string): string[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }
    return this.graph.edges(nodeId);
  }

  getDegree(nodeId: string): number {
    if (!this.graph.hasNode(nodeId)) {
      return 0;
    }
    return this.graph.degree(nodeId);
  }

  hasEdgeBetween(source: string, target: string): boolean {
    return this.graph.hasEdge(source, target);
  }

  clear(): void {
    this.graph.clear();
  }

  toDTO(): GraphDTO {
    const nodes: NodeDTO[] = this.graph.nodes().map(nodeId => {
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

    const edges: EdgeDTO[] = this.graph.edges().map(edgeId => {
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

  fromDTO(dto: GraphDTO): void {
    this.clear();

    for (const nodeDTO of dto.nodes) {
      this.addNode(nodeDTO);
    }

    for (const edgeDTO of dto.edges) {
      this.addEdge(edgeDTO);
    }
  }

  get nodeCount(): number {
    return this.graph.order;
  }

  get edgeCount(): number {
    return this.graph.size;
  }

  clone(): GraphModel {
    const cloned = new GraphModel(this.isDirected());
    cloned.fromDTO(this.toDTO());
    return cloned;
  }
}
