'use client'

import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Search, Filter } from 'lucide-react'

import { TripCard } from './trip-card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

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
    venues?: {
      name?: string
      city?: string
      country?: string
    } | null
  } | null
}

type TripTab = 'upcoming' | 'past' | 'cancelled'
type SortOption = 'date-asc' | 'date-desc' | 'amount-desc' | 'amount-asc'

interface TripListProps {
  bookings: Booking[]
  tab: TripTab
  currency: string
  pointValue: number
}

const tabLabels: Record<TripTab, string> = {
  upcoming: 'Upcoming Trips',
  past: 'Past Trips',
  cancelled: 'Cancelled Trips',
}

const getLocationLabel = (booking: Booking) => {
  const venue = booking.events?.venues
  if (venue?.city || venue?.country) {
    return [venue.city, venue.country].filter(Boolean).join(', ')
  }
  return booking.events?.location || venue?.name || 'Location TBD'
}

const getMonthLabel = (booking: Booking) => {
  const startDate = booking.event_start_date || booking.events?.start_date
  if (!startDate) return null
  return format(new Date(startDate), 'MMM yyyy')
}

export function TripList({ bookings, tab, currency, pointValue }: TripListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDestination, setSelectedDestination] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>(tab === 'past' ? 'date-desc' : 'date-asc')

  const destinations = useMemo(() => {
    const values = new Set<string>()
    bookings.forEach((booking) => {
      const location = getLocationLabel(booking)
      if (location && location !== 'Location TBD') {
        values.add(location)
      }
    })
    return Array.from(values).sort()
  }, [bookings])

  const months = useMemo(() => {
    const values = new Set<string>()
    bookings.forEach((booking) => {
      const month = getMonthLabel(booking)
      if (month) {
        values.add(month)
      }
    })
    return Array.from(values).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )
  }, [bookings])

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return bookings.filter((booking) => {
      const location = getLocationLabel(booking)
      const month = getMonthLabel(booking)
      const haystack = `${booking.event_name ?? ''} ${booking.booking_reference} ${location}`.toLowerCase()

      const matchesSearch = query ? haystack.includes(query) : true
      const matchesDestination =
        selectedDestination === 'all' || location === selectedDestination
      const matchesMonth = selectedMonth === 'all' || month === selectedMonth

      return matchesSearch && matchesDestination && matchesMonth
    })
  }, [bookings, searchQuery, selectedDestination, selectedMonth])

  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const dateA = a.event_start_date ? new Date(a.event_start_date) : new Date(0)
      const dateB = b.event_start_date ? new Date(b.event_start_date) : new Date(0)

      switch (sortOption) {
        case 'date-asc':
          return dateA.getTime() - dateB.getTime()
        case 'date-desc':
          return dateB.getTime() - dateA.getTime()
        case 'amount-asc':
          return a.total_amount - b.total_amount
        case 'amount-desc':
          return b.total_amount - a.total_amount
        default:
          return 0
      }
    })
  }, [filteredBookings, sortOption])

  const renderChip = (label: string, isActive: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition',
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/60 bg-background hover:bg-muted'
      )}
      aria-pressed={isActive}
    >
      {label}
    </button>
  )

  const hasResults = sortedBookings.length > 0

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {tab === 'upcoming' ? 'Plan ahead' : tab === 'past' ? 'Throwback' : 'Change of plans'}
          </p>
          <h2 className="text-xl font-semibold">
          {tabLabels[tab]} ({bookings.length})
        </h2>
      </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by event or reference"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date · Soonest first</SelectItem>
              <SelectItem value="date-desc">Date · Latest first</SelectItem>
              <SelectItem value="amount-desc">Amount · High to low</SelectItem>
              <SelectItem value="amount-asc">Amount · Low to high</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(destinations.length > 0 || months.length > 0) && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Refine results
          </div>

          {destinations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Destination</p>
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {renderChip('All', selectedDestination === 'all', () => setSelectedDestination('all'))}
                {destinations.map((destination) => (
                  <React.Fragment key={destination}>
                    {renderChip(destination, selectedDestination === destination, () =>
                      setSelectedDestination((prev) => (prev === destination ? 'all' : destination))
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {months.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Month</p>
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {renderChip('Any', selectedMonth === 'all', () => setSelectedMonth('all'))}
                {months.map((month) => (
                  <React.Fragment key={month}>
                    {renderChip(month, selectedMonth === month, () =>
                      setSelectedMonth((prev) => (prev === month ? 'all' : month))
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasResults ? (
        <>
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {sortedBookings.map((booking) => (
                <div key={booking.id} className="min-w-[280px] snap-start">
                  <TripCard
                    booking={booking}
                    variant={tab}
                    currency={currency}
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
            currency={currency}
            pointValue={pointValue}
          />
        ))}
      </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No trips match the current filters.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary hover:underline"
            onClick={() => {
              setSearchQuery('')
              setSelectedDestination('all')
              setSelectedMonth('all')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

