import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../auth/state/authSlice';
import shortenUrlReducer from '../../urls/state/shortenUrlSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shortenUrl: shortenUrlReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;