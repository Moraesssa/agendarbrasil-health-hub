
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './utils/mockInit';
import GlobalErrorBoundary from './components/system/GlobalErrorBoundary.tsx';

// Initialize advanced logger
import './utils/advancedLogger';


// Ensure React is available globally to prevent createContext issues
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).React = React;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
