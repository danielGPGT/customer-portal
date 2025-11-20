'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import { format } from 'date-fns'

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
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
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
    
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    } catch {
      return null
    }
  }

  const duration = calculateDuration()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Dates</div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatDateRange()}</span>
            {duration && (
              <span className="text-sm text-muted-foreground">
                ({duration} {duration === 1 ? 'day' : 'days'})
              </span>
            )}
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="text-sm text-muted-foreground">Location</div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{location}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="text-sm text-muted-foreground">Event Type</div>
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{eventName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

