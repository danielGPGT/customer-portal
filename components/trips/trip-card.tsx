'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, CreditCard, Gift, Sparkles, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'

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
    venues?: {
      name?: string
      city?: string
      country?: string
    } | null
  } | null
}

type TripTab = 'upcoming' | 'past' | 'cancelled'

interface TripCardProps {
  booking: Booking
  variant: TripTab
  currency: string
  pointValue: number
}

const statusConfig = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    label: 'Pending', 
    icon: Clock 
  },
  confirmed: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    label: 'Confirmed', 
    icon: CheckCircle 
  },
  completed: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    label: 'Completed', 
    icon: CheckCircle 
  },
  cancelled: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    label: 'Cancelled', 
    icon: XCircle 
  }
}

export function TripCard({ booking, variant, currency, pointValue }: TripCardProps) {
  const eventName = booking.event_name || booking.events?.name || 'Event'
  
  // Get location from venue (city, country) or fall back to event location or venue name
  const venue = booking.events?.venues as { name?: string; city?: string; country?: string } | null
  const location = venue 
    ? [venue.city, venue.country].filter(Boolean).join(', ') || venue.name || 'Location TBD'
    : booking.events?.location || 'Location TBD'
  
  const startDate = booking.event_start_date || booking.events?.start_date
  const endDate = booking.event_end_date || booking.events?.end_date
  
  const startDateFormatted = startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'TBD'
  const endDateFormatted = endDate ? format(new Date(endDate), 'MMM d, yyyy') : ''
  
  const dateRange = endDate && startDate && endDate !== startDate
    ? `${startDateFormatted} - ${endDateFormatted}`
    : startDateFormatted

  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  const status = statusConfig[booking.booking_status]
  const StatusIcon = status.icon

  // Calculate net points
  const netPoints = booking.points_earned - booking.points_used

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{eventName}</h3>
            {booking.is_first_loyalty_booking && (
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-yellow-700 font-medium">
                  First loyalty booking!
                </span>
              </div>
            )}
          </div>
          <Badge variant="outline" className={`${status.color} border shrink-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date & Location */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{dateRange}</span>
          </div>
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3 space-y-2">
          {/* Booking Reference */}
          <div className="text-xs text-muted-foreground">
            Ref: {booking.booking_reference}
          </div>

          {/* Financial Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {currencySymbol}{booking.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Points Summary */}
          <div className="space-y-1 text-sm">
            {booking.points_used > 0 && (
              <div className="flex items-center gap-2 text-purple-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>-{booking.points_used.toLocaleString()} pts used</span>
                <span className="text-muted-foreground">
                  ({currencySymbol}{(booking.points_used * pointValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} discount)
                </span>
              </div>
            )}
            {booking.points_earned > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <Gift className="h-3.5 w-3.5" />
                <span>+{booking.points_earned.toLocaleString()} pts earned</span>
              </div>
            )}
            {booking.points_used > 0 && booking.points_earned > 0 && (
              <div className="text-xs text-muted-foreground pt-1">
                Net: {netPoints >= 0 ? '+' : ''}{netPoints.toLocaleString()} points
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/trips/${booking.booking_id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

