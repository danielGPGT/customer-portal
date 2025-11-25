import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PointsCalculator } from '@/components/points/points-calculator'
import { Lightbulb, BookOpen, UserPlus, Gift, ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function PointsEarnPage() {
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
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // If client not found, try to link by email
  if (!client && user.email) {
    const { data: linkedClient } = await supabase
      .rpc('link_client_to_user', { p_user_id: user.id })

    if (linkedClient && linkedClient.length > 0) {
      const { data: retryClient } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
      
      if (retryClient) {
        client = retryClient
      } else {
        client = linkedClient[0]
      }
    }
  }

  if (!client) {
    redirect('/dashboard?error=client_not_found')
  }

  // Get loyalty settings
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('*')
    .eq('id', 1)
    .single()

  // Get earning stats
  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', client.id)
    .in('status', ['confirmed', 'completed'])
    .is('deleted_at', null)

  const { data: referralsData } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_client_id', client.id)
    .eq('status', 'completed')

  const totalBookings = bookingsData?.length || 0
  const totalReferrals = referralsData?.length || 0

  const pointsPerPound = settings?.points_per_pound || 0.05
  const pointValue = settings?.point_value || 1
  const currency = settings?.currency || 'GBP'
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">How to Earn Points</h1>
      </div>

      {/* Earning Rate Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Earning Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base">
            You earn {pointsPerPound} points for every {currencySymbol}1 you spend on trips
          </p>
          <p className="text-base font-medium">
            That's 1 point for every {currencySymbol}{Math.round(1 / pointsPerPound).toLocaleString()}!
          </p>
        </CardContent>
      </Card>

      {/* Ways to Earn */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ways to Earn</h2>
        <div className="space-y-4">
          {/* Book Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">1️⃣</span>
                <span>Book Trips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-muted-foreground">
                Earn points on every booking you make with us.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Example:</p>
                <p className="text-sm text-muted-foreground">
                  {currencySymbol}4,500 booking = {Math.round(4500 * pointsPerPound).toLocaleString()} points
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/trips" className="flex items-center justify-between">
                  <span>Browse Events</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Refer Friends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">2️⃣</span>
                <span>Refer Friends</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-muted-foreground">
                Get {settings?.referral_bonus_referee || 100} bonus points when your friend signs up, plus another {settings?.referral_bonus_referrer || 100} points when they make their first booking!
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Total: {(settings?.referral_bonus_referee || 100) + (settings?.referral_bonus_referrer || 100)} points per referral
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/refer" className="flex items-center justify-between">
                  <span>Start Referring</span>
                  <UserPlus className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Sign Up with Referral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">3️⃣</span>
                <span>Sign Up with Referral</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-muted-foreground">
                If you signed up using a friend's referral link, you already got {settings?.referral_bonus_referee || 100} bonus points!
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/points/statement" className="flex items-center justify-between">
                  <span>Check your statement</span>
                  <FileText className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Points Calculator */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Points Calculator</h2>
        <PointsCalculator 
          pointsPerPound={pointsPerPound}
          pointValue={pointValue}
          currency={currency}
        />
      </div>

      {/* Earning History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Earning History</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Earned:</span>
                <span className="text-lg font-bold">{client.lifetime_points_earned?.toLocaleString() || 0} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">From {totalBookings} booking{totalBookings !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">From {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/points/statement" className="flex items-center justify-between">
                <span>View Statement</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

