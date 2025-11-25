'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ChangePasswordFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export async function changePasswordAction(
  _prevState: ChangePasswordFormState,
  formData: FormData
): Promise<ChangePasswordFormState> {
  const rawData = {
    newPassword: formData.get('new_password')?.toString() ?? '',
    confirmPassword: formData.get('confirm_password')?.toString() ?? '',
  }

  const parsed = changePasswordSchema.safeParse(rawData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    const flattened = parsed.error.flatten().fieldErrors
    Object.entries(flattened).forEach(([key, value]) => {
      if (value && value[0]) {
        fieldErrors[key] = value[0]
      }
    })

    return {
      status: 'error',
      message: 'Please fix the highlighted fields.',
      errors: fieldErrors,
    }
  }

  const data = parsed.data
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      status: 'error',
      message: 'You must be signed in to change your password.',
      errors: {},
    }
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  })

  if (updateError) {
    console.error('Error updating password:', updateError)
    return {
      status: 'error',
      message: updateError.message || 'Unable to update your password. Please try again.',
      errors: {},
    }
  }

  await revalidatePath('/profile/password')

  return {
    status: 'success',
    message: 'Your password has been updated successfully.',
    errors: {},
  }
}

