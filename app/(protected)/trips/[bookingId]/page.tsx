import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TripDetailsHeader } from '@/components/trips/trip-details-header'
import { BookingOverviewCard } from '@/components/trips/booking-overview-card'
import { TripDetailsTabs } from '@/components/trips/trip-details-tabs'
import { TripActions } from '@/components/trips/trip-actions'
import { getClient } from '@/lib/utils/get-client'
import { getClientPreferredCurrency } from '@/lib/utils/currency'
import { convertDiscountToPreferredCurrency } from '@/lib/utils/currency-conversion'

interface TripDetailsPageProps {
  params: Promise<{ bookingId: string }>
}

export const metadata: Metadata = {
  title: 'Trip Details | Grand Prix Grand Tours Portal',
  description: 'View detailed information about your trip including itinerary, travellers, and payment details',
}

// Trip details can be cached briefly
// Dynamic page - no caching to ensure immediate updates when preferences change
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TripDetailsPage({ params }: TripDetailsPageProps) {
  const { client, user, error } = await getClient()
  const { bookingId } = await params

  if (!user) {
    redirect('/sign-in')
  }

  if (!client || error) {
    redirect('/dashboard?error=client_not_found')
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient()

  // OPTIMIZED: Parallel fetch booking and loyalty settings (they're independent)
  const [
    { data: booking, error: bookingError },
    { data: settings }
  ] = await Promise.all([
    // Get booking details from bookings table with all related data
    supabase
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
      .single(),
    // Get loyalty settings (independent of booking)
    supabase
      .from('loyalty_settings')
      .select('currency, point_value')
      .eq('id', 1)
      .single()
  ])

  if (bookingError || !booking) {
    notFound()
  }

  // Helper function to extract check-in/check-out dates from hotel room components
  const getHotelDates = (booking: any) => {
    const hotelComponents = booking.booking_components?.filter(
      (comp: any) => comp.component_type === 'hotel_room' && !comp.deleted_at
    ) || []

    if (hotelComponents.length === 0) return { checkIn: null, checkOut: null }

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

  // Get hotel dates (check-in/check-out)
  const hotelDates = getHotelDates(booking)
  
  // Use check-in/check-out dates if available, otherwise fall back to event dates
  const tripStartDate = hotelDates.checkIn || booking.events?.start_date || null
  const tripEndDate = hotelDates.checkOut || booking.events?.end_date || null

  // Get tickets data for ticket components
  const ticketComponents = booking.booking_components?.filter(
    (comp: any) => comp.component_type === 'ticket' && comp.component_id && !comp.deleted_at
  ) || []
  
  const ticketIds = ticketComponents.map((comp: any) => comp.component_id).filter(Boolean)

  // OPTIMIZED: Parallel fetch transactions, redemptions, and tickets (they're independent of each other)
  const [
    { data: earnTransaction },
    { data: spendTransaction },
    { data: redemptions },
    { data: tickets }
  ] = await Promise.all([
    // Get earn transaction (if exists)
    booking.earn_transaction_id
      ? supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('id', booking.earn_transaction_id)
          .single()
      : Promise.resolve({ data: null }),
    // Get spend transaction (if exists)
    booking.spend_transaction_id
      ? supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('id', booking.spend_transaction_id)
          .single()
      : Promise.resolve({ data: null }),
    // Get redemption(s) for this booking
    supabase
      .from('redemptions')
      .select('*')
      .eq('booking_id', booking.id)
      .order('applied_at', { ascending: false }),
    // Get tickets data (if any ticket components exist)
    ticketIds.length > 0
      ? supabase
          .from('tickets')
          .select('id, ticket_days')
          .in('id', ticketIds)
      : Promise.resolve({ data: [] })
  ])
  
  // Create a map of ticket_id -> ticket_days for easy lookup
  const ticketDaysMap = new Map(
    (tickets || []).map((ticket: any) => [ticket.id, ticket.ticket_days])
  )

  // Use booking fields directly (from migration - these are now on bookings table)
  const pointsEarned = booking.points_earned || 0
  const pointsUsed = booking.points_used || 0
  const discountApplied = booking.discount_applied || 0
  const isFirstLoyaltyBooking = booking.is_first_loyalty_booking || false

  // Map status
  const mapStatus = (status: string): 'provisional' | 'confirmed' | 'completed' | 'cancelled' => {
    if (status === 'cancelled' || status === 'refunded') return 'cancelled'
    if (status === 'confirmed' || status === 'completed') return status === 'completed' ? 'completed' : 'confirmed'
    return 'provisional'
  }

  // Enrich booking data
  const enrichedBooking = {
    ...booking,
    booking_id: booking.id,
    booking_reference: booking.booking_reference,
    event_name: booking.events?.name || null,
    event_start_date: booking.events?.start_date || null,
    event_end_date: booking.events?.end_date || null,
    // Trip dates (hotel check-in/out or event dates)
    trip_start_date: tripStartDate,
    trip_end_date: tripEndDate,
    total_amount: booking.total_price,
    booking_status: mapStatus(booking.status),
    points_earned: pointsEarned,
    points_used: pointsUsed,
    discount_applied: discountApplied,
    is_first_loyalty_booking: isFirstLoyaltyBooking,
    earn_transaction_id: booking.earn_transaction_id,
    spend_transaction_id: booking.spend_transaction_id,
    earn_transaction: earnTransaction,
    spend_transaction: spendTransaction,
    redemptions: redemptions || [],
    booked_at: booking.created_at
  }

  const defaultCurrency = settings?.currency || 'GBP'
  const currency = booking.currency || defaultCurrency
  const pointValue = settings?.point_value || 1
  
  // Get client's preferred currency and convert discount amounts
  const preferredCurrency = getClientPreferredCurrency(client, defaultCurrency)
  const discountConversion = await convertDiscountToPreferredCurrency(
    discountApplied,
    defaultCurrency,
    preferredCurrency
  )

  const eventName = enrichedBooking.event_name || enrichedBooking.events?.name || 'Event'
  
  // Get location from venue (city, country) or fall back to event location or venue name
  const venue = enrichedBooking.events?.venues as { name?: string; city?: string; country?: string } | null
  const eventLocation = venue 
    ? [venue.city, venue.country].filter(Boolean).join(', ') || venue.name || 'Location TBD'
    : enrichedBooking.events?.location || 'Location TBD'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-2 h-8 sm:h-10 px-2 sm:px-4">
        <Link href="/trips" prefetch={true}>
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Back to Trips</span>
        </Link>
      </Button>

      {/* Header */}
      <TripDetailsHeader
        eventName={eventName}
        eventLocation={eventLocation}
        tripStartDate={enrichedBooking.trip_start_date}
        tripEndDate={enrichedBooking.trip_end_date}
        bookingReference={enrichedBooking.booking_reference}
        bookingStatus={enrichedBooking.booking_status}
        totalAmount={enrichedBooking.total_amount}
        currency={currency}
        pointsEarned={enrichedBooking.points_earned}
        pointsUsed={enrichedBooking.points_used}
        isFirstLoyaltyBooking={enrichedBooking.is_first_loyalty_booking}
        eventImage={enrichedBooking.events?.event_image}
      />

      {/* Tabbed Content */}
      <TripDetailsTabs
        eventName={eventName}
        eventLocation={eventLocation}
        eventStartDate={enrichedBooking.trip_start_date}
        eventEndDate={enrichedBooking.trip_end_date}
        eventImage={enrichedBooking.events?.event_image}
        bookingReference={enrichedBooking.booking_reference}
        bookedAt={enrichedBooking.booked_at}
        confirmedAt={enrichedBooking.confirmed_at}
        bookingStatus={enrichedBooking.booking_status}
        isFirstLoyaltyBooking={enrichedBooking.is_first_loyalty_booking}
        totalAmount={enrichedBooking.total_amount}
        discountApplied={enrichedBooking.discount_applied}
        currency={currency}
        bookingId={bookingId}
        travelers={booking.booking_travelers || []}
        components={booking.booking_components || []}
        ticketDaysMap={ticketDaysMap}
        flights={booking.bookings_flights || []}
        payments={booking.booking_payments || []}
        pointsUsed={enrichedBooking.points_used}
        pointsEarned={enrichedBooking.points_earned}
        pointValue={pointValue}
        isCancelled={enrichedBooking.booking_status === 'cancelled'}
        earnTransaction={enrichedBooking.earn_transaction}
        spendTransaction={enrichedBooking.spend_transaction}
        redemptions={enrichedBooking.redemptions}
        preferredCurrency={preferredCurrency !== defaultCurrency ? preferredCurrency : undefined}
        discountAppliedConverted={discountConversion.convertedAmount}
      />

      {/* Actions */}
      {enrichedBooking.booking_status !== 'cancelled' && (
        <TripActions
          booking={enrichedBooking}
          eventName={eventName}
          location={eventLocation}
          startDate={enrichedBooking.trip_start_date}
          endDate={enrichedBooking.trip_end_date}
        />
      )}
    </div>
  )
}

