/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import stepsReducer from './steps.meta.slice';
import graphReducer from './graph.slice';
import uiReducer from './ui.slice';

export const store = configureStore({
  reducer: {
    steps: stepsReducer,
    graph: graphReducer,
    ui: uiReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Entity adapters already handle serialization correctly
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
