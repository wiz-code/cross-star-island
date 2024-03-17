import { createSlice } from '@reduxjs/toolkit';

const gameSlice = createSlice({
  name: 'game',

  initialState: {
    mode: 'loading',
    stageIndex: 0,
  },
  reducers: {
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setStage: (state, action) => {
      state.stageIndex = action.payload;
    },
    nextStage: (state) => {
      state.stageIndex += 1;
    },
    rewindStage: (state) => {
      state.stageIndex -= 1;
    },
  },
});

export default gameSlice;
