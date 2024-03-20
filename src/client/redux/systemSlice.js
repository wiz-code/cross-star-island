import { createSlice } from '@reduxjs/toolkit';

const systemSlice = createSlice({
  name: 'system',

  initialState: {
    gameStarted: false,
    isFullscreen: false,
  },
  reducers: {
    setGameStarted: (state, action) => {
      state.gameStarted = action.payload;
    },
    setIsFullscreen: (state, action) => {
      state.isFullscreen = action.payload;
    },
  },
});

export default systemSlice;
