import { createSlice } from '@reduxjs/toolkit';

const { floor } = Math;

const gameSlice = createSlice({
  name: 'game',

  initialState: {
    mode: 'loading',
    stageIndex: 0,//////
    stageName: '',
    elapsedTime: 0,
    score: null,
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
    nextStage: (state) => {
      state.stageName += 1;
    },
    rewindStage: (state) => {
      state.stageName -= 1;
    },
  },
});

export default gameSlice;
