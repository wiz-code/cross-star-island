import { createSlice } from '@reduxjs/toolkit';

import { Meta } from '../common';

const meta = new Map(Meta);
const stages = new Map(meta.get('stages'));
const [firstStage] = Array.from(stages.keys());

const { floor } = Math;

const gameSlice = createSlice({
  name: 'game',

  initialState: {
    mode: 'unstarted',
    stageName: firstStage,
    elapsedTime: 0,
    score: null,
    visibleFps: true,
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
    visibleFps: (state, action) => {
      state.visibleFps = action.payload;
    },
    toggleVRM: (state, action) => {
      state.vrm = action.payload;
    },
  },
});

export default gameSlice;
