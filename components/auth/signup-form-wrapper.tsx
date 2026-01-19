"use client"

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Client component wrapper for SignupForm
// This allows us to use ssr: false in a client component
const SignupForm = dynamic(() => import('@/components/auth/signup-form').then(mod => ({ default: mod.SignupForm })), {
  loading: () => (
    <div className="space-y-6">
      {/* Form Skeleton */}
      <div className="space-y-6">
        {/* First Name Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Last Name Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

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

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Referral Code Field (optional) */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
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

        {/* Terms Checkbox */}
        <div className="flex items-start space-x-2">
          <Skeleton className="h-4 w-4 mt-0.5" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Submit Button */}
        <Skeleton className="h-10 w-full" />

        {/* Sign In Link */}
        <div className="text-center text-sm">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    </div>
  ),
  ssr: false, // Clerk components are client-side only
})

interface SignupFormWrapperProps {
  initialReferralCode?: string
}

export function SignupFormWrapper({ initialReferralCode }: SignupFormWrapperProps) {
  return <SignupForm initialReferralCode={initialReferralCode} />
}
