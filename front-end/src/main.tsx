import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // Data fresh selama 10 menit
      gcTime: 60 * 60 * 1000, // Cache bertahan 60 menit
      refetchOnWindowFocus: false, // Jangan refetch saat switch tab
      refetchOnMount: false, // Jangan refetch saat component mount
      refetchOnReconnect: false, // Jangan refetch saat reconnect internet
      retry: 1, // Retry 1x kalau gagal
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
