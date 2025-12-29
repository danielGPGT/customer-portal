import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Customer Loyalty Portal',
  description: 'Terms and conditions for the loyalty program',
}

export default function TermsPage() {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Terms & Conditions</CardTitle>
        <CardDescription className="text-center">
          Please read our terms and conditions carefully
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="prose prose-sm max-w-none">
          <section className="space-y-4">
            <h3 className="font-semibold text-base">1. Membership</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By creating an account and joining our loyalty program, you agree to these terms and conditions. 
              Membership is free and available to all customers who have made a booking with Grand Prix Grand Tours.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">2. Points Earning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Points are earned on eligible bookings and purchases. Points are typically credited to your account 
              after your booking is confirmed. Points earning rates may vary and are subject to change. 
              We reserve the right to modify points earning rates with reasonable notice.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">3. Points Redemption</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Points can be redeemed for discounts on future bookings. The redemption rate and available 
              discounts are determined by Grand Prix Grand Tours and may be updated from time to time. 
              Points have no cash value and cannot be transferred or sold.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">4. Points Expiry</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Points may expire after a period of inactivity. We will notify you before points expire. 
              Please refer to your account dashboard for current expiry dates.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">5. Referral Program</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you refer friends using your unique referral code, you may earn bonus points when they 
              complete their first booking. Referral bonuses are subject to verification and may take time 
              to appear in your account. Abuse of the referral system may result in account suspension.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">6. Account Security</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the security of your account. Please keep your login 
              credentials confidential and notify us immediately if you suspect unauthorized access.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">7. Changes to Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms and conditions at any time. Significant changes 
              will be communicated to members via email or through the portal. Continued use of the 
              loyalty program constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base">8. Termination</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms or engage 
              in fraudulent activity. In such cases, any unredeemed points may be forfeited.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


