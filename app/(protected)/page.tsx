import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { getClient } from '@/lib/utils/get-client'
import { parseCalendarDate } from '@/lib/utils/date'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { UpcomingTrips } from '@/components/dashboard/upcoming-trips'
import { EarnRedeemCards } from '@/components/dashboard/earn-redeem-cards'
import { getClientPreferredCurrency } from '@/lib/utils/currency'

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>
}

export const metadata: Metadata = {
  title: 'Dashboard | Grand Prix Grand Tours Portal',
  description: 'View your loyalty points, upcoming trips, and manage your account',
}

// Dynamic page - no caching to ensure immediate updates when preferences change
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const error = params.error
  
  const { client, user, error: clientError } = await getClient()

  // Layout should already have enforced auth, but keep a defensive check
  if (!user) {
    redirect('/sign-in')
  }

  if (!client || clientError) {
    redirect('/sign-in?error=setup_failed')
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()

  // OPTIMIZED: Parallel fetch settings, referrals, and recent transactions (they're independent)
  const [
    { data: settings },
    { data: referralData },
    { data: recentTransactionsRaw }
  ] = await Promise.all([
    // Get loyalty settings for referral bonus and points info
    supabase
      .from('loyalty_settings')
      .select('referral_bonus_referee, referral_bonus_referrer, currency, points_per_pound, point_value, redemption_increment, min_redemption_points')
      .eq('id', 1)
      .single(),
    // Get referral data
    supabase
      .from('referrals')
      .select('referral_code, referral_link')
      .eq('referrer_client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Get compact recent loyalty transactions (for dashboard activity card)
    supabase
      .from('loyalty_transactions')
      .select('id, transaction_type, source_type, points, description, created_at, source_reference_id')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(3)
  ])

  // Get referrer bonus points from loyalty settings (what the user gets when someone books)
  const referrerBonusPoints = settings?.referral_bonus_referrer || 100

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
  
  const { data: upcomingBookings, error: upcomingBookingsError } = await supabase
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
      ),
      booking_components!booking_components_booking_id_fkey (
        id,
        component_type,
        component_data,
        component_snapshot
      )
    `)
    .eq('client_id', client.id)
    .in('status', ['confirmed', 'pending_payment', 'provisional'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (upcomingBookingsError) {
    // Error fetching upcoming bookings - will show empty state
  }

  // Helper function to extract check-in/check-out dates from hotel room components
  const getHotelDates = (booking: any) => {
    const hotelComponents = booking.booking_components?.filter(
      (comp: any) => comp.component_type === 'hotel_room'
    ) || []

    if (hotelComponents.length === 0) return { checkIn: null, checkOut: null }

    // Find the earliest check-in date
    let earliestCheckIn: string | null = null
    let latestCheckOut: string | null = null

    hotelComponents.forEach((comp: any) => {
      const data = comp.component_data || comp.component_snapshot || {}
      const checkIn = data.check_in || data.checkIn
      const checkOut = data.check_out || data.checkOut

      if (checkIn) {
        if (!earliestCheckIn || new Date(checkIn) < new Date(earliestCheckIn)) {
          earliestCheckIn = checkIn
        }
      }
      if (checkOut) {
        if (!latestCheckOut || new Date(checkOut) > new Date(latestCheckOut)) {
          latestCheckOut = checkOut
        }
      }
    })

    return { checkIn: earliestCheckIn, checkOut: latestCheckOut }
  }

  // Find the next upcoming trip (first one with check-in date in the future)
  let nextTrip: any = null
  if (upcomingBookings) {
    const tripsWithDates = upcomingBookings
      .map(booking => {
        const hotelDates = getHotelDates(booking)
        const result = {
          ...booking,
          check_in_date: hotelDates.checkIn,
          check_out_date: hotelDates.checkOut,
          event_start_date: booking.events?.start_date || null,
          event_end_date: booking.events?.end_date || null,
          event_name: booking.events?.name || null,
        }
        return result
      })
      .filter(booking => {
        // Use check-in date if available, otherwise fall back to event start date
        const tripStartDate = booking.check_in_date || booking.event_start_date
        
        if (!tripStartDate) {
          return false
        }
        const startDate = parseCalendarDate(tripStartDate)
        if (!startDate) return false
        startDate.setHours(0, 0, 0, 0)
        return startDate >= today
      })
      .sort((a, b) => {
        // Sort by check-in date if available, otherwise event start date
        const dateA = a.check_in_date || a.event_start_date
        const dateB = b.check_in_date || b.event_start_date
        const timeA = dateA ? (parseCalendarDate(dateA)?.getTime() ?? Infinity) : Infinity
        const timeB = dateB ? (parseCalendarDate(dateB)?.getTime() ?? Infinity) : Infinity
        return timeA - timeB
      })
    
    if (tripsWithDates.length > 0) {
      const trip = tripsWithDates[0]
      // Map status to portal-friendly status
      const mapStatus = (status: string): 'provisional' | 'confirmed' | 'completed' | 'cancelled' => {
        if (status === 'cancelled' || status === 'refunded') return 'cancelled'
        if (status === 'confirmed' || status === 'completed') return status === 'completed' ? 'completed' : 'confirmed'
        return 'provisional'
      }

      nextTrip = {
        id: trip.id,
        booking_id: trip.id,
        booking_reference: trip.booking_reference,
        event_name: trip.event_name,
        check_in_date: trip.check_in_date,
        check_out_date: trip.check_out_date,
        event_start_date: trip.event_start_date, // Keep for fallback
        event_end_date: trip.event_end_date, // Keep for fallback
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
      const mapStatus = (status: string): 'provisional' | 'confirmed' | 'completed' | 'cancelled' => {
        if (status === 'cancelled' || status === 'refunded') return 'cancelled'
        if (status === 'confirmed' || status === 'completed')
          return status === 'completed' ? 'completed' : 'confirmed'
        return 'provisional'
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
        const d = parseCalendarDate(startDate)
        if (!d) return false
        d.setHours(0, 0, 0, 0)
        return d >= today
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
      title: 'Access restricted',
      description: 'This account may only have team portal access. If you should have client access, please contact support.',
    },
  }

  const errorInfo = error ? errorMessages[error] : null

  return (
    <>
      {/* Full-Width Dashboard Header - Breaks out of container */}

      <div className="relative">
        <DashboardHeader
          firstName={client?.first_name || 'Customer'}
          pointsBalance={client?.points_balance || 0}
          lifetimePointsSpent={client?.lifetime_points_spent || 0}
          lifetimePointsEarned={client?.lifetime_points_earned || 0}
          redemptionIncrement={settings?.redemption_increment || 100}
          minRedemptionPoints={settings?.min_redemption_points || 100}
        />
      </div>

        {/* Main Content Container */}
        <div className="space-y-8 pb-8 w-full max-w-full overflow-x-hidden mt-8">
          {errorInfo && (
            <Alert variant="soft">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{errorInfo.title}</AlertTitle>
              <AlertDescription>{errorInfo.description}</AlertDescription>
            </Alert>
          )}
          
          {/* Upcoming Trips Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Upcoming Trip</h2>
              <p className="text-muted-foreground">
                Your next adventure is just around the corner. View details and manage your upcoming trip.
              </p>
            </div>
            <UpcomingTrips
              trip={nextTrip ? {
                id: nextTrip.id,
                booking_id: nextTrip.booking_id,
                booking_reference: nextTrip.booking_reference,
                event_name: nextTrip.event_name,
                check_in_date: nextTrip.check_in_date,
                check_out_date: nextTrip.check_out_date,
                event_start_date: nextTrip.event_start_date,
                event_end_date: nextTrip.event_end_date,
                booking_status: nextTrip.booking_status,
                is_first_loyalty_booking: nextTrip.is_first_loyalty_booking,
                events: nextTrip.events,
              } : null}
            />
          </div>

          {/* How to Earn & Redeem Cards */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Points Guide</h2>
              <p className="text-muted-foreground">
                Learn how to earn and redeem points to maximize your rewards.
              </p>
            </div>
            <EarnRedeemCards
              baseCurrency={settings?.currency || 'GBP'}
              preferredCurrency={getClientPreferredCurrency(client, settings?.currency || 'GBP')}
              pointsPerPound={settings?.points_per_pound || 0.05}
              pointValue={settings?.point_value || 1}
            />
          </div>
        </div>
 
    </>
  )
}

