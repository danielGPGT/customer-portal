'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import {
  Calendar,
  MapPin,
  Plane,
  Users,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NextTripCardProps {
  booking: {
    id: string
    booking_id: string
    booking_reference: string
    event_name: string | null
    event_start_date: string | null
    event_end_date: string | null
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
  } | null
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
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

export function NextTripCard({ booking }: NextTripCardProps) {
  if (!booking) {
    return (
      <Card className="relative overflow-hidden border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No upcoming trips</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Start planning your next adventure! Book a trip to start earning loyalty points.
          </p>
          <Button asChild variant="default">
            <Link href="/trips">
              View All Trips
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const eventName = booking.event_name || booking.events?.name || 'Event'
  const venue = booking.events?.venues as { name?: string; city?: string; country?: string } | null
  const location = venue
    ? [venue.city, venue.country].filter(Boolean).join(', ') || venue.name || 'Location TBD'
    : booking.events?.location || 'Location TBD'

  const startDate = booking.event_start_date || booking.events?.start_date
  const endDate = booking.event_end_date || booking.events?.end_date

  const startDateFormatted = startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'TBD'
  const endDateFormatted = endDate ? format(new Date(endDate), 'MMM d, yyyy') : ''
  const dateRange =
    endDate && startDate && endDate !== startDate
      ? `${startDateFormatted} - ${endDateFormatted}`
      : startDateFormatted

  const daysUntilDeparture = startDate
    ? differenceInDays(new Date(startDate), new Date())
    : null

  const status = statusConfig[booking.booking_status]
  const StatusIcon = status.icon
  const imageUrl = extractImageUrl(booking.events?.event_image)

  const isUpcoming = startDate && isAfter(new Date(startDate), new Date())
  const isPast = endDate && isBefore(new Date(endDate), new Date())

  // Subtle live countdown timer
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
  } | null>(null)

  useEffect(() => {
    if (!startDate || !isUpcoming) {
      setTimeRemaining(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const departure = new Date(startDate)
      const diff = departure.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeRemaining({ days, hours, minutes })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [startDate, isUpcoming])

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg border-2">
      {/* Background Image with Overlay */}
      <div className="relative h-48 w-full bg-muted">
        <div
          className="h-full w-full bg-cover bg-center"
          style={
            imageUrl
              ? { backgroundImage: `url(${imageUrl})` }
              : {
                  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 max-w-full">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {booking.is_first_loyalty_booking && (
                  <Badge className="bg-yellow-500/90 text-white border-yellow-400/50 text-xs shrink-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    First Booking
                  </Badge>
                )}
                <Badge className={cn('text-xs border backdrop-blur-sm shrink-0', status.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-1 line-clamp-2 break-words">{eventName}</h3>
              <p className="text-sm text-white/90 font-mono truncate">Ref: {booking.booking_reference}</p>
            </div>
          </div>

          {/* Subtle Countdown Timer */}
          {isUpcoming && timeRemaining && (
            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <Clock className="h-3.5 w-3.5 text-white/80" />
                <div className="flex items-center gap-1.5 text-xs text-white/90">
                  {timeRemaining.days > 0 && (
                    <>
                      <span className="font-medium">{timeRemaining.days}d</span>
                      <span className="text-white/60">·</span>
                    </>
                  )}
                  <span className="font-medium">{String(timeRemaining.hours).padStart(2, '0')}h</span>
                  <span className="text-white/60">·</span>
                  <span className="font-medium">{String(timeRemaining.minutes).padStart(2, '0')}m</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Date and Location */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Event Dates</p>
              <p className="text-sm font-semibold">{dateRange}</p>
            </div>
          </div>

          {location && location !== 'Location TBD' && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                <p className="text-sm font-semibold truncate">{location}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/30 p-4 gap-2">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/trips/${booking.booking_id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <Link href={`/trips/${booking.booking_id}?tab=travelers`} title="Manage Travellers">
            <Users className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="shrink-0">
          <Link href={`/trips/${booking.booking_id}?tab=included`} title="View Flights">
            <Plane className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

