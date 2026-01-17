'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSignIn } from '@clerk/nextjs'
import { loginSchema, type LoginInput } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SocialLoginButtons } from './social-login-buttons'

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
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
        // This triggers a fresh server-side render with the session cookie available
        // Redirect to / instead of /dashboard to avoid redirect chain
        window.location.href = '/'
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
              variant: 'destructive',
              title: 'Error sending verification code',
              description: verifyError.errors?.[0]?.message || 'Failed to send verification code.',
            })
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Two-factor authentication required',
            description: 'Please set up 2FA or use an alternative authentication method.',
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
              variant: 'destructive',
              title: 'Error sending verification code',
              description: verifyError.errors?.[0]?.message || 'Failed to send verification code.',
            })
          }
        } else {
          // Other verification types (2FA, etc.)
          toast({
            variant: 'destructive',
            title: 'Additional verification required',
            description: 'Please complete the additional verification step.',
          })
        }
      } else {
        // Handle other statuses
        console.log('[LoginForm] Sign-in status:', result.status)
        toast({
          variant: 'destructive',
          title: 'Additional verification required',
          description: `Sign-in status: ${result.status}. Please check your email or complete verification.`,
        })
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.errors?.[0]?.message || 'Invalid email or password',
      })
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
        
        // Redirect to / instead of /dashboard to avoid redirect chain
        window.location.href = '/'
        return // Exit early to prevent any further rendering
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification failed',
          description: 'The verification code is invalid. Please try again.',
        })
      }
    } catch (error: any) {
      console.error('[LoginForm] Verification error:', error)
      
      let errorMessage = 'Failed to verify email'
      if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0].message || error.errors[0].longMessage || errorMessage
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        variant: 'destructive',
        title: 'Verification Error',
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
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to resend code. Please try again.',
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
        <Input
          id="password"
          type="password"
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
  )
}

