// Error Boundary Component
// Catches React component errors and displays fallback UI

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div id="center">
            <h1 className="error-boundary-title">
              Something went wrong
            </h1>
            <p className="error-boundary-message">
              An unexpected error occurred. We've been notified and we're working to fix the issue.
            </p>
            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-button error-boundary-button--primary"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="error-boundary-button error-boundary-button--secondary"
              >
                Go to Home
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>
                  Error Details (Development Only)
                </summary>
                <pre>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
