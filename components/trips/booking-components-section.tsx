'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Ticket, Home, Car, Plane } from 'lucide-react'

interface Component {
  id: string
  component_type: string
  component_name?: string | null
  quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
  component_data?: any
  deleted_at?: string | null
}

interface BookingComponentsSectionProps {
  components: Component[]
  currency: string
}

export function BookingComponentsSection({ components, currency }: BookingComponentsSectionProps) {
  if (!components || components.length === 0) {
    return null
  }

  // Filter out deleted components
  const activeComponents = components.filter(c => !c.deleted_at)

  if (activeComponents.length === 0) {
    return null
  }

  const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'

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
            const totalForType = items.reduce((sum, item) => sum + (item.total_price || 0), 0)

            return (
              <div key={type} className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm sm:text-base">{getComponentTypeLabel(type)}</h4>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                </div>

                <div className="space-y-2 pl-4 sm:pl-6">
                  {items.map((component) => (
                    <div key={component.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm truncate">
                          {component.component_name || getComponentTypeLabel(type)}
                        </div>
                        {component.quantity && component.quantity > 1 && (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Quantity: {component.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {items.length > 1 && (
                  <div className="pl-4 sm:pl-6 border-t pt-2 flex justify-between text-xs sm:text-sm font-semibold">
                    <span>Subtotal ({type})</span>
                    <span>
                      {currencySymbol}{totalForType.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

