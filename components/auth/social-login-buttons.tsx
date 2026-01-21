'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface SocialLoginButtonsProps {
  mode: 'sign-in' | 'sign-up'
  referralCode?: string
}

// Google OAuth - Commented out for now, can be re-enabled later
// const GoogleIcon = () => (
//   <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
//     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
//     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
//     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
//   </svg>
// )

const socialProviders = [
  // Google OAuth - Disabled for now, uncomment to re-enable
  // {
  //   id: 'oauth_google',
  //   name: 'Google',
  //   icon: GoogleIcon,
  // },
  // Add more providers here as they are configured in Clerk Dashboard
  // {
  //   id: 'oauth_github',
  //   name: 'GitHub',
  //   icon: () => <span>⚫</span>,
  // },
  // {
  //   id: 'oauth_microsoft',
  //   name: 'Microsoft',
  //   icon: () => <span>🟦</span>,
  // },
  // {
  //   id: 'oauth_apple',
  //   name: 'Apple',
  //   icon: () => <span>⚪</span>,
  // },
] as const

export function SocialLoginButtons({ mode, referralCode }: SocialLoginButtonsProps) {
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const isLoaded = mode === 'sign-in' ? signInLoaded : signUpLoaded

  const handleSocialAuth = async (strategy: string) => {
    if (!isLoaded) return

    setLoadingProvider(strategy)

    try {
      // Build redirect URL - include referral code for sign-up
      const redirectUrl = new URL('/sso-callback', window.location.origin)
      const redirectUrlComplete = new URL('/dashboard', window.location.origin)
      
      if (mode === 'sign-up' && referralCode) {
        redirectUrl.searchParams.set('ref', referralCode)
        redirectUrlComplete.searchParams.set('ref', referralCode)
      }

      if (mode === 'sign-in') {
        await signIn?.authenticateWithRedirect({
          strategy: strategy as any,
          redirectUrl: redirectUrl.toString(),
          redirectUrlComplete: redirectUrlComplete.toString(),
        })
      } else {
        await signUp?.authenticateWithRedirect({
          strategy: strategy as any,
          redirectUrl: redirectUrl.toString(),
          redirectUrlComplete: redirectUrlComplete.toString(),
        })
      }
    } catch (error: any) {
      console.error(`Error authenticating with ${strategy}:`, error)
      setLoadingProvider(null)
      // Error will be handled by Clerk's redirect flow
    }
  }

  if (!isLoaded) {
    return null
  }

  // Don't render anything if there are no social providers enabled
  if (socialProviders.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className={socialProviders.length > 1 ? "grid grid-cols-2 gap-3" : "space-y-3"}>
        {socialProviders.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            onClick={() => handleSocialAuth(provider.id)}
            disabled={!!loadingProvider}
            className="w-full"
          >
            {loadingProvider === provider.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2"><provider.icon /></span>
            )}
            Continue with {provider.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
