'use client'

import { TripCard } from './trip-card'
import { UpcomingTrips } from '@/components/dashboard/upcoming-trips'

interface Booking {
  id: string
  booking_id: string
  booking_reference: string
  event_name: string | null
  event_start_date: string | null
  event_end_date: string | null
  check_in_date?: string | null
  check_out_date?: string | null
  total_amount: number
  currency: string
  points_earned: number
  points_used: number
  discount_applied: number
  booking_status: 'provisional' | 'confirmed' | 'completed' | 'cancelled'
  is_first_loyalty_booking: boolean
  events?: {
    name: string
    location: string | null
    start_date: string
    end_date: string
    event_image: any | null
    venues?: {
      name?: string
      city?: string
      country?: string
    } | null
  } | null
}

type TripTab = 'upcoming' | 'past' | 'all'

interface TripListProps {
  bookings: Booking[]
  tab: TripTab
  pointValue: number
}

export function TripList({ bookings, tab, pointValue }: TripListProps) {
  // Sort bookings based on tab
  const sortedBookings = [...bookings].sort((a, b) => {
    const aDate = a.event_start_date ? new Date(a.event_start_date) : new Date(0)
    const bDate = b.event_start_date ? new Date(b.event_start_date) : new Date(0)

    switch (tab) {
      case 'upcoming':
        // Soonest first
        return aDate.getTime() - bDate.getTime()
      case 'past':
        // Most recent first
        return bDate.getTime() - aDate.getTime()
      case 'all':
        // Most recent first
        return bDate.getTime() - aDate.getTime()
        default:
          return 0
      }
    })

  const hasResults = sortedBookings.length > 0

  // Get header content based on tab
  const getHeaderContent = () => {
    switch (tab) {
      case 'upcoming':
        return {
          title: 'Upcoming Trip',
          description: 'Your next adventure is just around the corner. View details and manage your upcoming trip.',
        }
      case 'past':
        return {
          title: 'Past Trips',
          description: 'Relive your travel memories. View details from your completed bookings.',
        }
      case 'all':
        return {
          title: 'All Trips',
          description: 'View and manage all your bookings in one place.',
        }
      default:
        return {
          title: 'My Trips',
          description: 'View and manage your bookings',
        }
    }
  }

  const headerContent = getHeaderContent()

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{headerContent.title}</h2>
        <p className="text-muted-foreground">{headerContent.description}</p>
      </div>

      {hasResults ? (
        <>
          {/* For upcoming tab, show first trip with UpcomingTrips component */}
          {tab === 'upcoming' && sortedBookings.length > 0 && (
            <div className="space-y-6">
              <UpcomingTrips
                trip={{
                  id: sortedBookings[0].id,
                  booking_id: sortedBookings[0].booking_id,
                  booking_reference: sortedBookings[0].booking_reference,
                  event_name: sortedBookings[0].event_name,
                  check_in_date: sortedBookings[0].check_in_date || null,
                  check_out_date: sortedBookings[0].check_out_date || null,
                  event_start_date: sortedBookings[0].event_start_date,
                  event_end_date: sortedBookings[0].event_end_date,
                  booking_status: sortedBookings[0].booking_status,
                  is_first_loyalty_booking: sortedBookings[0].is_first_loyalty_booking,
                  events: sortedBookings[0].events,
                }}
              />
              
              {/* Show remaining trips if any */}
              {sortedBookings.length > 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">More Upcoming Trips</h3>
                    <p className="text-sm text-muted-foreground">
                      {sortedBookings.length - 1} {sortedBookings.length === 2 ? 'trip' : 'trips'} coming up
                    </p>
      </div>

                  <div className="md:hidden -mx-4 px-4">
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                      {sortedBookings.slice(1).map((booking) => (
                        <div key={booking.id} className="min-w-[280px] snap-start">
                          <TripCard
                            booking={booking}
                            variant={tab}
                            pointValue={pointValue}
                          />
          </div>
                ))}
              </div>
            </div>

                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {sortedBookings.slice(1).map((booking) => (
                      <TripCard
                        key={booking.id}
                        booking={booking}
                        variant={tab}
                        pointValue={pointValue}
                      />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

          {/* For past and all tabs, show all trips in grid */}
          {tab !== 'upcoming' && (
        <>
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {sortedBookings.map((booking) => (
                <div key={booking.id} className="min-w-[280px] snap-start">
                  <TripCard
                    booking={booking}
                    variant={tab}
                    pointValue={pointValue}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {sortedBookings.map((booking) => (
          <TripCard
            key={booking.id}
            booking={booking}
            variant={tab}
            pointValue={pointValue}
          />
        ))}
      </div>
            </>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {tab === 'upcoming' 
              ? 'No upcoming trips at the moment.' 
              : tab === 'past'
              ? 'No past trips to display.'
              : 'No trips found.'}
          </p>
        </div>
      )}
    </div>
  )
}

