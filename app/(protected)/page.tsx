import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReferFriendBanner } from '@/components/points/refer-friend-banner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>
}

// Cache this dashboard page for 60 seconds to reduce repeat Supabase work
export const revalidate = 60

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const error = params.error
  const { client, user, error: clientError } = await getClient()

  // Layout should already have enforced auth, but keep a defensive check
  if (!user) {
    redirect('/login')
  }

  if (!client || clientError) {
    redirect('/login?error=setup_failed')
  }

  // Get loyalty settings for referral bonus
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('referral_bonus_referee, referral_bonus_referrer')
    .eq('id', 1)
    .single()

  // Get referral data
  const { data: referralData } = await supabase
    .from('referrals')
    .select('referral_code, referral_link')
    .eq('referrer_client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get referrer bonus points from loyalty settings (what the user gets when someone books)
  const referrerBonusPoints = settings?.referral_bonus_referrer || 100

  // Error messages mapping
  const errorMessages: Record<string, { title: string; description: string }> = {
    client_access_required: {
      title: 'Access Restricted',
      description: 'You don\'t have access to the client portal. This account may only have team portal access. Please contact support if you believe this is an error.',
    },
  }

  const errorInfo = error ? errorMessages[error] : null

  return (
    <div className="space-y-6">
      {errorInfo && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorInfo.title}</AlertTitle>
          <AlertDescription>{errorInfo.description}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {client?.first_name || 'Customer'}!
        </h1>
        <p className="text-muted-foreground mt-1">Your loyalty dashboard</p>
      </div>
      
      {/* Points Card */}
      <div className="rounded-lg border border-primary/20 bg-primary text-primary-foreground p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-2">Points Balance</h2>
        <p className="text-4xl font-bold">{client?.points_balance || 0}</p>
        <p className="text-sm text-primary-foreground/90 mt-2">
          Worth £{(client?.points_balance || 0).toLocaleString()} in discounts
        </p>
      </div>

      {/* Refer Friend Banner */}
      <ReferFriendBanner
        referralCode={referralData?.referral_code}
        referralLink={referralData?.referral_link}
        bonusPoints={referrerBonusPoints}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Lifetime Earned</h3>
          <p className="text-2xl font-bold mt-2">{client?.lifetime_points_earned || 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Lifetime Spent</h3>
          <p className="text-2xl font-bold mt-2">{client?.lifetime_points_spent || 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
          <p className="text-2xl font-bold mt-2">
            {client?.loyalty_enrolled_at 
              ? new Date(client.loyalty_enrolled_at).toLocaleDateString('en-GB', { 
                  month: 'short', 
                  year: 'numeric' 
                })
              : 'N/A'
            }
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/points">
              <div className="text-left">
                <p className="font-semibold">My Points</p>
                <p className="text-sm text-muted-foreground">View statement & history</p>
              </div>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/trips">
              <div className="text-left">
                <p className="font-semibold">My Trips</p>
                <p className="text-sm text-muted-foreground">View bookings</p>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

