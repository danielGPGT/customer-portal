import type { Metadata } from 'next'
import { SignupFormWrapper } from '@/components/auth/signup-form-wrapper'
import { ReferralSignupBanner } from '@/components/auth/referral-signup-banner'

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

  // Note: Referral validation moved to client-side in SignupForm component
  // This prevents blocking the initial page load with a database call
  // The form will validate the referral code when the user interacts with it

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
          referrerName={undefined} // Will be fetched client-side if needed
          isValid={undefined} // Will be validated client-side
        />
      )}

      <SignupFormWrapper initialReferralCode={referralCode || undefined} />
    </div>
  )
}

