import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssVarsProvider, CssBaseline } from '@mui/joy';
import App from './App';

// Import Google Inter font styles from Fontsource
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

// Create a new TanStack Query Client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CssVarsProvider defaultMode="dark">
        <CssBaseline />
        <App />
      </CssVarsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
