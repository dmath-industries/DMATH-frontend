/**
 * Redux slice для управления графом
 * Использует RTK Entity Adapters для эффективного управления узлами и рёбрами
 */

import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { NodeDTO, EdgeDTO } from '@/types';

// Entity adapters для узлов и рёбер
// selectId не нужен, т.к. NodeDTO и EdgeDTO имеют поле 'id'
const nodesAdapter = createEntityAdapter<NodeDTO>({
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

const edgesAdapter = createEntityAdapter<EdgeDTO>({
  sortComparer: (a, b) => a.id.localeCompare(b.id),
});

interface GraphState {
  nodes: ReturnType<typeof nodesAdapter.getInitialState>;
  edges: ReturnType<typeof edgesAdapter.getInitialState>;
  dirtyIds: string[];
}

const initialState: GraphState = {
  nodes: nodesAdapter.getInitialState(),
  edges: edgesAdapter.getInitialState(),
  dirtyIds: [],
};

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    setGraph(state, action: PayloadAction<{ nodes: NodeDTO[]; edges: EdgeDTO[] }>) {
      nodesAdapter.setAll(state.nodes, action.payload.nodes);
      edgesAdapter.setAll(state.edges, action.payload.edges);
      state.dirtyIds = [];
    },
    
    addNode(state, action: PayloadAction<NodeDTO>) {
      nodesAdapter.addOne(state.nodes, action.payload);
    },
    
    updateNode(state, action: PayloadAction<{ id: string; changes: Partial<NodeDTO> }>) {
      nodesAdapter.updateOne(state.nodes, action.payload);
    },
    
    removeNode(state, action: PayloadAction<string>) {
      nodesAdapter.removeOne(state.nodes, action.payload);
    },
    
    setNodes(state, action: PayloadAction<NodeDTO[]>) {
      nodesAdapter.setAll(state.nodes, action.payload);
    },
    
    addEdge(state, action: PayloadAction<EdgeDTO>) {
      edgesAdapter.addOne(state.edges, action.payload);
    },
    
    updateEdge(state, action: PayloadAction<{ id: string; changes: Partial<EdgeDTO> }>) {
      edgesAdapter.updateOne(state.edges, action.payload);
    },
    
    removeEdge(state, action: PayloadAction<string>) {
      edgesAdapter.removeOne(state.edges, action.payload);
    },
    
    setEdges(state, action: PayloadAction<EdgeDTO[]>) {
      edgesAdapter.setAll(state.edges, action.payload);
    },
    
    markDirty(state, action: PayloadAction<string | string[]>) {
      const ids = Array.isArray(action.payload) ? action.payload : [action.payload];
      
      for (const id of ids) {
        if (!state.dirtyIds.includes(id)) {
          state.dirtyIds.push(id);
        }
      }
    },
    
    clearDirty(state) {
      state.dirtyIds = [];
    },
    
    clearGraph(state) {
      nodesAdapter.removeAll(state.nodes);
      edgesAdapter.removeAll(state.edges);
      state.dirtyIds = [];
    },
  },
});

export const {
  setGraph,
  addNode,
  updateNode,
  removeNode,
  setNodes,
  addEdge,
  updateEdge,
  removeEdge,
  setEdges,
  markDirty,
  clearDirty,
  clearGraph,
} = graphSlice.actions;

// Selectors
export const {
  selectAll: selectAllNodes,
  selectById: selectNodeById,
  selectIds: selectNodeIds,
} = nodesAdapter.getSelectors((state: { graph: GraphState }) => state.graph.nodes);

export const {
  selectAll: selectAllEdges,
  selectById: selectEdgeById,
  selectIds: selectEdgeIds,
} = edgesAdapter.getSelectors((state: { graph: GraphState }) => state.graph.edges);

export default graphSlice.reducer;

