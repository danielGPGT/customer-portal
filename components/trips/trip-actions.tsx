'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MessageCircle, FileText, Download } from 'lucide-react'
import { formatCalendarDate } from '@/lib/utils/date'

interface Booking {
  booking_id: string
  booking_reference: string
  [key: string]: any
}

interface TripActionsProps {
  booking: Booking
  eventName: string
  location: string
  startDate: string | null
  endDate: string | null
}

export function TripActions({ booking, eventName, location, startDate, endDate }: TripActionsProps) {
  const generateICS = () => {
    if (!startDate || !endDate) {
      alert('Date information is not available for this booking.')
      return
    }

    try {
      const formatDateToICS = (date: string) => {
        const d = new Date(date)
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      const icsStart = formatDateToICS(startDate)
      const icsEnd = formatDateToICS(endDate)

      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Grand Prix Grand Tours//Customer Portal//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${booking.booking_id}@customer-portal
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${icsStart}
DTEND:${icsEnd}
SUMMARY:${eventName}
DESCRIPTION:Booking Reference: ${booking.booking_reference}\\nEvent: ${eventName}
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${booking.booking_reference}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating ICS file:', error)
      alert('Failed to generate calendar file. Please try again.')
    }
  }

  const contactSupport = () => {
    const subject = `Booking Support: ${booking.booking_reference}`
    const body = `Hello,

I need help with my booking:

Booking Reference: ${booking.booking_reference}
Event: ${eventName}
${startDate ? `Date: ${formatCalendarDate(startDate, 'MMMM d, yyyy')}` : ''}

Please assist me with:
[Your question or issue here]

Thank you`

    const mailtoLink = `mailto:bookings@grandprixgrandtours.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  return (
    <Card>
      <CardHeader >
        <CardTitle className="text-base sm:text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <Button
          onClick={generateICS}
          variant="outline"
          className="w-full justify-start h-9 sm:h-10"
          size="sm"
        >
          <Calendar className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Add to Calendar</span>
          <Download className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        <Button
          onClick={contactSupport}
          variant="outline"
          className="w-full justify-start h-9 sm:h-10"
          size="sm"
        >
          <MessageCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Contact Support</span>
        </Button>

        {/* Future feature - View Invoice 
        <Button
          variant="outline"
          className="w-full justify-start h-9 sm:h-10"
          size="sm"
          disabled
        >
          <FileText className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">View Invoice</span>
          <span className="ml-auto text-[10px] sm:text-xs text-muted-foreground">Coming soon</span>
        </Button>*/}
      </CardContent>
    </Card>
  )
}

