'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import {
  Calendar,
  MapPin,
  CreditCard,
  Gift,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    event_image?: any | null
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
  pointValue: number
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    step: 0,
    gradient: 'from-yellow-400/80 to-amber-500/80',
    border: 'border-yellow-200/40',
    text: 'text-white',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    step: 1,
    gradient: 'from-emerald-400/80 to-emerald-500/80',
    border: 'border-emerald-200/40',
    text: 'text-white',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    step: 2,
    gradient: 'from-sky-400/80 to-blue-500/80',
    border: 'border-sky-200/40',
    text: 'text-white',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    step: -1,
    gradient: 'from-rose-500/80 to-red-600/80',
    border: 'border-rose-200/40',
    text: 'text-white',
  },
}

const progressSteps = ['Booked', 'Confirmed', 'Completed']

const extractImageUrl = (imageData: any): string | null => {
  if (!imageData) return null

  const tryFromObject = (data: Record<string, any>) => {
    return (
      data.image_url ||
      data.thumbnail_url ||
      data.url ||
      data.src ||
      data.path ||
      null
    )
  }

  if (typeof imageData === 'string') return imageData

  if (Array.isArray(imageData)) {
    const first = imageData[0]
    if (!first) return null
    if (typeof first === 'string') return first
    if (typeof first === 'object') {
      return tryFromObject(first)
    }
  }

  if (typeof imageData === 'object') {
    return tryFromObject(imageData)
  }

  return null
}

export function TripCard({ booking, variant, currency, pointValue }: TripCardProps) {
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
  
  // Prefer the booking's own currency; fall back to GBP if missing
  const bookingCurrency = booking.currency || 'GBP'
  const currencySymbol =
    bookingCurrency === 'GBP' ? '£' : bookingCurrency === 'USD' ? '$' : '€'
  const status = statusConfig[booking.booking_status]
  const StatusIcon = status.icon
  const currentStep = status.step
  const imageUrl = extractImageUrl(booking.events?.event_image)

  const netPoints = booking.points_earned - booking.points_used

  return (
    <Card className="overflow-hidden transition-all hover:shadow-xl py-0">
      <div className="relative h-40 w-full bg-muted">
        <div
          className="h-full w-full bg-cover bg-center"
          style={
            imageUrl
              ? { backgroundImage: `url(${imageUrl})` }
              : {
                  backgroundImage: 'linear-gradient(120deg, #0f172a, #1d1b4a)',
                }
          }
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute inset-x-4 top-3  px-2 py-1 w-fit flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg">
          <div className="text-xs text-white">Ref: {booking.booking_reference}</div>
        </div>
        <div className="absolute inset-x-4 bottom-3 text-white">
        <h3 className="text-lg font-semibold">{eventName}</h3>
          <div className="flex items-center justify-between gap-2">
          {booking.is_first_loyalty_booking && (
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-yellow-300">
              <Sparkles className="h-3 w-3" />
              First loyalty booking
            </div>
          )}
            
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs  text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] backdrop-blur',
                'bg-linear-to-r',
                status.gradient,
                status.border,
                status.text
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </div>
          </div>

        </div>
      </div>

      <CardContent className="space-y-4">
        {currentStep >= 0 ? (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Progress</p>
            <div className="relative flex items-center justify-between text-xs font-medium">
              {progressSteps.map((step, index) => {
                const isActive = currentStep >= index
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition-colors',
                        isActive
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </div>
                    <span className="ml-2 text-muted-foreground">{step}</span>
                    {index < progressSteps.length - 1 && (
                      <div
                        className={cn(
                          'ml-3 mr-3 h-px flex-1',
                          currentStep > index ? 'bg-primary' : 'bg-muted-foreground/30'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
            <XCircle className="h-4 w-4" />
            This trip was cancelled
          </div>
        )}

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

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {currencySymbol}
              {booking.total_amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            {booking.points_used > 0 && (
              <div className="flex items-center gap-2 text-yellow-500 dark:text-yellow-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>-{booking.points_used.toLocaleString()} pts used</span>
                <span className="text-muted-foreground">
                  ({currencySymbol}
                  {(booking.points_used * pointValue).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                   <span className="text-muted-foreground ml-1">off)</span>
                </span>
              </div>
            )}
            {booking.points_earned > 0 && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Gift className="h-3.5 w-3.5" />
                <span>+{booking.points_earned.toLocaleString()} pts earned</span>
              </div>
            )}
            {booking.points_used > 0 && booking.points_earned > 0 && (
              <div className="text-xs text-muted-foreground">
                Net: {netPoints >= 0 ? '+' : ''}
                {netPoints.toLocaleString()} pts
              </div>
            )}
          </div>
        </div>

        
        
      </CardContent>

      <CardFooter className="border-t bg-muted/40 p-4">
        <Button asChild variant="default" className="w-full">
          <Link href={`/trips/${booking.booking_id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

