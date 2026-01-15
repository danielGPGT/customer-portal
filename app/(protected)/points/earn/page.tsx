import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PointsCalculator } from '@/components/points/points-calculator'
import { Lightbulb, Plane, UserPlus, Gift, ArrowRight, FileText, TrendingUp, Coins } from 'lucide-react'
import Link from 'next/link'
import { getClient } from '@/lib/utils/get-client'

export default async function PointsEarnPage() {
  const supabase = await createClient()
  const { client, user } = await getClient()

  if (!user || !client) {
    redirect('/login')
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
    <div className="space-y-8">
      <PageHeader
        title="How to Earn Points"
        description="Discover all the ways you can accumulate points and unlock rewards"
      />

      {/* Earning Rate Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Your Earning Rate
          </CardTitle>
          <CardDescription>
            Points are automatically credited to your account after booking confirmation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-base">
              You earn points every time you book with Grand Prix Grand Tours.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside ml-2">
              <li>For every {currencySymbol}20 you spend, you earn 1 point</li>
              <li>1 point = {currencySymbol}1 to use on a future booking</li>
              <li>Points for each trip are added to your account once your booking is confirmed</li>
              <li>You'll also see a full breakdown of how your points were earned</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Ways to Earn */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Ways to Earn Points</h2>
          <p className="text-muted-foreground">
            Multiple opportunities to boost your points balance
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Book Your Motorsport Experience */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Book Your Motorsport Experience!</CardTitle>
              </div>
              <CardDescription>
                Earn points automatically on every booking
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground flex-1">
                You earn points every time you book with Grand Prix Grand Tours. Points are added to your account once your booking is confirmed, and you'll see a full breakdown of how your points were earned.
              </p>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
                <p className="text-sm font-semibold">
                  Spend {currencySymbol}4,500 → Earn {Math.round(4500 / 20).toLocaleString()} points
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll see this total in your points hub.
                </p>
              </div>
              <Button asChild className="w-full">
                <a 
                  href="https://www.grandprixgrandtours.com/f1-packages/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <span>Explore Races</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Refer A Friend */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Refer A Friend</CardTitle>
              </div>
              <CardDescription>
                Share your unique link and earn 100 points per referral
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside flex-1">
                <li>Your friend automatically receives 100 points when they sign up</li>
                <li>You earn 100 points when they make their first booking</li>
                <li>Your total points earned will be visible in your points hub</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/refer" className="flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Start Referring</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Sign Up Via Referral */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Sign Up Via Referral</CardTitle>
              </div>
              <CardDescription>
                Welcome bonus for new members
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground flex-1">
                If you joined us using a friend's referral link, you already received 100 points in your account.
              </p>
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link href="/points" className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>View Statement</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Points Calculator */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Points Calculator</h2>
          <p className="text-muted-foreground">
            Calculate how many points you'll earn on your next booking
          </p>
        </div>
        <PointsCalculator 
          pointsPerPound={pointsPerPound}
          pointValue={pointValue}
          currency={currency}
        />
      </div>

      {/* Earning History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Your Earning History</h2>
          <p className="text-muted-foreground">
            Track your points accumulation over time
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Lifetime Points Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points Earned</p>
                  <p className="text-2xl font-bold mt-1">
                    {client.lifetime_points_earned?.toLocaleString() || 0}
                  </p>
                </div>
                <Coins className="h-8 w-8 text-primary opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">From Bookings</p>
                  <p className="text-lg font-semibold">{totalBookings}</p>
                  <p className="text-xs text-muted-foreground mt-1">booking{totalBookings !== 1 ? 's' : ''}</p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">From Referrals</p>
                  <p className="text-lg font-semibold">{totalReferrals}</p>
                  <p className="text-xs text-muted-foreground mt-1">referral{totalReferrals !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/points/statement" className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" />
                <span>View Full Statement</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

