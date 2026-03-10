import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalInstance } from './app/authConfig';
import App from './app/App.tsx';
import './styles/index.css';
import { QUERY_CONFIG } from './app/config/queryConfig';

/**
 * Global QueryClient instance.
 * Default settings are applied here; individual queries can override via QUERY_CONFIG.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_CONFIG.APPS.retry,
      staleTime: QUERY_CONFIG.APPS.staleTime,
      gcTime: QUERY_CONFIG.APPS.gcTime,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {msalInstance ? (
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      ) : (
        <App />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
 