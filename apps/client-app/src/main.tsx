import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { Provider as ReduxProvider } from 'react-redux';
import { store } from './features/core/store/store.js';

import App from './app.js';
import ViteThemeRegistry from './features/theme/components/ViteThemeRegistry.js';

import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <ReduxProvider store={store}>
      <ViteThemeRegistry>
          <App /> 
      </ViteThemeRegistry>
    </ReduxProvider>
  </StrictMode>
);