'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, CheckCircle, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

interface BookingDetailsSectionProps {
  bookingReference: string
  bookedAt: string | null
  confirmedAt: string | null
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  isFirstLoyaltyBooking: boolean
}

export function BookingDetailsSection({
  bookingReference,
  bookedAt,
  confirmedAt,
  bookingStatus,
  isFirstLoyaltyBooking
}: BookingDetailsSectionProps) {
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM d, yyyy, h:mm a')
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Booking Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFirstLoyaltyBooking && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Your First Loyalty Booking!
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This was your first booking in our loyalty program
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Reference Number</div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-medium">{bookingReference}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="text-sm text-muted-foreground">Booked On</div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatDateTime(bookedAt)}</span>
          </div>
        </div>

        {(bookingStatus === 'confirmed' || bookingStatus === 'completed') && confirmedAt && (
          <div className="border-t pt-4 space-y-2">
            <div className="text-sm text-muted-foreground">Confirmed On</div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">{formatDateTime(confirmedAt)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

