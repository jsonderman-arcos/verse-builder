import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Error rendering app:", error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
      <div style="text-align: center;">
        <h1 style="color: #ef4444; margin-bottom: 8px;">Application Error</h1>
        <p style="color: #6b7280;">Please refresh the page or contact support</p>
      </div>
    </div>
  `;
}
