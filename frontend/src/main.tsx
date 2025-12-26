import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import './index.css';

// Initialize Sentry
Sentry.init({
  dsn: 'https://f63ed9f83abe1c18b6c1cd65cb3c8cd0@o4510280685977605.ingest.us.sentry.io/4510601560064000',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in development
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  // Environment
  environment: (import.meta as any).env?.MODE || 'development',
  // Release tracking
  release: (import.meta as any).env?.VITE_APP_VERSION || 'dev',
});

// Force cache bust v2
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
