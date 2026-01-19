'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

interface Trip {
  id: string
  booking_reference: string
  event_name: string | null
  event_start_date: string | null
  event_end_date: string | null
  check_in_date?: string | null
  check_out_date?: string | null
  booking_status: 'provisional' | 'confirmed' | 'completed' | 'cancelled'
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

interface UpcomingTripsCarouselProps {
  trips: Trip[]
}

const statusConfig = {
  provisional: {
    label: 'Provisional',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  },
  cancelled: {
    label: 'Cancelled',
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

export function UpcomingTripsCarousel({ trips }: UpcomingTripsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 320 // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    checkScroll()
    if (scrollRef.current) {
      scrollRef.current.addEventListener('scroll', checkScroll)
      return () => {
        scrollRef.current?.removeEventListener('scroll', checkScroll)
      }
    }
  }, [trips])

  if (trips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Continue Your Trips</h2>
        </div>
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming trips yet. Book your first trip to get started!
            </p>
            <Button asChild variant="default" className="mt-4">
              <Link href="/trips" prefetch={true}>View All Trips</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Continue Your Trips</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full max-w-full"
      >
        {trips.map((trip) => {
          const eventName = trip.event_name || trip.events?.name || 'Trip'
          const venue = trip.events?.venues as { name?: string; city?: string; country?: string } | null
          const location = venue
            ? [venue.city, venue.country].filter(Boolean).join(', ') || venue.name || 'Location TBD'
            : trip.events?.location || 'Location TBD'

          // Use check-in/check-out dates if available, otherwise fall back to event dates
          const startDate = trip.check_in_date || trip.event_start_date || trip.events?.start_date
          const endDate = trip.check_out_date || trip.event_end_date || trip.events?.end_date
          const startDateFormatted = startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'TBD'
          const endDateFormatted = endDate ? format(new Date(endDate), 'MMM d, yyyy') : ''
          const dateRange =
            endDate && startDate && endDate !== startDate
              ? `${startDateFormatted} - ${endDateFormatted}`
              : startDateFormatted

          const status = statusConfig[trip.booking_status]
          const imageUrl = extractImageUrl(trip.events?.event_image)

          return (
            <Card
              key={trip.id}
              className="group min-w-[300px] flex-shrink-0 overflow-hidden border-2 transition-all hover:shadow-lg pt-0 max-w-[300px]"
            >
              <div className="relative h-40 w-full bg-muted">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform group-hover:scale-105"
                  style={
                    imageUrl
                      ? { backgroundImage: `url(${imageUrl})` }
                      : {
                          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                <div className="absolute top-3 right-3">
                  <Badge className={cn('text-xs border backdrop-blur-sm', status.className)}>
                    {status.label}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base font-bold line-clamp-2">{eventName}</h3>
                  <p className="text-xs font-mono mt-1 opacity-90">Ref: {trip.booking_reference}</p>
                </div>
              </div>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{dateRange}</span>
                  </div>
                  {location && location !== 'Location TBD' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                </div>
                <Button asChild variant="default" className="w-full" size="sm">
                  <Link href={`/trips/${trip.id}`} prefetch={true}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

