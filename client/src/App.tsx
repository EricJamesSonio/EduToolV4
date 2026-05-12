import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import './styles/main.scss';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

// Navbar Component
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-brand">
        <div className="navbar-logo">
          ET
        </div>
        <span>EduTool</span>
      </div>

      {/* Desktop Navigation */}
      <ul className="navbar-nav desktop-nav">
        <li className="nav-item">
          <a href="/" className="nav-link">Home</a>
        </li>
        <li className="nav-item">
          <a href="/about" className="nav-link">About Us</a>
        </li>
        <li className="nav-item">
          <a href="/theme" className="nav-link">Theme</a>
        </li>
        <li className="nav-item">
          <a href="/login" className="nav-link">Sign In</a>
        </li>
      </ul>

      {/* Language Selector */}
      <div className="navbar-language">
        <button
          className="language-button"
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
        >
          <span>🇺🇸</span>
          <span>English</span>
          <span>▼</span>
        </button>

        {isLanguageOpen && (
          <div className="language-dropdown">
            <div className="language-option">
              <span>🇺🇸</span>
              <span>English</span>
            </div>
            <div className="language-option">
              <span>🇪🇸</span>
              <span>Spanish</span>
            </div>
            <div className="language-option">
              <span>🇫🇷</span>
              <span>French</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="navbar-toggle mobile-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
    </nav>
  );
};

// HomePage Component
const HomePage = () => {
  return (
    <div className="hero">
      <div className="hero-content">
        {/* Main heading */}
        <h1 className="hero-title">
          The free, fun, and effective way to learn a language!
        </h1>

        {/* Subheading */}
        <p className="hero-subtitle">
          Learn with EduTool and make your educational journey amazing. Join millions of learners and start your adventure today!
        </p>

        {/* CTA Buttons */}
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg">
            GET STARTED
          </button>

          <button className="btn btn-secondary btn-lg">
            I ALREADY HAVE AN ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
};

// Other pages
const LoginPage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="page-title">
        Sign In
      </h1>
      <p className="page-description">
        Login page coming soon!
      </p>
      <a href="/" className="btn btn-primary">Back to Home</a>
    </div>
  </div>
);

const DashboardPage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="page-title">
        Dashboard
      </h1>
      <p className="page-description">
        Dashboard coming soon!
      </p>
      <a href="/" className="btn btn-primary">Back to Home</a>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="page-title">
        Page Not Found
      </h1>
      <p className="page-description">
        The page you're looking for doesn't exist.
      </p>
      <a href="/" className="btn btn-primary">Back to Home</a>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/about" element={<div className="page">
              <div className="page-content">
                <h1 className="page-title">
                  About Us
                </h1>
                <p className="page-description">
                  About page coming soon!
                </p>
                <a href="/" className="btn btn-primary">Back to Home</a>
              </div>
            </div>} />
            <Route path="/theme" element={<div className="page">
              <div className="page-content">
                <h1 className="page-title">
                  Theme Settings
                </h1>
                <p className="page-description">
                  Theme switcher coming soon!
                </p>
                <a href="/" className="btn btn-primary">Back to Home</a>
              </div>
            </div>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
