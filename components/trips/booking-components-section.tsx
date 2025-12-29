'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Ticket, Home, Car, Plane, Calendar, MapPin, Info } from 'lucide-react'
import { format } from 'date-fns'

interface Component {
  id: string
  component_type: string
  component_name?: string | null
  component_id?: string | null
  quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
  component_data?: any
  component_snapshot?: any
  deleted_at?: string | null
}

interface BookingComponentsSectionProps {
  components: Component[]
  currency: string
  ticketDaysMap?: Map<string, string | null>
}

export function BookingComponentsSection({ components, currency, ticketDaysMap }: BookingComponentsSectionProps) {
  if (!components || components.length === 0) {
    return null
  }

  // Filter out deleted components
  const activeComponents = components.filter(c => !c.deleted_at)

  if (activeComponents.length === 0) {
    return null
  }

  const getComponentIcon = (type: string) => {
    const icons: Record<string, any> = {
      ticket: Ticket,
      hotel_room: Home,
      circuit_transfer: Car,
      airport_transfer: Car,
      flight: Plane,
      extra: Package
    }
    return icons[type] || Package
  }

  const getComponentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ticket: 'Ticket',
      hotel_room: 'Hotel Room',
      circuit_transfer: 'Circuit Transfer',
      airport_transfer: 'Airport Transfer',
      flight: 'Flight',
      extra: 'Extra'
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return null
    try {
      return format(new Date(date), 'MMM d, yyyy, h:mm a')
    } catch {
      return date
    }
  }

  const extractComponentDetails = (component: Component) => {
    const data = component.component_data || component.component_snapshot || {}
    const details: {
      description?: string
      hotelName?: string
      roomType?: string
      bedType?: string
      checkIn?: string
      checkOut?: string
      pickupLocation?: string
      dropoffLocation?: string
      pickupTime?: string
      dropoffTime?: string
      vehicleType?: string
      transferDirection?: string
      transferDays?: string | number
      ticketCategory?: string
      grandstand?: string
      section?: string
      row?: string
      seat?: string
      notes?: string
      [key: string]: any
    } = {}

    // Extract common fields
    if (data.description) details.description = data.description
    if (data.notes) details.notes = data.notes
    if (data.name) details.name = data.name

    // Hotel-specific fields
    if (component.component_type === 'hotel_room') {
      if (data.hotel_name || data.hotel?.name) details.hotelName = data.hotel_name || data.hotel?.name
      if (data.room_type || data.roomType) details.roomType = data.room_type || data.roomType
      if (data.bed_type || data.bedType) details.bedType = data.bed_type || data.bedType
      if (data.check_in || data.checkIn) details.checkIn = data.check_in || data.checkIn
      if (data.check_out || data.checkOut) details.checkOut = data.check_out || data.checkOut
    }

    // Transfer-specific fields
    if (component.component_type === 'circuit_transfer' || component.component_type === 'airport_transfer') {
      if (data.pickup_location || data.pickupLocation) details.pickupLocation = data.pickup_location || data.pickupLocation
      if (data.dropoff_location || data.dropoffLocation) details.dropoffLocation = data.dropoff_location || data.dropoffLocation
      if (data.pickup_time || data.pickupTime) details.pickupTime = data.pickup_time || data.pickupTime
      if (data.dropoff_time || data.dropoffTime) details.dropoffTime = data.dropoff_time || data.dropoffTime
      if (data.vehicle_type || data.vehicleType) details.vehicleType = data.vehicle_type || data.vehicleType
      if (data.transport_type || data.transportType) details.vehicleType = data.transport_type || data.transportType
      if (data.transfer_direction || data.transferDirection) details.transferDirection = data.transfer_direction || data.transferDirection
    }
    
    // Circuit transfer-specific fields
    if (component.component_type === 'circuit_transfer') {
      if (data.transfer_days || data.transferDays || data.days) {
        details.transferDays = data.transfer_days || data.transferDays || data.days
      }
    }

    // Ticket-specific fields
    if (component.component_type === 'ticket') {
      if (data.ticket_category || data.ticketCategory || data.category) details.ticketCategory = data.ticket_category || data.ticketCategory || data.category
      if (data.grandstand) details.grandstand = data.grandstand
      if (data.section) details.section = data.section
      if (data.row) details.row = data.row
      if (data.seat) details.seat = data.seat
    }

    return details
  }

  const groupedByType = activeComponents.reduce((acc, component) => {
    const type = component.component_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(component)
    return acc
  }, {} as Record<string, Component[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          Booking Components ({activeComponents.length})
        </CardTitle>
      </CardHeader>
      <CardContent >
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedByType).map(([type, items]) => {
            const Icon = getComponentIcon(type)

            return (
              <div key={type} className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm sm:text-base">{getComponentTypeLabel(type)}</h4>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                </div>

                <div className="space-y-3 sm:space-y-4 pl-4 sm:pl-6">
                  {items.map((component) => {
                    const details = extractComponentDetails(component)

                    return (
                      <div key={component.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Component Name */}
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base mb-1">
                              {component.component_name || details.name || getComponentTypeLabel(type)}
                            </div>
                            {component.quantity && component.quantity > 1 && (
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                Quantity: {component.quantity}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Component-Specific Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          {/* Hotel Details */}
                          {details.hotelName && (
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <span className="text-muted-foreground">Hotel: </span>
                                <span className="font-medium">{details.hotelName}</span>
                              </div>
                            </div>
                          )}
                          {details.roomType && (
                            <div>
                              <span className="text-muted-foreground">Room Type: </span>
                              <span className="font-medium">
                                {details.roomType}
                                {details.bedType && ` (${details.bedType})`}
                              </span>
                            </div>
                          )}
                          {details.checkIn && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                              <div>
                                <span className="text-muted-foreground">Check-in: </span>
                                <span className="font-medium">{formatDate(details.checkIn)}</span>
                              </div>
                            </div>
                          )}
                          {details.checkOut && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                              <div>
                                <span className="text-muted-foreground">Check-out: </span>
                                <span className="font-medium">{formatDate(details.checkOut)}</span>
                              </div>
                            </div>
                          )}

                          {/* Transfer Details */}
                          {component.component_type === 'airport_transfer' && details.transferDirection && (
                            <div>
                              <span className="text-muted-foreground">Direction: </span>
                              <span className="font-medium">
                                {details.transferDirection.toLowerCase() === 'both' 
                                  ? 'Arrival and Return' 
                                  : details.transferDirection}
                              </span>
                            </div>
                          )}
                          {component.component_type === 'circuit_transfer' && details.transferDays && (
                            <div>
                              <span className="text-muted-foreground">Transfer Days: </span>
                              <span className="font-medium">
                                {typeof details.transferDays === 'number' 
                                  ? `${details.transferDays} ${details.transferDays === 1 ? 'day' : 'days'}`
                                  : details.transferDays}
                              </span>
                            </div>
                          )}
                          {details.pickupLocation && (
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <span className="text-muted-foreground">Pickup: </span>
                                <span className="font-medium">{details.pickupLocation}</span>
                                {details.pickupTime && (
                                  <span className="text-muted-foreground ml-1">
                                    ({formatDateTime(details.pickupTime)})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {details.dropoffLocation && (
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <span className="text-muted-foreground">Dropoff: </span>
                                <span className="font-medium">{details.dropoffLocation}</span>
                                {details.dropoffTime && (
                                  <span className="text-muted-foreground ml-1">
                                    ({formatDateTime(details.dropoffTime)})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {details.vehicleType && (
                            <div>
                              <span className="text-muted-foreground">Vehicle: </span>
                              <span className="font-medium">{details.vehicleType}</span>
                            </div>
                          )}

                          {/* Ticket Details */}
                          {component.component_type === 'ticket' && component.component_id && ticketDaysMap?.get(component.component_id) && (
                            <div>
                              <span className="text-muted-foreground">Ticket Days: </span>
                              <span className="font-medium">{ticketDaysMap.get(component.component_id)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

