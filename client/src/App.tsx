import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './styles/main.scss';
import Navbar from './components/Navbar';
import Approutes from './routes/Approutes';
import { OfflineBanner } from './components/ErrorDisplay/OfflineBanner';
import { queryClient } from './query/globalQueryClient';

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
