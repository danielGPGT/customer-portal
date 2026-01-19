"use client"

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Client component wrapper for LoginForm
// This allows us to use ssr: false in a client component
const LoginForm = dynamic(() => import('@/components/auth/login-form').then(mod => ({ default: mod.LoginForm })), {
  loading: () => (
    <div className="space-y-6">
      {/* Form Skeleton */}
      <div className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Social Login Buttons Skeleton */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                <Skeleton className="h-3 w-24" />
              </span>
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Submit Button */}
        <Skeleton className="h-10 w-full" />

        {/* Links */}
        <div className="flex items-center justify-between text-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  ),
  ssr: false, // Clerk components are client-side only
})

export function LoginFormWrapper() {
  return <LoginForm />
}
