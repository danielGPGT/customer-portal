import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TripDetailsHeader } from '@/components/trips/trip-details-header'
import { BookingOverviewCard } from '@/components/trips/booking-overview-card'
import { TripDetailsTabs } from '@/components/trips/trip-details-tabs'
import { TripActions } from '@/components/trips/trip-actions'

interface TripDetailsPageProps {
  params: Promise<{ bookingId: string }>
}

export default async function TripDetailsPage({ params }: TripDetailsPageProps) {
  const supabase = await createClient()
  const { bookingId } = await params

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

  // Get booking details from bookings table with all related data
  const { data: booking, error: bookingError } = await supabase
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
      ),
      booking_travelers!booking_travelers_booking_id_fkey (*),
      booking_payments!booking_payments_booking_id_fkey (*),
      booking_components!booking_components_booking_id_fkey (*),
      bookings_flights!bookings_flights_booking_id_fkey (*)
    `)
    .eq('id', bookingId)
    .eq('client_id', client.id)
    .is('deleted_at', null)
    .single()

  if (bookingError || !booking) {
    console.error('Error fetching booking:', bookingError)
    notFound()
  }

  // Get loyalty transactions for this booking
  const { data: loyaltyTransactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('client_id', client.id)
    .or(`source_reference_id.eq.${booking.id},source_reference_id.eq.${bookingId}`)
    .in('source_type', ['purchase', 'redemption', 'refund'])

  // Get redemption for this booking
  const { data: redemption } = await supabase
    .from('redemptions')
    .select('*')
    .eq('booking_id', booking.id)
    .maybeSingle()

  // Find points earned
  const earnTransaction = loyaltyTransactions?.find(
    tx => tx.source_type === 'purchase' && tx.source_reference_id === booking.id.toString()
  )
  const pointsEarned = earnTransaction?.points || 0

  // Find points used
  const pointsUsed = redemption?.points_redeemed || 0
  const discountApplied = redemption?.discount_amount || 0

  // Check if first loyalty booking
  const firstLoyaltyBookingAt = client.first_loyalty_booking_at
  const isFirstLoyaltyBooking = 
    firstLoyaltyBookingAt && 
    booking.confirmed_at &&
    new Date(booking.confirmed_at).toISOString() === new Date(firstLoyaltyBookingAt).toISOString()

  // Map status
  const mapStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
    if (status === 'cancelled' || status === 'refunded') return 'cancelled'
    if (status === 'confirmed' || status === 'completed') return status === 'completed' ? 'completed' : 'confirmed'
    return 'pending'
  }

  // Enrich booking data
  const enrichedBooking = {
    ...booking,
    booking_id: booking.id,
    booking_reference: booking.booking_reference,
    event_name: booking.events?.name || null,
    event_start_date: booking.events?.start_date || null,
    event_end_date: booking.events?.end_date || null,
    total_amount: booking.total_price,
    booking_status: mapStatus(booking.status),
    points_earned: pointsEarned,
    points_used: pointsUsed,
    discount_applied: discountApplied,
    is_first_loyalty_booking: !!isFirstLoyaltyBooking,
    earn_transaction_id: earnTransaction?.id || null,
    spend_transaction_id: redemption?.transaction_id || null,
    booked_at: booking.created_at
  }

  // Get loyalty settings
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('currency, point_value')
    .eq('id', 1)
    .single()

  const currency = settings?.currency || 'GBP'
  const pointValue = settings?.point_value || 1

  const eventName = enrichedBooking.event_name || enrichedBooking.events?.name || 'Event'
  
  // Get location from venue (city, country) or fall back to event location or venue name
  const venue = enrichedBooking.events?.venues as { name?: string; city?: string; country?: string } | null
  const eventLocation = venue 
    ? [venue.city, venue.country].filter(Boolean).join(', ') || venue.name || 'Location TBD'
    : enrichedBooking.events?.location || 'Location TBD'

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-2">
        <Link href="/trips">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trips
        </Link>
      </Button>

      {/* Header */}
      <TripDetailsHeader
        eventName={eventName}
        bookingStatus={enrichedBooking.booking_status}
        isCancelled={enrichedBooking.booking_status === 'cancelled'}
      />

      {/* Overview Card */}
      <BookingOverviewCard
        eventName={eventName}
        eventLocation={eventLocation}
        eventStartDate={enrichedBooking.event_start_date || enrichedBooking.events?.start_date}
        eventEndDate={enrichedBooking.event_end_date || enrichedBooking.events?.end_date}
        bookingReference={enrichedBooking.booking_reference}
        bookingStatus={enrichedBooking.booking_status}
        totalAmount={enrichedBooking.total_amount}
        currency={currency}
        pointsEarned={enrichedBooking.points_earned}
        pointsUsed={enrichedBooking.points_used}
        isFirstLoyaltyBooking={enrichedBooking.is_first_loyalty_booking}
      />

      {/* Tabbed Content */}
      <TripDetailsTabs
        eventName={eventName}
        eventLocation={eventLocation}
        eventStartDate={enrichedBooking.event_start_date || enrichedBooking.events?.start_date}
        eventEndDate={enrichedBooking.event_end_date || enrichedBooking.events?.end_date}
        eventImage={enrichedBooking.events?.event_image}
        bookingReference={enrichedBooking.booking_reference}
        bookedAt={enrichedBooking.booked_at}
        confirmedAt={enrichedBooking.confirmed_at}
        bookingStatus={enrichedBooking.booking_status}
        isFirstLoyaltyBooking={enrichedBooking.is_first_loyalty_booking}
        totalAmount={enrichedBooking.total_amount}
        discountApplied={enrichedBooking.discount_applied}
        currency={currency}
        travelers={booking.booking_travelers || []}
        components={booking.booking_components || []}
        flights={booking.bookings_flights || []}
        payments={booking.booking_payments || []}
        pointsUsed={enrichedBooking.points_used}
        pointsEarned={enrichedBooking.points_earned}
        pointValue={pointValue}
        isCancelled={enrichedBooking.booking_status === 'cancelled'}
      />

      {/* Actions */}
      {enrichedBooking.booking_status !== 'cancelled' && (
        <TripActions
          booking={enrichedBooking}
          eventName={eventName}
          location={eventLocation}
          startDate={enrichedBooking.event_start_date || enrichedBooking.events?.start_date}
          endDate={enrichedBooking.event_end_date || enrichedBooking.events?.end_date}
        />
      )}
    </div>
  )
}

