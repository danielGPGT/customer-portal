'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSignIn } from '@clerk/nextjs'
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordInput, type ResetPasswordInput } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { signIn, setActive, isLoaded } = useSignIn()
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState<'request' | 'reset'>('request')
  const [userEmail, setUserEmail] = useState('')
  const [resetCode, setResetCode] = useState('')

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onRequestReset = async (data: ForgotPasswordInput) => {
    if (!isLoaded || !signIn) {
      return
    }

    setIsLoading(true)

    try {
      // Request password reset code via email
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: data.email,
      })

      setUserEmail(data.email)
      setStage('reset')

      toast({
        title: 'Reset code sent! 📧',
        description: 'Please check your email for the password reset code.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.errors?.[0]?.longMessage || 'Failed to send reset code. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onResetPassword = async (data: ResetPasswordInput) => {
    if (!isLoaded || !signIn) {
      return
    }

    if (!resetCode) {
      toast({
        variant: 'destructive',
        title: 'Code required',
        description: 'Please enter the reset code from your email.',
      })
      return
    }

    setIsLoading(true)

    try {
      // Attempt password reset with code and new password
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: data.password,
      })

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId })

        toast({
          title: 'Password reset! ✅',
          description: 'Your password has been successfully reset.',
        })

        // Redirect to / instead of /dashboard to avoid redirect chain
        window.location.href = '/'
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.errors?.[0]?.longMessage || 'Failed to reset password. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (stage === 'reset') {
    return (
      <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Enter Reset Code</h3>
          <p className="text-sm text-muted-foreground">
            We sent a reset code to <strong>{userEmail}</strong>. Please enter it below along with your new password.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-code">Reset Code</Label>
          <Input
            id="reset-code"
            type="text"
            placeholder="Enter code from email"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            disabled={isLoading}
            autoComplete="one-time-code"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter new password"
            {...registerReset('password')}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errorsReset.password && (
            <p className="text-sm text-destructive">{errorsReset.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            {...registerReset('confirmPassword')}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errorsReset.confirmPassword && (
            <p className="text-sm text-destructive">{errorsReset.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStage('request')}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            Back to request code
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmitRequest(onRequestReset)} className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Reset Your Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a code to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...registerRequest('email')}
          disabled={isLoading}
          autoComplete="email"
        />
        {errorsRequest.email && (
          <p className="text-sm text-destructive">{errorsRequest.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Reset Code
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}

