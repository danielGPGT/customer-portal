'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isValidCurrency } from '@/lib/utils/currency'

export type PreferencesFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const initialErrors: Record<string, string> = {}

const preferencesSchema = z.object({
  clientId: z.string().uuid({ message: 'Invalid client reference' }),
  preferredCurrency: z
    .string()
    .min(1, 'Currency is required')
    .refine((val) => isValidCurrency(val), 'Invalid currency code'),
})

export async function updatePreferencesAction(
  _prevState: PreferencesFormState,
  formData: FormData
): Promise<PreferencesFormState> {
  const rawData = {
    clientId: formData.get('client_id')?.toString() ?? '',
    preferredCurrency: formData.get('preferred_currency')?.toString() ?? '',
  }

  const parsed = preferencesSchema.safeParse(rawData)

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

  // Get Clerk user
  const { getClerkUser } = await import('@/lib/clerk/server')
  const clerkUser = await getClerkUser()
  
  // Clear client cache so fresh data is fetched
  const { clearClientCache } = await import('@/lib/utils/get-client')
  if (clerkUser) {
    clearClientCache(clerkUser.id)
  }

  if (!clerkUser) {
    return {
      status: 'error',
      message: 'You must be signed in to update your preferences.',
      errors: initialErrors,
    }
  }

  // Get current preferences to merge
  const { data: currentClient } = await supabase
    .from('clients')
    .select('preferences')
    .eq('id', data.clientId)
    .eq('clerk_user_id', clerkUser.id)
    .single()

  // Parse existing preferences
  let existingPreferences: any = {}
  if (currentClient?.preferences) {
    if (typeof currentClient.preferences === 'string') {
      try {
        existingPreferences = JSON.parse(currentClient.preferences)
      } catch {
        existingPreferences = {}
      }
    } else {
      existingPreferences = currentClient.preferences
    }
  }

  // Update preferences with new currency preference
  const updatedPreferences = {
    ...existingPreferences,
    preferred_currency: data.preferredCurrency.toUpperCase(),
  }

  // Update client preferences
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      preferences: updatedPreferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.clientId)
    .eq('clerk_user_id', clerkUser.id)

  if (updateError) {
    return {
      status: 'error',
      message: 'We could not update your preferences. Please try again.',
      errors: initialErrors,
    }
  }

  // Enterprise-level cache invalidation
  const { invalidateCurrencyCaches } = await import('@/lib/utils/cache-invalidation')
  await invalidateCurrencyCaches(clerkUser.id)

  return {
    status: 'success',
    message: 'Preferences updated successfully.',
    errors: initialErrors,
  }
}
