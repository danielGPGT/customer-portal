import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TripTabs } from '@/components/trips/trip-tabs'
import { TripList } from '@/components/trips/trip-list'
import { EmptyTripState } from '@/components/trips/empty-trip-state'

type TripTab = 'upcoming' | 'past' | 'cancelled'

interface TripsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const activeTab = (params.tab || 'upcoming') as TripTab
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client data
  let { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!client) {
    redirect('/login')
  }

  // Get all bookings from bookings table with event details
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
  }

  // Get loyalty transactions for points calculation
  const { data: loyaltyTransactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .in('source_type', ['purchase', 'redemption', 'refund'])

  // Get redemptions for discount info
  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('*')
    .eq('client_id', client.id)

  // Get client's first loyalty booking date to check if booking is first
  const firstLoyaltyBookingAt = client.first_loyalty_booking_at

  // Enrich bookings with loyalty data
  const enrichedBookings = (bookings || []).map((booking) => {
    // Map bookings.status to portal-friendly status
    const mapStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
      if (status === 'cancelled' || status === 'refunded') return 'cancelled'
      if (status === 'confirmed' || status === 'completed') return status === 'completed' ? 'completed' : 'confirmed'
      return 'pending' // draft, provisional, pending_payment
    }

    const portalStatus = mapStatus(booking.status)

    const earnTransaction = loyaltyTransactions?.find(
      tx => tx.source_type === 'purchase' && tx.source_reference_id === booking.id.toString()
    )

    const redemption = redemptions?.find(r => r.booking_id === booking.id)

    const pointsEarned =
      (typeof booking.points_earned === 'number' ? booking.points_earned : null) ??
      earnTransaction?.points ??
      0

    const pointsUsed =
      (typeof booking.points_used === 'number' ? booking.points_used : null) ??
      redemption?.points_redeemed ??
      0

    const discountApplied =
      (typeof booking.discount_applied === 'number' ? booking.discount_applied : null) ??
      redemption?.discount_amount ??
      0

    const isFirstLoyaltyBooking = 
      booking.is_first_loyalty_booking ||
      (firstLoyaltyBookingAt &&
      booking.confirmed_at &&
        new Date(booking.confirmed_at).toISOString() === new Date(firstLoyaltyBookingAt).toISOString())

    return {
      id: booking.id,
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      client_id: booking.client_id,
      event_id: booking.event_id,
      quote_id: booking.quote_id,
      
      // Event details from join
      event_name: booking.events?.name || null,
      event_start_date: booking.events?.start_date || null,
      event_end_date: booking.events?.end_date || null,
      
      // Financial
      total_amount: booking.total_price,
      currency: booking.currency || 'GBP',
      discount_applied: discountApplied,
      
      // Loyalty Points (calculated from transactions)
      points_earned: pointsEarned,
      points_used: pointsUsed,
      is_first_loyalty_booking: !!isFirstLoyaltyBooking,
      earn_transaction_id: earnTransaction?.id || null,
      spend_transaction_id: redemption?.transaction_id || null,
      
      // Status (mapped)
      booking_status: portalStatus,
      
      // Timestamps
      booked_at: booking.created_at,
      confirmed_at: booking.confirmed_at,
      cancelled_at: booking.cancelled_at,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      
      // Events relation
      events: booking.events
    }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filterByTab = (tab: TripTab) => {
    return enrichedBookings.filter((booking) => {
    const startDate = booking.event_start_date ? new Date(booking.event_start_date) : null
    const endDate = booking.event_end_date ? new Date(booking.event_end_date) : null

      switch (tab) {
      case 'upcoming':
        return (
          startDate && 
          startDate >= today && 
          (booking.booking_status === 'confirmed' || booking.booking_status === 'pending')
        )
      case 'past':
        return (
          endDate && 
          endDate < today && 
          (booking.booking_status === 'confirmed' || booking.booking_status === 'completed')
        )
      case 'cancelled':
        return booking.booking_status === 'cancelled'
      default:
        return false
    }
  })
  }

  const tabCounts: Record<TripTab, number> = {
    upcoming: filterByTab('upcoming').length,
    past: filterByTab('past').length,
    cancelled: filterByTab('cancelled').length,
  }

  const filteredBookings = filterByTab(activeTab)

  // Sort bookings based on tab
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const aDate = a.event_start_date ? new Date(a.event_start_date) : new Date(0)
    const bDate = b.event_start_date ? new Date(b.event_start_date) : new Date(0)

    switch (activeTab) {
      case 'upcoming':
        // Soonest first
        return aDate.getTime() - bDate.getTime()
      case 'past':
        // Most recent first
        return bDate.getTime() - aDate.getTime()
      case 'cancelled':
        // Most recently cancelled first
        const aUpdated = new Date(a.updated_at || a.created_at)
        const bUpdated = new Date(b.updated_at || b.created_at)
        return bUpdated.getTime() - aUpdated.getTime()
      default:
        return 0
    }
  })

  // Get loyalty settings for currency formatting
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('currency, point_value')
    .eq('id', 1)
    .single()

  const currency = settings?.currency || 'GBP'
  const pointValue = settings?.point_value || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">My Trips</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your bookings
        </p>
      </div>

      <TripTabs activeTab={activeTab} counts={tabCounts} />

      {sortedBookings.length === 0 ? (
        <EmptyTripState tab={activeTab} />
      ) : (
        <TripList 
          bookings={sortedBookings} 
          tab={activeTab}
          currency={currency}
          pointValue={pointValue}
        />
      )}
    </div>
  )
}

