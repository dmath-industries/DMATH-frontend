/**
 * Redux slice для UI состояния
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface UIState {
  viewport: ViewportState;
  theme: 'light' | 'dark';
  selectedAlgorithm: string;
  sidebarOpen: boolean;
}

const initialState: UIState = {
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  theme: 'light',
  selectedAlgorithm: 'roberts-flores',
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewport(state, action: PayloadAction<Partial<ViewportState>>) {
      state.viewport = { ...state.viewport, ...action.payload };
    },
    
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    
    selectAlgorithm(state, action: PayloadAction<string>) {
      state.selectedAlgorithm = action.payload;
    },
    
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  setViewport,
  setTheme,
  selectAlgorithm,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

export default uiSlice.reducer;

