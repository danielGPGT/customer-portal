'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, User, Mail, Phone, MapPin, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TravelerEditDrawer } from '@/components/trips/traveler-edit-drawer'
import { formatCalendarDate } from '@/lib/utils/date'

interface Traveler {
  id: string
  traveler_type: 'lead' | 'guest'
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  passport_number?: string | null
  nationality?: string | null
  dietary_restrictions?: string | null
  accessibility_needs?: string | null
  special_requests?: string | null
  address_line1?: string | null
  city?: string | null
  country?: string | null
  deleted_at?: string | null
}

interface TravelersSectionProps {
  travelers: Traveler[]
  canEdit: boolean
  isEditLocked: boolean
  daysUntilLock: number | null
  hasBookedFlights: boolean
  lockDate: string | null
  isPermanentlyLocked?: boolean
  bookingStatus?: 'provisional' | 'confirmed' | 'completed' | 'cancelled'
  bookingId?: string
  teamId?: string | null
  bookingReference?: string
}

export function TravelersSection({ travelers, canEdit, isEditLocked, daysUntilLock, hasBookedFlights, lockDate, isPermanentlyLocked, bookingStatus, bookingId, teamId, bookingReference }: TravelersSectionProps) {
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [localTravelers, setLocalTravelers] = useState<Traveler[]>(travelers)

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

  // Update local travelers when prop changes
  useEffect(() => {
    setLocalTravelers(travelers)
  }, [travelers])

  if (!localTravelers || localTravelers.length === 0) {
    return null
  }

  // Filter out deleted travelers
  const activeTravelers = localTravelers.filter(t => !t.deleted_at)

  if (activeTravelers.length === 0) {
    return null
  }

  const handleTravelerClick = (traveler: Traveler) => {
    setSelectedTraveler(traveler)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedTraveler(null)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null
    return formatCalendarDate(date, 'd MMMM yyyy', date)
  }

  return (
    <>
      <Card>
        <CardHeader >
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Travellers ({activeTravelers.length})
            </CardTitle>
            {/* Lock / info note */}
            {isPermanentlyLocked && bookingStatus === 'cancelled' ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
                <p className="text-[11px] sm:text-xs text-red-900 font-medium">
                  This trip has been cancelled. Traveller details cannot be edited.
                </p>
              </div>
            ) : isEditLocked ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
                <p className="text-[11px] sm:text-xs text-amber-900 font-medium">
                  Traveller details are locked as we&apos;re within 4 weeks of departure
                  {lockDate && (
                    <> (changes locked from {formatCalendarDate(lockDate.slice(0, 10), 'd MMM yyyy')}).</>
                  )}
                  {' '}Please contact support to update information.
                </p>
              </div>
            ) : hasBookedFlights ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-[11px] sm:text-xs text-blue-900 font-medium">
                  You can still update traveller details, but name, email, phone, date of birth, passport, nationality, and address are locked because flights have been booked.
                </p>
              </div>
            ) : daysUntilLock !== null ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 flex flex-col gap-0.5">
                <p className="text-[11px] sm:text-xs text-emerald-900 font-medium">
                  You can update traveller details for another {daysUntilLock} {daysUntilLock === 1 ? 'day' : 'days'}
                  {lockDate && (
                    <> (changes lock on {formatCalendarDate(lockDate.slice(0, 10), 'd MMM yyyy')}).</>
                  )}
                </p>
                {timeRemaining && (
                  <p className="text-[11px] sm:text-[11px] text-emerald-900 font-semibold uppercase tracking-wide">
                    Time remaining to make changes: {timeRemaining}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent >
          <div className="space-y-4 sm:space-y-6">
            {activeTravelers.map((traveler, index) => (
              <div 
                key={traveler.id} 
                className={index !== activeTravelers.length - 1 ? 'border-b pb-4 sm:pb-6' : ''}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      {traveler.first_name} {traveler.last_name}
                    </h4>
                    {traveler.traveler_type === 'lead' && (
                      <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                        Lead Traveller
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTravelerClick(traveler)}
                      className="shrink-0 h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Edit</span>
                    </Button>
                  )}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                {traveler.email && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{traveler.email}</span>
                  </div>
                )}

                {traveler.phone && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>{traveler.phone}</span>
                  </div>
                )}

                {traveler.date_of_birth && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Date of Birth:</span>{' '}
                    {formatDate(traveler.date_of_birth)}
                  </div>
                )}

                {(traveler.address_line1 || traveler.city || traveler.country) && (
                  <div className="flex items-start gap-1.5 sm:gap-2 text-muted-foreground md:col-span-2">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      {traveler.address_line1 && <div className="truncate">{traveler.address_line1}</div>}
                      {(traveler.city || traveler.country) && (
                        <div className="truncate">
                          {[traveler.city, traveler.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {traveler.special_requests && (
                  <div className="text-muted-foreground md:col-span-2">
                    <span className="font-medium">Special Requests:</span> {traveler.special_requests}
                  </div>
                )}
              </div>
            </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traveller Edit Drawer */}
      <TravelerEditDrawer
        traveler={selectedTraveler}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        bookingId={bookingId}
        teamId={teamId}
        bookingReference={bookingReference}
        onSuccess={async (updatedTraveler) => {
          // Optimistically update local state with the updated traveler
          if (updatedTraveler) {
            setLocalTravelers(prev => 
              prev.map(t => t.id === updatedTraveler.id ? updatedTraveler : t)
            )
          } else {
            // If no updated traveler provided, silently refetch all travelers for this booking
            // We need to get the booking_id from the first traveler
            if (localTravelers.length > 0) {
              const supabase = createClient()
              // Fetch the booking_id from the first traveler
              const { data: travelerData } = await supabase
                .from('booking_travelers')
                .select('booking_id')
                .eq('id', localTravelers[0].id)
                .single()
              
              if (travelerData?.booking_id) {
                const { data: updatedData } = await supabase
                  .from('booking_travelers')
                  .select('*')
                  .eq('booking_id', travelerData.booking_id)
                  .is('deleted_at', null)
                  .order('created_at', { ascending: true })
                
                if (updatedData) {
                  setLocalTravelers(updatedData as Traveler[])
                }
              }
            }
          }
        }}
        canEditContactFields={!hasBookedFlights}
      />
    </>
  )
}

