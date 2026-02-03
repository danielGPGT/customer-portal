'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import { formatCalendarDate, parseCalendarDate } from '@/lib/utils/date'

interface EventDetailsSectionProps {
  eventName: string
  location: string
  startDate: string | null
  endDate: string | null
  eventImage?: any | null
}

export function EventDetailsSection({
  eventName,
  location,
  startDate,
  endDate,
  eventImage
}: EventDetailsSectionProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'TBD'
    return formatCalendarDate(date, 'MMM d, yyyy', 'Invalid date')
  }

  const formatDateRange = () => {
    if (!startDate) return 'TBD'
    
    const start = formatDate(startDate)
    if (!endDate || endDate === startDate) return start

    const end = formatDate(endDate)
    return `${start} - ${end}`
  }

  const calculateDuration = () => {
    if (!startDate || !endDate) return null
    const start = parseCalendarDate(startDate)
    const end = parseCalendarDate(endDate)
    if (!start || !end) return null
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const duration = calculateDuration()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Event Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="text-xs sm:text-sm text-muted-foreground">Dates</div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{formatDateRange()}</span>
            {duration && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({duration} {duration === 1 ? 'day' : 'days'})
              </span>
            )}
          </div>
        </div>

        <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
          <div className="text-xs sm:text-sm text-muted-foreground">Location</div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate">{location}</span>
          </div>
        </div>

        <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
          <div className="text-xs sm:text-sm text-muted-foreground">Event Type</div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate">{eventName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

