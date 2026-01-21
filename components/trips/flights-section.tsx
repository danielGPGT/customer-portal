'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plane, Calendar, FileText, CheckCircle2, Clock, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { CustomerFlightForm } from '@/components/trips/customer-flight-form'
import { FlightItineraryCard } from '@/components/trips/flight-itinerary-card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'
import { useRouter } from 'next/navigation'

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
  isPermanentlyLocked?: boolean
  bookingStatus?: 'provisional' | 'confirmed' | 'completed' | 'cancelled'
}

export function FlightsSection({ flights, currency, bookingId, canEdit, isEditLocked, daysUntilLock, lockDate, isPermanentlyLocked, bookingStatus }: FlightsSectionProps & { lockDate: string | null }) {
  const router = useRouter()
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [editingSegment, setEditingSegment] = useState<{ type: 'outbound' | 'return', index: number } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [deletingFlightId, setDeletingFlightId] = useState<string | null>(null)

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
        // Refresh page when time expires to update lock state
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
        return
      }
      const totalSeconds = Math.floor(diff / 1000)
      const totalMinutes = Math.floor(totalSeconds / 60)
      const days = Math.floor(totalMinutes / (60 * 24))
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
      const minutes = totalMinutes % 60
      const seconds = totalSeconds % 60

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }
    }

    update()
    
    // Update every second when less than 1 hour remains, otherwise every minute
    let intervalId: NodeJS.Timeout | null = null
    let lastInterval: number | null = null
    
    const startInterval = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      
      const now = Date.now()
      const diff = target - now
      const totalMinutes = Math.floor(diff / (1000 * 60))
      const interval = totalMinutes < 60 ? 1000 : 60_000
      lastInterval = interval
      
      intervalId = setInterval(() => {
        update()
        // Check if we need to switch to a different interval
        const currentDiff = target - Date.now()
        if (currentDiff <= 0) {
          if (intervalId) clearInterval(intervalId)
          return
        }
        const currentMinutes = Math.floor(currentDiff / (1000 * 60))
        const shouldUseSecondInterval = currentMinutes < 60
        const currentInterval = shouldUseSecondInterval ? 1000 : 60_000
        
        if (currentInterval !== lastInterval) {
          startInterval() // Restart with new interval
        }
      }, interval)
    }

    startInterval()
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [lockDate, isEditLocked])

  // Filter out deleted flights
  const activeFlights = flights?.filter(f => !f.deleted_at) || []

  const customerFlights = activeFlights.filter(f => f.flight_type === 'customer')
  const bookedFlights = activeFlights.filter(f => f.flight_type === 'booked' || !f.flight_type)
  const hasBookedFlights = bookedFlights.length > 0
  const canEditFlights = canEdit && !hasBookedFlights

  const handleDeleteFlight = async (flightId: string) => {
    if (deletingFlightId) return // Prevent multiple simultaneous deletions
    
    setDeletingFlightId(flightId)
    const supabase = createClient()

    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('bookings_flights')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', flightId)
        .eq('flight_type', 'customer')

      if (error) {
        throw error
      }

      sonnerToast.success('Flight removed', {
        description: 'Your flight information has been removed successfully.',
        duration: 3000,
      })

      toast({
        title: 'Flight removed',
        description: 'Your flight information has been removed successfully.',
      })

      // Refresh the page to update the flight list
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting flight:', error)
      
      let errorMessage = 'Failed to remove flight information'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }

      sonnerToast.error('Failed to remove flight', {
        description: errorMessage,
        duration: 5000,
      })

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setDeletingFlightId(null)
    }
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
            <div className="space-y-1.5 w-full">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
                Flights ({activeFlights.length})
              </CardTitle>
              <div className='flex items-center gap-2 justify-between w-full flex-wrap'>
              {isPermanentlyLocked && bookingStatus === 'cancelled' ? (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
                  <p className="text-[11px] sm:text-xs text-red-900 font-medium">
                    This trip has been cancelled. Flight details cannot be edited.
                  </p>
                </div>
              ) : hasBookedFlights ? (
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
          </div>
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
                    onDelete={canEditFlights ? handleDeleteFlight : undefined}
                    canDelete={canEditFlights}
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
