import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; 
import shortenUrlReducer from './shortenUrlSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shortenUrl: shortenUrlReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;