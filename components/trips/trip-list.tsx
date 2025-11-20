'use client'

import { TripCard } from './trip-card'

interface Booking {
  id: string
  booking_id: string
  booking_reference: string
  event_name: string | null
  event_start_date: string | null
  event_end_date: string | null
  total_amount: number
  currency: string
  points_earned: number
  points_used: number
  discount_applied: number
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  is_first_loyalty_booking: boolean
  events?: {
    name: string
    location: string | null
    start_date: string
    end_date: string
    event_image: any | null
  } | null
}

type TripTab = 'upcoming' | 'past' | 'cancelled'

interface TripListProps {
  bookings: Booking[]
  tab: TripTab
  currency: string
  pointValue: number
}

export function TripList({ bookings, tab, currency, pointValue }: TripListProps) {
  const tabLabels = {
    upcoming: 'Upcoming Trips',
    past: 'Past Trips',
    cancelled: 'Cancelled Trips'
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {tabLabels[tab]} ({bookings.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <TripCard
            key={booking.id}
            booking={booking}
            variant={tab}
            currency={currency}
            pointValue={pointValue}
          />
        ))}
      </div>
    </div>
  )
}

