'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, Gift, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReferralSignupBannerProps {
  referralCode: string
  referrerName?: string
  isValid?: boolean
}

export function ReferralSignupBanner({
  referralCode,
  referrerName,
  isValid = true,
}: ReferralSignupBannerProps) {
  if (!isValid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid Referral Code</AlertTitle>
        <AlertDescription>
          This referral code is invalid or has expired. You can still sign up, but won't receive bonus points.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary font-semibold">
        🎉 You're signing up with a referral!
      </AlertTitle>
      <AlertDescription className="space-y-2 mt-2">
        {referrerName ? (
          <p>
            <span className="font-semibold">{referrerName}</span> invited you to join! 
            Sign up now and you'll both get <span className="font-semibold text-primary">100 bonus points</span>.
          </p>
        ) : (
          <p>
            Sign up with this referral code and you'll get <span className="font-semibold text-primary">100 bonus points</span> when you create your account!
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Gift className="h-3 w-3" />
          <span>Referral code: <code className="font-mono font-semibold">{referralCode}</code></span>
        </div>
      </AlertDescription>
    </Alert>
  )
}

