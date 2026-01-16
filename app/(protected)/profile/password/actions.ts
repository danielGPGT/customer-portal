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

  // Get Clerk user
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()

  if (!userId) {
    return {
      status: 'error',
      message: 'You must be signed in to change your password.',
      errors: {},
    }
  }

  // Update password using Clerk Backend SDK
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    await clerkClient().users.updateUserPassword(userId, {
      newPassword: data.newPassword,
    })

    await revalidatePath('/profile/password')

    return {
      status: 'success',
      message: 'Your password has been updated successfully.',
      errors: {},
    }
  } catch (error: any) {
    console.error('Error updating password:', error)
    return {
      status: 'error',
      message: error.message || 'Unable to update your password. Please try again.',
      errors: {},
    }
  }
}

