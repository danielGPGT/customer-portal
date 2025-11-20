'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface TripDetailsHeaderProps {
  eventName: string
  bookingStatus: BookingStatus
  isCancelled: boolean
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

export function TripDetailsHeader({ eventName, bookingStatus, isCancelled }: TripDetailsHeaderProps) {
  const status = statusConfig[bookingStatus]
  const StatusIcon = status.icon

  return (
    <div className="flex sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{eventName}</h1>
        {isCancelled && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            This booking has been cancelled
          </p>
        )}
      </div>
      <Badge variant="outline" className={`${status.color} border w-fit text-xs sm:text-sm`}>
        <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
        {status.label}
      </Badge>
    </div>
  )
}

