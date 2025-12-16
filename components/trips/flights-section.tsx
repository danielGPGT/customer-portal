'use client'

import { useEffect, useState } from 'react'
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
  canEdit: boolean
  isEditLocked: boolean
  daysUntilLock: number | null
}

export function FlightsSection({ flights, currency, bookingId, canEdit, isEditLocked, daysUntilLock, lockDate }: FlightsSectionProps & { lockDate: string | null }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [editingSegment, setEditingSegment] = useState<{ type: 'outbound' | 'return', index: number } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)

  // Live countdown timer until lockDate
  useEffect(() => {
    if (!lockDate || isEditLocked) {
      setTimeRemaining(null)
      return
    }

    const target = new Date(lockDate).getTime()

    const update = () => {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) {
        setTimeRemaining(null)
        return
      }
      const totalMinutes = Math.floor(diff / (1000 * 60))
      const days = Math.floor(totalMinutes / (60 * 24))
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
      const minutes = totalMinutes % 60

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setTimeRemaining(`${minutes}m`)
      }
    }

    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [lockDate, isEditLocked])

  // Filter out deleted flights
  const activeFlights = flights?.filter(f => !f.deleted_at) || []

  const customerFlights = activeFlights.filter(f => f.flight_type === 'customer')
  const bookedFlights = activeFlights.filter(f => f.flight_type === 'booked' || !f.flight_type)
  const hasBookedFlights = bookedFlights.length > 0
  const canEditFlights = canEdit && !hasBookedFlights

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
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
                Flights ({activeFlights.length})
              </CardTitle>
              {hasBookedFlights ? (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-[11px] sm:text-xs text-blue-900 font-medium">
                    Your flight details are locked because a booked flight is already attached to this trip. Please contact support to make changes.
                  </p>
                </div>
              ) : isEditLocked ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] sm:text-xs text-amber-900 font-medium">
                    Flight details are locked as we&apos;re within 4 weeks of departure
                    {lockDate && (
                      <> (changes locked from {new Date(lockDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}).</>
                    )}
                    {' '}Please contact support to update information.
                  </p>
                </div>
              ) : daysUntilLock !== null ? (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 flex flex-col gap-0.5">
                  <p className="text-[11px] sm:text-xs text-emerald-900 font-medium">
                    You can add or edit your flight details for another {daysUntilLock} {daysUntilLock === 1 ? 'day' : 'days'}
                    {lockDate && (
                      <> (changes lock on {new Date(lockDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}).</>
                    )}
                  </p>
                  {timeRemaining && (
                    <p className="text-[11px] sm:text-[11px] text-emerald-900 font-semibold uppercase tracking-wide">
                      Time remaining to update flights: {timeRemaining}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            {canEditFlights && (
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
            )}
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
              {/* Internal / booked flights */}
              {bookedFlights.map((flight) => {
                const details = flight.flight_details as any
                if (!details) return null

                return (
                  <FlightItineraryCard
                    key={flight.id}
                    flightId={flight.id}
                    details={details}
                    label="Booked Flight"
                  />
                )
              })}

              {/* Customer Flights */}
              {customerFlights.map((flight) => {
                const details = flight.flight_details as any
                if (!details) return null
                
                return (
                  <FlightItineraryCard
                    key={flight.id}
                    flightId={flight.id}
                    details={details}
                    label="Your Flight"
                    onEditSegment={canEditFlights ? (type, index) => {
                      setEditingFlightId(flight.id)
                      setEditingSegment({ type, index })
                      setFormOpen(true)
                    } : undefined}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {canEditFlights && (
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
      )}
    </>
  )
}
