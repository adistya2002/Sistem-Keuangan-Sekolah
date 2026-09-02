import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress known third-party library deprecation warnings (e.g. Recharts defaultProps)
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (
      firstArg.includes('defaultProps will be removed') ||
      firstArg.includes('Support for defaultProps') ||
      firstArg.includes('validateDOMNesting') ||
      firstArg.includes('findDOMNode is deprecated')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

