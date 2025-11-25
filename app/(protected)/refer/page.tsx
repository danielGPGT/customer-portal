import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ReferFriendBanner } from '@/components/points/refer-friend-banner'
import { ReferralShareCard } from '@/components/points/referral-share-card'
import { ReferralInviteForm } from '@/components/referrals/referral-invite-form'
import { ReferralStatsGrid } from '@/components/referrals/referral-stats-grid'
import { ReferralHistoryTable, ReferralRecord } from '@/components/referrals/referral-history-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default async function ReferralPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client data by auth_user_id
  let { data: client } = await supabase
    .from('clients')
    .select('id, first_name')
    .eq('auth_user_id', user.id)
    .single()

  // If client not found, try to link by email
  if (!client && user.email) {
    const { data: linkedClient } = await supabase
      .rpc('link_client_to_user', { p_user_id: user.id })

    if (linkedClient && linkedClient.length > 0) {
      const { data: retryClient } = await supabase
        .from('clients')
        .select('id, first_name')
        .eq('auth_user_id', user.id)
        .single()
      
      if (retryClient) {
        client = retryClient
      } else {
        client = { id: linkedClient[0].id, first_name: linkedClient[0].first_name }
      }
    }
  }

  if (!client) {
    redirect('/dashboard?error=client_not_found')
  }

  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('referral_bonus_referee, referral_bonus_referrer, referral_program_enabled')
    .eq('id', 1)
    .single()

  const { data: referralsData } = await supabase
    .from('referrals')
    .select(
      `
        id,
        referee_email,
        status,
        created_at,
        signed_up_at,
        completed_at,
        referrer_booking_points,
        referral_code,
        referral_link
      `
    )
    .eq('referrer_client_id', client.id)
    .order('created_at', { ascending: false })

  const referrals = referralsData || []

  // Get or create the client's persistent referral code
  const { data: referralCode } = await supabase.rpc('get_or_create_referral_code', {
    p_client_id: client.id,
  })

  // Generate the referral link
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
  const referralLink = referralCode && baseUrl ? `${baseUrl}/signup?ref=${referralCode}` : null

  const totalInvites = referrals.length
  const pending = referrals.filter((r) => r.status === 'pending').length
  const signedUp = referrals.filter((r) => r.status === 'signed_up').length
  const completed = referrals.filter((r) => r.status === 'completed').length
  const totalPointsEarned = referrals.reduce(
    (sum, referral) => sum + (referral.referrer_booking_points || 0),
    0
  )

  const refereeBonus = settings?.referral_bonus_referee ?? 100
  const referrerBonus = settings?.referral_bonus_referrer ?? 100

  const referralHistory: ReferralRecord[] = referrals.map((referral) => ({
    id: referral.id,
    referee_email: referral.referee_email,
    status: referral.status,
    created_at: referral.created_at,
    signed_up_at: referral.signed_up_at,
    completed_at: referral.completed_at,
    referrer_booking_points: referral.referrer_booking_points,
  }))

  const programDisabled = settings && settings.referral_program_enabled === false

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Refer friends, earn rewards</h1>
        <p className="text-sm text-muted-foreground">
          Invite your network to book with us and both of you unlock exclusive loyalty bonuses.
        </p>
      </div>

      {programDisabled && (
        <Alert variant="destructive">
          <AlertTitle>Loyalty referrals paused</AlertTitle>
          <AlertDescription>
            The referral program is currently unavailable. Check back soon or contact concierge for
            more information.
          </AlertDescription>
        </Alert>
      )}

      <ReferFriendBanner
        referralCode={referralCode}
        referralLink={referralLink}
        bonusPoints={referrerBonus}
      />

      <ReferralStatsGrid
        totalInvites={totalInvites}
        pending={pending}
        signedUp={signedUp}
        completed={completed}
        totalPointsEarned={totalPointsEarned}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ReferralShareCard
          referralCode={referralCode}
          referralLink={referralLink}
          refereeBonus={refereeBonus}
          referrerBonus={referrerBonus}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">1. Invite a friend</p>
              <p className="text-muted-foreground">
                Share your referral link or send them a direct email invitation.
              </p>
            </div>
            <div>
              <p className="font-semibold">2. They sign up</p>
              <p className="text-muted-foreground">
                Your friend creates an account and receives {refereeBonus} bonus points instantly.
              </p>
            </div>
            <div>
              <p className="font-semibold">3. They book, you earn</p>
              <p className="text-muted-foreground">
                Once they complete their first booking, you get {referrerBonus} bonus points.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReferralInviteForm />

      <ReferralHistoryTable referrals={referralHistory} />
    </div>
  )
}

