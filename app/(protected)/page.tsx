import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'
import { NextTripCard } from '@/components/dashboard/next-trip-card'
import { PointsBalanceCard } from '@/components/dashboard/points-balance-card'
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card'
import { ReferralHighlight } from '@/components/dashboard/referral-highlight'
import { DashboardHeroCard } from '@/components/dashboard/dashboard-hero-card'
import { DashboardPillsRow } from '@/components/dashboard/dashboard-pills-row'
import { UpcomingTripsCarousel } from '@/components/dashboard/upcoming-trips-carousel'
import { DashboardActivityList } from '@/components/dashboard/dashboard-activity-list'
import { DashboardStatsCard } from '@/components/dashboard/dashboard-stats-card'

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

  // Get compact recent loyalty transactions (for dashboard activity card)
  const { data: recentTransactionsRaw } = await supabase
    .from('loyalty_transactions')
    .select('id, transaction_type, source_type, points, description, created_at, source_reference_id')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Enrich with booking reference and event name where applicable (batch query)
  let recentTransactions: {
    id: string
    transaction_type: string
    source_type: string
    points: number
    description: string
    created_at: string
    booking_reference?: string | null
    event_name?: string | null
  }[] = []

  if (recentTransactionsRaw && recentTransactionsRaw.length > 0) {
    const bookingIds = recentTransactionsRaw
      .filter(
        (tx) =>
          tx.source_reference_id &&
          (tx.source_type === 'purchase' || tx.source_type === 'redemption')
      )
      .map((tx) => tx.source_reference_id as string)
      .filter((id, index, self) => self.indexOf(id) === index)

    const bookingMap = new Map<string, { booking_reference: string | null; event_name: string | null }>()

    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(
          `
          id,
          booking_reference,
          events (
            name
          )
        `
        )
        .in('id', bookingIds)
        .is('deleted_at', null)

      bookings?.forEach((booking: any) => {
        bookingMap.set(booking.id, {
          booking_reference: booking.booking_reference || null,
          event_name: (booking.events as { name?: string } | null)?.name || null,
        })
      })
    }

    recentTransactions = recentTransactionsRaw.map((tx) => {
      if (
        tx.source_reference_id &&
        (tx.source_type === 'purchase' || tx.source_type === 'redemption')
      ) {
        const booking = bookingMap.get(tx.source_reference_id as string)
        return {
          ...tx,
          booking_reference: booking?.booking_reference ?? null,
          event_name: booking?.event_name ?? null,
        }
      }

      return {
        ...tx,
        booking_reference: null,
        event_name: null,
      }
    })
  }

  // Get next upcoming trip
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      status,
      is_first_loyalty_booking,
      events (
        id,
        name,
        location,
        start_date,
        end_date,
        event_image,
        venue_id,
        venues (
          name,
          city,
          country
        )
      )
    `)
    .eq('client_id', client.id)
    .in('status', ['confirmed', 'pending_payment', 'provisional'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Find the next upcoming trip (first one with start_date in the future)
  let nextTrip: any = null
  if (upcomingBookings) {
    const tripsWithDates = upcomingBookings
      .map(booking => ({
        ...booking,
        event_start_date: booking.events?.start_date || null,
        event_end_date: booking.events?.end_date || null,
        event_name: booking.events?.name || null,
      }))
      .filter(booking => {
        if (!booking.event_start_date) return false
        const startDate = new Date(booking.event_start_date)
        return startDate >= today
      })
      .sort((a, b) => {
        const dateA = a.event_start_date ? new Date(a.event_start_date).getTime() : Infinity
        const dateB = b.event_start_date ? new Date(b.event_start_date).getTime() : Infinity
        return dateA - dateB
      })

    if (tripsWithDates.length > 0) {
      const trip = tripsWithDates[0]
      // Map status to portal-friendly status
      const mapStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
        if (status === 'cancelled' || status === 'refunded') return 'cancelled'
        if (status === 'confirmed' || status === 'completed') return status === 'completed' ? 'completed' : 'confirmed'
        return 'pending'
      }

      nextTrip = {
        id: trip.id,
        booking_id: trip.id,
        booking_reference: trip.booking_reference,
        event_name: trip.event_name,
        event_start_date: trip.event_start_date,
        event_end_date: trip.event_end_date,
        booking_status: mapStatus(trip.status),
        is_first_loyalty_booking: trip.is_first_loyalty_booking || false,
        events: trip.events,
      }
    }
  }

  // Get a couple of most recent trips for dashboard (lightweight version of Trips page)
  const { data: recentBookingsRaw } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_reference,
      status,
      events (
        name,
        start_date
      )
    `
    )
    .eq('client_id', client.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(2)

  const recentTrips =
    recentBookingsRaw?.map((booking: any) => {
      const mapStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
        if (status === 'cancelled' || status === 'refunded') return 'cancelled'
        if (status === 'confirmed' || status === 'completed')
          return status === 'completed' ? 'completed' : 'confirmed'
        return 'pending'
      }

      return {
        id: booking.id as string,
        booking_reference: booking.booking_reference as string,
        event_name: (booking.events as { name?: string } | null)?.name || null,
        event_start_date: (booking.events as { start_date?: string } | null)?.start_date || null,
        booking_status: mapStatus(booking.status as string),
      }
    }) || []

  // Count upcoming trips for pills
  const upcomingTripsCount = upcomingBookings
    ? upcomingBookings.filter((booking) => {
        const startDate = booking.events?.start_date
        if (!startDate) return false
        return new Date(startDate) >= today
      }).length
    : 0

  // Referral stats for highlight card
  const { data: referralStats } = await supabase
    .from('referrals')
    .select('id, status, referrer_booking_points, referee_email, referee_name, created_at')
    .eq('referrer_client_id', client.id)
    .order('created_at', { ascending: false })

  const totalInvites = referralStats?.length || 0
  const completedReferrals =
    referralStats?.filter((r) => r.status === 'completed').length || 0
  const totalPointsEarned =
    referralStats?.reduce(
      (sum, r) => sum + (r.referrer_booking_points || 0),
      0
    ) || 0

  // Calculate progress percentage (points progress toward next milestone)
  // For now, use a simple calculation: % of way to next 1000 points
  const nextMilestone = Math.ceil((client?.points_balance || 0) / 1000) * 1000
  const currentMilestone = Math.floor((client?.points_balance || 0) / 1000) * 1000
  const progressPercentage = nextMilestone > 0 && nextMilestone !== currentMilestone
    ? Math.round(((client?.points_balance || 0) - currentMilestone) / (nextMilestone - currentMilestone) * 100)
    : 0

  // Get monthly activity for last 3 months (for bar chart)
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)

  const { data: monthlyTransactions } = await supabase
    .from('loyalty_transactions')
    .select('points, transaction_type, created_at')
    .eq('client_id', client.id)
    .eq('transaction_type', 'earn')
    .gte('created_at', threeMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  // Group by month
  const monthlyActivityMap = new Map<string, number>()
  monthlyTransactions?.forEach((tx) => {
    const month = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyActivityMap.set(month, (monthlyActivityMap.get(month) || 0) + Math.abs(tx.points || 0))
  })

  // Get last 3 months
  const monthlyActivity = []
  for (let i = 2; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(now.getMonth() - i)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyActivity.push({
      period: monthKey,
      value: monthlyActivityMap.get(monthKey) || 0,
    })
  }

  // Error messages mapping
  const errorMessages: Record<string, { title: string; description: string }> = {
    client_access_required: {
      title: 'Access Restricted',
      description: 'You don\'t have access to the client portal. This account may only have team portal access. Please contact support if you believe this is an error.',
    },
  }

  const errorInfo = error ? errorMessages[error] : null

  return (
    <div className="space-y-8 pb-8 w-full max-w-full overflow-x-hidden">
      {errorInfo && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorInfo.title}</AlertTitle>
          <AlertDescription>{errorInfo.description}</AlertDescription>
        </Alert>
      )}
      
      {/* Main Grid: Left hero/content + Right stats column */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] w-full max-w-full">
        {/* Left Column: Hero, Pills, Main Content */}
        <div className="space-y-6 min-w-0 w-full max-w-full">
          {/* Hero Banner */}
          <DashboardHeroCard
            firstName={client?.first_name || 'Customer'}
            nextTripId={nextTrip?.id}
            pointsBalance={client?.points_balance || 0}
          />

          {/* Pills Row */}
          <DashboardPillsRow
            upcomingTripsCount={upcomingTripsCount}
            pointsBalance={client?.points_balance || 0}
            friendsReferred={totalInvites}
          />

          {/* Upcoming Trips Carousel */}
          {upcomingBookings && upcomingBookings.length > 0 && (
            <UpcomingTripsCarousel
              trips={upcomingBookings
                .map((booking) => ({
                  id: booking.id,
                  booking_reference: booking.booking_reference,
                  event_name: booking.events?.name || null,
                  event_start_date: booking.events?.start_date || null,
                  event_end_date: booking.events?.end_date || null,
                  booking_status: (() => {
                    const mapStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
                      if (status === 'cancelled' || status === 'refunded') return 'cancelled'
                      if (status === 'confirmed' || status === 'completed')
                        return status === 'completed' ? 'completed' : 'confirmed'
                      return 'pending'
                    }
                    return mapStatus(booking.status)
                  })(),
                  events: booking.events,
                }))
                .filter((trip) => {
                  if (!trip.event_start_date) return false
                  return new Date(trip.event_start_date) >= today
                })
                .slice(0, 5)}
            />
          )}

        </div>

        {/* Right Column: Stats, Activity & Referrals (full height sidebar) */}
        <div className="space-y-6 min-w-0">
          {/* Stats Card with Progress */}
          <DashboardStatsCard
            firstName={client?.first_name || 'Customer'}
            profileImageUrl={client?.avatar_url || null}
            progressPercentage={progressPercentage}
            monthlyActivity={monthlyActivity}
          />

          {/* Activity List */}
          <DashboardActivityList transactions={recentTransactions} trips={recentTrips} />
        </div>
      </div>

      {/* Referral Highlight - Full Width */}
      <div className="w-full max-w-full">
        <ReferralHighlight
          totalInvites={totalInvites}
          completedReferrals={completedReferrals}
          totalPointsEarned={totalPointsEarned}
          referralBonusPerFriend={settings?.referral_bonus_referrer || 100}
        />
      </div>
    </div>
  )
}

