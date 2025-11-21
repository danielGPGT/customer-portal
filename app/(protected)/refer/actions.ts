'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { checkServerRateLimit } from '@/lib/utils/rate-limit-server'
import { getBaseUrl } from '@/lib/utils/get-base-url'

const inviteSchema = z.object({
  email: z.string().email(),
})

interface ActionState {
  success?: boolean
  error?: string
}

export async function submitReferralInvite(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Check rate limit first
  const rateLimitCheck = await checkServerRateLimit('referralInvite')
  if (!rateLimitCheck.success) {
    return { 
      error: rateLimitCheck.error || 'Too many invite attempts. Please try again later.' 
    }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in.' }
  }

  const email = formData.get('email')
  const parsed = inviteSchema.safeParse({ email })

  if (!parsed.success) {
    return { error: 'Please enter a valid email address.' }
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (clientError || !client) {
    return { error: 'Unable to find your profile. Please try again.' }
  }

  // Get or create the client's persistent referral code
  const { data: referralCode, error: codeError } = await supabase.rpc('get_or_create_referral_code', {
    p_client_id: client.id,
  })

  if (codeError || !referralCode) {
    return { error: 'Could not get your referral code. Please try again later.' }
  }

  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    return { error: 'Site URL not configured. Please set NEXT_PUBLIC_SITE_URL environment variable.' }
  }
  const referralLink = `${baseUrl}/signup?ref=${referralCode}`

  const { error: insertError } = await supabase.from('referrals').insert({
    referrer_client_id: client.id,
    referee_email: parsed.data.email,
    referral_code: referralCode, // Same code reused for all referrals from this client
    referral_link: referralLink,
  })

  if (insertError) {
    let message = 'Unable to send invite right now.'
    if (insertError.message?.includes('duplicate key')) {
      message = 'Looks like you already invited this email.'
    }
    return { error: message }
  }

  revalidatePath('/refer')

  return { success: true }
}

