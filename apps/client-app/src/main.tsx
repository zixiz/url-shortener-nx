// apps/client-app/src/main.tsx
import { StrictMode, useEffect } from 'react'; // Added useEffect
import * as ReactDOM from 'react-dom/client';

import { Provider as ReduxProvider } from 'react-redux'; // Redux Provider
import { store } from './store/store.js';                // Your Redux store
import { initialAuthCheckCompleted } from './store/authSlice.js'; // Action

import App from './app/app.js';                        // Default root component from Nx/Vite
import ViteThemeRegistry from './components/ViteThemeRegistry.js'; // Your theme registry

import './styles.css'; // Or './styles.css', your main CSS file

const AppInitializer = () => {
  const dispatch = store.dispatch;
  useEffect(() => {
    dispatch(initialAuthCheckCompleted());
  }, [dispatch]);
  return null;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <ReduxProvider store={store}>
      <ViteThemeRegistry>
        <AppInitializer />
        <App />
      </ViteThemeRegistry>
    </ReduxProvider>
  </StrictMode>
);