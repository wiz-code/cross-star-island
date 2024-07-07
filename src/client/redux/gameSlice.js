import { createSlice } from '@reduxjs/toolkit';

const { floor } = Math;

const gameSlice = createSlice({
  name: 'game',

  initialState: {
    mode: 'unstarted',
    stageName: '',
    elapsedTime: 0,
    score: null,
    fps: true,
    vrm: true,
  },
  reducers: {
    setElapsedTime: (state, action) => {
      const value = action.payload.toFixed(2);
      state.elapsedTime = value;
    },
    setScore: (state, action) => {
      state.score = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setStage: (state, action) => {
      state.stageName = action.payload;
    },
    visibleFPS: (state, action) => {
      state.fps = action.payload;
    },
    toggleVRM: (state, action) => {
      state.vrm = action.payload;
    },
  },
});

export default gameSlice;
