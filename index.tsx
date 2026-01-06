
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("index.tsx: Execution started...");

const mountApplication = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("index.tsx: Root element not found.");
    return;
  }

  try {
    console.log("index.tsx: Creating React root...");
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("index.tsx: Render called.");
  } catch (err) {
    console.error("index.tsx: Render error:", err);
  }
};

// Start the mount process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication);
} else {
  mountApplication();
}
