import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/signup-form'
import { ReferralSignupBanner } from '@/components/auth/referral-signup-banner'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sign Up | Grand Prix Grand Tours Portal',
  description: 'Create your account and join our loyalty program to start earning points on every trip',
}

interface SignupPageProps {
  searchParams: Promise<{ ref?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const referralCode = params.ref ? params.ref.toUpperCase().trim() : null

  // Validate referral code if provided
  let isValidReferral = false
  let referrerName: string | undefined = undefined

  if (referralCode) {
    try {
      const supabase = await createClient()
      const { data: validityArray, error } = await supabase.rpc('check_referral_validity', {
        p_referral_code: referralCode,
      })

      // check_referral_validity returns a TABLE, so we get an array
      const validity = Array.isArray(validityArray) && validityArray.length > 0 ? validityArray[0] : null

      if (validity && validity.is_valid) {
        isValidReferral = true
        // Optionally fetch referrer name
        if (validity.referrer_client_id) {
          const { data: referrer } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', validity.referrer_client_id)
            .single()
          
          if (referrer) {
            referrerName = `${referrer.first_name} ${referrer.last_name}`.trim()
          }
        }
      }
    } catch (error) {
      console.error('Error validating referral code:', error)
      // Continue with signup even if validation fails
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground mt-2">
          Join our loyalty program and start earning points on every trip
        </p>
      </div>

      {referralCode && (
        <ReferralSignupBanner
          referralCode={referralCode}
          referrerName={referrerName}
          isValid={isValidReferral}
        />
      )}

      <SignupForm initialReferralCode={referralCode || undefined} />
    </div>
  )
}

