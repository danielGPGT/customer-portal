'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { changePasswordAction, type ChangePasswordFormState } from '@/app/(protected)/profile/password/actions'
import { useState } from 'react'

const INITIAL_FORM_STATE: ChangePasswordFormState = {
  status: 'idle',
  errors: {},
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ChangePasswordFormState, FormData>(
    changePasswordAction,
    INITIAL_FORM_STATE
  )

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <form action={formAction} className="space-y-6">
      {state.status !== 'idle' && state.message && (
        <Alert variant={state.status === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{state.status === 'success' ? 'Password updated!' : 'Something went wrong'}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}



      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="new_password"
            name="new_password"
            type={showNewPassword ? 'text' : 'password'}
            className="pl-9 pr-9"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state.errors?.newPassword && (
          <p className="text-sm text-red-500">{state.errors.newPassword}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Min 8 characters, 1 number, 1 special character
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            className="pl-9 pr-9"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state.errors?.confirmPassword && (
          <p className="text-sm text-red-500">{state.errors.confirmPassword}</p>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Password requirements</p>
        <ul className="list-disc list-inside space-y-1">
          <li>At least 8 characters long</li>
          <li>Contains at least one number</li>
          <li>Contains at least one special character (!@#$%^&*)</li>
          <li>Different from your current password</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost" type="button" className="order-2 sm:order-1">
          <Link href="/profile">Cancel</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="order-1 sm:order-2" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Update password
    </Button>
  )
}

