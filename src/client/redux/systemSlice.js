import { createSlice } from '@reduxjs/toolkit';

const systemSlice = createSlice({
  name: 'system',

  initialState: {
    isFullscreen: false,
  },
  reducers: {
    setIsFullscreen: (state, action) => {
      state.isFullscreen = action.payload;
    },
  },
});

export default systemSlice;
