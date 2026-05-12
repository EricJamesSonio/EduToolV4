import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './styles/main.scss';
import Navbar from './components/Navbar';
import Approutes from './routes/Approutes';
import { OfflineBanner } from './components/ErrorDisplay/OfflineBanner';
import { createAppError, isAuthError, isNetworkError, isServerError } from './utils/errorHandler';

// Create a client with global error handlers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const appError = createAppError(error);

        // Don't retry for auth errors, network errors, or validation errors
        if (isAuthError(error) || isNetworkError(error) || appError.type === 'VALIDATION') {
          return false;
        }

        // Retry server errors up to 2 times
        if (isServerError(error) && failureCount < 2) {
          return true;
        }

        // Default: retry once
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: (failureCount, error) => {
        const appError = createAppError(error);

        // Don't retry for auth errors, network errors, or validation errors
        if (isAuthError(error) || isNetworkError(error) || appError.type === 'VALIDATION') {
          return false;
        }

        // Retry server errors once
        if (isServerError(error) && failureCount < 1) {
          return true;
        }

        return false;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <OfflineBanner />
          <Navbar />
          <Approutes />
          <Toaster
            position="top-right"
            toastOptions={{
              unstyled: true,
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
