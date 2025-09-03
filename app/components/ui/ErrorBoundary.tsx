'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card } from './Card'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-slate-600 mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left bg-red-50 p-4 rounded-lg mb-4 text-sm">
              <summary className="font-semibold cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-red-700">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button onClick={this.handleRetry} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}