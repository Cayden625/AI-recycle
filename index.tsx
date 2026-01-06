
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const mountApplication = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Critical Failure: Root element not found in DOM.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("EcoLearn successfully initialized.");
  } catch (err) {
    console.error("Mounting error:", err);
    rootElement.innerHTML = `<div style="padding: 20px; color: #b91c1c; font-weight: bold;">Mounting Error: ${err.message}</div>`;
  }
};

// Handle mounting regardless of DOM state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication);
} else {
  mountApplication();
}
