import { configureStore } from '@reduxjs/toolkit';
import gameSlice from './gameSlice';
import systemSlice from './systemSlice';

const { reducer: gameReducer } = gameSlice;
const { reducer: systemReducer } = systemSlice;

const store = configureStore({
  reducer: {
    game: gameReducer,
    system: systemReducer,
  },
});

export default store;
