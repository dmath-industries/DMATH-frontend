/**
 * Центральная точка экспорта store
 */

export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';

// Экспорт actions из steps.meta.slice
export {
  setSession,
  setIndex,
  nextStep,
  prevStep,
  play,
  pause,
  setSpeed,
  setSelectedStepId,
  reset,
  updateTotalSteps,
} from './steps.meta.slice';

// Экспорт actions из graph.slice
export {
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
  selectAllNodes,
  selectNodeById,
  selectNodeIds,
  selectAllEdges,
  selectEdgeById,
  selectEdgeIds,
} from './graph.slice';

// Экспорт actions из ui.slice
export { setViewport, setTheme, selectAlgorithm, toggleSidebar, setSidebarOpen } from './ui.slice';
