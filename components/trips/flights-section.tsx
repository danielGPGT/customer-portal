'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plane, Calendar, FileText, CheckCircle2, Clock, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { CustomerFlightForm } from '@/components/trips/customer-flight-form'
import { FlightItineraryCard } from '@/components/trips/flight-itinerary-card'

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
  bookingId: string
}

export function FlightsSection({ flights, currency, bookingId }: FlightsSectionProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [editingSegment, setEditingSegment] = useState<{ type: 'outbound' | 'return', index: number } | null>(null)

  // Filter out deleted flights
  const activeFlights = flights?.filter(f => !f.deleted_at) || []

  const customerFlights = activeFlights.filter(f => f.flight_type === 'customer')
  const bookedFlights = activeFlights.filter(f => f.flight_type === 'booked' || !f.flight_type)

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
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-[10px] sm:text-xs">
        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
        Ticketed & Paid
      </Badge>
    } else if (status.includes('Ticketed')) {
      return <Badge variant="secondary" className="text-[10px] sm:text-xs">
        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
        Ticketed - Not Paid
      </Badge>
    } else {
      return <Badge variant="outline" className="text-[10px] sm:text-xs">
        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
        Not Ticketed
      </Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
              Flights ({activeFlights.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingFlightId(null)
                setFormOpen(true)
              }}
              className="h-8 sm:h-9 px-2 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm">Add Your Flight</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent >
          {activeFlights.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Plane className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="mb-2 text-xs sm:text-sm">No flights added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingFlightId(null)
                  setFormOpen(true)
                }}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm">Add Your Flight Information</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {bookedFlights.map((flight) => (
                <div key={flight.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {flight.booking_pnr && (
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                          <span className="font-mono font-medium text-xs sm:text-sm">PNR: {flight.booking_pnr}</span>
                        </div>
                      )}
                      
                      {getStatusBadge(flight.flight_status)}
                    </div>

                    {flight.total_price && (
                      <div className="text-base sm:text-lg font-semibold shrink-0">
                        {currencySymbol}{flight.total_price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                    )}
                  </div>

                  {flight.ticketing_deadline && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>Ticketing Deadline: {formatDate(flight.ticketing_deadline)}</span>
                    </div>
                  )}

                  {flight.quantity && flight.quantity > 1 && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Quantity: {flight.quantity} {flight.quantity === 1 ? 'passenger' : 'passengers'}
                    </div>
                  )}

                  {flight.flight_details && typeof flight.flight_details === 'object' && (
                    <div className="text-xs sm:text-sm text-muted-foreground pt-2 border-t">
                      <details>
                        <summary className="cursor-pointer font-medium hover:text-foreground text-xs sm:text-sm">
                          View Flight Details
                        </summary>
                        <pre className="mt-2 text-[10px] sm:text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(flight.flight_details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}

              {/* Customer Flights */}
              {customerFlights.map((flight) => {
                const details = flight.flight_details as any
                if (!details) return null
                
                return (
                  <FlightItineraryCard
                    key={flight.id}
                    flightId={flight.id}
                    details={details}
                    onEditSegment={(type, index) => {
                      setEditingFlightId(flight.id)
                      setEditingSegment({ type, index })
                      setFormOpen(true)
                    }}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerFlightForm
        bookingId={bookingId}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingFlightId(null)
            setEditingSegment(null)
          }
        }}
        flightId={editingFlightId}
        editingSegment={editingSegment}
        onSuccess={() => {
          setFormOpen(false)
          setEditingFlightId(null)
          setEditingSegment(null)
        }}
      />
    </>
  )
}
