'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, FileText, CreditCard, Sparkles, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface TripDetailsHeaderProps {
  eventName: string
  eventLocation: string
  tripStartDate: string | null
  tripEndDate: string | null
  bookingReference: string
  bookingStatus: BookingStatus
  totalAmount: number
  currency: string
  pointsEarned: number
  pointsUsed: number
  isFirstLoyaltyBooking: boolean
  eventImage?: any | null
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    icon: Clock,
    className: 'bg-amber-100/90 text-amber-800 border-amber-200 backdrop-blur-sm',
  },
  confirmed: { 
    label: 'Confirmed', 
    icon: CheckCircle,
    className: 'bg-emerald-100/90 text-emerald-800 border-emerald-200 backdrop-blur-sm',
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle,
    className: 'bg-blue-100/90 text-blue-800 border-blue-200 backdrop-blur-sm',
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle,
    className: 'bg-red-100/90 text-red-800 border-red-200 backdrop-blur-sm',
  }
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

export function TripDetailsHeader({
  eventName,
  eventLocation,
  tripStartDate,
  tripEndDate,
  bookingReference,
  bookingStatus,
  totalAmount,
  currency,
  pointsEarned,
  pointsUsed,
  isFirstLoyaltyBooking,
  eventImage
}: TripDetailsHeaderProps) {
  const status = statusConfig[bookingStatus]
  const StatusIcon = status.icon
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  
  const imageUrl = extractImageUrl(eventImage)
  const defaultBackground = '/assets/images/67b47522e00a9d3b8432bdd7_67b4739ca8ab15bb14dcff85_Singapore-Home-Tile-min.avif'
  const backgroundImage = imageUrl || defaultBackground

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD'
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const formatDateRange = () => {
    if (!tripStartDate) return 'TBD'
    
    const start = formatDate(tripStartDate)
    if (!tripEndDate || tripEndDate === tripStartDate) return start

    const end = formatDate(tripEndDate)
    return `${start} - ${end}`
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      {/* Background Image - Full Width */}
      <div className="relative w-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt={eventName}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={85}
          />
        </div>

        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Gradient Overlay - Top section (filled to transparent) */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
            background: 'var(--secondary-1000)',
          }}
        />
        
        {/* Gradient Overlay - Bottom section (transparent to filled) */}
        <div 
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 50%, black 80%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 80%, black 100%)',
            background: 'var(--secondary-1000)',
          }}
        />

        {/* Content - Trip Details */}
        <div className="relative flex flex-col px-4 md:px-12 py-5 sm:py-6 md:py-8 lg:py-10">
          <div className=" w-full space-y-3 sm:space-y-4">
            {/* Top Row: Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2">
                  {eventName}
                </h1>
                {isFirstLoyaltyBooking && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                    <span className="text-xs font-medium text-yellow-200">First Loyalty Booking</span>
                  </div>
                )}
              </div>
              <Badge variant="outline" className={`${status.className} border shrink-0 text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1.5" />
                {status.label}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {/* Location */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                <MapPin className="h-4 w-4 text-white shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">Location</div>
                  <div className="text-sm font-semibold text-white truncate">{eventLocation}</div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                <Calendar className="h-4 w-4 text-white shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">Trip Dates</div>
                  <div className="text-sm font-semibold text-white">{formatDateRange()}</div>
                </div>
              </div>

              {/* Booking Reference */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                <FileText className="h-4 w-4 text-white shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">Reference</div>
                  <div className="text-sm font-semibold text-white font-mono">{bookingReference}</div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Financial Summary */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              {/* Total Amount */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 sm:px-4 py-2 border border-white/20">
                <div className="text-[10px] text-white/70 uppercase tracking-wide mb-0.5">Total Amount</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {currencySymbol}{totalAmount.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
              </div>

              {/* Points Summary */}
              {(pointsEarned > 0 || pointsUsed > 0) && (
                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-lg px-3 sm:px-4 py-2 border border-white/20">
                  {pointsEarned > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-green-300" />
                      <div>
                        <div className="text-[10px] text-white/70 uppercase tracking-wide">Earned</div>
                        <div className="text-sm font-bold text-green-300">+{pointsEarned.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  {pointsUsed > 0 && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-purple-300" />
                      <div>
                        <div className="text-[10px] text-white/70 uppercase tracking-wide">Used</div>
                        <div className="text-sm font-bold text-purple-300">-{pointsUsed.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
