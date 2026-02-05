'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSignIn } from '@clerk/nextjs'
import { loginSchema, type LoginInput } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SocialLoginButtons } from './social-login-buttons'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const errorParam = searchParams.get('error')
  const redirectUrlParam = searchParams.get('redirect_url')
  const safeRedirectUrl =
    redirectUrlParam &&
    redirectUrlParam.startsWith('/') &&
    !redirectUrlParam.startsWith('//') &&
    !redirectUrlParam.includes('\\')
      ? redirectUrlParam
      : null
  const { signIn, setActive, isLoaded } = useSignIn()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [verificationType, setVerificationType] = useState<'first_factor' | 'second_factor'>('first_factor')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    if (!isLoaded || !signIn) {
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      console.log('[LoginForm] Sign-in result:', {
        status: result.status,
        supportedFirstFactors: result.supportedFirstFactors,
        supportedSecondFactors: result.supportedSecondFactors,
      })

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId })

        toast({
          title: 'Welcome back! 👋',
          description: 'Successfully logged in',
        })

        // Immediately show loading state to prevent any component rendering during redirect
        setIsRedirecting(true)
        setIsLoading(true)

        // Longer delay to ensure session cookie is fully propagated to server
        // This prevents timing issues where protected layout runs before session is available
        // 500ms gives the cookie time to be sent with the next request
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use window.location for a full page reload to ensure session is properly set
        const destination = safeRedirectUrl || '/'
        window.location.href = destination
        return // Exit early to prevent any further rendering
      } else if (result.status === 'needs_second_factor') {
        // Two-factor authentication required (Client Trust or MFA)
        const emailFactor = result.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code'
        )

        if (emailFactor) {
          // Prepare second factor (email code)
          try {
            await signIn.prepareSecondFactor({
              strategy: 'email_code',
            })
            
            setUserEmail(data.email)
            setPendingVerification(true)
            setVerificationType('second_factor')
            
            toast({
              title: 'Verification code sent',
              description: 'Please check your email for the verification code to complete sign-in.',
            })
          } catch (verifyError: any) {
            console.error('[LoginForm] Error preparing second factor:', verifyError)
            toast({
              variant: 'soft',
              title: 'We couldn’t send the code',
              description: verifyError.errors?.[0]?.message || 'Please try again in a moment.',
            })
          }
        } else {
          toast({
            variant: 'soft',
            title: 'Extra verification needed',
            description: 'Please set up 2FA or use another way to sign in.',
          })
        }
      } else if (result.status === 'needs_first_factor') {
        // Check if email verification is required
        const emailFactor = result.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        )

        if (emailFactor) {
          // Prepare email verification
          try {
            await signIn.prepareFirstFactor({
              strategy: 'email_code',
            })
            
            setUserEmail(data.email)
            setPendingVerification(true)
            setVerificationType('first_factor')
            
            toast({
              title: 'Verification code sent',
              description: 'Please check your email for the verification code.',
            })
          } catch (verifyError: any) {
            console.error('[LoginForm] Error preparing email verification:', verifyError)
            toast({
              variant: 'soft',
              title: 'We couldn’t send the code',
              description: verifyError.errors?.[0]?.message || 'Please try again in a moment.',
            })
          }
        } else {
          // Other verification types (2FA, etc.)
          toast({
            variant: 'soft',
title: 'One more step',
          description: 'Please complete the verification step to sign in.',
          })
        }
      } else {
        // Handle other statuses
        console.log('[LoginForm] Sign-in status:', result.status)
        toast({
          variant: 'soft',
          title: 'One more step',
          description: 'Please check your email or complete the verification step to sign in.',
        })
      }
    } catch (error: any) {
      const clerkMessage = error?.errors?.[0]?.message ?? error?.message ?? ''
      const clerkCode = error?.errors?.[0]?.code ?? ''
      const isWrongCredentials =
        /couldn't find your account|could not find|invalid.*password|invalid.*identifier|incorrect.*password|invalid verification strategy/i.test(clerkMessage) ||
        /form_identifier_(invalid|incorrect)|strategy_invalid/i.test(clerkCode)
      if (isWrongCredentials) {
        toast({
          variant: 'soft',
          title: "We couldn't find your account",
          description: 'Check your email and password, or sign up if you don’t have an account.',
        })
      } else {
        toast({
          variant: 'soft',
          title: 'Something went wrong',
          description: error?.errors?.[0]?.message || error?.message || 'Please try again in a moment.',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded || !signIn || !verificationCode) {
      return
    }

    setIsLoading(true)

    try {
      // Attempt to verify the code and complete sign-in
      let result
      
      if (verificationType === 'first_factor') {
        result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code: verificationCode,
        })
      } else {
        // Second factor (2FA/Client Trust)
        result = await signIn.attemptSecondFactor({
          strategy: 'email_code',
          code: verificationCode,
        })
      }

      console.log('[LoginForm] Verification result:', {
        type: verificationType,
        status: result.status,
        hasCreatedSessionId: !!result.createdSessionId,
      })

      if (result.status === 'complete') {
        // Verification complete - set active session
        if (!result.createdSessionId) {
          throw new Error('Failed to get session ID after verification')
        }

        await setActive({ session: result.createdSessionId })

        toast({
          title: 'Welcome back! 👋',
          description: 'Successfully logged in',
        })

        // Immediately show loading state to prevent any component rendering during redirect
        setIsRedirecting(true)
        setIsLoading(true)

        // Longer delay to ensure session cookie is fully propagated to server
        // This prevents timing issues where protected layout runs before session is available
        // 500ms gives the cookie time to be sent with the next request
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const destination = safeRedirectUrl || '/'
        window.location.href = destination
        return // Exit early to prevent any further rendering
      } else {
        toast({
          variant: 'soft',
          title: 'Code didn’t work',
          description: 'That code may be wrong or expired. Please try again or request a new code.',
        })
      }
    } catch (error: any) {
      console.error('[LoginForm] Verification error:', error)
      
      let errorMessage = 'We couldn’t verify your email'
      if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0].message || error.errors[0].longMessage || errorMessage
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        variant: 'soft',
        title: 'Verification didn’t work',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show verification form if pending
  // Show loading spinner during redirect to prevent rendering dashboard
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    )
  }

  if (pendingVerification) {
    return (
      <form onSubmit={handleVerification} className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Verify your email</h2>
          <p className="text-muted-foreground mt-2">
            We've sent a verification code to <strong>{userEmail}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verificationCode">Verification Code</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            disabled={isLoading}
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Check your email for the verification code
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !verificationCode}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Email
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={async () => {
              if (signIn) {
                try {
                  if (verificationType === 'first_factor') {
                    await signIn.prepareFirstFactor({
                      strategy: 'email_code',
                    })
                  } else {
                    await signIn.prepareSecondFactor({
                      strategy: 'email_code',
                    })
                  }
                  toast({
                    title: 'Code resent',
                    description: 'A new verification code has been sent to your email.',
                  })
                } catch (error: any) {
                  toast({
                    variant: 'soft',
                    title: 'Resend didn’t go through',
                    description: 'Please wait a moment and try again.',
                  })
                }
              }
            }}
            className="text-sm"
            disabled={isLoading}
          >
            Resend code
          </Button>
        </div>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setPendingVerification(false)
              setVerificationCode('')
              setUserEmail('')
              setVerificationType('first_factor')
            }}
            className="text-sm"
            disabled={isLoading}
          >
            Back to sign in
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {errorParam === 'account_exists' && (
        <Alert variant="soft">
          <AlertTitle>Already have an account</AlertTitle>
          <AlertDescription>
            This email is already registered. You can sign in with your password below.
          </AlertDescription>
        </Alert>
      )}
      {errorParam === 'profile_save_failed' && (
        <Alert variant="soft">
          <AlertTitle>Account created — one more step</AlertTitle>
          <AlertDescription>
            Your account was created. Please sign in below; if anything doesn't look right, our team can help.
          </AlertDescription>
        </Alert>
      )}
      {errorParam === 'no_email' && (
        <Alert variant="soft">
          <AlertTitle>Email needed to continue</AlertTitle>
          <AlertDescription>
            We couldn't find an email on your account. Please sign in with a different method or contact support.
          </AlertDescription>
        </Alert>
      )}
      {errorParam === 'setup_failed' && (
        <Alert variant="soft">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn't finish setting up your session. Please try signing in again, or contact support if it keeps happening.
          </AlertDescription>
        </Alert>
      )}
      {errorParam === 'oauth_failed' && (
        <Alert variant="soft">
          <AlertTitle>Sign-in didn't complete</AlertTitle>
          <AlertDescription>
            Sign-in with Google or your provider didn't finish. Please try again or use email and password below.
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          {...register('password')}
          disabled={isLoading}
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log In
      </Button>

      <SocialLoginButtons mode="sign-in" />

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
    </div>
  )
}

