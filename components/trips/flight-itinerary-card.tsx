'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Plane } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Airport {
  id: string
  iata_code: string
  name: string
  city: string | null
  country: string | null
}

interface FlightSegment {
  departureCode: string
  arrivalCode: string
  departureDateTime: string
  arrivalDateTime: string
  flightNumber: string
  marketingAirline: string
  marketingAirlineCode: string
}

interface FlightItineraryCardProps {
  flightId: string
  details: {
    origin: string
    destination: string
    departureDate?: string
    returnDate?: string
    outboundSegments?: FlightSegment[]
    returnSegments?: FlightSegment[]
  }
  onEditSegment?: (segmentType: 'outbound' | 'return', segmentIndex: number) => void
}

export function FlightItineraryCard({ flightId, details, onEditSegment }: FlightItineraryCardProps) {
  const [airports, setAirports] = useState<Record<string, Airport>>({})

  // Fetch airport details
  useEffect(() => {
    const fetchAirports = async () => {
      const supabase = createClient()
      const airportCodes = new Set<string>()
      
      if (details.origin) airportCodes.add(details.origin)
      if (details.destination) airportCodes.add(details.destination)
      
      details.outboundSegments?.forEach(seg => {
        if (seg.departureCode) airportCodes.add(seg.departureCode)
        if (seg.arrivalCode) airportCodes.add(seg.arrivalCode)
      })
      
      details.returnSegments?.forEach(seg => {
        if (seg.departureCode) airportCodes.add(seg.departureCode)
        if (seg.arrivalCode) airportCodes.add(seg.arrivalCode)
      })

      if (airportCodes.size === 0) return

      const { data } = await supabase
        .from('airports')
        .select('*')
        .in('iata_code', Array.from(airportCodes))

      if (data) {
        const airportMap: Record<string, Airport> = {}
        data.forEach(airport => {
          airportMap[airport.iata_code] = airport
        })
        setAirports(airportMap)
      }
    }

    fetchAirports()
  }, [details])

  const formatTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return null
    try {
      return format(new Date(dateTime), 'HH:mm')
    } catch {
      return null
    }
  }

  const formatDate = (dateTime: string | null | undefined) => {
    if (!dateTime) return null
    try {
      return format(new Date(dateTime), 'd MMM yyyy')
    } catch {
      return null
    }
  }

  const formatDateShort = (dateTime: string | null | undefined) => {
    if (!dateTime) return null
    try {
      return format(new Date(dateTime), 'd MMM yyyy')
    } catch {
      return null
    }
  }

  const calculateDuration = (departureDateTime: string, arrivalDateTime: string) => {
    try {
      const dep = new Date(departureDateTime)
      const arr = new Date(arrivalDateTime)
      const diffMs = arr.getTime() - dep.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return { hours, minutes }
    } catch {
      return null
    }
  }

  const getAirportDisplay = (code: string) => {
    const airport = airports[code]
    if (!airport) return code
    const location = [airport.city, airport.country].filter(Boolean).join(', ')
    return `${airport.name}${location ? `, ${location}` : ''}`
  }

  const FlightSegmentDisplay = ({ 
    segment, 
    dateLabel,
    onEditSegment
  }: { 
    segment: FlightSegment
    dateLabel: string
    onEditSegment?: () => void
  }) => {
    const depTime = formatTime(segment.departureDateTime)
    const arrTime = formatTime(segment.arrivalDateTime)
    const depDate = formatDateShort(segment.departureDateTime)
    const arrDate = formatDateShort(segment.arrivalDateTime)
    const duration = calculateDuration(segment.departureDateTime, segment.arrivalDateTime)
    
    // Format flight number: airline code + space + flight number (e.g., "EZY 123")
    const flightNumber = segment.marketingAirlineCode && segment.flightNumber
      ? `${segment.marketingAirlineCode} ${segment.flightNumber}`
      : segment.flightNumber
        ? segment.flightNumber
        : segment.marketingAirlineCode
          ? segment.marketingAirlineCode
          : null

    const depAirport = airports[segment.departureCode]
    const arrAirport = airports[segment.arrivalCode]

    return (
      <div className="border rounded-lg p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3 md:space-y-4 bg-card shadow-sm">
        {/* Header */}
        <div className="pb-2 sm:pb-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground">{dateLabel}</h3>
          {onEditSegment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditSegment}
              className="h-6 px-2"
            >
              <Pencil className="h-3 w-3 mr-1" />
              <span className="text-xs">Edit</span>
            </Button>
          )}
        </div>

        {/* Flight Number Row */}
        {flightNumber && (
          <div className="pb-0 sm:pb-3">
            <Badge variant="secondary" className="bg-base-800 text-white text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 sm:py-1">
              {flightNumber}
            </Badge>
          </div>
        )}

        <div className="flex gap-2 sm:gap-4 md:gap-6">


          {/* Flight details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
              {/* Departure */}
              <div className="flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px]">
                <div className="text-lg sm:text-xl font-bold text-foreground mb-0.5 sm:mb-1">
                  {depTime || '--:--'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">
                  {depAirport 
                    ? `${segment.departureCode}`
                    : segment.departureCode}
                </div>
                {depAirport && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 line-clamp-2">
                    {depAirport.name}
                  </div>
                )}
                {depDate && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {depDate}
                  </div>
                )}
              </div>

              {/* Flight Path */}
              <div className="flex-3 px-1 sm:px-2 md:px-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center w-full">
                    <div className="flex-1 border-t-2 border-foreground"></div>
                    <div className="flex flex-col items-center px-1 sm:px-2 md:px-3 lg:px-4">
                      <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-primary rotate-45" />
                    </div>
                    <div className="flex-1 border-t-2 border-foreground"></div>
                  </div>
                </div>
              </div>

              {/* Arrival */}
              <div className="flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] text-right">
                <div className="text-lg sm:text-xl font-bold text-foreground mb-0.5 sm:mb-1">
                  {arrTime || '--:--'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">
                  {arrAirport
                    ? `${segment.arrivalCode}`
                    : segment.arrivalCode}
                </div>
                {arrAirport && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 line-clamp-2">
                    {arrAirport.name}
                  </div>
                )}
                {arrDate && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {arrDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <Badge variant="outline" className="bg-secondary-50 dark:bg-secondary-950 border-secondary-200 dark:border-secondary-800">
          Your Flight
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Outbound */}
        {details.outboundSegments && details.outboundSegments.length > 0 && (
          <>
            {details.outboundSegments.map((segment, idx) => (
              <FlightSegmentDisplay
                key={idx}
                segment={segment}
                dateLabel={`Outbound • ${formatDateShort(segment.departureDateTime) || formatDateShort(details.departureDate) || ''}`}
                onEditSegment={onEditSegment ? () => onEditSegment('outbound', idx) : undefined}
              />
            ))}
          </>
        )}

        {/* Return */}
        {details.returnSegments && details.returnSegments.length > 0 && (
          <>
            {details.returnSegments.map((segment, idx) => (
              <FlightSegmentDisplay
                key={idx}
                segment={segment}
                dateLabel={`Return • ${formatDateShort(segment.departureDateTime) || formatDateShort(details.returnDate) || ''}`}
                onEditSegment={onEditSegment ? () => onEditSegment('return', idx) : undefined}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

