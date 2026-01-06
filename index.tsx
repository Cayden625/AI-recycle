
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("index.tsx: Application entry point reached.");

const mountApplication = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("index.tsx: Root element (#root) not found in DOM.");
    return;
  }

  try {
    console.log("index.tsx: Starting React 19 mount...");
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("index.tsx: Initial render triggered successfully.");
  } catch (err) {
    console.error("index.tsx: Critical error during mounting:", err);
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
      debugLog.style.display = 'block';
      debugLog.innerHTML += `<div style="color:red">Mount Failure: ${err.message}</div>`;
    }
  }
};

// Start the mount process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication);
} else {
  mountApplication();
}
