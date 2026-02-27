import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme } from './store/themeStore';

// Apply theme on initial load
const initTheme = () => {
  const stored = localStorage.getItem('theme');
  const theme = stored === 'light' ? 'light' : 'dark';
  applyTheme(theme);
};

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
