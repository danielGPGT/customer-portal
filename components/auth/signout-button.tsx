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
    await signOut({ redirectUrl: '/sign-in' })
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
