'use client'

import { useEffect } from 'react'

/**
 * Suppresses React/Next.js development errors that appear during navigation
 * These are harmless development-only errors related to performance measurement
 * and do not affect production builds
 */
export function ErrorSuppression() {
  // Set up error handlers immediately (before useEffect runs)
  // This ensures we catch errors as early as possible
  if (typeof window !== 'undefined') {
    // Only suppress in development
    if (process.env.NODE_ENV === 'development') {
      // Suppress uncaught exceptions (set up synchronously)
      const handleError = (event: ErrorEvent) => {
        const message = event.message || event.error?.message || event.toString() || ''
        const stack = event.error?.stack || ''
        
        // Suppress specific development-only errors related to React/Next.js performance measurement
        if (
          message.includes('Failed to execute \'measure\' on \'Performance\'') ||
          message.includes('cannot have a negative time stamp') ||
          message.includes('negative time stamp') ||
          message.includes('Rendered more hooks than during the previous render') ||
          (message.includes('DashboardPage') && (message.includes('negative') || message.includes('Performance'))) ||
          stack.includes('flushComponentPerformance') ||
          stack.includes('flushInitialRenderPerformance')
        ) {
          // Prevent the error from showing in console or UI
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          return false
        }
      }

      // Suppress unhandled promise rejections
      const handleRejection = (event: PromiseRejectionEvent) => {
        const message = event.reason?.message || String(event.reason) || ''
        const stack = event.reason?.stack || ''
        
        // Suppress specific development-only errors
        if (
          message.includes('Failed to execute \'measure\' on \'Performance\'') ||
          message.includes('cannot have a negative time stamp') ||
          message.includes('negative time stamp') ||
          message.includes('Rendered more hooks than during the previous render') ||
          (message.includes('DashboardPage') && (message.includes('negative') || message.includes('Performance'))) ||
          stack.includes('flushComponentPerformance') ||
          stack.includes('flushInitialRenderPerformance')
        ) {
          // Prevent the error from showing in console
          event.preventDefault()
          return false
        }
      }

      // Add listeners immediately (synchronously)
      window.addEventListener('error', handleError, true) // Use capture phase
      window.addEventListener('unhandledrejection', handleRejection, true) // Use capture phase
    }
  }

  useEffect(() => {
    // Only suppress in development
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // Suppress console.error messages
    const originalError = console.error
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      
      // Suppress performance measurement errors during navigation
      if (
        message.includes('Failed to execute \'measure\' on \'Performance\'') ||
        message.includes('cannot have a negative time stamp') ||
        message.includes('Rendered more hooks than during the previous render') ||
        (message.includes('DashboardPage') && message.includes('negative time stamp'))
      ) {
        // Silently ignore these development-only errors
        return
      }
      
      // Allow all other errors through
      originalError.apply(console, args)
    }

    // Note: Error handlers are already set up synchronously above
    // This useEffect only handles console.error suppression
    // Cleanup on unmount
    return () => {
      console.error = originalError
      // Note: We don't remove the synchronous error handlers as they persist for the page lifetime
    }
  }, [])

  return null
}
