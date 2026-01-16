'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()

  useEffect(() => {
    // Clerk handles password reset through email links that redirect to their reset UI
    // If user somehow lands here without a Clerk reset token, redirect to sign-in
    // Users should access password reset via the link in their email from Clerk
    router.push('/sign-in')
  }, [router])

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Password Reset</h3>
        <p className="text-sm text-gray-600">
          Password reset is handled through Clerk. Please use the link in your email to reset your password, or use the "Forgot password?" option on the sign-in page.
        </p>
      </div>
      
      <Button 
        type="button" 
        className="w-full" 
        onClick={() => router.push('/sign-in')}
      >
        Go to Sign In
      </Button>

      <p className="text-center text-sm text-gray-600">
        <Link href="/sign-in" className="text-primary hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  )
}

