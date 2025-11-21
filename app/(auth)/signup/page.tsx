import { SignupForm } from '@/components/auth/signup-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ReferralSignupBanner } from '@/components/auth/referral-signup-banner'

interface SignupPageProps {
  searchParams: Promise<{ ref?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const referralCode = params.ref || null

  // If referral code provided, validate it and fetch referrer info for banner
  let referrerInfo: { firstName?: string; isValid?: boolean } | null = null
  if (referralCode) {
    const supabase = await createClient()
    
    // Normalize the code: uppercase and trim whitespace
    const normalizedCode = referralCode.toUpperCase().trim()
    
    const { data: validity, error: validityError } = await supabase.rpc('check_referral_validity', {
      p_referral_code: normalizedCode,
    })

    if (!validityError && validity && validity.length > 0) {
      const validation = validity[0]
      const isValid = validation.is_valid === true
      
      // If valid, fetch referrer's name
      let firstName: string | undefined
      if (isValid && validation.referrer_client_id) {
        const { data: referrer } = await supabase
          .from('clients')
          .select('first_name')
          .eq('id', validation.referrer_client_id)
          .single()
        
        firstName = referrer?.first_name
      }
      
      referrerInfo = {
        firstName,
        isValid,
      }
    } else {
      referrerInfo = { 
        isValid: false,
      }
    }
  }

  return (
    <div className="space-y-4">
      {referralCode && referrerInfo && (
        <ReferralSignupBanner
          referralCode={referralCode}
          referrerName={referrerInfo.firstName}
          isValid={referrerInfo.isValid}
        />
      )}
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
        <CardDescription className="text-center">
          Join our loyalty program and start earning points
        </CardDescription>
      </CardHeader>
      <CardContent>
          <SignupForm initialReferralCode={referralCode || undefined} />
      </CardContent>
    </Card>
    </div>
  )
}

