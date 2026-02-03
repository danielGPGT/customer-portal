import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginFormWrapper } from '@/components/auth/login-form-wrapper'

export const metadata: Metadata = {
  title: 'Sign In | Grand Prix Grand Tours Portal',
  description: 'Sign in to your account to access your loyalty points, trips, and exclusive rewards',
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to your account to access your loyalty points and trips
        </p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 rounded-lg bg-muted" />}>
        <LoginFormWrapper />
      </Suspense>
    </div>
  )
}

