import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (import.meta.env.DEV) {
  const isExtensionNoise = (value = '') =>
    value.startsWith('chrome-extension://') ||
    value.startsWith('moz-extension://') ||
    value.includes('onboarding.js');

  window.addEventListener('error', (event) => {
    const source = event.filename || '';
    if (isExtensionNoise(source)) {
      event.preventDefault();
      console.info('[dev] Ignored browser-extension error:', source);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const stack = typeof reason?.stack === 'string' ? reason.stack : '';
    if (isExtensionNoise(stack)) {
      event.preventDefault();
      console.info('[dev] Ignored browser-extension rejection');
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
