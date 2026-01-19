'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, CheckCircle, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

interface BookingDetailsSectionProps {
  bookingReference: string
  bookedAt: string | null
  confirmedAt: string | null
  bookingStatus: 'provisional' | 'confirmed' | 'completed' | 'cancelled'
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
      <CardHeader >
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          Booking Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {isFirstLoyaltyBooking && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-yellow-800">
                  Your First Loyalty Booking!
                </p>
                <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5 sm:mt-1">
                  This was your first booking in our loyalty program
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5 sm:space-y-2">
          <div className="text-xs sm:text-sm text-muted-foreground">Reference Number</div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="font-mono font-medium text-xs sm:text-sm">{bookingReference}</span>
          </div>
        </div>

        <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
          <div className="text-xs sm:text-sm text-muted-foreground">Booked On</div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{formatDateTime(bookedAt)}</span>
          </div>
        </div>

        {(bookingStatus === 'confirmed' || bookingStatus === 'completed') && confirmedAt && (
          <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
            <div className="text-xs sm:text-sm text-muted-foreground">Confirmed On</div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">{formatDateTime(confirmedAt)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

