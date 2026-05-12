import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './styles/main.scss';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Import pages (we'll create these later)
const HomePage = () => <div className="p-6"><h1 className="text-2xl font-bold">Welcome to EduTool</h1></div>;
const LoginPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Login</h1></div>;
const DashboardPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Dashboard</h1></div>;
const NotFoundPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Page Not Found</h1></div>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
