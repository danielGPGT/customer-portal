'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format, differenceInDays } from 'date-fns'
import {
  Calendar,
  MapPin,
  ArrowRight,
  Plane,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface UpcomingTrip {
  id: string
  booking_id: string
  booking_reference: string
  event_name: string | null
  check_in_date: string | null
  check_out_date: string | null
  event_start_date: string | null // Fallback if no check-in date
  event_end_date: string | null // Fallback if no check-out date
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  is_first_loyalty_booking?: boolean
  events?: {
    name: string
    location: string | null
    start_date: string
    end_date: string
    event_image?: any | null
    venues?: {
      name?: string
      city?: string
      country?: string
    } | null
  } | null
}

interface UpcomingTripsProps {
  trip: UpcomingTrip | null
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  },
}

const extractImageUrl = (imageData: any): string | null => {
  if (!imageData) return null
  if (typeof imageData === 'string') return imageData
  if (Array.isArray(imageData) && imageData[0]) {
    const first = imageData[0]
    if (typeof first === 'string') return first
    if (typeof first === 'object') {
      return first.image_url || first.thumbnail_url || first.url || first.src || first.path || null
    }
  }
  if (typeof imageData === 'object') {
    return imageData.image_url || imageData.thumbnail_url || imageData.url || imageData.src || imageData.path || null
  }
  return null
}

export function UpcomingTrips({ trip }: UpcomingTripsProps) {
  // No upcoming trips state
  if (!trip) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-muted/50 to-muted border border-border/50 p-8 md:p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <CalendarDays className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-2xl font-bold">No upcoming trip</h3>
            <p className="text-muted-foreground">
              Start planning your next adventure! Book a trip to start earning loyalty points and unlock exclusive rewards.
            </p>
          </div>
          <Button asChild size="lg" className="mt-4">
            <Link href="/trips">
              Browse Trips
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const eventName = trip.event_name || trip.events?.name || 'Event'
  const venue = trip.events?.venues as { name?: string; city?: string; country?: string } | null
  const location = venue
    ? [venue.city, venue.country].filter(Boolean).join(', ') || venue.name || 'Location TBD'
    : trip.events?.location || 'Location TBD'

  // Use check-in/check-out dates if available, otherwise fall back to event dates
  const startDate = trip.check_in_date || trip.event_start_date || trip.events?.start_date
  const endDate = trip.check_out_date || trip.event_end_date || trip.events?.end_date

  const startDateFormatted = startDate ? format(new Date(startDate), 'EEEE, MMMM d, yyyy') : 'TBD'
  const endDateFormatted = endDate ? format(new Date(endDate), 'EEEE, MMMM d, yyyy') : ''
  const dateRange =
    endDate && startDate && endDate !== startDate
      ? `${startDateFormatted} - ${endDateFormatted}`
      : startDateFormatted

  const daysUntilDeparture = startDate
    ? differenceInDays(new Date(startDate), new Date())
    : null

  const status = statusConfig[trip.booking_status]
  const StatusIcon = status.icon
  const imageUrl = extractImageUrl(trip.events?.event_image)

  // Get keywords/tags for the event
  const keywords = [
    trip.is_first_loyalty_booking && 'First Booking',
    daysUntilDeparture !== null && daysUntilDeparture <= 30 && 'Departing Soon',
    trip.booking_status === 'confirmed' && 'Confirmed',
  ].filter(Boolean) as string[]

  // Live countdown timer
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null)

  useEffect(() => {
    if (!startDate || daysUntilDeparture === null || daysUntilDeparture < 0 || daysUntilDeparture > 30) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const departure = new Date(startDate)
      const diff = departure.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setCountdown({ days, hours, minutes })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [startDate, daysUntilDeparture])

  return (
    <div className="group relative rounded-3xl bg-card border border-border/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[350px]">
        {/* Left Column: Trip Details */}
        <div className="flex flex-col justify-between p-5 md:p-6 lg:p-8 space-y-5">
          <div className="space-y-4">
            {/* Header */}
            <div>
              
              <h2 className="text-xl md:text-2xl font-bold leading-tight mb-1.5">
                {eventName}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Booking: {trip.booking_reference}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Trip Dates
                  </p>
                  <p className="text-sm md:text-base font-semibold leading-relaxed">
                    {dateRange}
                  </p>
                  {daysUntilDeparture !== null && daysUntilDeparture >= 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {daysUntilDeparture === 0
                        ? 'Departing today!'
                        : daysUntilDeparture === 1
                        ? 'Departing tomorrow'
                        : `${daysUntilDeparture} days until departure`}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {location && location !== 'Location TBD' && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Location
                    </p>
                    <p className="text-sm md:text-base font-semibold">
                      {location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/trips/${trip.booking_id}`}>
                View Trip Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Image with Status & Keywords */}
        <div className="relative h-[280px] lg:h-auto overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10">
          {/* Background Image */}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={eventName}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10" />
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content Overlay */}
          <div className="relative h-full flex flex-col justify-between p-5 md:p-6 lg:p-8">
            {/* Top: Status and Keywords */}
            <div className="flex flex-col items-end gap-2">
              {/* Status Badge */}
              <Badge
                className={cn(
                  'text-xs px-3 py-1.5 border backdrop-blur-sm',
                  status.className
                )}
              >
                <StatusIcon className="h-3 w-3 mr-1.5" />
                {status.label}
              </Badge>

              {/* Keywords/Tags */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30 transition-colors px-2 py-1"
                    >
                      {keyword === 'First Booking' && (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom: Countdown Timer */}
            {countdown && (
              <div className="mt-auto">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20">
                  <Clock className="h-4 w-4 text-white" />
                  <div className="flex items-center gap-1.5">
                    {countdown.days > 0 && (
                      <>
                        <div className="text-center">
                          <p className="text-xl font-bold text-white leading-none">
                            {countdown.days}
                          </p>
                          <p className="text-[10px] text-white/80">days</p>
                        </div>
                        <span className="text-white/40">:</span>
                      </>
                    )}
                    <div className="text-center">
                      <p className="text-xl font-bold text-white leading-none">
                        {String(countdown.hours).padStart(2, '0')}
                      </p>
                      <p className="text-[10px] text-white/80">hours</p>
                    </div>
                    <span className="text-white/40">:</span>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white leading-none">
                        {String(countdown.minutes).padStart(2, '0')}
                      </p>
                      <p className="text-[10px] text-white/80">min</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
