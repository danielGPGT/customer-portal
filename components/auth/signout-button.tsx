'use client'

import { useClerk } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface SignOutButtonProps {
  children: ReactNode
  className?: string
  asChild?: boolean
}

export function SignOutButton({ children, className, asChild }: SignOutButtonProps) {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Use window.location for a full page reload after sign-out
      // This ensures the session is fully cleared and prevents blank screens
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to redirect even if signOut fails
      window.location.href = '/login'
    }
  }

  // If asChild, clone the child element and add onClick handler
  if (asChild && children) {
    return (
      <div onClick={handleSignOut} className={className}>
        {children}
      </div>
    )
  }

  // Otherwise render as clickable div
  return (
    <div onClick={handleSignOut} className={className}>
      {children}
    </div>
  )
}
