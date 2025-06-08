import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; 
// import themeReducer from './themeSlice'; // Example for later
// import snackbarReducer from './snackbarSlice'; // Example for later

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // theme: themeReducer,
    // snackbar: snackbarReducer,
  },
  // Middleware is automatically configured by RTK with common defaults (like thunk for async actions)
  // You can customize middleware here if needed:
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(customMiddleware),
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;