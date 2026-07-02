import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './app/routes';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check your index.html file.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      richColors
      expand
      closeButton
      theme="system"
    />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      if (import.meta.env.DEV) {
        console.debug('Service worker registration failed:', err);
      }
    });
  });
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});