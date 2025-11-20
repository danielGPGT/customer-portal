'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, FileText, CreditCard, Sparkles, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'

interface BookingOverviewCardProps {
  eventName: string
  eventLocation: string
  eventStartDate: string | null
  eventEndDate: string | null
  bookingReference: string
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  totalAmount: number
  currency: string
  pointsEarned: number
  pointsUsed: number
  isFirstLoyaltyBooking: boolean
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

export function BookingOverviewCard({
  eventName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  bookingReference,
  bookingStatus,
  totalAmount,
  currency,
  pointsEarned,
  pointsUsed,
  isFirstLoyaltyBooking
}: BookingOverviewCardProps) {
  const status = statusConfig[bookingStatus]
  const StatusIcon = status.icon
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD'
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const formatDateRange = () => {
    if (!eventStartDate) return 'TBD'
    
    const start = formatDate(eventStartDate)
    if (!eventEndDate || eventEndDate === eventStartDate) return start

    const end = formatDate(eventEndDate)
    return `${start} - ${end}`
  }

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Event & Booking Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{eventName}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{eventLocation}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDateRange()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs">{bookingReference}</span>
              </div>

              {isFirstLoyaltyBooking && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-medium text-yellow-700">First Loyalty Booking</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status, Price & Points */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 lg:gap-4">
            {/* Status Badge */}
            <Badge variant="outline" className={`${status.color} border shrink-0`}>
              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {status.label}
            </Badge>

            {/* Financial Summary */}
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold">
                {currencySymbol}{totalAmount.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
            </div>

            {/* Points Summary */}
            {(pointsEarned > 0 || pointsUsed > 0) && (
              <div className="flex items-center gap-3 text-sm">
                {pointsEarned > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">+{pointsEarned.toLocaleString()}</span>
                  </div>
                )}
                {pointsUsed > 0 && (
                  <div className="flex items-center gap-1 text-purple-600">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">-{pointsUsed.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

