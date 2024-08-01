import { createSlice } from '@reduxjs/toolkit';

const systemSlice = createSlice({
  name: 'system',

  initialState: {
    isFullscreen: false,
    fps: 60,
  },
  reducers: {
    setIsFullscreen: (state, action) => {
      state.isFullscreen = action.payload;
    },
    setFps: (state, action) => {
      state.fps = action.payload;
    },
  },
});

export default systemSlice;
