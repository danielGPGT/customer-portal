 'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type ProfileFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const initialErrors: Record<string, string> = {}

const profileSchema = z.object({
  clientId: z.string().uuid({ message: 'Invalid client reference' }),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.length ? val : null))
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      'Enter a valid date'
    ),
  address: z
    .object({
      address_line1: z.string().optional().nullable(),
      address_line2: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      postal_code: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
})

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const rawData = {
    clientId: formData.get('client_id')?.toString() ?? '',
    firstName: formData.get('first_name')?.toString() ?? '',
    lastName: formData.get('last_name')?.toString() ?? '',
    phone: formData.get('phone')?.toString() ?? null,
    dateOfBirth: formData.get('date_of_birth')?.toString() ?? null,
    address: {
      address_line1: formData.get('address_line1')?.toString()?.trim() || null,
      address_line2: formData.get('address_line2')?.toString()?.trim() || null,
      city: formData.get('city')?.toString()?.trim() || null,
      state: formData.get('state')?.toString()?.trim() || null,
      postal_code: formData.get('postal_code')?.toString()?.trim() || null,
      country: formData.get('country')?.toString()?.trim() || null,
    },
  }

  const parsed = profileSchema.safeParse(rawData)

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

  // Get Clerk user instead of Supabase auth user
  const { getClerkUser } = await import('@/lib/clerk/server')
  const clerkUser = await getClerkUser()

  if (!clerkUser) {
    return {
      status: 'error',
      message: 'You must be signed in to update your profile.',
      errors: initialErrors,
    }
  }

  // Build address JSONB object (only include if at least one field is provided)
  const addressData = data.address
  const hasAddressData =
    addressData &&
    (addressData.address_line1 ||
      addressData.address_line2 ||
      addressData.city ||
      addressData.state ||
      addressData.postal_code ||
      addressData.country)

  const updatePayload: Record<string, unknown> = {
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    phone: data.phone,
    date_of_birth: data.dateOfBirth,
    updated_at: new Date().toISOString(),
  }

  // Only include address if there's actual data
  if (hasAddressData) {
    updatePayload.address = {
      address_line1: addressData.address_line1 || null,
      address_line2: addressData.address_line2 || null,
      city: addressData.city || null,
      state: addressData.state || null,
      postal_code: addressData.postal_code || null,
      country: addressData.country || null,
    }
  } else {
    // If all fields are empty, set address to null
    updatePayload.address = null
  }

  // Verify that the client ID belongs to the current Clerk user
  const { error: clientUpdateError } = await supabase
    .from('clients')
    .update(updatePayload)
    .eq('id', data.clientId)
    .eq('clerk_user_id', clerkUser.id)

  if (clientUpdateError) {
    console.error('Error updating client profile:', clientUpdateError)
    return {
      status: 'error',
      message: 'We could not update your profile. Please try again.',
      errors: initialErrors,
    }
  }

  // Note: Clerk user metadata is managed through Clerk's dashboard or API
  // We update the client record in Supabase which is the source of truth for profile data

  await Promise.all([revalidatePath('/profile'), revalidatePath('/profile/edit')])

  const successMessage = 'Profile updated successfully.'

  return {
    status: 'success',
    message: successMessage,
    errors: initialErrors,
  }
}

