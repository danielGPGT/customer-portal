'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plane, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Flight {
  id: string
  flight_status?: string | null
  booking_pnr?: string | null
  ticketing_deadline?: string | null
  flight_details?: any
  total_price?: number | null
  currency?: string | null
  quantity?: number | null
  flight_type?: string | null
  deleted_at?: string | null
}

interface FlightsSectionProps {
  flights: Flight[]
  currency: string
}

export function FlightsSection({ flights, currency }: FlightsSectionProps) {
  if (!flights || flights.length === 0) {
    return null
  }

  // Filter out deleted flights
  const activeFlights = flights.filter(f => !f.deleted_at)

  if (activeFlights.length === 0) {
    return null
  }

  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null
    
    if (status.includes('Ticketed') && status.includes('Paid')) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Ticketed & Paid
      </Badge>
    } else if (status.includes('Ticketed')) {
      return <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Ticketed - Not Paid
      </Badge>
    } else {
      return <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Not Ticketed
      </Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Flights ({activeFlights.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeFlights.map((flight) => (
            <div key={flight.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {flight.booking_pnr && (
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">PNR: {flight.booking_pnr}</span>
                    </div>
                  )}
                  
                  {getStatusBadge(flight.flight_status)}
                </div>

                {flight.total_price && (
                  <div className="text-lg font-semibold">
                    {currencySymbol}{flight.total_price.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                )}
              </div>

              {flight.ticketing_deadline && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Ticketing Deadline: {formatDate(flight.ticketing_deadline)}</span>
                </div>
              )}

              {flight.quantity && flight.quantity > 1 && (
                <div className="text-sm text-muted-foreground">
                  Quantity: {flight.quantity} {flight.quantity === 1 ? 'passenger' : 'passengers'}
                </div>
              )}

              {flight.flight_details && typeof flight.flight_details === 'object' && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  <details>
                    <summary className="cursor-pointer font-medium hover:text-foreground">
                      View Flight Details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(flight.flight_details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

