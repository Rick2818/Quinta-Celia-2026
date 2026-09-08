import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

function mountApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } else {
    // Si el DOM aún no está listo, espera a DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountApp, { once: true });
    } else {
      setTimeout(mountApp, 50);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp, { once: true });
} else {
  mountApp();
}


