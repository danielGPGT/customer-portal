'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const router = useRouter()

  // Clerk handles password reset through their sign-in page
  // Redirect to sign-in page where users can click "Forgot password?"
  const handleRedirect = () => {
    router.push('/sign-in')
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Reset Your Password</h3>
        <p className="text-sm text-gray-600">
          Clerk handles password reset through the sign-in page. You'll be redirected there where you can click "Forgot password?" to reset your password.
        </p>
      </div>
      
      <Button 
        type="button" 
        className="w-full" 
        onClick={handleRedirect}
      >
        Go to Sign In
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

