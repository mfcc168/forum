'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Simplified fallback rendering to avoid potential issues
      if (this.props.fallback) {
        try {
          const FallbackComponent = this.props.fallback;
          return React.createElement(FallbackComponent, {
            error: this.state.error,
            reset: this.reset
          });
        } catch (fallbackError) {
          console.error('Fallback component failed:', fallbackError);
          // Fall through to default error UI
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <div className="space-x-4">
                <button
                  onClick={this.reset}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Try again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Refresh page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-800 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;