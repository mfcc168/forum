/**
 * Error Boundary Tests
 * 
 * Tests error boundaries, error handling patterns, and graceful degradation
 * to ensure the application remains stable when errors occur.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import React from 'react'
import { render as testRender } from '@/tests/utils/test-utils'

// Mock error tracking
const mockErrorTracking = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn()
}

vi.mock('@/lib/utils/error-tracking', () => ({
  errorTracking: mockErrorTracking
}))

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
  vi.clearAllMocks()
})

afterEach(() => {
  console.error = originalConsoleError
  vi.resetAllMocks()
})

describe('Error Boundary Tests', () => {
  // Component that throws an error
  const ThrowError = ({ shouldThrow = false, message = 'Test error' }: { 
    shouldThrow?: boolean; 
    message?: string 
  }) => {
    if (shouldThrow) {
      throw new Error(message)
    }
    return <div>Component rendered successfully</div>
  }

  // Simple error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )

  describe('Basic Error Boundary Functionality', () => {
    it('catches and displays errors from child components', () => {
      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThrowError shouldThrow={true} message="Child component error" />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Child component error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('renders children normally when no errors occur', () => {
      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('allows error recovery through reset functionality', async () => {
      const { rerender } = render(
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          resetKeys={['key-1']}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error state should be shown
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Reset by changing reset key
      rerender(
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          resetKeys={['key-2']} // Different key triggers reset
        >
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Error Types and Context', () => {
    it('handles JavaScript runtime errors', () => {
      const ComponentWithRuntimeError = () => {
        const obj: any = null
        return <div>{obj.nonexistent.property}</div> // This will throw
      }

      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ComponentWithRuntimeError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/cannot read properties/i)).toBeInTheDocument()
    })

    it('handles async errors in useEffect', async () => {
      const AsyncErrorComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(false)

        React.useEffect(() => {
          if (shouldThrow) {
            throw new Error('Async error in useEffect')
          }
        }, [shouldThrow])

        React.useEffect(() => {
          // Trigger error after component mounts
          setTimeout(() => setShouldThrow(true), 10)
        }, [])

        return <div>Async component</div>
      }

      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <AsyncErrorComponent />
        </ErrorBoundary>
      )

      // Wait for async error to be caught
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('provides error context information', () => {
      const ComponentWithContext = () => {
        throw new Error('Error with context')
      }

      const ContextualErrorFallback = ({ error }: { error: Error }) => (
        <div role="alert">
          <h2>Error occurred</h2>
          <p>Error: {error.message}</p>
          <p>Stack: {error.stack ? 'Available' : 'Not available'}</p>
        </div>
      )

      render(
        <ErrorBoundary FallbackComponent={ContextualErrorFallback}>
          <ComponentWithContext />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error with context')).toBeInTheDocument()
      expect(screen.getByText('Stack: Available')).toBeInTheDocument()
    })
  })

  describe('Error Logging and Monitoring', () => {
    it('logs errors to monitoring service', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onError={onError}
        >
          <ThrowError shouldThrow={true} message="Monitored error" />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('captures different error severities', () => {
      const CriticalError = () => {
        throw new Error('CRITICAL: Database connection failed')
      }

      const WarningError = () => {
        throw new Error('WARNING: Non-critical feature unavailable')
      }

      const onError = vi.fn()

      // Test critical error
      const { unmount } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={onError}>
          <CriticalError />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'CRITICAL: Database connection failed'
        }),
        expect.any(Object)
      )

      unmount()
      onError.mockClear()

      // Test warning error
      render(
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={onError}>
          <WarningError />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'WARNING: Non-critical feature unavailable'
        }),
        expect.any(Object)
      )
    })
  })

  describe('Nested Error Boundaries', () => {
    it('allows nested error boundaries for granular error handling', () => {
      const InnerErrorFallback = ({ error }: { error: Error }) => (
        <div data-testid="inner-error">Inner error: {error.message}</div>
      )

      const OuterErrorFallback = ({ error }: { error: Error }) => (
        <div data-testid="outer-error">Outer error: {error.message}</div>
      )

      render(
        <ErrorBoundary FallbackComponent={OuterErrorFallback}>
          <div>
            <p>Outer boundary content</p>
            <ErrorBoundary FallbackComponent={InnerErrorFallback}>
              <ThrowError shouldThrow={true} message="Inner component error" />
            </ErrorBoundary>
            <p>More outer content</p>
          </div>
        </ErrorBoundary>
      )

      // Inner error boundary should catch the error
      expect(screen.getByTestId('inner-error')).toBeInTheDocument()
      expect(screen.getByText('Inner error: Inner component error')).toBeInTheDocument()
      
      // Outer content should still be visible
      expect(screen.getByText('Outer boundary content')).toBeInTheDocument()
      expect(screen.getByText('More outer content')).toBeInTheDocument()
      
      // Outer error boundary should not be triggered
      expect(screen.queryByTestId('outer-error')).not.toBeInTheDocument()
    })

    it('escalates to outer boundary when inner boundary fails', () => {
      const FailingErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        // Simulate error boundary that also has a bug
        throw new Error('Error boundary itself failed')
      }

      const OuterErrorFallback = ({ error }: { error: Error }) => (
        <div data-testid="outer-error">Outer caught: {error.message}</div>
      )

      render(
        <ErrorBoundary FallbackComponent={OuterErrorFallback}>
          <FailingErrorBoundary>
            <ThrowError shouldThrow={true} message="Original error" />
          </FailingErrorBoundary>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('outer-error')).toBeInTheDocument()
      expect(screen.getByText('Outer caught: Error boundary itself failed')).toBeInTheDocument()
    })
  })

  describe('Application-Specific Error Boundaries', () => {
    // Mock components that might exist in the application
    const BlogPostContent = ({ shouldError = false }: { shouldError?: boolean }) => {
      if (shouldError) {
        throw new Error('Failed to load blog post content')
      }
      return <article>Blog post content loaded successfully</article>
    }

    const CommentSection = ({ shouldError = false }: { shouldError?: boolean }) => {
      if (shouldError) {
        throw new Error('Comments service unavailable')
      }
      return <section>Comments loaded</section>
    }

    it('isolates blog post errors from comments section', () => {
      const BlogErrorFallback = () => (
        <div data-testid="blog-error">
          Unable to load blog post. Please try again later.
        </div>
      )

      const CommentErrorFallback = () => (
        <div data-testid="comment-error">
          Comments temporarily unavailable.
        </div>
      )

      render(
        <div>
          <ErrorBoundary FallbackComponent={BlogErrorFallback}>
            <BlogPostContent shouldError={true} />
          </ErrorBoundary>
          
          <ErrorBoundary FallbackComponent={CommentErrorFallback}>
            <CommentSection shouldError={false} />
          </ErrorBoundary>
        </div>
      )

      // Blog post should show error
      expect(screen.getByTestId('blog-error')).toBeInTheDocument()
      expect(screen.getByText(/unable to load blog post/i)).toBeInTheDocument()

      // Comments should still work
      expect(screen.getByText('Comments loaded')).toBeInTheDocument()
      expect(screen.queryByTestId('comment-error')).not.toBeInTheDocument()
    })

    it('provides user-friendly error messages for different contexts', () => {
      const UserFriendlyErrorFallback = ({ error }: { error: Error }) => {
        const isNetworkError = error.message.includes('fetch')
        const isAuthError = error.message.includes('unauthorized')
        const isValidationError = error.message.includes('validation')

        let userMessage = 'Something went wrong. Please try again.'
        
        if (isNetworkError) {
          userMessage = 'Connection problem. Check your internet and try again.'
        } else if (isAuthError) {
          userMessage = 'You need to sign in to continue.'
        } else if (isValidationError) {
          userMessage = 'Please check your input and try again.'
        }

        return (
          <div role="alert" className="error-message">
            <h3>Oops!</h3>
            <p>{userMessage}</p>
            <button>Try Again</button>
          </div>
        )
      }

      // Test network error
      const { rerender } = render(
        <ErrorBoundary FallbackComponent={UserFriendlyErrorFallback}>
          <ThrowError shouldThrow={true} message="fetch failed due to network" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/connection problem/i)).toBeInTheDocument()

      // Test auth error
      rerender(
        <ErrorBoundary FallbackComponent={UserFriendlyErrorFallback}>
          <ThrowError shouldThrow={true} message="unauthorized access denied" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/you need to sign in/i)).toBeInTheDocument()

      // Test validation error
      rerender(
        <ErrorBoundary FallbackComponent={UserFriendlyErrorFallback}>
          <ThrowError shouldThrow={true} message="validation failed for email" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/please check your input/i)).toBeInTheDocument()
    })
  })

  describe('Error Recovery Patterns', () => {
    it('supports retry functionality', async () => {
      let attemptCount = 0
      
      const FlakeyComponent = () => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        return <div>Success after {attemptCount} attempts</div>
      }

      const RetryErrorFallback = ({ error, resetErrorBoundary }: {
        error: Error;
        resetErrorBoundary: () => void;
      }) => (
        <div role="alert">
          <p>Error: {error.message}</p>
          <button onClick={resetErrorBoundary}>Retry</button>
        </div>
      )

      const { rerender } = render(
        <ErrorBoundary 
          FallbackComponent={RetryErrorFallback}
          resetKeys={[attemptCount]}
        >
          <FlakeyComponent />
        </ErrorBoundary>
      )

      // First attempt should fail
      expect(screen.getByText('Error: Attempt 1 failed')).toBeInTheDocument()

      // Trigger retry by changing reset key
      rerender(
        <ErrorBoundary 
          FallbackComponent={RetryErrorFallback}
          resetKeys={[attemptCount + 1]}
        >
          <FlakeyComponent />
        </ErrorBoundary>
      )

      // Second attempt should also fail
      expect(screen.getByText('Error: Attempt 2 failed')).toBeInTheDocument()

      // Third retry should succeed
      rerender(
        <ErrorBoundary 
          FallbackComponent={RetryErrorFallback}
          resetKeys={[attemptCount + 2]}
        >
          <FlakeyComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Success after 3 attempts')).toBeInTheDocument()
    })

    it('provides fallback content for non-critical features', () => {
      const SidebarWidget = ({ shouldError = false }: { shouldError?: boolean }) => {
        if (shouldError) {
          throw new Error('Widget service unavailable')
        }
        return <aside>Sidebar widget loaded</aside>
      }

      const SidebarErrorFallback = () => (
        <aside data-testid="sidebar-fallback">
          <p>Additional content unavailable</p>
          <p>Main features remain functional</p>
        </aside>
      )

      render(
        <div>
          <main>
            <h1>Main Content</h1>
            <p>Primary application content</p>
          </main>
          
          <ErrorBoundary FallbackComponent={SidebarErrorFallback}>
            <SidebarWidget shouldError={true} />
          </ErrorBoundary>
        </div>
      )

      // Main content should remain functional
      expect(screen.getByText('Main Content')).toBeInTheDocument()
      expect(screen.getByText('Primary application content')).toBeInTheDocument()

      // Sidebar should show graceful degradation
      expect(screen.getByTestId('sidebar-fallback')).toBeInTheDocument()
      expect(screen.getByText('Main features remain functional')).toBeInTheDocument()
    })
  })

  describe('Development vs Production Error Handling', () => {
    it('shows detailed error information in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const DetailedErrorFallback = ({ error }: { error: Error }) => (
        <div role="alert">
          <h2>Development Error</h2>
          <pre>{error.stack}</pre>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details</summary>
              <p>Component Stack Available</p>
            </details>
          )}
        </div>
      )

      render(
        <ErrorBoundary FallbackComponent={DetailedErrorFallback}>
          <ThrowError shouldThrow={true} message="Development error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Development Error')).toBeInTheDocument()
      expect(screen.getByText('Error Details')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('shows user-friendly messages in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const ProductionErrorFallback = ({ error }: { error: Error }) => (
        <div role="alert">
          <h2>Something went wrong</h2>
          <p>We're working to fix this issue.</p>
          {process.env.NODE_ENV === 'development' ? (
            <pre>{error.stack}</pre>
          ) : (
            <button>Report Issue</button>
          )}
        </div>
      )

      render(
        <ErrorBoundary FallbackComponent={ProductionErrorFallback}>
          <ThrowError shouldThrow={true} message="Production error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText("We're working to fix this issue.")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument()
      expect(screen.queryByText('Production error')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })
})