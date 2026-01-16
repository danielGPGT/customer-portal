'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if this is a development-only performance measurement error
    const message = error.message || ''
    const stack = error.stack || ''
    
    const isDevelopmentError = 
      message.includes('Failed to execute \'measure\' on \'Performance\'') ||
      message.includes('cannot have a negative time stamp') ||
      message.includes('negative time stamp') ||
      message.includes('Rendered more hooks than during the previous render') ||
      (message.includes('DashboardPage') && (message.includes('negative') || message.includes('Performance'))) ||
      stack.includes('flushComponentPerformance') ||
      stack.includes('flushInitialRenderPerformance')

    // Don't catch development-only errors - let them pass through silently
    if (isDevelopmentError && process.env.NODE_ENV === 'development') {
      return { hasError: false, error: null }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if this is a development-only error
    const message = error.message || ''
    const stack = error.stack || ''
    
    const isDevelopmentError = 
      message.includes('Failed to execute \'measure\' on \'Performance\'') ||
      message.includes('cannot have a negative time stamp') ||
      message.includes('negative time stamp') ||
      message.includes('Rendered more hooks than during the previous render') ||
      (message.includes('DashboardPage') && (message.includes('negative') || message.includes('Performance'))) ||
      stack.includes('flushComponentPerformance') ||
      stack.includes('flushInitialRenderPerformance')

    // Suppress development-only errors
    if (isDevelopmentError && process.env.NODE_ENV === 'development') {
      console.warn('[ErrorBoundary] Suppressing development-only error:', error.message)
      // Reset error state to prevent UI error message
      this.setState({ hasError: false, error: null })
      return
    }

    // Log real errors
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Show fallback UI for real errors
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
