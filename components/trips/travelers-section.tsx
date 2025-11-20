'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, User, Mail, Phone, MapPin, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TravelerEditDrawer } from '@/components/trips/traveler-edit-drawer'

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
}

export function TravelersSection({ travelers }: TravelersSectionProps) {
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!travelers || travelers.length === 0) {
    return null
  }

  // Filter out deleted travelers
  const activeTravelers = travelers.filter(t => !t.deleted_at)

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
    try {
      return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return date
    }
  }

  return (
    <>
      <Card>
        <CardHeader >
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Travelers ({activeTravelers.length})
          </CardTitle>
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
                        Lead Traveler
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTravelerClick(traveler)}
                    className="shrink-0 h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline text-xs sm:text-sm">Edit</span>
                  </Button>
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

                {traveler.nationality && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Nationality:</span> {traveler.nationality}
                  </div>
                )}

                {traveler.passport_number && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Passport:</span> {traveler.passport_number}
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

                {traveler.dietary_restrictions && (
                  <div className="text-muted-foreground md:col-span-2">
                    <span className="font-medium">Dietary Restrictions:</span> {traveler.dietary_restrictions}
                  </div>
                )}

                {traveler.accessibility_needs && (
                  <div className="text-muted-foreground md:col-span-2">
                    <span className="font-medium">Accessibility Needs:</span> {traveler.accessibility_needs}
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

      {/* Traveler Edit Drawer */}
      <TravelerEditDrawer
        traveler={selectedTraveler}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={() => {
          // Refresh the page to show updated data
          window.location.reload()
        }}
      />
    </>
  )
}

