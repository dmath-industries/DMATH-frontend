/**
 * Redux slice для управления шагами алгоритма
 * Хранит только курсор/статусы, сами шаги — в IndexedDB (Dexie)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StepsState {
  sessionId: string | null; // ID текущей сессии в IndexedDB
  currentIndex: number; // текущий индекс шага (-1 = начальное состояние)
  totalSteps: number; // общее количество шагов (из метаданных сессии)
  playing: boolean;
  speedMs: number;
  selectedStepId: string | null; // ID выбранного шага для навигации
}

const initialState: StepsState = {
  sessionId: null,
  currentIndex: -1,
  totalSteps: 0,
  playing: false,
  speedMs: 1000, // 1 секунда между шагами по умолчанию
  selectedStepId: null,
};

const stepsSlice = createSlice({
  name: 'steps',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ sessionId: string; totalSteps: number }>) {
      state.sessionId = action.payload.sessionId;
      state.totalSteps = action.payload.totalSteps;
      state.currentIndex = -1;
      state.playing = false;
      state.selectedStepId = null;
    },

    setIndex(state, action: PayloadAction<number>) {
      const newIndex = action.payload;
      if (newIndex >= -1 && newIndex < state.totalSteps) {
        state.currentIndex = newIndex;
      }
    },

    nextStep(state) {
      if (state.currentIndex < state.totalSteps - 1) {
        state.currentIndex += 1;
      } else {
        state.playing = false;
      }
    },

    prevStep(state) {
      if (state.currentIndex > -1) {
        state.currentIndex -= 1;
      }
    },

    play(state) {
      if (state.totalSteps > 0) {
        state.playing = true;
      }
    },

    pause(state) {
      state.playing = false;
    },

    setSpeed(state, action: PayloadAction<number>) {
      state.speedMs = action.payload;
    },

    setSelectedStepId(state, action: PayloadAction<string | null>) {
      state.selectedStepId = action.payload;
    },

    reset(state) {
      state.sessionId = null;
      state.currentIndex = -1;
      state.totalSteps = 0;
      state.playing = false;
      state.selectedStepId = null;
    },

    updateTotalSteps(state, action: PayloadAction<number>) {
      state.totalSteps = action.payload;
    },
  },
});

export const {
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
} = stepsSlice.actions;

export default stepsSlice.reducer;
